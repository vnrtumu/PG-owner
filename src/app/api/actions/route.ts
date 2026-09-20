import { transaction } from "@/lib/db";
import { requireUser, originCheck, propertyAccess, apiError } from "@/lib/auth";
import { paise, proratedRent, today } from "@/lib/money";
import bcrypt from "bcryptjs";
import { z } from "zod";
const uuid = (v: unknown) => z.uuid().parse(v);
const text = (v: unknown, max = 300) =>
  z.string().trim().min(1).max(max).parse(v);
const optional = (v: unknown, max = 1000) => (v ? text(v, max) : "");
const date = (v: unknown) => {
  const s = z.iso.date().parse(v);
  return s;
};
export async function POST(req: Request) {
  try {
    originCheck(req);
    const user = await requireUser();
    const body = await req.json();
    const action = text(body.action);
    const d = body.data ?? {};
    const permissions: Record<string, string[]> = {
      property: ["owner"],
      room: ["owner", "manager"],
      maintenance: ["owner", "manager", "caretaker"],
      tenant: ["owner", "manager"],
      tenantUpdate: ["owner", "manager"],
      rent: ["owner", "manager"],
      payment: ["owner", "manager", "accountant"],
      charge: ["owner", "manager", "accountant"],
      deposit: ["owner", "manager", "accountant"],
      expense: ["owner", "manager", "accountant"],
      expenseStatus: ["owner", "manager", "accountant"],
      complaint: ["owner", "manager", "caretaker"],
      complaintStatus: ["owner", "manager", "caretaker"],
      booking: ["owner", "manager"],
      bookingStatus: ["owner", "manager"],
      checkout: ["owner", "manager"],
      transfer: ["owner", "manager"],
      notice: ["owner", "manager"],
      staff: ["owner"],
      staffAccess: ["owner"],
      password: ["owner", "manager", "accountant", "caretaker"],
    };
    if (!permissions[action]?.includes(user.role)) throw Error("FORBIDDEN");
    let propertyId: string | null = d.property_id ? uuid(d.property_id) : null;
    if (propertyId && !(await propertyAccess(user, propertyId)))
      throw Error("FORBIDDEN");
    const result = await transaction(async (c) => {
      async function scoped(table: string, id: unknown) {
        const row = (
          await c.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [
            uuid(id),
          ])
        ).rows[0];
        if (!row) throw Error("Record not found.");
        if (row.property_id && !(await propertyAccess(user, row.property_id)))
          throw Error("FORBIDDEN");
        propertyId = row.property_id ?? propertyId;
        return row;
      }
      const needProperty = () => {
        if (!propertyId) throw Error("Choose a PG.");
        return propertyId;
      };
      let result: unknown = {};
      switch (action) {
        case "property": {
          const args = [
            text(d.name, 100),
            text(d.address),
            text(d.city, 100),
            optional(d.contact, 30),
            text(d.type, 30),
            optional(d.amenities),
            optional(d.rules, 3000),
            z.coerce.number().int().min(1).max(28).parse(d.due_day),
          ];
          if (d.id) {
            await scoped("properties", d.id);
            await c.query(
              "UPDATE properties SET name=$1,address=$2,city=$3,contact=$4,type=$5,amenities=$6,rules=$7,due_day=$8 WHERE id=$9",
              [...args, uuid(d.id)],
            );
            propertyId = d.id;
          } else {
            propertyId = (
              await c.query(
                "INSERT INTO properties(name,address,city,contact,type,amenities,rules,due_day) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
                args,
              )
            ).rows[0].id;
          }
          break;
        }
        case "room": {
          const p = needProperty();
          const room = (
            await c.query(
              "INSERT INTO rooms(property_id,name,floor,rent) VALUES($1,$2,$3,$4) RETURNING id",
              [p, text(d.name, 30), text(d.floor, 30), paise(d.rent)],
            )
          ).rows[0];
          const count = z.coerce.number().int().min(1).max(12).parse(d.beds);
          for (let n = 1; n <= count; n++)
            await c.query("INSERT INTO beds(room_id,label) VALUES($1,$2)", [
              room.id,
              `B${n}`,
            ]);
          break;
        }
        case "maintenance": {
          const bed = (
            await c.query(
              "SELECT b.*,r.property_id FROM beds b JOIN rooms r ON r.id=b.room_id WHERE b.id=$1 FOR UPDATE OF b",
              [uuid(d.id)],
            )
          ).rows[0];
          if (!bed || !(await propertyAccess(user, bed.property_id)))
            throw Error("FORBIDDEN");
          propertyId = bed.property_id;
          if (
            (
              await c.query(
                "SELECT 1 FROM stays WHERE bed_id=$1 AND ended_on IS NULL",
                [bed.id],
              )
            ).rowCount
          )
            throw Error("An occupied bed cannot be marked under maintenance.");
          await c.query(
            "UPDATE beds SET maintenance=NOT maintenance WHERE id=$1",
            [bed.id],
          );
          break;
        }
        case "tenant": {
          const p = needProperty();
          const bed = (
            await c.query(
              "SELECT b.*,r.property_id FROM beds b JOIN rooms r ON r.id=b.room_id WHERE b.id=$1 FOR UPDATE OF b",
              [uuid(d.bed_id)],
            )
          ).rows[0];
          if (!bed || bed.property_id !== p || bed.maintenance)
            throw Error("Choose an available bed in this PG.");
          const joined = date(d.joined_on);
          if (joined > today())
            throw Error(
              "Use Enquiries for future move-ins. Joining date cannot be in the future.",
            );
          const tenant = (
            await c.query(
              "INSERT INTO tenants(name,phone,email,emergency_name,emergency_phone,address,occupation) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
              [
                text(d.name, 100),
                text(d.phone, 30),
                optional(d.email, 254),
                optional(d.emergency_name, 100),
                optional(d.emergency_phone, 30),
                optional(d.address),
                optional(d.occupation, 100),
              ],
            )
          ).rows[0];
          result = (
            await c.query(
              "INSERT INTO stays(tenant_id,property_id,bed_id,joined_on,rent,deposit_expected,deposit_paid,agreement_expires) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
              [
                tenant.id,
                p,
                bed.id,
                joined,
                paise(d.rent),
                paise(d.deposit_expected || 0),
                paise(d.deposit_paid || 0),
                d.agreement_expires ? date(d.agreement_expires) : null,
              ],
            )
          ).rows[0];
          break;
        }
        case "tenantUpdate": {
          const s = await scoped("stays", d.id);
          await c.query(
            "UPDATE tenants SET name=$1,phone=$2,email=$3,emergency_name=$4,emergency_phone=$5,address=$6,occupation=$7 WHERE id=$8",
            [
              text(d.name, 100),
              text(d.phone, 30),
              optional(d.email, 254),
              optional(d.emergency_name, 100),
              optional(d.emergency_phone, 30),
              optional(d.address),
              optional(d.occupation, 100),
              s.tenant_id,
            ],
          );
          await c.query("UPDATE stays SET agreement_expires=$1 WHERE id=$2", [
            d.agreement_expires ? date(d.agreement_expires) : null,
            s.id,
          ]);
          break;
        }
        case "rent": {
          const p = needProperty();
          const month = today().slice(0, 7);
          const prop = (
            await c.query("SELECT due_day FROM properties WHERE id=$1", [p])
          ).rows[0];
          const stays = (
            await c.query(
              "SELECT * FROM stays WHERE property_id=$1 AND ended_on IS NULL AND joined_on<=$2 FOR UPDATE",
              [p, today()],
            )
          ).rows;
          let count = 0;
          for (const s of stays) {
            const joined = new Date(s.joined_on).toISOString().slice(0, 10);
            const amount = proratedRent(Number(s.rent), joined, month);
            if (!amount) continue;
            const due = `${month}-${String(prop.due_day).padStart(2, "0")}`;
            count +=
              (
                await c.query(
                  "INSERT INTO invoices(property_id,stay_id,period,description,amount,due_on) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(stay_id,period) WHERE kind='rent' DO NOTHING",
                  [
                    p,
                    s.id,
                    month,
                    `Rent · ${month}`,
                    amount,
                    due < joined ? joined : due,
                  ],
                )
              ).rowCount ?? 0;
          }
          result = {
            message: `${count} rent bill${count === 1 ? "" : "s"} generated. Existing bills were left unchanged.`,
          };
          break;
        }
        case "charge": {
          const s = await scoped("stays", d.stay_id);
          if (s.ended_on) throw Error("This tenant has checked out.");
          const amount = paise(d.amount);
          if (!amount) throw Error("Amount must be greater than zero.");
          await c.query(
            "INSERT INTO invoices(property_id,stay_id,period,description,kind,amount,due_on) VALUES($1,$2,$3,$4,'charge',$5,$6)",
            [
              s.property_id,
              s.id,
              date(d.due_on).slice(0, 7),
              text(d.description),
              amount,
              date(d.due_on),
            ],
          );
          break;
        }
        case "payment": {
          const i = await scoped("invoices", d.invoice_id);
          const key = uuid(d.idempotency_key);
          if (
            (
              await c.query("SELECT 1 FROM payments WHERE idempotency_key=$1", [
                key,
              ])
            ).rowCount
          ) {
            result = { message: "Payment already recorded." };
            break;
          }
          const paid = Number(
            (
              await c.query(
                "SELECT COALESCE(SUM(amount),0) paid FROM payments WHERE invoice_id=$1",
                [i.id],
              )
            ).rows[0].paid,
          );
          const amount = paise(d.amount);
          if (amount <= 0 || amount > Number(i.amount) - paid)
            throw Error(
              "Payment must be positive and cannot exceed the outstanding balance.",
            );
          const paidOn = date(d.paid_on);
          if (paidOn > today())
            throw Error("Payment date cannot be in the future.");
          await c.query(
            "INSERT INTO payments(invoice_id,amount,method,reference,paid_on,created_by,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              i.id,
              amount,
              z.enum(["UPI", "Cash", "Bank transfer"]).parse(d.method),
              optional(d.reference),
              paidOn,
              user.id,
              key,
            ],
          );
          break;
        }
        case "deposit": {
          const s = await scoped("stays", d.id);
          if (s.ended_on) throw Error("This tenant has checked out.");
          const amount = paise(d.amount);
          if (
            amount <= 0 ||
            amount > Number(s.deposit_expected) - Number(s.deposit_paid)
          )
            throw Error("Amount exceeds the pending deposit.");
          await c.query(
            "UPDATE stays SET deposit_paid=deposit_paid+$1 WHERE id=$2",
            [amount, s.id],
          );
          result = { amount, reference: optional(d.reference) };
          break;
        }
        case "expense": {
          const amount = paise(d.amount);
          if (!amount) throw Error("Amount must be greater than zero.");
          await c.query(
            "INSERT INTO expenses(property_id,category,description,amount,spent_on,status) VALUES($1,$2,$3,$4,$5,$6)",
            [
              needProperty(),
              text(d.category, 50),
              text(d.description),
              amount,
              date(d.spent_on),
              z.enum(["Paid", "Pending"]).parse(d.status),
            ],
          );
          break;
        }
        case "expenseStatus": {
          const e = await scoped("expenses", d.id);
          await c.query("UPDATE expenses SET status='Paid' WHERE id=$1", [
            e.id,
          ]);
          break;
        }
        case "complaint":
          await c.query(
            "INSERT INTO complaints(property_id,title,location,priority,assigned_to,notes) VALUES($1,$2,$3,$4,$5,$6)",
            [
              needProperty(),
              text(d.title),
              text(d.location),
              z.enum(["Low", "Medium", "High"]).parse(d.priority),
              optional(d.assigned_to, 100),
              optional(d.notes),
            ],
          );
          break;
        case "complaintStatus": {
          const r = await scoped("complaints", d.id);
          await c.query("UPDATE complaints SET status=$1 WHERE id=$2", [
            z.enum(["Open", "In progress", "Resolved"]).parse(d.status),
            r.id,
          ]);
          break;
        }
        case "booking":
          await c.query(
            "INSERT INTO bookings(property_id,name,phone,move_in,follow_up,notes) VALUES($1,$2,$3,$4,$5,$6)",
            [
              needProperty(),
              text(d.name, 100),
              text(d.phone, 30),
              date(d.move_in),
              d.follow_up ? date(d.follow_up) : null,
              optional(d.notes),
            ],
          );
          break;
        case "bookingStatus": {
          const b = await scoped("bookings", d.id);
          await c.query("UPDATE bookings SET status=$1 WHERE id=$2", [
            z
              .enum(["New", "Contacted", "Converted", "Cancelled"])
              .parse(d.status),
            b.id,
          ]);
          break;
        }
        case "notice": {
          const s = await scoped("stays", d.id);
          if (s.ended_on) throw Error("This tenant has checked out.");
          await c.query("UPDATE stays SET notice_on=$1 WHERE id=$2", [
            date(d.notice_on),
            s.id,
          ]);
          break;
        }
        case "checkout": {
          const s = await scoped("stays", d.id);
          if (s.ended_on) throw Error("Already checked out.");
          const ended = date(d.ended_on);
          if (
            ended > today() ||
            ended < new Date(s.joined_on).toISOString().slice(0, 10)
          )
            throw Error("Choose a valid checkout date.");
          const unpaid = Number(
            (
              await c.query(
                "SELECT COALESCE(SUM(i.amount-COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0)),0) amount FROM invoices i WHERE stay_id=$1",
                [s.id],
              )
            ).rows[0].amount,
          );
          if (unpaid > 0)
            throw Error("Collect all outstanding bills before checkout.");
          if (
            Number(s.rent) > 0 &&
            !(
              await c.query(
                "SELECT 1 FROM invoices WHERE stay_id=$1 AND period=$2 AND kind='rent'",
                [s.id, ended.slice(0, 7)],
              )
            ).rowCount
          )
            throw Error(
              "Generate and settle rent for the checkout month first.",
            );
          const deduction = paise(d.deduction || 0);
          if (deduction > Number(s.deposit_paid))
            throw Error("Deduction cannot exceed the collected deposit.");
          const reason = text(d.reason, 1000);
          await c.query(
            "UPDATE stays SET ended_on=$1,deposit_deduction=$2,deposit_refund=$3,settlement_reason=$4 WHERE id=$5",
            [
              ended,
              deduction,
              Number(s.deposit_paid) - deduction,
              reason,
              s.id,
            ],
          );
          result = { refund: Number(s.deposit_paid) - deduction };
          break;
        }
        case "transfer": {
          const s = await scoped("stays", d.id);
          if (s.ended_on) throw Error("This tenant has checked out.");
          const b = (
            await c.query(
              "SELECT b.*,r.property_id FROM beds b JOIN rooms r ON r.id=b.room_id WHERE b.id=$1 FOR UPDATE OF b",
              [uuid(d.bed_id)],
            )
          ).rows[0];
          if (!b || b.maintenance || b.property_id !== s.property_id)
            throw Error(
              "Select an available bed in the same PG. For another PG, settle checkout and create a new stay.",
            );
          await c.query("UPDATE stays SET bed_id=$1 WHERE id=$2", [b.id, s.id]);
          result = { previous_bed: s.bed_id, new_bed: b.id };
          break;
        }
        case "staff": {
          const password = text(d.password, 128);
          if (password.length < 12)
            throw Error("Use a password with at least 12 characters.");
          const role = z
            .enum(["manager", "accountant", "caretaker"])
            .parse(d.role);
          const ids = z.array(z.uuid()).min(1).parse(d.property_ids);
          const staff = (
            await c.query(
              "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
              [
                text(d.name, 100),
                z.email().parse(d.email).toLowerCase(),
                await bcrypt.hash(password, 12),
                role,
              ],
            )
          ).rows[0];
          for (const id of ids)
            await c.query(
              "INSERT INTO user_properties(user_id,property_id) VALUES($1,$2)",
              [staff.id, id],
            );
          break;
        }
        case "staffAccess": {
          const u = await scoped("users", d.id);
          if (u.role === "owner")
            throw Error("Owner access cannot be disabled here.");
          await c.query(
            "UPDATE users SET active=NOT active,session_version=session_version+1 WHERE id=$1",
            [u.id],
          );
          break;
        }
        case "password": {
          const current = (
            await c.query("SELECT password_hash FROM users WHERE id=$1", [
              user.id,
            ])
          ).rows[0];
          if (
            !(await bcrypt.compare(
              text(d.current_password, 128),
              current.password_hash,
            ))
          )
            throw Error("Current password is incorrect.");
          const password = text(d.password, 128);
          if (password.length < 12) throw Error("Use at least 12 characters.");
          await c.query(
            "UPDATE users SET password_hash=$1,session_version=session_version+1 WHERE id=$2",
            [await bcrypt.hash(password, 12), user.id],
          );
          break;
        }
      }
      const safe = { ...d };
      delete safe.password;
      delete safe.current_password;
      await c.query(
        "INSERT INTO audit_logs(user_id,property_id,action,details) VALUES($1,$2,$3,$4)",
        [
          user.id,
          propertyId,
          action,
          JSON.stringify({
            record_id: d.id ?? null,
            ...(["payment", "deposit", "checkout", "transfer"].includes(action)
              ? { ...safe, result }
              : {}),
          }),
        ],
      );
      return result;
    });
    return Response.json({ ok: true, ...(result as object) });
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: "Please check all required fields and their formats." },
        { status: 400 },
      );
    return apiError(e);
  }
}
