import { db } from "./db";
import type { User } from "./auth";
export async function getData(user: User) {
  const owner = user.role === "owner";
  const params = owner ? [] : [user.id];
  const scope = owner
    ? "TRUE"
    : "p.id IN (SELECT property_id FROM user_properties WHERE user_id=$1)";
  const query = async (sql: string) => (await db.query(sql, params)).rows;
  const properties = await query(
    `SELECT p.* FROM properties p WHERE ${scope} ORDER BY p.name`,
  );
  const rooms = await query(
    `SELECT r.*,p.name property_name FROM rooms r JOIN properties p ON p.id=r.property_id WHERE ${scope} ORDER BY r.floor,r.name`,
  );
  const beds = await query(
    `SELECT b.*,r.property_id,r.name room_name,r.floor,r.rent,s.id stay_id,t.name tenant_name FROM beds b JOIN rooms r ON r.id=b.room_id JOIN properties p ON p.id=r.property_id LEFT JOIN stays s ON s.bed_id=b.id AND s.ended_on IS NULL LEFT JOIN tenants t ON t.id=s.tenant_id WHERE ${scope} ORDER BY r.name,b.label`,
  );
  const complaints = await query(
    `SELECT c.*,p.name property_name FROM complaints c JOIN properties p ON p.id=c.property_id WHERE ${scope} ORDER BY c.created_at DESC`,
  );
  const finance = user.role !== "caretaker";
  const tenants = finance
    ? await query(
        `SELECT s.*,t.name,t.phone,t.email,t.emergency_name,t.emergency_phone,t.address,t.occupation,p.name property_name,r.name room_name,b.label bed_label FROM stays s JOIN tenants t ON t.id=s.tenant_id JOIN properties p ON p.id=s.property_id JOIN beds b ON b.id=s.bed_id JOIN rooms r ON r.id=b.room_id WHERE ${scope} ORDER BY s.ended_on NULLS FIRST,t.name`,
      )
    : [];
  const invoices = finance
    ? await query(
        `SELECT i.*,t.name tenant_name,t.phone,p.name property_name,COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0)::text paid FROM invoices i JOIN properties p ON p.id=i.property_id JOIN stays s ON s.id=i.stay_id JOIN tenants t ON t.id=s.tenant_id WHERE ${scope} ORDER BY i.due_on DESC,i.number DESC`,
      )
    : [];
  const payments = finance
    ? await query(
        `SELECT pay.*,i.property_id,i.number invoice_number,t.name tenant_name FROM payments pay JOIN invoices i ON i.id=pay.invoice_id JOIN properties p ON p.id=i.property_id JOIN stays s ON s.id=i.stay_id JOIN tenants t ON t.id=s.tenant_id WHERE ${scope} ORDER BY pay.created_at DESC`,
      )
    : [];
  const expenses = finance
    ? await query(
        `SELECT e.*,p.name property_name FROM expenses e JOIN properties p ON p.id=e.property_id WHERE ${scope} ORDER BY e.spent_on DESC`,
      )
    : [];
  const bookings = finance
    ? await query(
        `SELECT b.*,p.name property_name FROM bookings b JOIN properties p ON p.id=b.property_id WHERE ${scope} ORDER BY b.created_at DESC`,
      )
    : [];
  const documents = ["owner", "manager"].includes(user.role)
    ? await query(
        `SELECT d.id,d.property_id,d.tenant_id,d.name,d.category,d.mime,d.size,d.created_at,t.name tenant_name,p.name property_name FROM documents d JOIN properties p ON p.id=d.property_id LEFT JOIN tenants t ON t.id=d.tenant_id WHERE ${scope} ORDER BY d.created_at DESC`,
      )
    : [];
  const staff = owner
    ? (
        await db.query(
          "SELECT u.id,u.name,u.email,u.role,u.active,COALESCE(array_agg(up.property_id) FILTER(WHERE up.property_id IS NOT NULL),'{}') property_ids FROM users u LEFT JOIN user_properties up ON up.user_id=u.id GROUP BY u.id ORDER BY u.created_at",
        )
      ).rows
    : [];
  const audit = owner
    ? (
        await db.query(
          "SELECT a.*,u.name actor,p.name property_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN properties p ON p.id=a.property_id ORDER BY a.created_at DESC LIMIT 100",
        )
      ).rows
    : [];
  if (!finance) {
    for (const r of rooms) delete r.rent;
    for (const b of beds) delete b.rent;
  }
  return {
    user,
    properties,
    rooms,
    beds,
    tenants,
    invoices,
    payments,
    expenses,
    complaints,
    bookings,
    documents,
    staff,
    audit,
    demo: process.env.DEMO_MODE === "true",
  };
}
