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
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  Settings,
  UserCheck,
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

export function getFinancialYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) {
    const nextYear = String(year + 1).slice(2);
    return `FY ${year}-${nextYear}`;
  } else {
    const prevYear = year - 1;
    const currYearShort = String(year).slice(2);
    return `FY ${prevYear}-${currYearShort}`;
  }
}

export function getCurrentFinancialYear(): string {
  return getFinancialYear(today());
}

export function getFYRange(fyString: string): { start: string; end: string } {
  const match = fyString.match(/(\d{4})-(\d{2})/);
  if (!match) return { start: "", end: "" };
  const startYear = parseInt(match[1], 10);
  const endYear = startYear + 1;
  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
  };
}

export function getRelativeDateRange(preset: string): { start: string; end: string } {
  const [yStr, mStr] = today().split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10); // 1-12

  const formatYMD = (yr: number, mo: number, dy: number) =>
    `${yr}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;

  if (preset === "this_month") {
    const lastDay = new Date(y, m, 0).getDate();
    return {
      start: formatYMD(y, m, 1),
      end: formatYMD(y, m, lastDay),
    };
  }

  if (preset === "last_month") {
    const prevYear = m === 1 ? y - 1 : y;
    const prevMonth = m === 1 ? 12 : m - 1;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    return {
      start: formatYMD(prevYear, prevMonth, 1),
      end: formatYMD(prevYear, prevMonth, lastDay),
    };
  }

  if (preset === "last_3m") {
    let startYear = y;
    let startMonth = m - 2;
    if (startMonth <= 0) {
      startYear -= 1;
      startMonth += 12;
    }
    return {
      start: formatYMD(startYear, startMonth, 1),
      end: today(),
    };
  }

  if (preset === "last_6m") {
    let startYear = y;
    let startMonth = m - 5;
    if (startMonth <= 0) {
      startYear -= 1;
      startMonth += 12;
    }
    return {
      start: formatYMD(startYear, startMonth, 1),
      end: today(),
    };
  }

  return { start: "", end: "" };
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Properties", icon: Building2 },
  { name: "Rooms & beds", icon: BedDouble },
  { name: "Tenants", icon: Users },
  { name: "Rent & payments", icon: Receipt },
  { name: "Expenses", icon: Wallet },
  { name: "Staff & salaries", icon: UserCheck },
  { name: "Maintenance", icon: Wrench },
  { name: "Documents", icon: FileCheck2 },
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

export function formatReceiptText(payment: Row, data: Data): string {
  const invoice = data.invoices.find((i) => i.id === payment.invoice_id);
  const property = data.properties.find((x) => x.id === payment.property_id);

  return [
    `🧾 *RENT PAYMENT RECEIPT*`,
    `----------------------------------------`,
    `🏢 *Property*: ${property?.name || "PG"}`,
    property?.address ? `📍 *Address*: ${property.address}, ${property.city}` : null,
    `👤 *Resident*: ${payment.tenant_name}`,
    `📄 *Invoice*: #${String(invoice?.number || payment.invoice_number || "").padStart(4, "0")} (${invoice?.description || "Rent"})`,
    `💰 *Amount Received*: ${money(payment.amount)}`,
    `📅 *Payment Date*: ${day(payment.paid_on)}`,
    `💳 *Payment Method*: ${payment.method}`,
    payment.reference ? `🔢 *Transaction Ref*: ${payment.reference}` : null,
    `----------------------------------------`,
    `✅ Thank you for your payment!`,
    `_Issued by ${property?.name || "NestLedger"}_`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getWhatsAppShareUrl(phone: string, text: string): string {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  const formattedPhone =
    cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export const PG_INVESTMENT_COMPONENTS = [
  {
    key: "purchase",
    label: "Purchase / Lease Deposit",
    description: "Property acquisition cost or refundable lease advance",
    color: "#0f766e",
  },
  {
    key: "furnishing",
    label: "Interior & Furnishing",
    description: "Beds, high-density mattresses, wardrobes, tables & curtains",
    color: "#2563eb",
  },
  {
    key: "appliances",
    label: "Appliances & Electronics",
    description: "Geysers, ACs, commercial refrigerators, washing machines, Wi-Fi",
    color: "#7c3aed",
  },
  {
    key: "electrical_plumbing",
    label: "Electrical & Plumbing",
    description: "Power backup generator/inverter, LED lighting, pumps & piping",
    color: "#ca8a04",
  },
  {
    key: "security_cctv",
    label: "Security & Safety",
    description: "CCTV system, smart locks, fire safety equipment",
    color: "#ea580c",
  },
  {
    key: "legal_licensing",
    label: "Legal, Registration & NOC",
    description: "Agreement stamping, police verification, fire NOC, trade license",
    color: "#0891b2",
  },
  {
    key: "other_setup",
    label: "Painting, Signage & Initial Setup",
    description: "Painting, signage/branding, mess kitchen setup & miscellaneous",
    color: "#475569",
  },
];

export interface BreakevenMetrics {
  totalInvestment: number; // in paise
  totalRevenue: number;
  totalExpenses: number;
  cumulativeProfit: number;
  thisMonthRevenue: number;
  thisMonthExpenses: number;
  thisMonthProfit: number;
  avgMonthlyProfit: number;
  recoveryPercentage: number; // 0 - 100
  remainingAmount: number; // in paise
  monthsToBreakeven: number | null;
  projectedDate: string | null;
  isAchieved: boolean;
}

export function calculateBreakevenMetrics(
  properties: Row[],
  payments: Row[],
  expenses: Row[],
  activePropertyId = "all",
): BreakevenMetrics {
  const scopedProps =
    activePropertyId === "all"
      ? properties
      : properties.filter((p) => p.id === activePropertyId);

  const scopedPropIds = new Set(scopedProps.map((p) => p.id));

  const totalInvestment = scopedProps.reduce(
    (sum, p) => sum + Number(p.buying_cost_total || 0),
    0,
  );

  const scopedPayments =
    activePropertyId === "all"
      ? payments
      : payments.filter((p) => scopedPropIds.has(p.property_id));

  const scopedExpenses =
    activePropertyId === "all"
      ? expenses
      : expenses.filter((e) => scopedPropIds.has(e.property_id));

  const totalRevenue = scopedPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );

  const totalExpenses = scopedExpenses
    .filter((e) => e.status === "Paid")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const cumulativeProfit = totalRevenue - totalExpenses;

  const currentMonth = today().slice(0, 7);
  const thisMonthRevenue = scopedPayments
    .filter((p) => String(p.paid_on).startsWith(currentMonth))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const thisMonthExpenses = scopedExpenses
    .filter(
      (e) => e.status === "Paid" && String(e.spent_on).startsWith(currentMonth),
    )
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const thisMonthProfit = thisMonthRevenue - thisMonthExpenses;

  // Last 6 months profits
  const monthlyProfits: number[] = [];
  for (let idx = 0; idx < 6; idx++) {
    const dt = new Date();
    dt.setDate(1);
    dt.setMonth(dt.getMonth() - idx);
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;

    const rev = scopedPayments
      .filter((p) => String(p.paid_on).startsWith(m))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const exp = scopedExpenses
      .filter(
        (e) => e.status === "Paid" && String(e.spent_on).startsWith(m),
      )
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    if (rev > 0 || exp > 0) {
      monthlyProfits.push(rev - exp);
    }
  }

  const avgMonthlyProfit =
    monthlyProfits.length > 0
      ? monthlyProfits.reduce((a, b) => a + b, 0) / monthlyProfits.length
      : thisMonthProfit > 0
        ? thisMonthProfit
        : 0;

  const recoveryPercentage =
    totalInvestment > 0
      ? Math.min(100, Math.max(0, (cumulativeProfit / totalInvestment) * 100))
      : 0;

  const remainingAmount = Math.max(0, totalInvestment - cumulativeProfit);
  const isAchieved = totalInvestment > 0 && cumulativeProfit >= totalInvestment;

  let monthsToBreakeven: number | null = null;
  let projectedDate: string | null = null;

  if (isAchieved) {
    monthsToBreakeven = 0;
  } else if (remainingAmount > 0 && avgMonthlyProfit > 0) {
    monthsToBreakeven = Math.ceil(remainingAmount / avgMonthlyProfit);
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + monthsToBreakeven);
    projectedDate = targetDate.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }

  return {
    totalInvestment,
    totalRevenue,
    totalExpenses,
    cumulativeProfit,
    thisMonthRevenue,
    thisMonthExpenses,
    thisMonthProfit,
    avgMonthlyProfit,
    recoveryPercentage,
    remainingAmount,
    monthsToBreakeven,
    projectedDate,
    isAchieved,
  };
}
