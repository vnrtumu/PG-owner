import { test, expect, request as playwrightRequest } from "@playwright/test";
import { readFileSync } from "node:fs";
import pg from "pg";
const access = readFileSync("LOCAL-ACCESS.txt", "utf8");
const email = access.match(/Email: (.+)/)![1];
const password = access.match(/Password: (.+)/)![1];
const origin = "http://localhost:3000";
let api: any;
let propertyId: string;
let otherPropertyId: string;
let tenant: any;
let invoice: any;
const suffix = Date.now();
const command = async (action: string, data: any) =>
  api.post("/api/actions", {
    headers: { Origin: origin },
    data: { action, data },
  });
test.beforeAll(async () => {
  api = await playwrightRequest.newContext({ baseURL: origin });
  expect(
    (
      await api.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email, password },
      })
    ).ok(),
  ).toBeTruthy();
});
test.afterAll(async () => {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const p = (
      await db.query("SELECT id FROM properties WHERE name LIKE 'QA-%'")
    ).rows.map((r) => r.id);
    await db.query("BEGIN");
    await db.query(
      "DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE property_id=ANY($1))",
      [p],
    );
    await db.query("DELETE FROM invoices WHERE property_id=ANY($1)", [p]);
    const t = (
      await db.query("SELECT tenant_id FROM stays WHERE property_id=ANY($1)", [
        p,
      ])
    ).rows.map((r) => r.tenant_id);
    for (const table of [
      "documents",
      "bookings",
      "complaints",
      "expenses",
      "audit_logs",
      "stays",
      "user_properties",
    ])
      await db.query(`DELETE FROM ${table} WHERE property_id=ANY($1)`, [p]);
    await db.query("DELETE FROM tenants WHERE id=ANY($1)", [t]);
    await db.query(
      "DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE property_id=ANY($1))",
      [p],
    );
    await db.query("DELETE FROM rooms WHERE property_id=ANY($1)", [p]);
    await db.query("DELETE FROM properties WHERE id=ANY($1)", [p]);
    await db.query(
      "DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'qa-%')",
    );
    await db.query("DELETE FROM users WHERE email LIKE 'qa-%'");
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    await db.end();
    await api.dispose();
  }
});
test("owner workflow: property, bed, tenant, billing, payment, deposit and checkout", async () => {
  let r = await command("property", {
    name: `QA-Home-${suffix}`,
    city: "Hyderabad",
    address: "Test address",
    type: "Co-living",
    due_day: 5,
  });
  expect(r.ok()).toBeTruthy();
  let d = await (await api.get("/api/data")).json();
  propertyId = d.properties.find((p: any) => p.name === `QA-Home-${suffix}`).id;
  r = await command("room", {
    property_id: propertyId,
    name: "101",
    floor: "1",
    beds: 2,
    rent: "9000",
  });
  expect(r.ok()).toBeTruthy();
  d = await (await api.get("/api/data")).json();
  const bed = d.beds.find((b: any) => b.property_id === propertyId);
  const joined = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const payload = {
    property_id: propertyId,
    bed_id: bed.id,
    name: "QA Resident",
    phone: "9000000001",
    joined_on: joined,
    rent: "9000",
    deposit_expected: "18000",
    deposit_paid: "9000",
  };
  const results = await Promise.all([
    command("tenant", payload),
    command("tenant", { ...payload, name: "QA Duplicate" }),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  d = await (await api.get("/api/data")).json();
  tenant = d.tenants.find((t: any) => t.property_id === propertyId);
  expect(tenant.joined_on).toBe(joined);
  expect((await command("maintenance", { id: bed.id })).ok()).toBeFalsy();
  expect(
    (await command("rent", { property_id: propertyId })).ok(),
  ).toBeTruthy();
  await command("rent", { property_id: propertyId });
  d = await (await api.get("/api/data")).json();
  expect(
    d.invoices.filter((i: any) => i.property_id === propertyId),
  ).toHaveLength(1);
  invoice = d.invoices.find((i: any) => i.property_id === propertyId);
  expect(
    (
      await command("checkout", {
        id: tenant.id,
        ended_on: joined,
        deduction: 0,
        reason: "Test",
      })
    ).ok(),
  ).toBeFalsy();
  expect(
    (
      await command("payment", {
        invoice_id: invoice.id,
        amount: Number(invoice.amount) / 100 + 1,
        method: "UPI",
        paid_on: joined,
        idempotency_key: crypto.randomUUID(),
      })
    ).ok(),
  ).toBeFalsy();
  const payment = {
    invoice_id: invoice.id,
    amount: Number(invoice.amount) / 100,
    method: "UPI",
    paid_on: joined,
    idempotency_key: crypto.randomUUID(),
  };
  expect((await command("payment", payment)).ok()).toBeTruthy();
  expect((await command("payment", payment)).ok()).toBeTruthy();
  expect(
    (await command("deposit", { id: tenant.id, amount: "9000" })).ok(),
  ).toBeTruthy();
  expect(
    (await command("deposit", { id: tenant.id, amount: "1" })).ok(),
  ).toBeFalsy();
  expect(
    (
      await command("expense", {
        property_id: propertyId,
        category: "Repairs",
        description: "QA Expense",
        amount: "250",
        spent_on: joined,
        status: "Paid",
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await command("complaint", {
        property_id: propertyId,
        title: "QA repair",
        location: "101",
        priority: "High",
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await command("checkout", {
        id: tenant.id,
        ended_on: joined,
        deduction: "1000",
        reason: "QA refund confirmed",
      })
    ).ok(),
  ).toBeTruthy();
  d = await (await api.get("/api/data")).json();
  const settled = d.tenants.find((t: any) => t.id === tenant.id);
  expect(settled.deposit_refund).toBe("1700000");
  expect(settled.ended_on).toBe(joined);
  expect(
    d.payments.filter((p: any) => p.invoice_id === invoice.id),
  ).toHaveLength(1);
  expect(d.beds.find((b: any) => b.id === bed.id).stay_id).toBeNull();
});
test("authorization, CSRF and property isolation", async () => {
  const anon = await playwrightRequest.newContext({ baseURL: origin });
  expect((await anon.get("/api/data")).status()).toBe(401);
  expect(
    (
      await api.post("/api/actions", {
        headers: { Origin: "https://evil.invalid" },
        data: { action: "rent", data: { property_id: propertyId } },
      })
    ).status(),
  ).toBe(403);
  await command("property", {
    name: `QA-Other-${suffix}`,
    city: "Hyderabad",
    address: "Test",
    type: "Boys PG",
    due_day: 5,
  });
  let d = await (await api.get("/api/data")).json();
  otherPropertyId = d.properties.find(
    (p: any) => p.name === `QA-Other-${suffix}`,
  ).id;
  const staffEmail = `qa-manager-${suffix}@example.com`;
  expect(
    (
      await command("staff", {
        name: "QA Manager",
        email: staffEmail,
        password: "QA-Testing-Password-123",
        role: "manager",
        property_ids: [propertyId],
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await anon.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { email: staffEmail, password: "QA-Testing-Password-123" },
      })
    ).ok(),
  ).toBeTruthy();
  const managerData = await (await anon.get("/api/data")).json();
  expect(managerData.properties.map((p: any) => p.id)).toEqual([propertyId]);
  expect(managerData.staff).toHaveLength(0);
  expect(
    (
      await anon.post("/api/actions", {
        headers: { Origin: origin },
        data: {
          action: "expense",
          data: {
            property_id: otherPropertyId,
            category: "Other",
            description: "Blocked",
            amount: "1",
            spent_on: "2026-09-20",
            status: "Paid",
          },
        },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await anon.post("/api/actions", {
        headers: { Origin: origin },
        data: { action: "property", data: { name: "Blocked" } },
      })
    ).status(),
  ).toBe(403);
  const changed = await anon.post("/api/actions", {
    headers: { Origin: origin },
    data: {
      action: "password",
      data: {
        current_password: "QA-Testing-Password-123",
        password: "QA-New-Testing-Password-456",
      },
    },
  });
  expect(changed.ok()).toBeTruthy();
  expect((await anon.get("/api/data")).status()).toBe(401);
  await anon.dispose();
});
test("caretaker receives only assigned operational data", async () => {
  const email = `qa-caretaker-${suffix}@example.com`;
  await command("staff", {
    name: "QA Caretaker",
    email,
    password: "QA-Testing-Password-123",
    role: "caretaker",
    property_ids: [propertyId],
  });
  const context = await playwrightRequest.newContext({ baseURL: origin });
  await context.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email, password: "QA-Testing-Password-123" },
  });
  const d = await (await context.get("/api/data")).json();
  expect(d.invoices).toEqual([]);
  expect(d.tenants).toEqual([]);
  expect(d.payments).toEqual([]);
  expect(d.rooms[0].rent).toBeUndefined();
  expect(d.beds[0].rent).toBeUndefined();
  await context.dispose();
});
test("private document upload and download", async () => {
  const r = await api.post("/api/documents", {
    headers: { Origin: origin },
    multipart: {
      property_id: propertyId,
      category: "Other",
      file: {
        name: "test.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\nTest document"),
      },
    },
  });
  expect(r.ok()).toBeTruthy();
  const d = await (await api.get("/api/data")).json();
  const doc = d.documents.find((x: any) => x.property_id === propertyId);
  expect((await api.get(`/api/documents?id=${doc.id}`)).ok()).toBeTruthy();
  const anon = await playwrightRequest.newContext({ baseURL: origin });
  expect((await anon.get(`/api/documents?id=${doc.id}`)).status()).toBe(401);
  await anon.dispose();
});
test("desktop and mobile screens, navigation, and CSV export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your business, at a glance." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Filter by property").selectOption(propertyId);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Maintenance", exact: true })
    .click();
  await page.getByRole("button", { name: "New request" }).click();
  await page.getByLabel("Issue").fill("QA Browser maintenance");
  await page.getByLabel("Room / location").fill("Common area");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("QA Browser maintenance", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filter by property").selectOption("all");
  for (const name of [
    "Properties",
    "Rooms & beds",
    "Tenants",
    "Enquiries",
    "Rent & payments",
    "Expenses",
    "Maintenance",
    "Documents",
    "Reports",
    "Team",
    "Settings",
  ]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }).first(),
    ).toBeVisible();
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tenants", exact: true })
    .click();
  await page.getByRole("button", { name: "Add tenant", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Tenants", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tenants", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  const csv = await api.get("/api/export?type=invoices");
  expect(csv.headers()["content-type"]).toContain("text/csv");
});

test("property deletion confirms name, enforces owner access and protects history", async () => {
  const name = `QA-Delete-${suffix}`;
  expect(
    (
      await command("property", {
        name,
        city: "Hyderabad",
        address: "QA address",
        type: "Co-living",
        due_day: 5,
      })
    ).ok(),
  ).toBeTruthy();
  let data = await (await api.get("/api/data")).json();
  const id = data.properties.find((p: any) => p.name === name).id;
  expect(
    (
      await command("room", {
        property_id: id,
        name: "101",
        floor: "1",
        beds: 2,
        rent: 8000,
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await command("propertyDelete", { id, confirmation: "wrong name" })
    ).status(),
  ).toBe(400);
  const staffEmail = `qa-delete-${suffix}@example.com`;
  await command("staff", {
    name: "QA Manager",
    email: staffEmail,
    password: "QA-Testing-Password-123",
    role: "manager",
    property_ids: [id],
  });
  const manager = await playwrightRequest.newContext({ baseURL: origin });
  await manager.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: staffEmail, password: "QA-Testing-Password-123" },
  });
  expect(
    (
      await manager.post("/api/actions", {
        headers: { Origin: origin },
        data: { action: "propertyDelete", data: { id, confirmation: name } },
      })
    ).status(),
  ).toBe(403);
  await manager.dispose();
  expect(
    (await command("propertyDelete", { id, confirmation: name })).ok(),
  ).toBeTruthy();
  data = await (await api.get("/api/data")).json();
  expect(data.properties.some((p: any) => p.id === id)).toBeFalsy();
  expect(data.rooms.some((p: any) => p.property_id === id)).toBeFalsy();
  expect(data.beds.some((p: any) => p.property_id === id)).toBeFalsy();
  expect(
    data.audit.some(
      (a: any) => a.action === "propertyDelete" && a.details.record_id === id,
    ),
  ).toBeTruthy();
  const occupied = data.properties.find((p: any) =>
    data.tenants.some((t: any) => t.property_id === p.id),
  );
  expect(
    (
      await command("propertyDelete", {
        id: occupied.id,
        confirmation: occupied.name,
      })
    ).status(),
  ).toBe(400);
  const financialName = `QA-Finance-${suffix}`;
  await command("property", {
    name: financialName,
    city: "Hyderabad",
    address: "QA address",
    type: "Co-living",
    due_day: 5,
  });
  data = await (await api.get("/api/data")).json();
  const financial = data.properties.find((p: any) => p.name === financialName);
  await command("expense", {
    property_id: financial.id,
    category: "Other",
    description: "QA expense",
    amount: "1",
    spent_on: "2026-09-20",
    status: "Paid",
  });
  expect(
    (
      await command("propertyDelete", {
        id: financial.id,
        confirmation: financialName,
      })
    ).status(),
  ).toBe(400);
});
