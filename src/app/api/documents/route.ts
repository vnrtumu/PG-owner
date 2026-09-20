import { requireUser, propertyAccess, originCheck, apiError } from "@/lib/auth";
import { db, transaction } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
const root = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR || "./uploads",
  );
export async function POST(req: Request) {
  let filePath = "";
  try {
    originCheck(req);
    const user = await requireUser();
    if (!["owner", "manager"].includes(user.role)) throw Error("FORBIDDEN");
    const form = await req.formData();
    const p = z.uuid().parse(form.get("property_id"));
    if (!(await propertyAccess(user, p))) throw Error("FORBIDDEN");
    const tenant = form.get("tenant_id")
      ? z.uuid().parse(form.get("tenant_id"))
      : null;
    if (
      tenant &&
      !(
        await db.query(
          "SELECT 1 FROM stays WHERE tenant_id=$1 AND property_id=$2",
          [tenant, p],
        )
      ).rowCount
    )
      throw Error("Tenant does not belong to this PG.");
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024)
      throw Error("Choose a PDF, JPG or PNG up to 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime =
      bytes.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : bytes[0] === 255 && bytes[1] === 216
          ? "image/jpeg"
          : bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : null;
    if (!mime) throw Error("Only PDF, JPG and PNG documents are supported.");
    const key = randomUUID();
    await mkdir(root(), { recursive: true });
    filePath = path.join(/* turbopackIgnore: true */ root(), key);
    await writeFile(filePath, bytes, { mode: 0o600 });
    
    const docName = (form.get("name") ? String(form.get("name")).trim().slice(0, 200) : "") || file.name.slice(0, 200);
    const category = String(form.get("category") || "Other").trim().slice(0, 60) || "Other";

    await transaction(async (c) => {
      await c.query(
        "INSERT INTO documents(property_id,tenant_id,name,category,file_key,mime,size) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          p,
          tenant,
          docName,
          category,
          key,
          mime,
          file.size,
        ],
      );
      await c.query(
        "INSERT INTO audit_logs(user_id,property_id,action) VALUES($1,$2,$3)",
        [user.id, p, "documentUpload"],
      );
    });
    return Response.json({ ok: true });
  } catch (e) {
    if (filePath) await unlink(filePath).catch(() => {});
    return apiError(e);
  }
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    if (!["owner", "manager"].includes(user.role)) throw Error("FORBIDDEN");
    const id = z.uuid().parse(new URL(req.url).searchParams.get("id"));
    const d = (await db.query("SELECT * FROM documents WHERE id=$1", [id]))
      .rows[0];
    if (!d || !(await propertyAccess(user, d.property_id)))
      throw Error("FORBIDDEN");
    const file = await readFile(
      /* turbopackIgnore: true */ path.join(
        /* turbopackIgnore: true */ root(),
        d.file_key,
      ),
    );
    const isInline =
      new URL(req.url).searchParams.get("view") === "1" ||
      new URL(req.url).searchParams.get("inline") === "1";
    const disposition = isInline ? "inline" : "attachment";

    return new Response(file, {
      headers: {
        "Content-Type": d.mime,
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(d.name)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: Request) {
  try {
    originCheck(req);
    const user = await requireUser();
    if (!["owner", "manager"].includes(user.role)) throw Error("FORBIDDEN");
    const id = z.uuid().parse(new URL(req.url).searchParams.get("id"));
    const d = (await db.query("SELECT * FROM documents WHERE id=$1", [id]))
      .rows[0];
    if (!d || !(await propertyAccess(user, d.property_id)))
      throw Error("FORBIDDEN");

    await transaction(async (c) => {
      await c.query("DELETE FROM documents WHERE id=$1", [id]);
      await c.query(
        "INSERT INTO audit_logs(user_id,property_id,action,details) VALUES($1,$2,$3,$4)",
        [
          user.id,
          d.property_id,
          "documentDelete",
          JSON.stringify({ name: d.name, category: d.category }),
        ],
      );
    });

    const filePath = path.join(/* turbopackIgnore: true */ root(), d.file_key);
    await unlink(filePath).catch(() => {});

    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
