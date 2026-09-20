"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Building2,
  LayoutDashboard,
  BedDouble,
  Users,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Download,
  FileText,
  Wrench,
  CalendarDays,
  ShieldCheck,
  X,
  Check,
  Menu,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Home,
  Clock,
  CheckCircle2,
  TrendingUp,
  Upload,
  UserRound,
  History,
  Loader2,
} from "lucide-react";

type Row = Record<string, any>;
type Data = {
  user: Row;
  properties: Row[];
  rooms: Row[];
  beds: Row[];
  tenants: Row[];
  invoices: Row[];
  payments: Row[];
  expenses: Row[];
  complaints: Row[];
  bookings: Row[];
  documents: Row[];
  staff: Row[];
  audit: Row[];
  demo: boolean;
};
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  min?: string;
  max?: string;
};
type Modal = {
  title: string;
  subtitle?: string;
  action: string;
  fields: Field[];
  values?: Row;
  submit?: string;
};
const money = (v: any) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number(v) % 100 ? 2 : 0,
  }).format(Number(v || 0) / 100);
const day = (v: any) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const dateValue = (v: any) => (v ? String(v).slice(0, 10) : "");
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Properties", icon: Building2 },
  { name: "Rooms & beds", icon: BedDouble },
  { name: "Tenants", icon: Users },
  { name: "Enquiries", icon: CalendarDays },
  { name: "Rent & payments", icon: Receipt },
  { name: "Expenses", icon: Wallet },
  { name: "Maintenance", icon: Wrench },
  { name: "Documents", icon: FileText },
  { name: "Reports", icon: TrendingUp },
  { name: "Team", icon: ShieldCheck },
  { name: "Settings", icon: Settings },
];
const f = (
  name: string,
  label: string,
  type = "text",
  required = true,
): Field => ({ name, label, type, required });
const sel = (name: string, label: string, options: string[]): Field => ({
  name,
  label,
  type: "select",
  options: options.map((x) => ({ value: x, label: x })),
  required: true,
});
function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Empty({
  title = "Nothing here yet",
  text = "Add your first record to get started.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Building2 size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Table({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title={empty || "No records found"}
      text="Try changing the filters or add a new record."
    />
  );
}
function Stat({
  label,
  value,
  note,
  icon: Icon,
  color = "",
}: {
  label: string;
  value: string;
  note: string;
  icon: any;
  color?: string;
}) {
  return (
    <div className={`stat ${color}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function FormDialog({
  modal,
  onClose,
  onSubmit,
  properties,
  beds,
  tenants,
}: {
  modal: Modal;
  onClose: () => void;
  onSubmit: (d: Row) => Promise<void>;
  properties: Row[];
  beds: Row[];
  tenants: Row[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Row>(modal.values || {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const fd = new FormData(e.currentTarget);
            const data = { ...values, ...Object.fromEntries(fd) };
            if (modal.action === "staff")
              data.property_ids = fd.getAll("property_ids");
            if (modal.action === "document") data.formData = fd;
            await onSubmit(data);
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-head">
          <div>
            <h2>{modal.title}</h2>
            {modal.subtitle && <p>{modal.subtitle}</p>}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="form-grid">
          {modal.fields.map((field) => {
            let options = field.options;
            if (field.name === "property_id")
              options = properties.map((p) => ({ value: p.id, label: p.name }));
            if (field.name === "bed_id")
              options = beds
                .filter(
                  (b) =>
                    b.property_id === values.property_id &&
                    !b.stay_id &&
                    !b.maintenance,
                )
                .map((b) => ({
                  value: b.id,
                  label: `Room ${b.room_name} · ${b.label}`,
                }));
            if (field.name === "tenant_id")
              options = tenants
                .filter((t) => t.property_id === values.property_id)
                .map((t) => ({ value: t.tenant_id, label: t.name }));
            return (
              <label
                key={field.name}
                className={
                  field.type === "textarea" || field.type === "checkboxes"
                    ? "full"
                    : ""
                }
              >
                {field.label}
                {field.required && <span className="required"> *</span>}
                {field.type === "checkboxes" ? (
                  <div className="check-list">
                    {properties.map((p) => (
                      <label key={p.id}>
                        <input
                          type="checkbox"
                          name="property_ids"
                          value={p.id}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.name]: e.target.value,
                        ...(field.name === "property_id"
                          ? { bed_id: "", tenant_id: "" }
                          : {}),
                      })
                    }
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    defaultValue={values[field.name]}
                    rows={3}
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    required={field.required}
                    defaultValue={
                      field.type === "file" ? undefined : values[field.name]
                    }
                    min={
                      field.min ?? (field.type === "number" ? "0" : undefined)
                    }
                    max={field.max}
                    step={field.type === "number" ? "0.01" : undefined}
                    accept={
                      field.type === "file" ? ".pdf,.jpg,.jpeg,.png" : undefined
                    }
                    autoComplete={
                      field.type === "password" ? "new-password" : undefined
                    }
                  />
                )}{" "}
                {field.hint && <small>{field.hint}</small>}
              </label>
            );
          })}
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="spin" /> Saving…
              </>
            ) : (
              modal.submit || "Save changes"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export default function Portal() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState("Overview");
  const [property, setProperty] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [toast, setToast] = useState("");
  const [mobile, setMobile] = useState(false);
  const [filter, setFilter] = useState("All");
  const [detail, setDetail] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const r = await fetch("/api/data", { cache: "no-store" });
    if (r.status === 401) {
      location.reload();
      return;
    }
    if (!r.ok) throw Error("Could not load your workspace. Please retry.");
    setData(await r.json());
    setLoadError("");
  }, []);
  useEffect(() => {
    refresh().catch((e) => setLoadError(e.message));
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const go = (p: string) => {
    setPage(p);
    setSearch("");
    setFilter("All");
    setMobile(false);
  };
  async function act(action: string, values: Row) {
    const r = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data: values }),
    });
    const response = await r.json();
    if (!r.ok) throw Error(response.error);
    await refresh();
    setToast(response.message || "Changes saved successfully.");
  }
  async function quick(action: string, values: Row) {
    setBusy(true);
    try {
      await act(action, values);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="loading">
        <Building2 size={36} />
        <h2>{loadError || "Opening your workspace…"}</h2>
        {loadError ? (
          <button
            className="primary"
            onClick={() => refresh().catch((e) => setLoadError(e.message))}
          >
            Retry
          </button>
        ) : (
          <Loader2 className="spin" />
        )}
      </div>
    );
  const owner = data.user.role === "owner",
    ops = ["owner", "manager"].includes(data.user.role),
    finance = data.user.role !== "caretaker";
  const visibleNav = nav.filter((n) =>
    data.user.role === "caretaker"
      ? ["Overview", "Rooms & beds", "Maintenance", "Settings"].includes(n.name)
      : n.name === "Team"
        ? owner
        : n.name === "Documents"
          ? ops
          : true,
  );
  const scoped = (rows: Row[]) =>
    rows.filter(
      (r) =>
        property === "all" || r.property_id === property || r.id === property,
    );
  const matches = (r: Row) =>
    !search ||
    Object.values(r).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase()),
    );
  const props = data.properties.filter(
      (p) => property === "all" || p.id === property,
    ),
    beds = scoped(data.beds),
    tenants = scoped(data.tenants),
    invoices = scoped(data.invoices),
    expenses = scoped(data.expenses),
    payments = scoped(data.payments),
    complaints = scoped(data.complaints);
  const occupied = beds.filter((b) => b.stay_id).length;
  const available = beds.filter((b) => !b.stay_id && !b.maintenance).length;
  const occupancy = beds.length
    ? Math.round((occupied / beds.length) * 100)
    : 0;
  const month = today().slice(0, 7);
  const currentInvoices = invoices.filter((i) => i.period === month);
  const collected = payments
    .filter((p) => dateValue(p.paid_on).startsWith(month))
    .reduce((s, p) => s + Number(p.amount), 0);
  const spending = expenses
    .filter(
      (e) => dateValue(e.spent_on).startsWith(month) && e.status === "Paid",
    )
    .reduce((s, e) => s + Number(e.amount), 0);
  const dues = invoices.filter((i) => Number(i.amount) > Number(i.paid));
  const outstanding = dues.reduce(
    (s, i) => s + Number(i.amount) - Number(i.paid),
    0,
  );
  const active = tenants.filter((t) => !t.ended_on);
  const defaultProp = property === "all" ? data.properties[0]?.id : property;
  const propertyField: Field = {
    name: "property_id",
    label: "PG property",
    type: "select",
    required: true,
  };
  const bedField: Field = {
    name: "bed_id",
    label: "Available bed",
    type: "select",
    required: true,
  };
  const tenantFields = [
    f("name", "Full name"),
    f("phone", "Phone number", "tel"),
    f("email", "Email address", "email", false),
    f("occupation", "College / workplace", "text", false),
    f("emergency_name", "Emergency contact name", "text", false),
    f("emergency_phone", "Emergency contact phone", "tel", false),
    f("address", "Permanent address", "textarea", false),
    f("agreement_expires", "Agreement expiry", "date", false),
  ];
  function addTenant() {
    setModal({
      title: "Welcome a new tenant",
      subtitle: "Assign a bed and record the agreed rent and deposit.",
      action: "tenant",
      fields: [
        propertyField,
        bedField,
        ...tenantFields,
        f("joined_on", "Joining date", "date"),
        f("rent", "Monthly rent (₹)", "number"),
        f("deposit_expected", "Security deposit (₹)", "number"),
        f("deposit_paid", "Deposit received (₹)", "number"),
      ],
      values: {
        property_id: defaultProp,
        joined_on: today(),
        deposit_expected: 0,
        deposit_paid: 0,
      },
      submit: "Add tenant",
    });
  }
  function addProperty(p?: Row) {
    setModal({
      title: p ? "Edit property" : "Add a PG property",
      action: "property",
      fields: [
        f("name", "Property name"),
        f("city", "City"),
        f("address", "Address", "textarea"),
        f("contact", "Contact number", "tel", false),
        sel("type", "Property type", ["Boys PG", "Girls PG", "Co-living"]),
        { ...f("due_day", "Rent due day", "number"), min: "1", max: "28" },
        f("amenities", "Amenities", "textarea", false),
        f("rules", "House rules", "textarea", false),
      ],
      values: p || { due_day: 5, type: "Co-living" },
    });
  }
  function payment(i: Row) {
    setModal({
      title: "Record rent payment",
      subtitle: `${i.tenant_name} · Invoice #${String(i.number).padStart(4, "0")} · Balance ${money(Number(i.amount) - Number(i.paid))}`,
      action: "payment",
      fields: [
        f("amount", "Amount received (₹)", "number"),
        sel("method", "Payment method", ["UPI", "Cash", "Bank transfer"]),
        f("paid_on", "Payment date", "date"),
        f("reference", "Transaction reference", "text", false),
      ],
      values: {
        invoice_id: i.id,
        amount: (Number(i.amount) - Number(i.paid)) / 100,
        paid_on: today(),
        method: "UPI",
        idempotency_key: crypto.randomUUID(),
      },
      submit: "Record payment",
    });
  }
  function exportReport(type: string) {
    window.location.href = `/api/export?type=${type}&property=${property}`;
  }
  function receipt(p: Row) {
    const i = data!.invoices.find((i) => i.id === p.invoice_id);
    const property = data!.properties.find((x) => x.id === p.property_id);
    const w = window.open("", "_blank");
    if (!w) {
      setToast("Allow pop-ups to print the receipt.");
      return;
    }
    const esc = (s: any) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      );
    w.document.write(
      `<html><head><title>Payment receipt</title><style>body{font:16px system-ui;padding:60px;color:#163b34}h1{font-size:36px}table{width:100%;margin:35px 0;border-collapse:collapse}td{padding:16px;border-bottom:1px solid #ddd}small{color:#666}</style></head><body><small>NESTLEDGER · PAYMENT RECEIPT</small><h1>${esc(property?.name)}</h1><p>${esc(property?.address)}</p><table>${Object.entries(
        {
          "Receipt reference": p.id,
          Tenant: p.tenant_name,
          Invoice: `#${i?.number}`,
          Description: i?.description,
          "Paid on": day(p.paid_on),
          "Payment method": p.method,
          "Transaction reference": p.reference || "—",
          "Amount received": money(p.amount),
        },
      )
        .map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
        .join(
          "",
        )}</table><p>Payment received. Thank you.</p><small>This receipt records the payment entered by the property manager.</small></body></html>`,
    );
    w.document.close();
    w.print();
  }
  const actionButton = () => {
    if (page === "Overview" || page === "Tenants")
      return ops ? (
        <button className="primary" onClick={addTenant}>
          <Plus size={17} /> Add tenant
        </button>
      ) : null;
    if (page === "Properties")
      return owner ? (
        <button className="primary" onClick={() => addProperty()}>
          <Plus size={17} /> Add property
        </button>
      ) : null;
    if (page === "Rooms & beds")
      return ops ? (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Add a room",
              action: "room",
              fields: [
                propertyField,
                f("name", "Room number"),
                f("floor", "Floor"),
                {
                  ...f("beds", "Number of beds", "number"),
                  min: "1",
                  max: "12",
                },
                f("rent", "Default rent per bed (₹)", "number"),
              ],
              values: {
                property_id: defaultProp,
                floor: "Ground",
                beds: 2,
                rent: 8000,
              },
            })
          }
        >
          <Plus size={17} /> Add room
        </button>
      ) : null;
    if (page === "Expenses")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Record an expense",
              action: "expense",
              fields: [
                propertyField,
                sel("category", "Category", [
                  "Lease rent",
                  "Salaries",
                  "Groceries",
                  "Electricity",
                  "Water",
                  "Internet",
                  "Repairs",
                  "Other",
                ]),
                f("description", "Description"),
                f("amount", "Amount (₹)", "number"),
                f("spent_on", "Expense date", "date"),
                sel("status", "Payment status", ["Paid", "Pending"]),
              ],
              values: {
                property_id: defaultProp,
                spent_on: today(),
                status: "Paid",
                category: "Groceries",
              },
            })
          }
        >
          <Plus size={17} /> Add expense
        </button>
      );
    if (page === "Maintenance")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Log a maintenance request",
              action: "complaint",
              fields: [
                propertyField,
                f("title", "Issue"),
                f("location", "Room / location"),
                sel("priority", "Priority", ["Low", "Medium", "High"]),
                f("assigned_to", "Assigned to", "text", false),
                f("notes", "Details", "textarea", false),
              ],
              values: { property_id: defaultProp, priority: "Medium" },
            })
          }
        >
          <Plus size={17} /> New request
        </button>
      );
    if (page === "Enquiries")
      return ops ? (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "New enquiry",
              subtitle:
                "Track a potential tenant. Enquiries do not reserve a bed.",
              action: "booking",
              fields: [
                propertyField,
                f("name", "Name"),
                f("phone", "Phone", "tel"),
                f("move_in", "Expected move-in", "date"),
                f("follow_up", "Follow-up date", "date", false),
                f("notes", "Notes", "textarea", false),
              ],
              values: { property_id: defaultProp, move_in: today() },
            })
          }
        >
          <Plus size={17} /> Add enquiry
        </button>
      ) : null;
    if (page === "Documents")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Upload a document",
              subtitle: "Private files · PDF, JPG or PNG · Maximum 5 MB",
              action: "document",
              fields: [
                propertyField,
                {
                  name: "tenant_id",
                  label: "Tenant (optional)",
                  type: "select",
                },
                sel("category", "Category", [
                  "Identity",
                  "Agreement",
                  "Property",
                  "Expense receipt",
                  "Other",
                ]),
                f("file", "Document", "file"),
              ],
              values: { property_id: defaultProp, category: "Identity" },
            })
          }
        >
          <Upload size={17} /> Upload document
        </button>
      );
    if (page === "Team")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Invite a team member",
              subtitle:
                "Create their login and select the PGs they can access.",
              action: "staff",
              fields: [
                f("name", "Name"),
                f("email", "Email", "email"),
                f("password", "Initial password (12+ characters)", "password"),
                sel("role", "Role", ["manager", "accountant", "caretaker"]),
                {
                  name: "property_ids",
                  label: "Assigned properties",
                  type: "checkboxes",
                },
              ],
              values: { role: "manager" },
            })
          }
        >
          <Plus size={17} /> Add team member
        </button>
      );
    return null;
  };
  const overdue = dues.filter((i) => dateValue(i.due_on) < today());
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <button className="brand" onClick={() => go("Overview")}>
          <span className="brand-icon">
            <Building2 size={23} />
          </span>
          NestLedger<span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">OWNER WORKSPACE</div>
        <nav>
          {visibleNav.map((n, index) => {
            const Icon = n.icon;
            return (
              <button
                key={n.name}
                aria-label={n.name}
                className={`${page === n.name ? "active" : ""} ${index === 5 || n.name === "Team" ? "nav-gap" : ""}`}
                onClick={() => go(n.name)}
              >
                <Icon size={19} />
                <span>{n.name}</span>
                {n.name === "Maintenance" &&
                  complaints.filter((c) => c.status !== "Resolved").length >
                    0 && (
                    <b>
                      {complaints.filter((c) => c.status !== "Resolved").length}
                    </b>
                  )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="owner-avatar">{data.user.name.charAt(0)}</div>
          <div>
            <strong>{data.user.name}</strong>
            <small>{data.user.role}</small>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <Home size={16} />
            <ChevronRight size={14} />
            <span>{page}</span>
          </div>
          <div className="top-actions">
            <div className="property-select">
              <Building2 size={16} />
              <select
                aria-label="Filter by property"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
              >
                <option value="all">All properties</option>
                {data.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="icon-btn notification"
              aria-label="View reminders"
              onClick={() => go("Reminders")}
            >
              <Bell size={19} />
              {(overdue.length > 0 ||
                complaints.some((c) => c.status !== "Resolved")) && <i />}
            </button>
            <span className="small-avatar">{data.user.name.charAt(0)}</span>
          </div>
        </header>
        <main className="content">
          {data.demo && (
            <div className="demo-banner">
              <span>
                <span className="demo-tag">DEMO</span> You’re exploring sample
                PG data. Your production database starts empty.
              </span>
              <span>Local workspace</span>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "Overview"
                  ? new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "YOUR OWNER WORKSPACE"}
              </div>
              <h1>
                {page === "Overview" ? `Your business, at a glance.` : page}
              </h1>
              <p>
                {
                  (
                    {
                      Overview: `Here’s what’s happening across ${props.length === 1 ? props[0].name : `your ${props.length} properties`} today.`,
                      Properties: "A clear view of every place you manage.",
                      "Rooms & beds":
                        "Make room for what’s next. Track every bed in one place.",
                      Tenants: "The people who make your properties a home.",
                      Enquiries:
                        "Keep the conversation going, from first enquiry to move-in.",
                      "Rent & payments":
                        "Stay on top of every bill and every payment.",
                      Expenses: "Know where your money goes.",
                      Maintenance: "Small fixes. Better stays.",
                      Documents: "Important paperwork, safely in one place.",
                      Reports: "A closer look at your business numbers.",
                      Team: "The right access for the right people.",
                      Settings: "Make this workspace work for you.",
                      Reminders: "Your follow-ups, dues and upcoming dates.",
                    } as Record<string, string>
                  )[page]
                }
              </p>
            </div>
            <div className="heading-actions">
              {[
                "Overview",
                "Tenants",
                "Rent & payments",
                "Expenses",
                "Reports",
              ].includes(page) &&
                finance && (
                  <button
                    className="secondary"
                    onClick={() =>
                      exportReport(
                        page === "Tenants"
                          ? "tenants"
                          : page === "Expenses"
                            ? "expenses"
                            : "invoices",
                      )
                    }
                  >
                    <Download size={16} /> Export
                  </button>
                )}
              {actionButton()}
            </div>
          </div>
          {page === "Overview" && finance && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Total occupancy"
                  value={`${occupancy}%`}
                  note={`${occupied} of ${beds.length} beds occupied`}
                  icon={BedDouble}
                  color="featured"
                />
                <Stat
                  label="Rent collected"
                  value={money(collected)}
                  note="Payments received this month"
                  icon={ArrowDownLeft}
                />
                <Stat
                  label="Outstanding dues"
                  value={money(outstanding)}
                  note={`${dues.length} unpaid or partially paid bills`}
                  icon={Clock}
                />
                <Stat
                  label="Available beds"
                  value={String(available).padStart(2, "0")}
                  note={`Across ${props.length} ${props.length === 1 ? "property" : "properties"}`}
                  icon={Home}
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel revenue-panel">
                  <div className="panel-head">
                    <div>
                      <h2>Cash flow</h2>
                      <p>Collections and paid expenses over time</p>
                    </div>
                    <span className="period">Last 6 months</span>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="green" /> Collections
                    </span>
                    <span>
                      <i className="pale" /> Expenses
                    </span>
                  </div>
                  <div className="bar-chart">
                    {Array.from({ length: 6 }, (_, idx) => {
                      const dt = new Date();
                      dt.setDate(1);
                      dt.setMonth(dt.getMonth() - 5 + idx);
                      const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
                      const inc = payments
                        .filter((p) => dateValue(p.paid_on).startsWith(m))
                        .reduce((s, p) => s + Number(p.amount), 0);
                      const exp = expenses
                        .filter(
                          (e) =>
                            e.status === "Paid" &&
                            dateValue(e.spent_on).startsWith(m),
                        )
                        .reduce((s, e) => s + Number(e.amount), 0);
                      const max = Math.max(
                        1,
                        ...Array.from({ length: 6 }, (_, j) => {
                          const dd = new Date();
                          dd.setDate(1);
                          dd.setMonth(dd.getMonth() - 5 + j);
                          const mm = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`;
                          return Math.max(
                            payments
                              .filter((p) =>
                                dateValue(p.paid_on).startsWith(mm),
                              )
                              .reduce((s, p) => s + Number(p.amount), 0),
                            expenses
                              .filter(
                                (e) =>
                                  e.status === "Paid" &&
                                  dateValue(e.spent_on).startsWith(mm),
                              )
                              .reduce((s, e) => s + Number(e.amount), 0),
                          );
                        }),
                      );
                      return (
                        <div className="chart-column" key={m}>
                          <div className="bars">
                            <div
                              title={`Collections: ${money(inc)}`}
                              style={{
                                height: `${Math.max(inc ? 3 : 0, (inc / max) * 100)}%`,
                              }}
                            />
                            <div
                              title={`Expenses: ${money(exp)}`}
                              style={{
                                height: `${Math.max(exp ? 3 : 0, (exp / max) * 100)}%`,
                              }}
                            />
                          </div>
                          <span>
                            {dt.toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="chart-summary">
                    <span>
                      This month’s cash surplus{" "}
                      <b>{money(collected - spending)}</b>
                    </span>
                    <small>
                      Collections minus paid expenses · excludes deposits
                    </small>
                  </div>
                </section>
                <section className="panel attention">
                  <div className="panel-head">
                    <h2>Needs your attention</h2>
                    <span className="count">
                      {overdue.length +
                        complaints.filter((c) => c.status !== "Resolved")
                          .length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      go("Rent & payments");
                      setFilter("Outstanding");
                    }}
                  >
                    <span className="attention-icon amber">
                      <Receipt size={19} />
                    </span>
                    <span>
                      <strong>{overdue.length} overdue rent bills</strong>
                      <small>
                        {money(
                          overdue.reduce(
                            (s, i) => s + Number(i.amount) - Number(i.paid),
                            0,
                          ),
                        )}{" "}
                        awaiting collection
                      </small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => go("Maintenance")}>
                    <span className="attention-icon blue">
                      <Wrench size={19} />
                    </span>
                    <span>
                      <strong>
                        {
                          complaints.filter((c) => c.status !== "Resolved")
                            .length
                        }{" "}
                        open requests
                      </strong>
                      <small>Keep your residents comfortable</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <button onClick={() => go("Reminders")}>
                    <span className="attention-icon purple">
                      <CalendarDays size={19} />
                    </span>
                    <span>
                      <strong>
                        {active.filter((t) => t.notice_on).length} planned
                        move-outs
                      </strong>
                      <small>Review notice and settlement</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <div className="attention-note">
                    <ShieldCheck size={19} />
                    <p>
                      A little follow-up goes a long way.
                      <br />
                      <b>Keep your PG running smoothly.</b>
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Your properties</h2>
                    <p>A quick check on occupancy and collections</p>
                  </div>
                  <button className="text-btn" onClick={() => go("Properties")}>
                    View all properties <ArrowRight size={16} />
                  </button>
                </div>
                <Table
                  headers={[
                    "PROPERTY",
                    "OCCUPANCY",
                    "BEDS AVAILABLE",
                    "MONTHLY COLLECTIONS",
                    "",
                  ]}
                  rows={props.map((p) => {
                    const pb = data.beds.filter((b) => b.property_id === p.id);
                    const used = pb.filter((b) => b.stay_id).length;
                    const rate = pb.length
                      ? Math.round((used / pb.length) * 100)
                      : 0;
                    return [
                      <div className="property-cell">
                        <span className="property-icon">
                          <Building2 size={21} />
                        </span>
                        <div>
                          <b>{p.name}</b>
                          <small>
                            {p.city} · {p.type}
                          </small>
                        </div>
                      </div>,
                      <div className="occupancy-cell">
                        <span>
                          {used}/{pb.length} beds <b>{rate}%</b>
                        </span>
                        <div className="progress">
                          <i style={{ width: `${rate}%` }} />
                        </div>
                      </div>,
                      <Badge tone="green">
                        {pb.filter((b) => !b.stay_id && !b.maintenance).length}{" "}
                        available
                      </Badge>,
                      <b>
                        {money(
                          data.payments
                            .filter(
                              (pay) =>
                                pay.property_id === p.id &&
                                dateValue(pay.paid_on).startsWith(month),
                            )
                            .reduce((s, pay) => s + Number(pay.amount), 0),
                        )}
                      </b>,
                      <button
                        aria-label={`View ${p.name}`}
                        className="icon-btn"
                        onClick={() => {
                          setProperty(p.id);
                          go("Rooms & beds");
                        }}
                      >
                        <ArrowUpRight size={18} />
                      </button>,
                    ];
                  })}
                />
              </section>
            </>
          )}
          {page === "Overview" && !finance && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Total occupancy"
                  value={`${occupancy}%`}
                  note={`${occupied} of ${beds.length} beds occupied`}
                  icon={BedDouble}
                  color="featured"
                />
                <Stat
                  label="Available beds"
                  value={String(available)}
                  note="Across your assigned properties"
                  icon={Home}
                />
                <Stat
                  label="Open requests"
                  value={String(
                    complaints.filter((c) => c.status !== "Resolved").length,
                  )}
                  note="Maintenance to follow up"
                  icon={Wrench}
                />
              </div>
              <section className="panel settings-card">
                <div>
                  <h2>Keep your property running smoothly</h2>
                  <p>
                    Review room availability and follow up on maintenance
                    requests.
                  </p>
                </div>
                <button className="primary" onClick={() => go("Maintenance")}>
                  View maintenance <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {page === "Properties" && (
            <div className="property-grid">
              {props.filter(matches).map((p) => {
                const pb = data.beds.filter((b) => b.property_id === p.id),
                  used = pb.filter((b) => b.stay_id).length;
                return (
                  <article className="panel property-card" key={p.id}>
                    <div className="property-art">
                      <Building2 size={44} />
                      <Badge>{p.type}</Badge>
                    </div>
                    <div className="property-body">
                      <h2>{p.name}</h2>
                      <p>
                        {p.address}, {p.city}
                      </p>
                      <div className="property-numbers">
                        <div>
                          <b>
                            {
                              data.rooms.filter((r) => r.property_id === p.id)
                                .length
                            }
                          </b>
                          <small>Rooms</small>
                        </div>
                        <div>
                          <b>
                            {used}/{pb.length}
                          </b>
                          <small>Occupied beds</small>
                        </div>
                        <div>
                          <b>
                            {
                              pb.filter((b) => !b.stay_id && !b.maintenance)
                                .length
                            }
                          </b>
                          <small>Available</small>
                        </div>
                      </div>
                      <div className="progress">
                        <i
                          style={{
                            width: `${pb.length ? (used / pb.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="amenities">
                        {p.amenities || "No amenities added yet"}
                      </p>
                      <div className="card-actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            setProperty(p.id);
                            go("Rooms & beds");
                          }}
                        >
                          Manage property <ArrowRight size={15} />
                        </button>
                        {owner && (
                          <button
                            className="text-btn"
                            onClick={() => addProperty(p)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {!props.length && (
                <Empty
                  title="Your first PG starts here"
                  text="Add a property, then create rooms and beds."
                />
              )}
            </div>
          )}
          {page === "Rooms & beds" && (
            <>
              <div className="room-summary">
                <span>
                  <i className="legend-dot occupied" />
                  {occupied} occupied
                </span>
                <span>
                  <i className="legend-dot vacant" />
                  {available} available
                </span>
                <span>
                  <i className="legend-dot maintenance" />
                  {beds.filter((b) => b.maintenance).length} maintenance
                </span>
              </div>
              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search rooms"
                    placeholder="Search room number, floor…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="rooms-grid">
                {scoped(data.rooms)
                  .filter(matches)
                  .map((r) => (
                    <section className="panel room-card" key={r.id}>
                      <div className="panel-head">
                        <div>
                          <h2>Room {r.name}</h2>
                          <p>
                            {r.property_name} · Floor {r.floor}
                          </p>
                        </div>
                        {finance ? (
                          <Badge>{money(r.rent)} / bed</Badge>
                        ) : (
                          <Badge>
                            {beds.filter((b) => b.room_id === r.id).length} beds
                          </Badge>
                        )}
                      </div>
                      <div className="bed-grid">
                        {beds
                          .filter((b) => b.room_id === r.id)
                          .map((b) => (
                            <button
                              key={b.id}
                              className={`bed ${b.stay_id ? "occupied" : b.maintenance ? "maintenance" : "vacant"}`}
                              title={
                                b.stay_id
                                  ? b.tenant_name
                                  : b.maintenance
                                    ? "Mark available"
                                    : "Mark under maintenance"
                              }
                              onClick={() => {
                                if (b.stay_id) {
                                  const t = data.tenants.find(
                                    (t) => t.id === b.stay_id,
                                  );
                                  if (t) setDetail(t);
                                } else quick("maintenance", { id: b.id });
                              }}
                              disabled={
                                busy ||
                                (!ops &&
                                  data.user.role !== "caretaker" &&
                                  !b.stay_id)
                              }
                            >
                              <BedDouble size={25} />
                              <b>{b.label}</b>
                              <small>
                                {b.stay_id
                                  ? b.tenant_name.split(" ")[0]
                                  : b.maintenance
                                    ? "Maintenance"
                                    : "Available"}
                              </small>
                            </button>
                          ))}
                      </div>
                      <small className="room-tip">
                        Select an empty bed to toggle maintenance.
                      </small>
                    </section>
                  ))}
              </div>
              {!scoped(data.rooms).length && (
                <Empty
                  title="No rooms yet"
                  text="Create a room and we’ll add its beds automatically."
                />
              )}
            </>
          )}
          {[
            "Tenants",
            "Enquiries",
            "Rent & payments",
            "Expenses",
            "Maintenance",
            "Documents",
            "Team",
          ].includes(page) && (
            <section className="panel">
              <div className="toolbar">
                <div className="search">
                  <Search size={17} />
                  <input
                    aria-label={`Search ${page}`}
                    placeholder={`Search ${page.toLowerCase()}…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="toolbar-right">
                  {page === "Rent & payments" && ops && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        setModal({
                          title: "Generate monthly rent",
                          subtitle:
                            "Creates this month’s bills once per active stay. First-month rent is prorated from the joining date.",
                          action: "rent",
                          fields: [propertyField],
                          values: { property_id: defaultProp },
                          submit: "Generate bills",
                        })
                      }
                    >
                      <RefreshCw size={15} /> Generate rent
                    </button>
                  )}
                  {page === "Rent & payments" && finance && (
                    <button
                      className="text-btn"
                      onClick={() =>
                        setModal({
                          title: "Add a charge",
                          action: "charge",
                          fields: [
                            {
                              name: "stay_id",
                              label: "Tenant",
                              type: "select",
                              required: true,
                              options: active.map((t) => ({
                                value: t.id,
                                label: `${t.name} · ${t.property_name}`,
                              })),
                            },
                            f("description", "Description"),
                            f("amount", "Amount (₹)", "number"),
                            f("due_on", "Due date", "date"),
                          ],
                          values: { due_on: today() },
                        })
                      }
                    >
                      + Add charge
                    </button>
                  )}
                  {["Tenants", "Rent & payments", "Maintenance"].includes(
                    page,
                  ) && (
                    <select
                      aria-label="Status filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {(page === "Tenants"
                        ? ["All", "Active", "Notice", "Checked out"]
                        : page === "Rent & payments"
                          ? ["All", "Outstanding", "Paid", "Payments"]
                          : ["All", "Open", "In progress", "Resolved"]
                      ).map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              {page === "Tenants" && (
                <Table
                  headers={[
                    "TENANT",
                    "PROPERTY / BED",
                    "MONTHLY RENT",
                    "DEPOSIT RECEIVED",
                    "STATUS",
                    "",
                  ]}
                  rows={tenants
                    .filter(matches)
                    .filter(
                      (t) =>
                        filter === "All" ||
                        (filter === "Active" && !t.ended_on) ||
                        (filter === "Notice" && t.notice_on && !t.ended_on) ||
                        (filter === "Checked out" && t.ended_on),
                    )
                    .map((t) => [
                      <button
                        className="person-cell"
                        onClick={() => setDetail(t)}
                      >
                        <span className="avatar">
                          {t.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span>
                          <b>{t.name}</b>
                          <small>{t.phone}</small>
                        </span>
                      </button>,
                      <div>
                        <b>{t.property_name}</b>
                        <small>
                          Room {t.room_name} · {t.bed_label}
                        </small>
                      </div>,
                      money(t.rent),
                      <div>
                        {money(t.deposit_paid)}
                        <small>of {money(t.deposit_expected)}</small>
                      </div>,
                      <Badge
                        tone={
                          t.ended_on ? "gray" : t.notice_on ? "amber" : "green"
                        }
                      >
                        {t.ended_on
                          ? "Checked out"
                          : t.notice_on
                            ? "On notice"
                            : "Active"}
                      </Badge>,
                      <button className="text-btn" onClick={() => setDetail(t)}>
                        View <ChevronRight size={14} />
                      </button>,
                    ])}
                />
              )}
              {page === "Enquiries" && (
                <Table
                  headers={[
                    "PROSPECT",
                    "PROPERTY",
                    "MOVE-IN",
                    "FOLLOW-UP",
                    "NOTES",
                    "STATUS",
                  ]}
                  rows={scoped(data.bookings)
                    .filter(matches)
                    .map((b) => [
                      <div>
                        <b>{b.name}</b>
                        <small>{b.phone}</small>
                      </div>,
                      b.property_name,
                      day(b.move_in),
                      day(b.follow_up),
                      b.notes || "—",
                      ops ? (
                        <select
                          aria-label={`Status for ${b.name}`}
                          value={b.status}
                          disabled={busy}
                          onChange={(e) =>
                            quick("bookingStatus", {
                              id: b.id,
                              status: e.target.value,
                            })
                          }
                        >
                          {["New", "Contacted", "Converted", "Cancelled"].map(
                            (x) => (
                              <option key={x}>{x}</option>
                            ),
                          )}
                        </select>
                      ) : (
                        <Badge>{b.status}</Badge>
                      ),
                    ])}
                />
              )}
              {page === "Rent & payments" &&
                (filter === "Payments" ? (
                  <Table
                    headers={[
                      "TENANT",
                      "INVOICE",
                      "DATE",
                      "METHOD",
                      "AMOUNT",
                      "",
                    ]}
                    rows={payments.filter(matches).map((p) => [
                      p.tenant_name,
                      `#${String(p.invoice_number).padStart(4, "0")}`,
                      day(p.paid_on),
                      p.method,
                      <b>{money(p.amount)}</b>,
                      <button className="text-btn" onClick={() => receipt(p)}>
                        <Download size={14} /> Receipt
                      </button>,
                    ])}
                  />
                ) : (
                  <Table
                    headers={[
                      "INVOICE / TENANT",
                      "PROPERTY",
                      "DUE DATE",
                      "BILLED",
                      "BALANCE",
                      "STATUS",
                      "",
                    ]}
                    rows={invoices
                      .filter(matches)
                      .filter(
                        (i) =>
                          filter === "All" ||
                          (filter === "Outstanding" &&
                            Number(i.amount) > Number(i.paid)) ||
                          (filter === "Paid" &&
                            Number(i.amount) === Number(i.paid)),
                      )
                      .map((i) => {
                        const balance = Number(i.amount) - Number(i.paid),
                          late = dateValue(i.due_on) < today();
                        return [
                          <div>
                            <b>{i.tenant_name}</b>
                            <small>
                              #{String(i.number).padStart(4, "0")} ·{" "}
                              {i.description}
                            </small>
                          </div>,
                          i.property_name,
                          day(i.due_on),
                          money(i.amount),
                          <b>{money(balance)}</b>,
                          <Badge
                            tone={!balance ? "green" : late ? "red" : "amber"}
                          >
                            {!balance
                              ? "Paid"
                              : Number(i.paid) > 0
                                ? "Partial"
                                : late
                                  ? "Overdue"
                                  : "Pending"}
                          </Badge>,
                          balance > 0 ? (
                            <button
                              className="text-btn"
                              onClick={() => payment(i)}
                            >
                              Collect <ArrowRight size={14} />
                            </button>
                          ) : (
                            <Check size={17} className="success-icon" />
                          ),
                        ];
                      })}
                  />
                ))}
              {page === "Expenses" && (
                <Table
                  headers={[
                    "EXPENSE",
                    "PROPERTY",
                    "DATE",
                    "AMOUNT",
                    "STATUS",
                    "",
                  ]}
                  rows={expenses.filter(matches).map((e) => [
                    <div>
                      <b>{e.description}</b>
                      <small>{e.category}</small>
                    </div>,
                    e.property_name,
                    day(e.spent_on),
                    <b>{money(e.amount)}</b>,
                    <Badge tone={e.status === "Paid" ? "green" : "amber"}>
                      {e.status}
                    </Badge>,
                    e.status === "Pending" ? (
                      <button
                        className="text-btn"
                        disabled={busy}
                        onClick={() => quick("expenseStatus", { id: e.id })}
                      >
                        Mark paid
                      </button>
                    ) : (
                      "—"
                    ),
                  ])}
                />
              )}
              {page === "Maintenance" && (
                <Table
                  headers={[
                    "REQUEST",
                    "PROPERTY / LOCATION",
                    "PRIORITY",
                    "ASSIGNED TO",
                    "STATUS",
                  ]}
                  rows={complaints
                    .filter(matches)
                    .filter((c) => filter === "All" || c.status === filter)
                    .map((c) => [
                      <div>
                        <b>{c.title}</b>
                        <small>{c.notes || day(c.created_at)}</small>
                      </div>,
                      <div>
                        {c.property_name}
                        <small>{c.location}</small>
                      </div>,
                      <Badge
                        tone={
                          c.priority === "High"
                            ? "red"
                            : c.priority === "Medium"
                              ? "amber"
                              : "gray"
                        }
                      >
                        {c.priority}
                      </Badge>,
                      c.assigned_to || "Unassigned",
                      <select
                        aria-label={`Status for ${c.title}`}
                        value={c.status}
                        disabled={busy}
                        onChange={(e) =>
                          quick("complaintStatus", {
                            id: c.id,
                            status: e.target.value,
                          })
                        }
                      >
                        {["Open", "In progress", "Resolved"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>,
                    ])}
                />
              )}
              {page === "Documents" && (
                <Table
                  headers={[
                    "DOCUMENT",
                    "PROPERTY",
                    "TENANT",
                    "CATEGORY",
                    "UPLOADED",
                    "",
                  ]}
                  rows={scoped(data.documents)
                    .filter(matches)
                    .map((d) => [
                      <div className="document-cell">
                        <FileText size={20} />
                        <div>
                          <b>{d.name}</b>
                          <small>{Math.ceil(d.size / 1024)} KB</small>
                        </div>
                      </div>,
                      d.property_name,
                      d.tenant_name || "Property document",
                      <Badge>{d.category}</Badge>,
                      day(d.created_at),
                      <a
                        className="text-btn"
                        href={`/api/documents?id=${d.id}`}
                      >
                        <Download size={15} /> Download
                      </a>,
                    ])}
                />
              )}
              {page === "Team" && (
                <Table
                  headers={[
                    "TEAM MEMBER",
                    "ROLE",
                    "PROPERTY ACCESS",
                    "STATUS",
                    "",
                  ]}
                  rows={data.staff.filter(matches).map((u) => [
                    <div>
                      <b>{u.name}</b>
                      <small>{u.email}</small>
                    </div>,
                    <Badge>{u.role}</Badge>,
                    u.role === "owner"
                      ? "All properties"
                      : data.properties
                          .filter((p) => u.property_ids.includes(p.id))
                          .map((p) => p.name)
                          .join(", "),
                    <Badge tone={u.active ? "green" : "gray"}>
                      {u.active ? "Active" : "Disabled"}
                    </Badge>,
                    u.role !== "owner" ? (
                      <button
                        className="text-btn"
                        disabled={busy}
                        onClick={() => quick("staffAccess", { id: u.id })}
                      >
                        {u.active ? "Disable access" : "Enable access"}
                      </button>
                    ) : (
                      "—"
                    ),
                  ])}
                />
              )}
            </section>
          )}
          {page === "Reports" && (
            <>
              <div className="stats-grid">
                <Stat
                  label="Collections this month"
                  value={money(collected)}
                  note="Based on actual payment dates"
                  icon={ArrowDownLeft}
                />
                <Stat
                  label="Paid expenses"
                  value={money(spending)}
                  note="Pending expenses excluded"
                  icon={ArrowUpRight}
                />
                <Stat
                  label="Cash surplus"
                  value={money(collected - spending)}
                  note="Excludes security deposits"
                  icon={TrendingUp}
                  color="featured"
                />
                <Stat
                  label="Deposits held"
                  value={money(
                    active.reduce((s, t) => s + Number(t.deposit_paid), 0),
                  )}
                  note="Refundable deposits, not income"
                  icon={ShieldCheck}
                />
              </div>
              <section className="panel">
                <div className="panel-head">
                  <h2>Property performance</h2>
                  <span className="period">
                    {new Date().toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Table
                  headers={[
                    "PROPERTY",
                    "COLLECTED",
                    "PAID EXPENSES",
                    "CASH SURPLUS",
                    "OUTSTANDING DUES",
                  ]}
                  rows={props.map((p) => {
                    const inc = payments
                        .filter(
                          (x) =>
                            x.property_id === p.id &&
                            dateValue(x.paid_on).startsWith(month),
                        )
                        .reduce((s, x) => s + Number(x.amount), 0),
                      exp = expenses
                        .filter(
                          (x) =>
                            x.property_id === p.id &&
                            x.status === "Paid" &&
                            dateValue(x.spent_on).startsWith(month),
                        )
                        .reduce((s, x) => s + Number(x.amount), 0);
                    return [
                      p.name,
                      money(inc),
                      money(exp),
                      <b>{money(inc - exp)}</b>,
                      money(
                        dues
                          .filter((i) => i.property_id === p.id)
                          .reduce(
                            (s, i) => s + Number(i.amount) - Number(i.paid),
                            0,
                          ),
                      ),
                    ];
                  })}
                />
              </section>
              <div className="export-grid">
                {["tenants", "invoices", "payments", "expenses"].map((t) => (
                  <button
                    className="panel export-card"
                    key={t}
                    onClick={() => exportReport(t)}
                  >
                    <FileText size={24} />
                    <span>
                      <b>{t.charAt(0).toUpperCase() + t.slice(1)} report</b>
                      <small>Download all records for selected PG · CSV</small>
                    </span>
                    <Download size={18} />
                  </button>
                ))}
              </div>
              <p className="footnote">
                CSV monetary amounts are in paise (₹1 = 100 paise). Cash surplus
                is a cash-flow measure, not an accounting profit statement.
              </p>
            </>
          )}
          {page === "Reminders" && (
            <div className="reminder-grid">
              <section className="panel">
                <div className="panel-head">
                  <h2>Overdue bills</h2>
                  <Badge tone="amber">{overdue.length}</Badge>
                </div>
                {overdue.length ? (
                  overdue.map((i) => (
                    <div className="reminder" key={i.id}>
                      <Receipt size={20} />
                      <div>
                        <b>{i.tenant_name}</b>
                        <small>
                          {money(Number(i.amount) - Number(i.paid))} · Due{" "}
                          {day(i.due_on)}
                        </small>
                      </div>
                      <button className="text-btn" onClick={() => payment(i)}>
                        Collect
                      </button>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="No overdue bills"
                    text="You’re all caught up."
                  />
                )}
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>Upcoming dates</h2>
                </div>
                {active
                  .filter((t) => t.notice_on || t.agreement_expires)
                  .map((t) => (
                    <div className="reminder" key={t.id}>
                      <CalendarDays size={20} />
                      <div>
                        <b>{t.name}</b>
                        <small>
                          {t.notice_on
                            ? `Move-out: ${day(t.notice_on)}`
                            : `Agreement expires: ${day(t.agreement_expires)}`}
                        </small>
                      </div>
                      <button className="text-btn" onClick={() => setDetail(t)}>
                        View
                      </button>
                    </div>
                  ))}
                {!active.some((t) => t.notice_on || t.agreement_expires) && (
                  <Empty
                    title="No upcoming dates"
                    text="Agreement expiries and notices will appear here."
                  />
                )}
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>Enquiry follow-ups</h2>
                </div>
                {scoped(data.bookings)
                  .filter(
                    (b) =>
                      b.follow_up &&
                      !["Cancelled", "Converted"].includes(b.status),
                  )
                  .map((b) => (
                    <div className="reminder" key={b.id}>
                      <UserRound size={20} />
                      <div>
                        <b>{b.name}</b>
                        <small>
                          {b.phone} · {day(b.follow_up)}
                        </small>
                      </div>
                    </div>
                  ))}
              </section>
            </div>
          )}
          {page === "Settings" && (
            <>
              <section className="panel settings-card">
                <div>
                  <h2>Your account</h2>
                  <p>
                    {data.user.name} · {data.user.email}
                  </p>
                  <Badge tone="green">{data.user.role}</Badge>
                </div>
                <button
                  className="secondary"
                  onClick={() =>
                    setModal({
                      title: "Change your password",
                      action: "password",
                      fields: [
                        f("current_password", "Current password", "password"),
                        f(
                          "password",
                          "New password (12+ characters)",
                          "password",
                        ),
                      ],
                    })
                  }
                >
                  Change password
                </button>
              </section>
              <section className="panel settings-card">
                <div>
                  <h2>Billing policy</h2>
                  <p>
                    Monthly rent, prorated on joining. Checkout month is billed
                    in full.
                    <br />
                    Security deposits are tracked separately. Set each PG’s due
                    day under Properties.
                  </p>
                </div>
                <button className="secondary" onClick={() => go("Properties")}>
                  Property settings
                </button>
              </section>
              {owner && (
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h2>Activity history</h2>
                      <p>The latest 100 changes to your workspace</p>
                    </div>
                    <History size={20} />
                  </div>
                  <Table
                    headers={["ACTION", "BY", "PROPERTY", "DATE"]}
                    rows={data.audit.map((a) => [
                      a.action.replace(/([A-Z])/g, " $1"),
                      a.actor || "System",
                      a.property_name || "Workspace",
                      new Date(a.created_at).toLocaleString("en-IN"),
                    ])}
                  />
                </section>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              NestLedger <span>·</span> A clearer view of your PG business
            </span>
            <span>
              <ShieldCheck size={13} /> Private owner workspace
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <FormDialog
          key={modal.action + String(modal.values?.id || "")}
          modal={modal}
          onClose={() => setModal(null)}
          properties={data.properties}
          beds={data.beds}
          tenants={data.tenants}
          onSubmit={async (values) => {
            if (modal.action === "document") {
              const r = await fetch("/api/documents", {
                method: "POST",
                body: values.formData,
              });
              const result = await r.json();
              if (!r.ok) throw Error(result.error);
              await refresh();
              setToast("Document uploaded securely.");
            } else await act(modal.action, values);
          }}
        />
      )}
      {detail && (
        <TenantDetail
          tenant={data.tenants.find((t) => t.id === detail.id) || detail}
          invoices={data.invoices.filter((i) => i.stay_id === detail.id)}
          onClose={() => setDetail(null)}
          onPay={payment}
          ops={ops}
          finance={finance}
          onAction={(kind, t) => {
            setDetail(null);
            if (kind === "edit")
              setModal({
                title: "Edit tenant profile",
                action: "tenantUpdate",
                fields: tenantFields,
                values: {
                  ...t,
                  agreement_expires: dateValue(t.agreement_expires),
                },
              });
            if (kind === "transfer")
              setModal({
                title: "Transfer bed",
                subtitle:
                  "Transfers within this PG preserve the agreed rent and deposit.",
                action: "transfer",
                fields: [bedField],
                values: { id: t.id, property_id: t.property_id },
              });
            if (kind === "deposit")
              setModal({
                title: "Record security deposit",
                subtitle: `Pending deposit: ${money(Number(t.deposit_expected) - Number(t.deposit_paid))}`,
                action: "deposit",
                fields: [
                  f("amount", "Amount received (₹)", "number"),
                  f("reference", "Payment reference", "text", false),
                ],
                values: {
                  id: t.id,
                  amount:
                    (Number(t.deposit_expected) - Number(t.deposit_paid)) / 100,
                },
              });
            if (kind === "notice")
              setModal({
                title: "Record move-out notice",
                action: "notice",
                fields: [f("notice_on", "Expected move-out date", "date")],
                values: { id: t.id, notice_on: today() },
              });
            if (kind === "checkout")
              setModal({
                title: "Settle & check out",
                subtitle: `Collected deposit: ${money(t.deposit_paid)}. Settle all rent bills first. Saving confirms the remaining deposit has been refunded and releases the bed.`,
                action: "checkout",
                fields: [
                  f("ended_on", "Checkout date", "date"),
                  f("deduction", "Deposit deduction (₹)", "number"),
                  f(
                    "reason",
                    "Settlement reason / refund reference",
                    "textarea",
                  ),
                ],
                values: { id: t.id, ended_on: today(), deduction: 0 },
                submit: "Confirm refund & checkout",
              });
          }}
        />
      )}
    </div>
  );
}
function TenantDetail({
  tenant: t,
  invoices,
  onClose,
  onAction,
  onPay,
  ops,
  finance,
}: {
  tenant: Row;
  invoices: Row[];
  onClose: () => void;
  onAction: (kind: string, t: Row) => void;
  onPay: (i: Row) => void;
  ops: boolean;
  finance: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog className="detail-dialog" ref={ref} onCancel={onClose}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">TENANT PROFILE</span>
          <h2>{t.name}</h2>
          <p>
            {t.property_name} · Room {t.room_name} · {t.bed_label}
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close tenant"
        >
          <X />
        </button>
      </div>
      <div className="detail-body">
        <div className="detail-grid">
          {Object.entries({
            Phone: t.phone,
            Email: t.email || "—",
            Joined: day(t.joined_on),
            "Monthly rent": money(t.rent),
            "Deposit received": money(t.deposit_paid),
            "Deposit expected": money(t.deposit_expected),
            "Emergency contact": `${t.emergency_name || "—"} ${t.emergency_phone}`,
            "College / workplace": t.occupation || "—",
            Address: t.address || "—",
            "Agreement expires": day(t.agreement_expires),
            "Move-out notice": day(t.notice_on),
            ...(t.ended_on
              ? {
                  "Checked out": day(t.ended_on),
                  "Deposit refunded": money(t.deposit_refund),
                  "Deposit deducted": money(t.deposit_deduction),
                  Settlement: t.settlement_reason,
                }
              : {}),
          }).map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <h3>Bills</h3>
        {invoices.length ? (
          invoices.map((i) => (
            <div className="reminder" key={i.id}>
              <div>
                <b>{i.description}</b>
                <small>Due {day(i.due_on)}</small>
              </div>
              <strong>{money(Number(i.amount) - Number(i.paid))} due</strong>
              {Number(i.amount) > Number(i.paid) && finance && (
                <button
                  className="text-btn"
                  onClick={() => {
                    onClose();
                    onPay(i);
                  }}
                >
                  Collect
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No bills generated yet.</p>
        )}
        <div className="detail-actions">
          {ops && (
            <button className="secondary" onClick={() => onAction("edit", t)}>
              Edit profile
            </button>
          )}
          {!t.ended_on && (
            <>
              {ops && (
                <>
                  <button
                    className="secondary"
                    onClick={() => onAction("transfer", t)}
                  >
                    Transfer bed
                  </button>
                  <button
                    className="secondary"
                    onClick={() => onAction("notice", t)}
                  >
                    Record notice
                  </button>
                </>
              )}
              {finance &&
                Number(t.deposit_paid) < Number(t.deposit_expected) && (
                  <button
                    className="secondary"
                    onClick={() => onAction("deposit", t)}
                  >
                    Collect deposit
                  </button>
                )}
              {ops && (
                <button
                  className="danger"
                  onClick={() => onAction("checkout", t)}
                >
                  Check out
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
