// Run daily: unique(stay_id, period) makes restarts safe and picks up mid-month arrivals.
import pg from "pg";
pg.types.setTypeParser(1082, (value) => value);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const month = today.slice(0, 7);
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const stays = (
    await db.query(
      "SELECT s.*,p.due_day FROM stays s JOIN properties p ON p.id=s.property_id WHERE ended_on IS NULL AND joined_on<=$1 FOR UPDATE OF s",
      [today],
    )
  ).rows;
  let count = 0;
  for (const s of stays) {
    const start = s.joined_on.startsWith(month)
      ? Number(s.joined_on.slice(8, 10))
      : 1;
    const amount = Math.round((Number(s.rent) * (days - start + 1)) / days);
    if (!amount) continue;
    const due = `${month}-${String(s.due_day).padStart(2, "0")}`;
    count += (
      await db.query(
        "INSERT INTO invoices(property_id,stay_id,period,description,amount,due_on) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(stay_id,period) WHERE kind='rent' DO NOTHING",
        [
          s.property_id,
          s.id,
          month,
          `Rent · ${month}`,
          amount,
          due < s.joined_on ? s.joined_on : due,
        ],
      )
    ).rowCount;
  }
  if (count)
    await db.query(
      "INSERT INTO audit_logs(action,details) VALUES('scheduledBilling',$1)",
      [JSON.stringify({ count, month })],
    );
  await db.query("COMMIT");
  console.log(`Generated ${count} rent bills for ${month}.`);
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
