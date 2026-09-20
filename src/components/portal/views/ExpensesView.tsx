"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  PieChart,
  BarChart3,
  Calendar,
  CalendarRange,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import {
  money,
  day,
  today,
  dateValue,
  getFinancialYear,
  getCurrentFinancialYear,
  getFYRange,
  getRelativeDateRange,
} from "../utils";
import type { Row } from "../types";

export function ExpensesView() {
  const {
    expenses,
    payments,
    scoped,
    matches,
    search,
    setSearch,
    busy,
    quick,
  } = usePortal();

  const [activeTab, setActiveTab] = useState<"ledger" | "monthly" | "categories">("ledger");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Date Range & Financial Year Filter State
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Pagination for Expense Ledger
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pagination for Monthly Analysis
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyPageSize, setMonthlyPageSize] = useState(12);

  const scopedExpenses = scoped(expenses);
  const scopedPayments = scoped(payments);

  const currentMonth = today().slice(0, 7);
  const currentFY = getCurrentFinancialYear() || "FY 2026-27";

  // Discover all Financial Years from transaction history
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    set.add(currentFY);

    for (const e of scopedExpenses) {
      const fy = getFinancialYear(dateValue(e.spent_on));
      if (fy) set.add(fy);
    }
    for (const p of scopedPayments) {
      const fy = getFinancialYear(dateValue(p.paid_on || p.created_at));
      if (fy) set.add(fy);
    }

    // Ensure at least previous FY is also available
    const match = currentFY.match(/(\d{4})-(\d{2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      set.add(`FY ${y - 1}-${String(y).slice(2)}`);
    }

    return Array.from(set).sort().reverse();
  }, [scopedExpenses, scopedPayments, currentFY]);

  // Compute effective start and end dates from current selection
  const effectiveDateRange = useMemo(() => {
    if (periodFilter === "ALL") {
      return { start: "", end: "", label: "All Time", isFY: false };
    }

    if (periodFilter.startsWith("FY ")) {
      const { start, end } = getFYRange(periodFilter);
      return {
        start,
        end,
        label: periodFilter === currentFY ? `${periodFilter} (Current FY)` : periodFilter,
        isFY: true,
        fyCode: periodFilter,
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
        isFY: false,
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
        isFY: false,
      };
    }

    return { start: "", end: "", label: "All Time", isFY: false };
  }, [periodFilter, customStartDate, customEndDate, currentFY]);

  // Filter expenses and payments by the effective date range
  const dateFilteredExpenses = useMemo(() => {
    const { start, end } = effectiveDateRange;
    if (!start && !end) return scopedExpenses;
    return scopedExpenses.filter((e) => {
      const d = dateValue(e.spent_on);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [scopedExpenses, effectiveDateRange]);

  const dateFilteredPayments = useMemo(() => {
    const { start, end } = effectiveDateRange;
    if (!start && !end) return scopedPayments;
    return scopedPayments.filter((p) => {
      const d = dateValue(p.paid_on || p.created_at);
      if (!d) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [scopedPayments, effectiveDateRange]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setCurrentPage(1);
    setMonthlyPage(1);
  }, [search, categoryFilter, statusFilter, periodFilter, customStartDate, customEndDate]);

  // Top KPI financial calculations for the selected period
  const totalExpensesPaise = dateFilteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0,
  );
  const paidExpensesPaise = dateFilteredExpenses
    .filter((e) => e.status === "Paid")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const pendingExpenses = dateFilteredExpenses.filter((e) => e.status === "Pending");
  const pendingExpensesPaise = pendingExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0,
  );

  const periodCollectionsPaise = dateFilteredPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0,
  );

  const netCashSurplusPaise = periodCollectionsPaise - paidExpensesPaise;
  const opexRatio =
    periodCollectionsPaise > 0
      ? Math.round((paidExpensesPaise / periodCollectionsPaise) * 100)
      : null;

  // Categories calculation for selected period
  const categoriesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of dateFilteredExpenses) {
      if (e.status === "Paid") {
        const cat = e.category || "Other";
        map[cat] = (map[cat] || 0) + Number(e.amount || 0);
      }
    }
    return map;
  }, [dateFilteredExpenses]);

  // Filtered expense ledger rows
  const filteredExpenses = useMemo(() => {
    return dateFilteredExpenses.filter((e) => {
      if (!matches(e)) return false;
      if (categoryFilter !== "All" && e.category !== categoryFilter) return false;
      if (statusFilter !== "All" && e.status !== statusFilter) return false;
      return true;
    });
  }, [dateFilteredExpenses, matches, categoryFilter, statusFilter]);

  // Paginated Expense Ledger
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  // Monthly Collections vs Expenses Analysis
  const monthlyAnalysis = useMemo(() => {
    const monthsSet = new Set<string>();

    // If an Indian Financial Year is selected, populate all 12 FY months (Apr to Mar)
    if (periodFilter.startsWith("FY ")) {
      const match = periodFilter.match(/(\d{4})-(\d{2})/);
      if (match) {
        const startYear = parseInt(match[1], 10);
        // Months: 04, 05, ..., 12 of startYear, then 01, 02, 03 of startYear + 1
        for (let m = 4; m <= 12; m++) {
          monthsSet.add(`${startYear}-${String(m).padStart(2, "0")}`);
        }
        for (let m = 1; m <= 3; m++) {
          monthsSet.add(`${startYear + 1}-${String(m).padStart(2, "0")}`);
        }
      }
    } else {
      // Otherwise, collect distinct active months from payments & expenses in scope
      monthsSet.add(currentMonth);

      // Generate last 12 months as baseline
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      for (const p of dateFilteredPayments) {
        const d = p.paid_on || p.created_at;
        if (d) monthsSet.add(String(d).slice(0, 7));
      }
      for (const e of dateFilteredExpenses) {
        if (e.spent_on) monthsSet.add(String(e.spent_on).slice(0, 7));
      }
    }

    // Sort newest to oldest
    const sortedMonths = Array.from(monthsSet).sort().reverse();

    return sortedMonths.map((m) => {
      const [year, monthNum] = m.split("-");
      const monthDate = new Date(Number(year), Number(monthNum) - 1, 1);
      const monthLabel = monthDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      const collections = scopedPayments
        .filter((p) => dateValue(p.paid_on || p.created_at).startsWith(m))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const mExpenses = scopedExpenses.filter(
        (e) => e.status === "Paid" && dateValue(e.spent_on).startsWith(m),
      );

      const totalExp = mExpenses.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0,
      );

      const netSurplus = collections - totalExp;
      const monthOpexRatio =
        collections > 0 ? Math.round((totalExp / collections) * 100) : null;

      // Top category for this month
      const monthCatMap: Record<string, number> = {};
      for (const e of mExpenses) {
        const cat = e.category || "Other";
        monthCatMap[cat] = (monthCatMap[cat] || 0) + Number(e.amount || 0);
      }
      let topCat = "—";
      let topCatAmt = 0;
      for (const [c, a] of Object.entries(monthCatMap)) {
        if (a > topCatAmt) {
          topCatAmt = a;
          topCat = c;
        }
      }

      return {
        monthKey: m,
        monthLabel,
        collections,
        totalExp,
        netSurplus,
        opexRatio: monthOpexRatio,
        topCat,
        topCatAmt,
        expenseCount: mExpenses.length,
      };
    });
  }, [periodFilter, scopedPayments, scopedExpenses, currentMonth, dateFilteredPayments, dateFilteredExpenses]);

  const paginatedMonthly = useMemo(() => {
    const start = (monthlyPage - 1) * monthlyPageSize;
    return monthlyAnalysis.slice(start, start + monthlyPageSize);
  }, [monthlyAnalysis, monthlyPage, monthlyPageSize]);

  // Unique categories list for dropdown filter
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of scopedExpenses) {
      if (e.category) set.add(e.category);
    }
    return Array.from(set).sort();
  }, [scopedExpenses]);

  const handleResetFilter = () => {
    setPeriodFilter("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return (
    <div className="expenses-page-wrap">
      {/* Financial Year & Date Range Filter Bar */}
      <div className="expenses-filter-bar">
        <div className="fy-filter-main-row">
          <div className="fy-filter-label-group">
            <div className="fy-icon-wrap">
              <CalendarRange size={18} />
            </div>
            <div className="fy-label-text">
              <span className="fy-label-tag">FINANCIAL YEAR & DATE RANGE</span>
              <span className="fy-sub-info">Filter expenses, cash outflow & margins</span>
            </div>
          </div>

          {/* Quick 1-Click FY and Period Selector Pills */}
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
              className={`fy-pill-btn ${periodFilter === "this_month" ? "active" : ""}`}
              onClick={() => setPeriodFilter("this_month")}
            >
              This Month
            </button>
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
              aria-label="Select financial year or period"
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

        {/* Custom Date Range Inputs Row (When Custom is selected) */}
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
                <b>{dateFilteredExpenses.length}</b> expenses ({money(paidExpensesPaise)} paid)
              </span>
            </div>
            <button
              type="button"
              className="active-period-clear-btn"
              onClick={handleResetFilter}
              title="Clear date filter"
            >
              <RotateCcw size={13} /> Reset to All Time
            </button>
          </div>
        )}
      </div>

      {/* Top Analysis KPI Summary Cards */}
      <div className="expenses-kpi-grid">
        <div className="expense-kpi-card">
          <div className="kpi-icon-container total-exp">
            <Wallet size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">
              {periodFilter === "ALL"
                ? "TOTAL OPERATING EXPENSES"
                : `${effectiveDateRange.label.toUpperCase()} EXPENSES`}
            </span>
            <h3 className="kpi-main-metric">{money(totalExpensesPaise)}</h3>
            <span className="kpi-sub-text">
              {dateFilteredExpenses.length} transactions in period
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container this-month">
            <ArrowUpRight size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">
              {periodFilter === "ALL"
                ? "TOTAL CASH OUTFLOW"
                : `${effectiveDateRange.label.toUpperCase()} OUTFLOW`}
            </span>
            <h3 className="kpi-main-metric">{money(paidExpensesPaise)}</h3>
            <span className="kpi-sub-text">
              Collections: <b>{money(periodCollectionsPaise)}</b>
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div
            className={`kpi-icon-container ${netCashSurplusPaise >= 0 ? "surplus" : "deficit"}`}
          >
            {netCashSurplusPaise >= 0 ? (
              <ArrowDownLeft size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">
              {periodFilter === "ALL"
                ? "NET CASH SURPLUS / DEFICIT"
                : `${effectiveDateRange.label.toUpperCase()} NET MARGIN`}
            </span>
            <h3
              className={`kpi-main-metric ${netCashSurplusPaise >= 0 ? "text-green" : "text-red"}`}
            >
              {netCashSurplusPaise >= 0 ? "+" : ""}
              {money(netCashSurplusPaise)}
            </h3>
            <span className="kpi-sub-text">
              {opexRatio !== null
                ? `${100 - opexRatio}% net profit margin (${opexRatio}% OpEx)`
                : "Collections minus operational expenses"}
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container pending-bills">
            <Clock size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">PENDING BILLS & PAYABLES</span>
            <h3 className="kpi-main-metric">{money(pendingExpensesPaise)}</h3>
            <span className="kpi-sub-text">
              {pendingExpenses.length} bill{pendingExpenses.length === 1 ? "" : "s"} awaiting clearance
            </span>
          </div>
        </div>
      </div>

      <section className="panel">
        {/* Navigation & Analysis View Switcher Tabs */}
        <div className="expense-tabs-header">
          <div className="expense-tab-buttons">
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
              onClick={() => setActiveTab("ledger")}
            >
              <Wallet size={16} /> Detailed Expenses ({filteredExpenses.length})
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "monthly" ? "active" : ""}`}
              onClick={() => setActiveTab("monthly")}
            >
              <BarChart3 size={16} /> Monthly Collections & OpEx Analysis
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <PieChart size={16} /> Category Breakdown
            </button>
          </div>
        </div>

        {/* Tab 1: Detailed Expense Ledger */}
        {activeTab === "ledger" && (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search Expenses"
                  placeholder="Search expenses by description, category, or property…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="toolbar-right">
                {/* Category Filter */}
                <select
                  className="toolbar-select"
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="toolbar-select"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="empty-state-card" style={{ padding: "48px 20px", textAlign: "center" }}>
                <Wallet size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                <h4 style={{ margin: "0 0 6px", color: "#334155" }}>No expenses found</h4>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
                  No transactions match the selected period ({effectiveDateRange.label}) or search filters.
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
                    "EXPENSE",
                    "PROPERTY",
                    "DATE",
                    "AMOUNT",
                    "STATUS",
                    "ACTIONS",
                  ]}
                  rows={paginatedExpenses.map((e) => [
                    <div key={`exp-${e.id}`}>
                      <b>{e.description}</b>
                      <small>{e.category}</small>
                    </div>,
                    e.property_name,
                    day(e.spent_on),
                    <b key={`amt-${e.id}`}>{money(e.amount)}</b>,
                    <Badge
                      key={`badge-${e.id}`}
                      tone={e.status === "Paid" ? "green" : "amber"}
                    >
                      {e.status}
                    </Badge>,
                    e.status === "Pending" ? (
                      <button
                        key={`btn-${e.id}`}
                        className="text-btn"
                        disabled={busy}
                        onClick={() => quick("expenseStatus", { id: e.id })}
                      >
                        Mark paid
                      </button>
                    ) : (
                      <span key={`paid-chk-${e.id}`} className="row-actions">
                        <CheckCircle2 size={16} className="success-icon" />
                        <small>Cleared</small>
                      </span>
                    ),
                  ])}
                />

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredExpenses.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[10, 25, 50]}
                />
              </>
            )}
          </>
        )}

        {/* Tab 2: Monthly Collections & OpEx Analysis */}
        {activeTab === "monthly" && (
          <div className="monthly-analysis-section">
            {/* Annual Financial Year Summary Banner if FY or Period is filtered */}
            {periodFilter.startsWith("FY ") && (
              <div className="fy-annual-summary-card">
                <div className="fy-summary-title-col">
                  <TrendingUp size={20} className="fy-summary-icon" />
                  <div>
                    <h4 className="fy-summary-heading">{effectiveDateRange.label} Annual Overview</h4>
                    <span className="fy-summary-caption">
                      April {periodFilter.slice(3, 7)} to March {Number(periodFilter.slice(3, 7)) + 1}
                    </span>
                  </div>
                </div>
                <div className="fy-metrics-row">
                  <div className="fy-metric-cell">
                    <span className="fy-metric-lbl">Total Collections</span>
                    <strong className="text-green">{money(periodCollectionsPaise)}</strong>
                  </div>
                  <div className="fy-metric-cell">
                    <span className="fy-metric-lbl">Total OpEx</span>
                    <strong className="text-red">{money(paidExpensesPaise)}</strong>
                  </div>
                  <div className="fy-metric-cell">
                    <span className="fy-metric-lbl">Net Annual Profit</span>
                    <strong className={netCashSurplusPaise >= 0 ? "text-green" : "text-red"}>
                      {netCashSurplusPaise >= 0 ? "+" : ""}{money(netCashSurplusPaise)}
                    </strong>
                  </div>
                  <div className="fy-metric-cell">
                    <span className="fy-metric-lbl">OpEx Ratio</span>
                    <strong>{opexRatio !== null ? `${opexRatio}%` : "0%"}</strong>
                  </div>
                  <div className="fy-metric-cell">
                    <span className="fy-metric-lbl">Avg Monthly OpEx</span>
                    <strong>{money(Math.round(paidExpensesPaise / 12))}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="monthly-analysis-note">
              <Calendar size={18} />
              <span>
                {periodFilter.startsWith("FY ")
                  ? `Detailed month-by-month financial performance for ${effectiveDateRange.label}. Rent collections vs operating outflows.`
                  : "Compare monthly rent collections with total paid operating expenses to evaluate net profit margins and operational efficiency over time."}
              </span>
            </div>

            <Table
              headers={[
                "MONTH",
                "RENT COLLECTIONS",
                "TOTAL EXPENSES",
                "NET CASH SURPLUS / MARGIN",
                "OPEX RATIO",
                "TOP EXPENSE CATEGORY",
              ]}
              rows={paginatedMonthly.map((m) => {
                const isPositive = m.netSurplus >= 0;
                return [
                  <b key={`m-lbl-${m.monthKey}`} className="monthly-period-tag">
                    {m.monthLabel}
                    {m.monthKey === currentMonth && (
                      <span className="current-month-badge">Current</span>
                    )}
                  </b>,
                  <span key={`m-col-${m.monthKey}`} className="monthly-col-val">
                    {money(m.collections)}
                  </span>,
                  <span key={`m-exp-${m.monthKey}`} className="monthly-exp-val">
                    {money(m.totalExp)}
                  </span>,
                  <b
                    key={`m-net-${m.monthKey}`}
                    className={isPositive ? "text-green" : "text-red"}
                  >
                    {isPositive ? "+" : ""}
                    {money(m.netSurplus)}
                  </b>,
                  <Badge
                    key={`m-rat-${m.monthKey}`}
                    tone={
                      m.opexRatio === null
                        ? "gray"
                        : m.opexRatio <= 40
                          ? "green"
                          : m.opexRatio <= 70
                            ? "amber"
                            : "red"
                    }
                  >
                    {m.opexRatio !== null ? `${m.opexRatio}%` : "—"}
                  </Badge>,
                  <span key={`m-top-${m.monthKey}`} className="monthly-top-cat">
                    {m.topCat !== "—" ? `${m.topCat} (${money(m.topCatAmt)})` : "—"}
                  </span>,
                ];
              })}
            />

            <Pagination
              currentPage={monthlyPage}
              totalItems={monthlyAnalysis.length}
              pageSize={monthlyPageSize}
              onPageChange={setMonthlyPage}
              onPageSizeChange={setMonthlyPageSize}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        )}

        {/* Tab 3: Category Breakdown */}
        {activeTab === "categories" && (
          <div className="category-breakdown-section">
            <div className="category-breakdown-header" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Total categorized operational spend for <b>{effectiveDateRange.label}</b>:{" "}
                <b style={{ color: "#0f172a" }}>{money(paidExpensesPaise)}</b> across{" "}
                {Object.keys(categoriesMap).length} categories.
              </span>
            </div>

            {Object.keys(categoriesMap).length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#64748b" }}>
                No cleared expenses recorded for {effectiveDateRange.label}.
              </div>
            ) : (
              <div className="category-breakdown-grid">
                {Object.entries(categoriesMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => {
                    const pct =
                      paidExpensesPaise > 0
                        ? Math.round((amt / paidExpensesPaise) * 100)
                        : 0;

                    return (
                      <div key={cat} className="category-stat-card">
                        <div className="category-card-head">
                          <div>
                            <b>{cat}</b>
                            <small>{pct}% of period expenditure</small>
                          </div>
                          <span className="category-amt-pill">{money(amt)}</span>
                        </div>
                        <div className="category-progress-track">
                          <div
                            className="category-progress-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
