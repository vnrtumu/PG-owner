"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Download,
  ArrowRight,
  Check,
  Share2,
  Receipt,
  Calendar,
  CalendarRange,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  MessageCircle,
  Clock,
  CreditCard,
  Plus,
  Phone,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import {
  money,
  day,
  dateValue,
  today,
  f,
  getFinancialYear,
  getCurrentFinancialYear,
  getFYRange,
  getRelativeDateRange,
} from "../utils";
import type { Row } from "../types";

export function RentPaymentsView() {
  const {
    invoices,
    payments,
    active,
    matches,
    search,
    setSearch,
    ops,
    finance,
    busy,
    setModal,
    propertyField,
    defaultProp,
    payment,
    receipt,
    shareReceipt,
  } = usePortal();

  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "overdue" | "monthly">("invoices");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");

  // Period & Financial Year Filter State
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Pagination states
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);

  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);

  const [overduePage, setOverduePage] = useState(1);
  const [overduePageSize, setOverduePageSize] = useState(10);

  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyPageSize, setMonthlyPageSize] = useState(12);

  const currentMonth = today().slice(0, 7);
  const currentFY = getCurrentFinancialYear() || "FY 2026-27";

  // Discover all Financial Years from invoices and payments
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    set.add(currentFY);

    for (const inv of invoices) {
      const fy = getFinancialYear(dateValue(inv.due_on));
      if (fy) set.add(fy);
    }
    for (const p of payments) {
      const fy = getFinancialYear(dateValue(p.paid_on || p.created_at));
      if (fy) set.add(fy);
    }

    const match = currentFY.match(/(\d{4})-(\d{2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      set.add(`FY ${y - 1}-${String(y).slice(2)}`);
    }

    return Array.from(set).sort().reverse();
  }, [invoices, payments, currentFY]);

  // Compute effective date range
  const effectiveDateRange = useMemo(() => {
    if (periodFilter === "ALL") {
      return { start: "", end: "", label: "All Time" };
    }

    if (periodFilter.startsWith("FY ")) {
      const { start, end } = getFYRange(periodFilter);
      return {
        start,
        end,
        label: periodFilter === currentFY ? `${periodFilter} (Current FY)` : periodFilter,
      };
    }

    if (periodFilter === "custom") {
      return {
        start: customStartDate,
        end: customEndDate,
        label:
          customStartDate || customEndDate
            ? `${customStartDate ? day(customStartDate) : "Start"} to ${customEndDate ? day(customEndDate) : "Present"}`
            : "Custom Date Range",
      };
    }

    if (["this_month", "last_month", "last_3m", "last_6m"].includes(periodFilter)) {
      const { start, end } = getRelativeDateRange(periodFilter);
      const labels: Record<string, string> = {
        this_month: "This Month",
        last_month: "Last Month",
        last_3m: "Last 3 Months",
        last_6m: "Last 6 Months",
      };
      return {
        start,
        end,
        label: labels[periodFilter] || periodFilter,
      };
    }

    return { start: "", end: "", label: "All Time" };
  }, [periodFilter, customStartDate, customEndDate, currentFY]);

  // Filter invoices and payments by date range
  const dateFilteredInvoices = useMemo(() => {
    const { start, end } = effectiveDateRange;
    if (!start && !end) return invoices;
    return invoices.filter((i) => {
      const d = dateValue(i.due_on);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [invoices, effectiveDateRange]);

  const dateFilteredPayments = useMemo(() => {
    const { start, end } = effectiveDateRange;
    if (!start && !end) return payments;
    return payments.filter((p) => {
      const d = dateValue(p.paid_on || p.created_at);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [payments, effectiveDateRange]);

  // Reset pagination on filter change
  useEffect(() => {
    setInvoicesPage(1);
    setPaymentsPage(1);
    setOverduePage(1);
    setMonthlyPage(1);
  }, [search, statusFilter, methodFilter, periodFilter, customStartDate, customEndDate]);

  // Top Financial KPI Calculations for the selected period
  const totalBilledPaise = dateFilteredInvoices.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0,
  );

  const totalCollectedPaise = dateFilteredInvoices.reduce(
    (sum, i) => sum + Number(i.paid || 0),
    0,
  );

  const totalOutstandingPaise = dateFilteredInvoices.reduce((sum, i) => {
    const bal = Number(i.amount) - Number(i.paid);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  const collectionRate =
    totalBilledPaise > 0
      ? Math.round((totalCollectedPaise / totalBilledPaise) * 100)
      : 100;

  // Overdue Invoices List (unpaid/partially paid and past due date)
  const overdueInvoices = useMemo(() => {
    return dateFilteredInvoices
      .filter((i) => {
        const balance = Number(i.amount) - Number(i.paid);
        const isLate = dateValue(i.due_on) < today();
        return balance > 0 && isLate;
      })
      .sort((a, b) => (dateValue(a.due_on) > dateValue(b.due_on) ? 1 : -1));
  }, [dateFilteredInvoices]);

  // Filtered Invoices (Tab 1)
  const filteredInvoices = useMemo(() => {
    return dateFilteredInvoices.filter((i) => {
      if (!matches(i)) return false;
      const balance = Number(i.amount) - Number(i.paid);
      const isLate = dateValue(i.due_on) < today();

      if (statusFilter === "Paid" && balance !== 0) return false;
      if (statusFilter === "Pending" && (balance === 0 || isLate)) return false;
      if (statusFilter === "Overdue" && (balance === 0 || !isLate)) return false;
      if (statusFilter === "Partial" && (balance === 0 || Number(i.paid) === 0)) return false;

      return true;
    });
  }, [dateFilteredInvoices, matches, statusFilter]);

  const paginatedInvoices = useMemo(() => {
    const start = (invoicesPage - 1) * invoicesPageSize;
    return filteredInvoices.slice(start, start + invoicesPageSize);
  }, [filteredInvoices, invoicesPage, invoicesPageSize]);

  // Filtered Payments (Tab 2)
  const filteredPayments = useMemo(() => {
    return dateFilteredPayments.filter((p) => {
      if (!matches(p)) return false;
      if (methodFilter !== "All" && p.method !== methodFilter) return false;
      return true;
    });
  }, [dateFilteredPayments, matches, methodFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * paymentsPageSize;
    return filteredPayments.slice(start, start + paymentsPageSize);
  }, [filteredPayments, paymentsPage, paymentsPageSize]);

  // Paginated Overdue (Tab 3)
  const paginatedOverdue = useMemo(() => {
    const start = (overduePage - 1) * overduePageSize;
    return overdueInvoices.slice(start, start + overduePageSize);
  }, [overdueInvoices, overduePage, overduePageSize]);

  // Monthly Collection Trends (Tab 4)
  const monthlyTrends = useMemo(() => {
    const monthsSet = new Set<string>();

    if (periodFilter.startsWith("FY ")) {
      const match = periodFilter.match(/(\d{4})-(\d{2})/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        for (let m = 4; m <= 12; m++) {
          monthsSet.add(`${startYear}-${String(m).padStart(2, "0")}`);
        }
        for (let m = 1; m <= 3; m++) {
          monthsSet.add(`${startYear + 1}-${String(m).padStart(2, "0")}`);
        }
      }
    } else {
      monthsSet.add(currentMonth);
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      for (const inv of dateFilteredInvoices) {
        if (inv.due_on) monthsSet.add(String(inv.due_on).slice(0, 7));
      }
      for (const p of dateFilteredPayments) {
        const d = p.paid_on || p.created_at;
        if (d) monthsSet.add(String(d).slice(0, 7));
      }
    }

    const sorted = Array.from(monthsSet).sort().reverse();

    return sorted.map((m) => {
      const [year, monthNum] = m.split("-");
      const monthDate = new Date(Number(year), Number(monthNum) - 1, 1);
      const monthLabel = monthDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      const mInvoices = invoices.filter((i) => dateValue(i.due_on).startsWith(m));
      const mBilled = mInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const mCollected = payments
        .filter((p) => dateValue(p.paid_on || p.created_at).startsWith(m))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const mPending = mInvoices.reduce((sum, i) => {
        const bal = Number(i.amount) - Number(i.paid);
        return sum + (bal > 0 ? bal : 0);
      }, 0);

      const rate = mBilled > 0 ? Math.round((mCollected / mBilled) * 100) : mCollected > 0 ? 100 : null;

      return {
        monthKey: m,
        monthLabel,
        billed: mBilled,
        collected: mCollected,
        pending: mPending,
        rate,
        invoicesCount: mInvoices.length,
      };
    });
  }, [invoices, payments, periodFilter, currentMonth, dateFilteredInvoices, dateFilteredPayments]);

  const paginatedMonthly = useMemo(() => {
    const start = (monthlyPage - 1) * monthlyPageSize;
    return monthlyTrends.slice(start, start + monthlyPageSize);
  }, [monthlyTrends, monthlyPage, monthlyPageSize]);

  // WhatsApp Reminder Link Helper
  const getWhatsAppReminderUrl = (inv: Row) => {
    const phone = inv.phone ? String(inv.phone).replace(/[^0-9]/g, "") : "";
    const intlPhone = phone.length === 10 ? `91${phone}` : phone;
    const balance = Number(inv.amount) - Number(inv.paid);
    const msg = `Hi ${inv.tenant_name}, this is a gentle reminder regarding your rent for ${inv.property_name} (${inv.description || "Room Rent"}). Outstanding amount: ${money(balance)}, due date was ${day(inv.due_on)}. Please clear at your earliest convenience. Thank you!`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleResetFilter = () => {
    setPeriodFilter("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return (
    <div className="expenses-page-wrap rent-page-wrap">
      {/* Financial Year & Period Filter Bar */}
      <div className="expenses-filter-bar">
        <div className="fy-filter-main-row">
          <div className="fy-filter-label-group">
            <div className="fy-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <CalendarRange size={18} />
            </div>
            <div className="fy-label-text">
              <span className="fy-label-tag" style={{ color: "#2563eb" }}>
                COLLECTION PERIOD & FINANCIAL YEAR
              </span>
              <span className="fy-sub-info">Filter rent bills, cash inflows & overdue dues</span>
            </div>
          </div>

          {/* Quick 1-Click Period Pills */}
          <div className="fy-quick-pills">
            <button
              type="button"
              className={`fy-pill-btn ${periodFilter === "ALL" ? "active" : ""}`}
              onClick={() => setPeriodFilter("ALL")}
            >
              All Time
            </button>
            <button
              type="button"
              className={`fy-pill-btn ${periodFilter === "this_month" ? "active" : ""}`}
              onClick={() => setPeriodFilter("this_month")}
            >
              This Month
            </button>
            <button
              type="button"
              className={`fy-pill-btn ${periodFilter === currentFY ? "active" : ""}`}
              onClick={() => setPeriodFilter(currentFY)}
            >
              {currentFY} (Current)
            </button>
            {availableFYs.filter((f) => f !== currentFY).slice(0, 1).map((fy) => (
              <button
                key={fy}
                type="button"
                className={`fy-pill-btn ${periodFilter === fy ? "active" : ""}`}
                onClick={() => setPeriodFilter(fy)}
              >
                {fy}
              </button>
            ))}
            <button
              type="button"
              className={`fy-pill-btn ${periodFilter === "custom" ? "active" : ""}`}
              onClick={() => {
                setPeriodFilter("custom");
                if (!customStartDate) setCustomStartDate(`${currentMonth}-01`);
                if (!customEndDate) setCustomEndDate(today());
              }}
            >
              Custom Range
            </button>
          </div>

          {/* Full Period & FY Dropdown Selector */}
          <div className="fy-dropdown-wrap">
            <select
              aria-label="Select collection period or financial year"
              className="fy-dropdown-select"
              value={periodFilter}
              onChange={(e) => {
                const val = e.target.value;
                setPeriodFilter(val);
                if (val === "custom" && !customStartDate) {
                  setCustomStartDate(`${currentMonth}-01`);
                  setCustomEndDate(today());
                }
              }}
            >
              <optgroup label="Financial Years (Indian FY)">
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy} {fy === currentFY ? "(Current FY)" : ""}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Quick Presets">
                <option value="ALL">All Time (Full History)</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3m">Last 3 Months</option>
                <option value="last_6m">Last 6 Months</option>
                <option value="custom">Custom Date Range…</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Custom Date Range Inputs Row */}
        {periodFilter === "custom" && (
          <div className="fy-custom-date-row">
            <div className="custom-date-inputs">
              <div className="date-input-box">
                <label>From Date:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="date-input-field"
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-input-box">
                <label>To Date:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="date-input-field"
                />
              </div>
            </div>
            <button
              type="button"
              className="date-reset-link"
              onClick={() => {
                setCustomStartDate(`${currentMonth}-01`);
                setCustomEndDate(today());
              }}
            >
              Reset to Current Month
            </button>
          </div>
        )}

        {/* Active Period Status Bar */}
        {periodFilter !== "ALL" && (
          <div className="active-period-indicator">
            <div className="active-period-text">
              <Calendar size={14} />
              <span>
                Showing data for <b>{effectiveDateRange.label}</b>
                {effectiveDateRange.start && (
                  <>
                    {" "}
                    ({day(effectiveDateRange.start)} to {day(effectiveDateRange.end)})
                  </>
                )}
                {" · "}
                <b>{dateFilteredInvoices.length}</b> bills ({money(totalCollectedPaise)} collected)
              </span>
            </div>
            <button
              type="button"
              className="active-period-clear-btn"
              onClick={handleResetFilter}
              title="Clear period filter"
            >
              <RotateCcw size={13} /> Reset to All Time
            </button>
          </div>
        )}
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div className="expenses-kpi-grid">
        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Receipt size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">
              {periodFilter === "ALL"
                ? "TOTAL RENT BILLED"
                : `${effectiveDateRange.label.toUpperCase()} BILLED`}
            </span>
            <h3 className="kpi-main-metric">{money(totalBilledPaise)}</h3>
            <span className="kpi-sub-text">
              {dateFilteredInvoices.length} invoices generated
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container surplus">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">
              {periodFilter === "ALL"
                ? "REALIZED CASH COLLECTIONS"
                : `${effectiveDateRange.label.toUpperCase()} COLLECTED`}
            </span>
            <h3 className="kpi-main-metric text-green">{money(totalCollectedPaise)}</h3>
            <span className="kpi-sub-text">
              Received via UPI, Cash & Bank
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div
            className={`kpi-icon-container ${totalOutstandingPaise > 0 ? "deficit" : "surplus"}`}
          >
            {totalOutstandingPaise > 0 ? (
              <AlertCircle size={22} />
            ) : (
              <Check size={22} />
            )}
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">OUTSTANDING / OVERDUE DUES</span>
            <h3
              className={`kpi-main-metric ${totalOutstandingPaise > 0 ? "text-red" : "text-green"}`}
            >
              {money(totalOutstandingPaise)}
            </h3>
            <span className="kpi-sub-text">
              {overdueInvoices.length > 0 ? (
                <b style={{ color: "#dc2626" }}>
                  {overdueInvoices.length} overdue defaulter{overdueInvoices.length === 1 ? "" : "s"}
                </b>
              ) : (
                "All payments on schedule"
              )}
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#f0fdf4", color: "#059669" }}>
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">COLLECTION EFFICIENCY</span>
            <h3 className="kpi-main-metric">{collectionRate}%</h3>
            <span className="kpi-sub-text">
              Billed vs Realized collection ratio
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel with 4 Tabs */}
      <section className="panel">
        <div className="expense-tabs-header">
          <div className="expense-tab-buttons">
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "invoices" ? "active" : ""}`}
              onClick={() => setActiveTab("invoices")}
            >
              <Receipt size={16} /> Invoices & Dues ({filteredInvoices.length})
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "payments" ? "active" : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard size={16} /> Payment Receipts & History ({filteredPayments.length})
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "overdue" ? "active" : ""}`}
              onClick={() => setActiveTab("overdue")}
            >
              <ShieldAlert size={16} /> Overdue Defaulters ({overdueInvoices.length})
              {overdueInvoices.length > 0 && (
                <span className="overdue-tab-count-badge">{overdueInvoices.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "monthly" ? "active" : ""}`}
              onClick={() => setActiveTab("monthly")}
            >
              <TrendingUp size={16} /> Monthly Collection Trends
            </button>
          </div>
        </div>

        {/* Tab 1: Invoices & Dues */}
        {activeTab === "invoices" && (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search Invoices & bills"
                  placeholder="Search by tenant, invoice #, property, or description…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="toolbar-right">
                {ops && (
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
                {finance && (
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
                    <Plus size={15} style={{ marginRight: 4 }} /> Add charge
                  </button>
                )}
                <select
                  aria-label="Filter by invoice status"
                  className="toolbar-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Invoices</option>
                  <option value="Paid">Paid in full</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Partial">Partially Paid</option>
                </select>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "48px 20px", textAlign: "center" }}>
                <Receipt size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                <h4 style={{ margin: "0 0 6px", color: "#334155" }}>No invoices found</h4>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
                  No bills match the selected period ({effectiveDateRange.label}) or search filters.
                </p>
                {periodFilter !== "ALL" && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleResetFilter}
                  >
                    <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset to All Time
                  </button>
                )}
              </div>
            ) : (
              <>
                <Table
                  headers={[
                    "INVOICE / TENANT",
                    "PROPERTY",
                    "DUE DATE",
                    "BILLED",
                    "PAID",
                    "BALANCE",
                    "STATUS",
                    "ACTIONS",
                  ]}
                  rows={paginatedInvoices.map((i) => {
                    const balance = Number(i.amount) - Number(i.paid);
                    const late = dateValue(i.due_on) < today();
                    const relatedPayment = payments.find((x) => x.invoice_id === i.id);

                    return [
                      <div key={`inv-${i.id}`}>
                        <b>{i.tenant_name}</b>
                        <small>
                          #{String(i.number).padStart(4, "0")} · {i.description}
                        </small>
                      </div>,
                      i.property_name,
                      day(i.due_on),
                      money(i.amount),
                      <span key={`paid-${i.id}`} className="text-green">
                        {money(i.paid)}
                      </span>,
                      <b
                        key={`bal-${i.id}`}
                        className={balance > 0 ? (late ? "text-red" : "text-amber") : "text-slate"}
                      >
                        {money(balance)}
                      </b>,
                      <Badge
                        key={`badge-${i.id}`}
                        tone={balance <= 0 ? "green" : late ? "red" : Number(i.paid) > 0 ? "indigo" : "amber"}
                      >
                        {balance <= 0
                          ? "Paid"
                          : Number(i.paid) > 0
                            ? "Partial"
                            : late
                              ? "Overdue"
                              : "Pending"}
                      </Badge>,
                      balance > 0 ? (
                        <div key={`act-unpaid-${i.id}`} className="row-actions">
                          <button
                            className="collect-rent-btn"
                            onClick={() => payment(i)}
                            title="Collect rent and record payment"
                          >
                            Collect <ArrowRight size={13} />
                          </button>
                          {late && i.phone && (
                            <a
                              href={getWhatsAppReminderUrl(i)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whatsapp-icon-btn"
                              title="Send WhatsApp payment reminder"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div key={`paid-act-${i.id}`} className="row-actions">
                          <span title="Paid in full">
                            <Check size={16} className="success-icon" />
                          </span>
                          {relatedPayment && (
                            <>
                              <button
                                type="button"
                                className="text-btn"
                                onClick={() => receipt(relatedPayment)}
                                title="Print / download receipt"
                              >
                                <Download size={13} /> Receipt
                              </button>
                              <button
                                type="button"
                                className="text-btn"
                                onClick={() => shareReceipt(relatedPayment)}
                                title="Share rent receipt with tenant"
                              >
                                <Share2 size={13} /> Share
                              </button>
                            </>
                          )}
                        </div>
                      ),
                    ];
                  })}
                />

                <Pagination
                  currentPage={invoicesPage}
                  totalItems={filteredInvoices.length}
                  pageSize={invoicesPageSize}
                  onPageChange={setInvoicesPage}
                  onPageSizeChange={setInvoicesPageSize}
                  pageSizeOptions={[10, 25, 50]}
                />
              </>
            )}
          </>
        )}

        {/* Tab 2: Payment Receipts & History */}
        {activeTab === "payments" && (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search payment receipts"
                  placeholder="Search by tenant name, invoice #, reference, or method…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="toolbar-right">
                <select
                  aria-label="Filter by payment method"
                  className="toolbar-select"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <option value="All">All Payment Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "48px 20px", textAlign: "center" }}>
                <CreditCard size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                <h4 style={{ margin: "0 0 6px", color: "#334155" }}>No payment receipts found</h4>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
                  No payments match the selected period ({effectiveDateRange.label}) or method filter.
                </p>
                {periodFilter !== "ALL" && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleResetFilter}
                  >
                    <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset to All Time
                  </button>
                )}
              </div>
            ) : (
              <>
                <Table
                  headers={[
                    "TENANT",
                    "INVOICE #",
                    "DATE",
                    "PAYMENT METHOD",
                    "REFERENCE",
                    "AMOUNT COLLECTED",
                    "ACTIONS",
                  ]}
                  rows={paginatedPayments.map((p) => [
                    <div key={`p-t-${p.id}`}>
                      <b>{p.tenant_name}</b>
                      {p.tenant_phone && <small>{p.tenant_phone}</small>}
                    </div>,
                    `#${String(p.invoice_number || "").padStart(4, "0")}`,
                    day(p.paid_on || p.created_at),
                    <Badge
                      key={`p-m-${p.id}`}
                      tone={p.method === "UPI" ? "indigo" : p.method === "Cash" ? "amber" : "gray"}
                    >
                      {p.method || "Cash"}
                    </Badge>,
                    <span key={`p-r-${p.id}`} className="reference-code">
                      {p.reference || "Direct / Cash"}
                    </span>,
                    <b key={`p-a-${p.id}`} className="text-green">
                      {money(p.amount)}
                    </b>,
                    <div key={`p-act-${p.id}`} className="row-actions">
                      <button
                        className="text-btn"
                        onClick={() => receipt(p)}
                        title="Print or download PDF receipt"
                      >
                        <Download size={14} /> Receipt
                      </button>
                      <button
                        className="text-btn"
                        onClick={() => shareReceipt(p)}
                        title="Share receipt via WhatsApp, Copy, or Email"
                      >
                        <Share2 size={14} /> Share
                      </button>
                    </div>,
                  ])}
                />

                <Pagination
                  currentPage={paymentsPage}
                  totalItems={filteredPayments.length}
                  pageSize={paymentsPageSize}
                  onPageChange={setPaymentsPage}
                  onPageSizeChange={setPaymentsPageSize}
                  pageSizeOptions={[10, 25, 50]}
                />
              </>
            )}
          </>
        )}

        {/* Tab 3: Overdue Defaulters Tracking */}
        {activeTab === "overdue" && (
          <div className="overdue-defaulters-section">
            <div className="overdue-banner">
              <div className="overdue-banner-icon">
                <ShieldAlert size={22} />
              </div>
              <div className="overdue-banner-info">
                <h4>Overdue Rent Defaulters ({overdueInvoices.length})</h4>
                <p>
                  Tenants with unpaid or partial rent past their due date. Send instant WhatsApp reminders or collect payments directly.
                </p>
              </div>
              <div className="overdue-banner-total">
                <span>Total Overdue:</span>
                <strong className="text-red">
                  {money(
                    overdueInvoices.reduce((sum, i) => sum + (Number(i.amount) - Number(i.paid)), 0),
                  )}
                </strong>
              </div>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="overdue-clean-slate">
                <CheckCircle2 size={42} className="success-icon" style={{ margin: "0 auto 12px" }} />
                <h4>🎉 Zero Overdue Bills!</h4>
                <p>All tenants have cleared their rent on time for the selected period.</p>
              </div>
            ) : (
              <>
                <Table
                  headers={[
                    "TENANT / CONTACT",
                    "PROPERTY",
                    "DUE DATE",
                    "OVERDUE DAYS",
                    "PENDING AMOUNT",
                    "ACTIONS",
                  ]}
                  rows={paginatedOverdue.map((i) => {
                    const balance = Number(i.amount) - Number(i.paid);
                    const dueDate = new Date(i.due_on);
                    const now = new Date(today());
                    const diffTime = Math.max(0, now.getTime() - dueDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return [
                      <div key={`ov-${i.id}`}>
                        <b>{i.tenant_name}</b>
                        {i.phone && (
                          <small style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={11} /> {i.phone}
                          </small>
                        )}
                      </div>,
                      i.property_name,
                      day(i.due_on),
                      <Badge
                        key={`ov-days-${i.id}`}
                        tone={diffDays > 15 ? "red" : diffDays > 7 ? "amber" : "gray"}
                      >
                        {diffDays} day{diffDays === 1 ? "" : "s"} late
                      </Badge>,
                      <b key={`ov-bal-${i.id}`} className="text-red">
                        {money(balance)}
                      </b>,
                      <div key={`ov-act-${i.id}`} className="row-actions">
                        <button
                          className="collect-rent-btn"
                          onClick={() => payment(i)}
                          title="Record payment"
                        >
                          Collect <ArrowRight size={13} />
                        </button>
                        {i.phone && (
                          <a
                            href={getWhatsAppReminderUrl(i)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-reminder-action-btn"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageCircle size={14} /> Send WhatsApp Reminder
                          </a>
                        )}
                      </div>,
                    ];
                  })}
                />

                <Pagination
                  currentPage={overduePage}
                  totalItems={overdueInvoices.length}
                  pageSize={overduePageSize}
                  onPageChange={setOverduePage}
                  onPageSizeChange={setOverduePageSize}
                  pageSizeOptions={[10, 25, 50]}
                />
              </>
            )}
          </div>
        )}

        {/* Tab 4: Monthly Collection Trends */}
        {activeTab === "monthly" && (
          <div className="monthly-analysis-section">
            <div className="monthly-analysis-note">
              <Calendar size={18} />
              <span>
                {periodFilter.startsWith("FY ")
                  ? `Monthly billing vs cash realization trend for ${effectiveDateRange.label}. Track collection efficiency and pending balances over time.`
                  : "Track month-by-month rent billing, cash realization, and collection efficiency percentages across your PG properties."}
              </span>
            </div>

            <Table
              headers={[
                "MONTH",
                "TOTAL BILLED",
                "REALIZED CASH",
                "PENDING DUES",
                "COLLECTION RATE",
                "BILLS GENERATED",
              ]}
              rows={paginatedMonthly.map((m) => [
                <b key={`m-t-${m.monthKey}`} className="monthly-period-tag">
                  {m.monthLabel}
                  {m.monthKey === currentMonth && (
                    <span className="current-month-badge">Current</span>
                  )}
                </b>,
                <span key={`m-b-${m.monthKey}`} className="monthly-col-val" style={{ color: "#0f172a" }}>
                  {money(m.billed)}
                </span>,
                <span key={`m-c-${m.monthKey}`} className="monthly-col-val">
                  {money(m.collected)}
                </span>,
                <span
                  key={`m-p-${m.monthKey}`}
                  className={m.pending > 0 ? "monthly-exp-val" : "text-slate"}
                >
                  {money(m.pending)}
                </span>,
                <Badge
                  key={`m-r-${m.monthKey}`}
                  tone={
                    m.rate === null
                      ? "gray"
                      : m.rate >= 95
                        ? "green"
                        : m.rate >= 75
                          ? "amber"
                          : "red"
                  }
                >
                  {m.rate !== null ? `${m.rate}%` : "—"}
                </Badge>,
                <span key={`m-cnt-${m.monthKey}`} className="monthly-top-cat">
                  {m.invoicesCount} invoice{m.invoicesCount === 1 ? "" : "s"}
                </span>,
              ])}
            />

            <Pagination
              currentPage={monthlyPage}
              totalItems={monthlyTrends.length}
              pageSize={monthlyPageSize}
              onPageChange={setMonthlyPage}
              onPageSizeChange={setMonthlyPageSize}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        )}
      </section>
    </div>
  );
}
