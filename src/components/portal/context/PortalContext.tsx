"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Data, Modal, Row, Field } from "../types";
import { dateValue, today, f, sel, printReceipt } from "../utils";

export interface PortalContextType {
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data | null>>;
  refresh: () => Promise<void>;
  loadError: string;
  page: string;
  go: (p: string) => void;
  property: string;
  setProperty: (id: string) => void;
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (f: string) => void;
  modal: Modal | null;
  setModal: (m: Modal | null) => void;
  detail: Row | null;
  setDetail: (r: Row | null) => void;
  toast: string;
  setToast: (t: string) => void;
  mobile: boolean;
  setMobile: React.Dispatch<React.SetStateAction<boolean>>;
  busy: boolean;
  act: (action: string, values: Row) => Promise<void>;
  quick: (action: string, values: Row) => Promise<void>;

  // Roles
  owner: boolean;
  ops: boolean;
  finance: boolean;

  // Scoped collections & helpers
  scoped: (rows: Row[]) => Row[];
  matches: (r: Row) => boolean;
  props: Row[];
  beds: Row[];
  tenants: Row[];
  invoices: Row[];
  expenses: Row[];
  payments: Row[];
  complaints: Row[];
  occupied: number;
  available: number;
  occupancy: number;
  collected: number;
  spending: number;
  dues: Row[];
  outstanding: number;
  active: Row[];
  overdue: Row[];

  // Field helpers
  defaultProp: string;
  propertyField: Field;
  bedField: Field;
  tenantFields: Field[];

  // Action helpers
  addTenant: () => void;
  addProperty: (p?: Row) => void;
  payment: (i: Row) => void;
  receipt: (p: Row) => void;
  exportReport: (type: string) => void;
}

const PortalContext = createContext<PortalContextType | null>(null);

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}

export function PortalProvider({
  initialData,
  refresh,
  loadError,
  children,
}: {
  initialData: Data;
  refresh: () => Promise<void>;
  loadError: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<Data>(initialData);
  const [page, setPage] = useState("Overview");
  const [property, setProperty] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [toast, setToast] = useState("");
  const [mobile, setMobile] = useState(false);
  const [filter, setFilter] = useState("All");
  const [detail, setDetail] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  // Sync internal data when initialData updates
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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

  const act = async (action: string, values: Row) => {
    const r = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data: values }),
    });
    const response = await r.json();
    if (!r.ok) throw Error(response.error);
    await refresh();
    setToast(response.message || "Changes saved successfully.");
  };

  const quick = async (action: string, values: Row) => {
    setBusy(true);
    try {
      await act(action, values);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const owner = data.user.role === "owner";
  const ops = ["owner", "manager"].includes(data.user.role);
  const finance = data.user.role !== "caretaker";

  const scoped = useCallback(
    (rows: Row[]) =>
      rows.filter(
        (r) =>
          property === "all" || r.property_id === property || r.id === property,
      ),
    [property],
  );

  const matches = useCallback(
    (r: Row) =>
      !search ||
      Object.values(r).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const props = data.properties.filter(
    (p) => property === "all" || p.id === property,
  );
  const beds = scoped(data.beds);
  const tenants = scoped(data.tenants);
  const invoices = scoped(data.invoices);
  const expenses = scoped(data.expenses);
  const payments = scoped(data.payments);
  const complaints = scoped(data.complaints);

  const occupied = beds.filter((b) => b.stay_id).length;
  const available = beds.filter((b) => !b.stay_id && !b.maintenance).length;
  const occupancy = beds.length
    ? Math.round((occupied / beds.length) * 100)
    : 0;

  const month = today().slice(0, 7);
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
  const overdue = dues.filter((i) => dateValue(i.due_on) < today());

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

  const tenantFields: Field[] = [
    f("name", "Full name"),
    f("phone", "Phone number", "tel"),
    f("email", "Email address", "email", false),
    f("occupation", "College / workplace", "text", false),
    f("emergency_name", "Emergency contact name", "text", false),
    f("emergency_phone", "Emergency contact phone", "tel", false),
    f("address", "Permanent address", "textarea", false),
    f("agreement_expires", "Agreement expiry", "date", false),
  ];

  const addTenant = () => {
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
  };

  const addProperty = (p?: Row) => {
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
  };

  const payment = (i: Row) => {
    setModal({
      title: "Record rent payment",
      subtitle: `${i.tenant_name} · Invoice #${String(i.number).padStart(4, "0")} · Balance ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: Number(Number(i.amount) - Number(i.paid)) % 100 ? 2 : 0 }).format(Number(Number(i.amount) - Number(i.paid) || 0) / 100)}`,
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
  };

  const receipt = (p: Row) => {
    printReceipt(p, data, setToast);
  };

  const exportReport = (type: string) => {
    window.location.href = `/api/export?type=${type}&property=${property}`;
  };

  return (
    <PortalContext.Provider
      value={{
        data,
        setData: setData as any,
        refresh,
        loadError,
        page,
        go,
        property,
        setProperty,
        search,
        setSearch,
        filter,
        setFilter,
        modal,
        setModal,
        detail,
        setDetail,
        toast,
        setToast,
        mobile,
        setMobile,
        busy,
        act,
        quick,
        owner,
        ops,
        finance,
        scoped,
        matches,
        props,
        beds,
        tenants,
        invoices,
        expenses,
        payments,
        complaints,
        occupied,
        available,
        occupancy,
        collected,
        spending,
        dues,
        outstanding,
        active,
        overdue,
        defaultProp,
        propertyField,
        bedField,
        tenantFields,
        addTenant,
        addProperty,
        payment,
        receipt,
        exportReport,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}
