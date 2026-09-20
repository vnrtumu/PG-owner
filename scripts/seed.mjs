import pg from "pg";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
if (process.env.DEMO_MODE !== "true")
  throw Error("Demo seed requires DEMO_MODE=true. Never seed production.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  if (Number((await db.query("SELECT count(*) FROM users")).rows[0].count))
    throw Error("Seed requires an empty database.");
  await db.query("BEGIN");
  const password = "Nest-" + randomBytes(10).toString("base64url");
  const owner = (
    await db.query(
      "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'owner') RETURNING id",
      ["PG Owner", "owner@nestledger.local", await bcrypt.hash(password, 12)],
    )
  ).rows[0];
  const props = [];
  for (const [name, address, city, type, amenities] of [
    [
      "Maple House",
      "12, Green Park Road",
      "Hyderabad",
      "Boys PG",
      "Wi-Fi · Meals · Laundry · Power backup",
    ],
    [
      "The Urban Nest",
      "8, Lake View Avenue",
      "Hyderabad",
      "Co-living",
      "Wi-Fi · Gym · Housekeeping · Parking",
    ],
    [
      "Bloom Residency",
      "24, Residency Road",
      "Bengaluru",
      "Girls PG",
      "Wi-Fi · Meals · CCTV · Laundry",
    ],
  ]) {
    props.push(
      (
        await db.query(
          "INSERT INTO properties(name,address,city,type,amenities,contact,rules,buying_cost_total,buying_cost_breakdown) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
          [
            name,
            address,
            city,
            type,
            amenities,
            "9000000000",
            "Quiet hours after 10 PM. Keep shared spaces clean.",
            250000000,
            JSON.stringify({
              purchase: 150000000,
              furnishing: 45000000,
              appliances: 30000000,
              electrical_plumbing: 15000000,
              legal_licensing: 5000000,
              other_setup: 5000000,
            }),
          ],
        )
      ).rows[0].id,
    );
  }
  const names = [
    "Aarav Sharma",
    "Arjun Reddy",
    "Rohan Mehta",
    "Vikram Rao",
    "Aditya Verma",
    "Sai Kiran",
    "Rahul Nair",
    "Karthik Kumar",
    "Dev Patel",
    "Nikhil Shah",
    "Ananya Rao",
    "Meera Iyer",
    "Priya Reddy",
    "Sneha Das",
    "Kavya Menon",
    "Riya Kapoor",
    "Ishaan Gupta",
    "Neha Singh",
  ];
  let n = 0;
  const current = new Date();
  current.setDate(1);
  const monthDate = (offset, day = 1) => {
    const d = new Date(current);
    d.setMonth(d.getMonth() + offset);
    d.setDate(day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  for (let p = 0; p < props.length; p++)
    for (let r = 1; r <= 4; r++) {
      const rent = (8000 + p * 1500) * 100;
      const room = (
        await db.query(
          "INSERT INTO rooms(property_id,name,floor,rent) VALUES($1,$2,$3,$4) RETURNING id",
          [props[p], String(100 + r), r > 2 ? "2" : "1", rent],
        )
      ).rows[0];
      for (let b = 1; b <= 2; b++) {
        const bed = (
          await db.query(
            "INSERT INTO beds(room_id,label,maintenance) VALUES($1,$2,$3) RETURNING id",
            [room.id, `B${b}`, r === 4 && b === 2 && p === 1],
          )
        ).rows[0];
        if (r === 4) continue;
        const name = names[n++];
        const tenant = (
          await db.query(
            "INSERT INTO tenants(name,phone,email,emergency_name,emergency_phone,occupation,address) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
            [
              name,
              `900001${String(n).padStart(4, "0")}`,
              name.toLowerCase().replace(" ", ".") + "@example.com",
              "Emergency contact",
              "9000020000",
              "Working professional",
              "Sample permanent address",
            ],
          )
        ).rows[0];
        const stay = (
          await db.query(
            "INSERT INTO stays(tenant_id,property_id,bed_id,joined_on,rent,deposit_expected,deposit_paid,agreement_expires) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
            [
              tenant.id,
              props[p],
              bed.id,
              monthDate(-5),
              rent,
              rent * 2,
              n % 4 === 0 ? rent : rent * 2,
              monthDate(6),
            ],
          )
        ).rows[0];
        if (n === 3)
          await db.query("UPDATE stays SET notice_on=$1 WHERE id=$2", [
            monthDate(1),
            stay.id,
          ]);
        for (let mo = -5; mo <= 0; mo++) {
          const invoice = (
            await db.query(
              "INSERT INTO invoices(property_id,stay_id,period,description,amount,due_on) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
              [
                props[p],
                stay.id,
                monthDate(mo).slice(0, 7),
                `Rent · ${monthDate(mo).slice(0, 7)}`,
                rent,
                monthDate(mo, 5),
              ],
            )
          ).rows[0];
          if (mo === 0 && n % 4 === 0) continue;
          await db.query(
            "INSERT INTO payments(invoice_id,amount,method,reference,paid_on,created_by,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              invoice.id,
              mo === 0 && n % 5 === 0 ? rent / 2 : rent,
              n % 3 === 0 ? "Cash" : "UPI",
              "DEMO-PAYMENT",
              monthDate(mo, Math.min(new Date().getDate(), 4)),
              owner.id,
              randomUUID(),
            ],
          );
        }
      }
    }
  for (let p = 0; p < props.length; p++) {
    for (let mo = -5; mo <= 0; mo++) {
      for (const [category, description, amount] of [
        ["Lease rent", "Monthly property lease", 2400000 + p * 300000],
        ["Groceries", "Kitchen supplies", 550000 + p * 100000],
        ["Electricity", "Electricity bill", 240000],
      ])
        await db.query(
          "INSERT INTO expenses(property_id,category,description,amount,spent_on,status) VALUES($1,$2,$3,$4,$5,$6)",
          [
            props[p],
            category,
            description,
            amount + mo * 10000,
            monthDate(mo, Math.min(new Date().getDate(), 3)),
            "Paid",
          ],
        );
    }
    await db.query(
      "INSERT INTO complaints(property_id,title,location,priority,assigned_to,notes) VALUES($1,$2,$3,$4,$5,$6)",
      [
        props[p],
        [
          "Water purifier needs servicing",
          "AC not cooling",
          "Wi-Fi connection unstable",
        ][p],
        ["Common kitchen", "Room 103", "Second floor"][p],
        ["Medium", "High", "Low"][p],
        "Property manager",
        "Sample request — follow up with the service provider.",
      ],
    );
    await db.query(
      "INSERT INTO bookings(property_id,name,phone,move_in,follow_up,notes) VALUES($1,$2,$3,$4,$5,$6)",
      [
        props[p],
        ["Akash Jain", "Sana Ali", "Pooja Nair"][p],
        "9000030000",
        monthDate(1),
        monthDate(0, Math.min(new Date().getDate(), 28)),
        "Interested in a double-sharing room.",
      ],
    );
  }
  await db.query(
    "INSERT INTO audit_logs(user_id,action,details) VALUES($1,'demoSetup',$2)",
    [owner.id, JSON.stringify({ message: "Sample data initialized" })],
  );
  await db.query("COMMIT");
  await writeFile(
    "LOCAL-ACCESS.txt",
    `NestLedger local demo\nURL: http://localhost:3000\nEmail: owner@nestledger.local\nPassword: ${password}\n\nThis file is ignored by Git. Change the password under Settings.\n`,
    { mode: 0o600 },
  );
  console.log(
    "Demo seeded. Credentials are in LOCAL-ACCESS.txt (not committed).",
  );
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
