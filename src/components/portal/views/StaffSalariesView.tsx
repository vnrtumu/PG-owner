"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Users,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  Plus,
  Phone,
  MessageCircle,
  Download,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Printer,
  ShieldCheck,
  Check,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import { money, day, today } from "../utils";
import type { StaffMember, SalaryPayout, Row } from "../types";
import { INITIAL_STAFF_MEMBERS, INITIAL_SALARY_PAYOUTS } from "../staffData";
import { PaySalaryDialog } from "../dialogs/PaySalaryDialog";
import { AddStaffDialog } from "../dialogs/AddStaffDialog";

export function StaffSalariesView() {
  const { data, scoped, matches, search, setSearch, property, ops, act, setToast } = usePortal();

  // Selected Payroll Cycle Month (default to current month: "YYYY-MM")
  const currentMonthKey = today().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  // Sub-tabs: "directory" | "history"
  const [activeTab, setActiveTab] = useState<"directory" | "history">("directory");

  // Filters
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Staff and Payouts State with localStorage persistence
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nestledger_staff_members");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_STAFF_MEMBERS;
  });

  const [payouts, setPayouts] = useState<SalaryPayout[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nestledger_salary_payouts");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_SALARY_PAYOUTS;
  });

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nestledger_staff_members", JSON.stringify(staffList));
    }
  }, [staffList]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nestledger_salary_payouts", JSON.stringify(payouts));
    }
  }, [payouts]);

  // Dialog states
  const [payingStaff, setPayingStaff] = useState<StaffMember | null>(null);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [voucherPayout, setVoucherPayout] = useState<SalaryPayout | null>(null);

  // Pagination for History
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Formatted Month Name
  const [selYear, selMonthNum] = selectedMonth.split("-");
  const selectedMonthLabel = new Date(Number(selYear), Number(selMonthNum) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" },
  );

  // Filter staff by assigned property
  const propertyStaff = useMemo(() => {
    return staffList.filter(
      (s) => property === "all" || s.property_id === property,
    );
  }, [staffList, property]);

  // Active staff
  const activeStaff = useMemo(() => {
    return propertyStaff.filter((s) => s.status === "Active");
  }, [propertyStaff]);

  // Total monthly payroll budget for active staff
  const totalPayrollBudget = useMemo(() => {
    return activeStaff.reduce((sum, s) => sum + Number(s.salary || 0), 0);
  }, [activeStaff]);

  // Payouts for the currently selected month
  const currentMonthPayouts = useMemo(() => {
    return payouts.filter((p) => p.period === selectedMonth);
  }, [payouts, selectedMonth]);

  // Map of staff payouts for selected month
  const staffPaidMap = useMemo(() => {
    const map: Record<string, SalaryPayout> = {};
    for (const p of currentMonthPayouts) {
      map[p.staff_id] = p;
    }
    return map;
  }, [currentMonthPayouts]);

  // Total paid this month
  const totalPaidThisMonth = useMemo(() => {
    return currentMonthPayouts
      .filter((p) => property === "all" || p.property_id === property)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [currentMonthPayouts, property]);

  // Pending salaries for selected month
  const pendingCount = activeStaff.filter((s) => !staffPaidMap[s.id]).length;
  const totalPendingAmount = Math.max(0, totalPayrollBudget - totalPaidThisMonth);

  // Filtered staff directory
  const filteredStaff = useMemo(() => {
    return propertyStaff.filter((s) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.role.toLowerCase().includes(q) ||
          s.property_name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (roleFilter !== "All" && s.role !== roleFilter) return false;
      const isPaid = Boolean(staffPaidMap[s.id]);
      if (statusFilter === "Paid" && !isPaid) return false;
      if (statusFilter === "Pending" && isPaid) return false;
      return true;
    });
  }, [propertyStaff, search, roleFilter, statusFilter, staffPaidMap]);

  // Filtered payouts history
  const filteredPayouts = useMemo(() => {
    return payouts
      .filter((p) => property === "all" || p.property_id === property)
      .filter((p) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          p.staff_name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.property_name.toLowerCase().includes(q) ||
          (p.reference && p.reference.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.paid_on > a.paid_on ? 1 : -1));
  }, [payouts, property, search]);

  const paginatedPayouts = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredPayouts.slice(start, start + historyPageSize);
  }, [filteredPayouts, historyPage, historyPageSize]);

  // Available month cycles (last 6 months)
  const availableMonths = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      months.push({ key, label });
    }
    return months;
  }, []);

  // Handle salary payment
  const handleRecordPayout = async (payout: SalaryPayout, logToExpenses: boolean) => {
    // Add to payouts list
    setPayouts((prev) => [payout, ...prev]);

    // If logToExpenses is true, also log an operational expense
    if (logToExpenses) {
      try {
        await act("expense", {
          property_id: payout.property_id,
          category: "Staff salary",
          description: `Salary for ${payout.staff_name} (${payout.role}) · ${selectedMonthLabel}`,
          amount: payout.amount,
          spent_on: payout.paid_on,
          status: "Paid",
        });
      } catch (e) {
        console.error("Could not sync to expenses:", e);
      }
    }

    setToast(`Salary of ${money(payout.amount)} paid to ${payout.staff_name} for ${selectedMonthLabel}.`);
  };

  // Handle adding new staff
  const handleAddStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [newStaff, ...prev]);
    setToast(`New staff member ${newStaff.name} (${newStaff.role}) registered.`);
  };

  // WhatsApp helper
  const getWhatsAppStaffUrl = (s: StaffMember, isPaid: boolean, payout?: SalaryPayout) => {
    const cleanPhone = s.phone.replace(/[^0-9]/g, "");
    const intl = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = isPaid && payout
      ? `Hi ${s.name}, your salary of ${money(payout.amount)} for ${selectedMonthLabel} has been disbursed via ${payout.method}${payout.reference ? ` (Ref: ${payout.reference})` : ""}. Thank you for your dedication at ${s.property_name}!`
      : `Hi ${s.name}, your monthly salary for ${selectedMonthLabel} at ${s.property_name} is scheduled for disbursement.`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="expenses-page-wrap staff-page-wrap">
      {/* Top Staff & Payroll KPI Cards */}
      <div className="expenses-kpi-grid">
        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Users size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">ACTIVE STAFF MEMBERS</span>
            <h3 className="kpi-main-metric">{activeStaff.length}</h3>
            <span className="kpi-sub-text">
              Across {data.properties.length} PG properties
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#f0fdfa", color: "#0f766e" }}>
            <Wallet size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">MONTHLY PAYROLL BUDGET</span>
            <h3 className="kpi-main-metric">{money(totalPayrollBudget)}</h3>
            <span className="kpi-sub-text">
              Avg {money(activeStaff.length ? Math.round(totalPayrollBudget / activeStaff.length) : 0)} / staff member
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container surplus">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">PAID IN {selectedMonthLabel.toUpperCase()}</span>
            <h3 className="kpi-main-metric text-green">{money(totalPaidThisMonth)}</h3>
            <span className="kpi-sub-text">
              {activeStaff.length - pendingCount} of {activeStaff.length} salaries cleared
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div
            className={`kpi-icon-container ${pendingCount > 0 ? "deficit" : "surplus"}`}
          >
            {pendingCount > 0 ? (
              <AlertCircle size={22} />
            ) : (
              <Check size={22} />
            )}
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">PENDING SALARIES</span>
            <h3
              className={`kpi-main-metric ${pendingCount > 0 ? "text-red" : "text-green"}`}
            >
              {money(totalPendingAmount)}
            </h3>
            <span className="kpi-sub-text">
              {pendingCount > 0 ? `${pendingCount} staff awaiting payout` : "100% payroll cleared"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <section className="panel">
        {/* Month Selector Bar & Tabs Header */}
        <div className="expense-tabs-header staff-tabs-header">
          <div className="expense-tab-buttons">
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "directory" ? "active" : ""}`}
              onClick={() => setActiveTab("directory")}
            >
              <Users size={16} /> Staff Directory & Payroll ({filteredStaff.length})
            </button>
            <button
              type="button"
              className={`expense-tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <CreditCard size={16} /> Salary Payouts History ({payouts.length})
            </button>
          </div>

          {/* Month Cycle Selector */}
          <div className="staff-cycle-switcher">
            <Calendar size={14} className="text-slate" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Payroll Cycle:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="toolbar-select"
              style={{ padding: "4px 8px", fontSize: 12 }}
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} {m.key === currentMonthKey ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Staff Directory & Salaries */}
        {activeTab === "directory" && (
          <>
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search staff"
                  placeholder="Search staff by name, phone, role, or property…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="toolbar-right">
                {ops && (
                  <button
                    className="primary"
                    onClick={() => setAddStaffOpen(true)}
                    style={{ gap: 6 }}
                  >
                    <Plus size={15} /> Add staff member
                  </button>
                )}

                <select
                  aria-label="Filter by role"
                  className="toolbar-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="All">All Roles</option>
                  <option value="Manager">Managers</option>
                  <option value="Caretaker">Caretakers</option>
                  <option value="Cook">Cooks</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Security">Security</option>
                  <option value="Maintenance">Maintenance</option>
                </select>

                <select
                  aria-label="Filter by payment status"
                  className="toolbar-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid in {selectedMonthLabel}</option>
                  <option value="Pending">Pending Payout</option>
                </select>
              </div>
            </div>

            <Table
              headers={[
                "STAFF MEMBER",
                "ROLE & DESIGNATION",
                "ASSIGNED PG",
                "MONTHLY SALARY",
                `STATUS (${selectedMonthLabel})`,
                "ACTIONS",
              ]}
              rows={filteredStaff.map((s) => {
                const payout = staffPaidMap[s.id];
                const isPaid = Boolean(payout);

                return [
                  <div key={`st-${s.id}`} className="person-cell">
                    <span className="avatar">
                      {s.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <b>{s.name}</b>
                      <small>{s.phone}</small>
                    </div>
                  </div>,

                  <span
                    key={`role-${s.id}`}
                    className={`staff-role-badge ${s.role.toLowerCase()}`}
                  >
                    {s.role}
                  </span>,

                  <div key={`prop-${s.id}`}>
                    <b>{s.property_name}</b>
                    <small style={{ display: "block", color: "#64748b" }}>
                      Joined {day(s.joined_on)}
                    </small>
                  </div>,

                  <b key={`sal-${s.id}`}>{money(s.salary)}</b>,

                  <div key={`status-${s.id}`}>
                    {isPaid ? (
                      <div className="salary-paid-pill">
                        <CheckCircle2 size={13} />
                        <span>Paid · {day(payout?.paid_on)} ({payout?.method})</span>
                      </div>
                    ) : (
                      <div className="salary-pending-pill">
                        <Clock size={13} />
                        <span>Pending Payout</span>
                      </div>
                    )}
                  </div>,

                  <div key={`act-${s.id}`} className="row-actions">
                    {!isPaid ? (
                      <button
                        className="collect-rent-btn"
                        onClick={() => setPayingStaff(s)}
                        title={`Pay ${money(s.salary)} salary for ${selectedMonthLabel}`}
                      >
                        Pay Salary <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        className="text-btn"
                        onClick={() => setVoucherPayout(payout)}
                        title="View salary voucher slip"
                      >
                        <FileText size={13} /> Voucher
                      </button>
                    )}

                    <a
                      href={getWhatsAppStaffUrl(s, isPaid, payout)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-icon-btn"
                      title="Message staff on WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>,
                ];
              })}
            />
          </>
        )}

        {/* Tab 2: Salary Payouts History */}
        {activeTab === "history" && (
          <div className="payouts-history-section">
            <div className="toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search salary payments"
                  placeholder="Search by staff name, reference, property, or role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Table
              headers={[
                "STAFF MEMBER",
                "ROLE",
                "PROPERTY",
                "PAYROLL MONTH",
                "PAID ON",
                "PAYMENT METHOD",
                "REFERENCE",
                "AMOUNT PAID",
                "ACTIONS",
              ]}
              rows={paginatedPayouts.map((p) => [
                <b key={`hist-name-${p.id}`}>{p.staff_name}</b>,
                <span
                  key={`hist-role-${p.id}`}
                  className={`staff-role-badge ${p.role.toLowerCase()}`}
                >
                  {p.role}
                </span>,
                p.property_name,
                <Badge key={`hist-per-${p.id}`} tone="indigo">
                  {p.period}
                </Badge>,
                day(p.paid_on),
                <Badge
                  key={`hist-m-${p.id}`}
                  tone={p.method === "UPI" ? "indigo" : p.method === "Cash" ? "amber" : "green"}
                >
                  {p.method}
                </Badge>,
                <code key={`hist-ref-${p.id}`} className="reference-code">
                  {p.reference || "Direct"}
                </code>,
                <b key={`hist-amt-${p.id}`} className="text-green">
                  {money(p.amount)}
                </b>,
                <button
                  key={`hist-btn-${p.id}`}
                  className="text-btn"
                  onClick={() => setVoucherPayout(p)}
                >
                  <FileText size={13} /> Slip
                </button>,
              ])}
            />

            <Pagination
              currentPage={historyPage}
              totalItems={filteredPayouts.length}
              pageSize={historyPageSize}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        )}
      </section>

      {/* Pay Salary Modal */}
      {payingStaff && (
        <PaySalaryDialog
          staff={payingStaff}
          period={selectedMonth}
          onClose={() => setPayingStaff(null)}
          onPaid={handleRecordPayout}
        />
      )}

      {/* Add Staff Modal */}
      {addStaffOpen && (
        <AddStaffDialog
          properties={data.properties}
          onClose={() => setAddStaffOpen(false)}
          onAdd={handleAddStaff}
        />
      )}

      {/* Salary Voucher Slip Dialog */}
      {voucherPayout && (
        <dialog className="form-dialog" open onCancel={() => setVoucherPayout(null)}>
          <div className="modal-head">
            <div>
              <span className="eyebrow">OFFICIAL SALARY DISBURSEMENT SLIP</span>
              <h2>Salary Payment Voucher</h2>
              <p>Payment ID: #{voucherPayout.id}</p>
            </div>
            <button
              className="icon-btn"
              onClick={() => setVoucherPayout(null)}
              aria-label="Close voucher"
            >
              &times;
            </button>
          </div>
          <div className="dialog-form-body">
            <div className="salary-voucher-card">
              <div className="voucher-header">
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a" }}>NestLedger Properties</h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{voucherPayout.property_name}</span>
                </div>
                <Badge tone="green">Cleared & Disbursed</Badge>
              </div>

              <div className="detail-grid" style={{ margin: "16px 0" }}>
                <div>
                  <small>Staff Member</small>
                  <b>{voucherPayout.staff_name}</b>
                </div>
                <div>
                  <small>Designation</small>
                  <b>{voucherPayout.role}</b>
                </div>
                <div>
                  <small>Payroll Period</small>
                  <b>{voucherPayout.period}</b>
                </div>
                <div>
                  <small>Disbursement Date</small>
                  <b>{day(voucherPayout.paid_on)}</b>
                </div>
                <div>
                  <small>Payment Mode</small>
                  <b>{voucherPayout.method}</b>
                </div>
                <div>
                  <small>Reference / UTR</small>
                  <b>{voucherPayout.reference || "Direct / Cash"}</b>
                </div>
              </div>

              <div className="voucher-total-box">
                <span>Net Amount Disbursed:</span>
                <strong className="text-green" style={{ fontSize: 22 }}>
                  {money(voucherPayout.amount)}
                </strong>
              </div>

              {voucherPayout.notes && (
                <p style={{ margin: "12px 0 0", fontSize: 12, color: "#64748b" }}>
                  Remarks: {voucherPayout.notes}
                </p>
              )}
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="secondary"
                onClick={() => window.print()}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={15} /> Print Voucher
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => setVoucherPayout(null)}
              >
                Done
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
