import { requireUser, apiError } from "@/lib/auth";
import { getData } from "@/lib/data";
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (user.role === "caretaker") throw Error("FORBIDDEN");
    const params = new URL(req.url).searchParams;
    const type = params.get("type") || "invoices";
    const data = await getData(user);
    const sets: Record<string, unknown[]> = {
      invoices: data.invoices,
      payments: data.payments,
      expenses: data.expenses,
      tenants: data.tenants,
    };
    if (!sets[type]) throw Error("Choose a valid report.");
    let rows = sets[type] as Record<string, unknown>[];
    const property = params.get("property");
    if (property && property !== "all")
      rows = rows.filter((r) => r.property_id === property);
    const columns = Object.keys(rows[0] || { message: "" });
    const cell = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const csv = [
      columns.map(cell).join(","),
      ...rows.map((r) => columns.map((k) => cell(r[k])).join(",")),
    ].join("\r\n");
    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}.csv"`,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
