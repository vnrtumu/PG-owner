import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  CalendarDays,
  Receipt,
  Wallet,
  Wrench,
  FileText,
  TrendingUp,
  ShieldCheck,
  Settings,
} from "lucide-react";
import type { Field, NavItem, Row, Data } from "./types";

export const money = (v: any) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number(v) % 100 ? 2 : 0,
  }).format(Number(v || 0) / 100);

export const day = (v: any) =>
  v
    ? new Date(v).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const dateValue = (v: any) => (v ? String(v).slice(0, 10) : "");

export const NAV_ITEMS: NavItem[] = [
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

export const f = (
  name: string,
  label: string,
  type = "text",
  required = true,
): Field => ({ name, label, type, required });

export const sel = (name: string, label: string, options: string[]): Field => ({
  name,
  label,
  type: "select",
  options: options.map((x) => ({ value: x, label: x })),
  required: true,
});

export function printReceipt(
  payment: Row,
  data: Data,
  onToast: (msg: string) => void,
) {
  const invoice = data.invoices.find((i) => i.id === payment.invoice_id);
  const property = data.properties.find((x) => x.id === payment.property_id);
  const w = window.open("", "_blank");
  if (!w) {
    onToast("Allow pop-ups to print the receipt.");
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
        "Receipt reference": payment.id,
        Tenant: payment.tenant_name,
        Invoice: `#${invoice?.number}`,
        Description: invoice?.description,
        "Paid on": day(payment.paid_on),
        "Payment method": payment.method,
        "Transaction reference": payment.reference || "—",
        "Amount received": money(payment.amount),
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
