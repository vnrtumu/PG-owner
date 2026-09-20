"use client";
import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronRight,
  Users,
  Wallet,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Phone,
  Briefcase,
  Calendar,
  MessageCircle,
  FileText,
  Plus,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { Pagination } from "../common/Pagination";
import { money, day } from "../utils";
import type { Row } from "../types";

export function TenantsView() {
  const {
    tenants,
    beds,
    invoices,
    data,
    matches,
    search,
    setSearch,
    setDetail,
    setUploadDocOpen,
    setUploadDocTenantId,
  } = usePortal();

  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active tenants
  const activeTenants = useMemo(() => tenants.filter((t) => !t.ended_on), [tenants]);

  // Rent Roll
  const totalRentRollPaise = useMemo(
    () => activeTenants.reduce((sum, t) => sum + Number(t.rent || 0), 0),
    [activeTenants],
  );

  // Deposits
  const totalDepositPaidPaise = useMemo(
    () => activeTenants.reduce((sum, t) => sum + Number(t.deposit_paid || 0), 0),
    [activeTenants],
  );
  const totalDepositExpectedPaise = useMemo(
    () => activeTenants.reduce((sum, t) => sum + Number(t.deposit_expected || 0), 0),
    [activeTenants],
  );

  // Document Count per Tenant map
  const tenantDocsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data.documents || []) {
      if (d.tenant_id) {
        map[d.tenant_id] = (map[d.tenant_id] || 0) + 1;
      }
    }
    return map;
  }, [data.documents]);

  // KYC Verified Count
  const verifiedCount = useMemo(() => {
    return activeTenants.filter(
      (t) => (tenantDocsCountMap[t.tenant_id || t.id] || 0) > 0,
    ).length;
  }, [activeTenants, tenantDocsCountMap]);

  // Unpaid balance map per tenant stay
  const tenantDuesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of invoices) {
      const bal = Number(inv.amount) - Number(inv.paid);
      if (bal > 0 && inv.stay_id) {
        map[inv.stay_id] = (map[inv.stay_id] || 0) + bal;
      }
    }
    return map;
  }, [invoices]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants
      .filter((t) => {
        if (!matches(t)) return false;
        const docCount = tenantDocsCountMap[t.tenant_id || t.id] || 0;

        if (filter === "Active") return !t.ended_on;
        if (filter === "Notice") return t.notice_on && !t.ended_on;
        if (filter === "Checked out") return Boolean(t.ended_on);
        if (filter === "Verified KYC") return !t.ended_on && docCount > 0;
        if (filter === "Missing KYC") return !t.ended_on && docCount === 0;

        return true;
      });
  }, [tenants, matches, filter, tenantDocsCountMap]);

  // Paginated tenants
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  return (
    <div className="expenses-page-wrap">
      {/* Top Tenant KPI Intelligence Cards */}
      <div className="expenses-kpi-grid">
        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <Users size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">TOTAL ACTIVE TENANTS</span>
            <h3 className="kpi-main-metric">{activeTenants.length}</h3>
            <span className="kpi-sub-text">
              {beds.length ? Math.round((activeTenants.length / beds.length) * 100) : 0}% bed occupancy ({activeTenants.length}/{beds.length})
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container surplus">
            <Wallet size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">MONTHLY RENT ROLL</span>
            <h3 className="kpi-main-metric text-green">{money(totalRentRollPaise)}</h3>
            <span className="kpi-sub-text">
              Avg {money(activeTenants.length ? Math.round(totalRentRollPaise / activeTenants.length) : 0)} / tenant
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div className="kpi-icon-container" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
            <ShieldCheck size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">SECURITY DEPOSITS HELD</span>
            <h3 className="kpi-main-metric">{money(totalDepositPaidPaise)}</h3>
            <span className="kpi-sub-text">
              {totalDepositExpectedPaise > 0
                ? `${Math.round((totalDepositPaidPaise / totalDepositExpectedPaise) * 100)}% of expected collected`
                : "Deposits collected"}
            </span>
          </div>
        </div>

        <div className="expense-kpi-card">
          <div
            className="kpi-icon-container"
            style={{
              background: verifiedCount === activeTenants.length ? "#f0fdf4" : "#fffbeb",
              color: verifiedCount === activeTenants.length ? "#059669" : "#d97706",
            }}
          >
            <FileCheck2 size={22} />
          </div>
          <div className="kpi-info-col">
            <span className="kpi-micro-label">KYC & DOCUMENT STATUS</span>
            <h3 className="kpi-main-metric">
              {verifiedCount}/{activeTenants.length}
            </h3>
            <span className="kpi-sub-text">
              {activeTenants.length - verifiedCount > 0 ? (
                <b style={{ color: "#d97706" }}>
                  {activeTenants.length - verifiedCount} missing documents
                </b>
              ) : (
                "100% KYC verified"
              )}
            </span>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={17} />
            <input
              aria-label="Search Tenants"
              placeholder="Search by tenant name, phone, property, room, or workplace…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="toolbar-right">
            <select
              aria-label="Filter tenants"
              className="toolbar-select"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Tenants ({tenants.length})</option>
              <option value="Active">Active Stays ({activeTenants.length})</option>
              <option value="Notice">On Notice ({tenants.filter((t) => t.notice_on && !t.ended_on).length})</option>
              <option value="Checked out">Checked Out ({tenants.filter((t) => t.ended_on).length})</option>
              <option value="Verified KYC">Verified KYC ({verifiedCount})</option>
              <option value="Missing KYC">Missing KYC / No Docs ({activeTenants.length - verifiedCount})</option>
            </select>
          </div>
        </div>

        <Table
          headers={[
            "TENANT",
            "ROOM & PROPERTY",
            "MONTHLY RENT",
            "SECURITY DEPOSIT",
            "DOCUMENTS & KYC",
            "STATUS",
            "ACTIONS",
          ]}
          rows={paginatedTenants.map((t) => {
            const docCount = tenantDocsCountMap[t.tenant_id || t.id] || 0;
            const dues = tenantDuesMap[t.id] || 0;
            const phone = t.phone ? String(t.phone).replace(/[^0-9]/g, "") : "";
            const intlPhone = phone.length === 10 ? `91${phone}` : phone;
            const waUrl = phone ? `https://wa.me/${intlPhone}` : "";

            return [
              <button
                key={`person-${t.id}`}
                className="person-cell"
                onClick={() => setDetail(t)}
                title="View full tenant profile"
              >
                <span className="avatar">
                  {t.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <b style={{ color: "#0f172a" }}>{t.name}</b>
                  <small style={{ color: "#64748b" }}>{t.phone}</small>
                  {t.occupation && (
                    <span className="tenant-work-badge">
                      <Briefcase size={10} style={{ marginRight: 3 }} /> {t.occupation}
                    </span>
                  )}
                </span>
              </button>,

              <div key={`prop-${t.id}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <b>{t.property_name}</b>
                <small style={{ color: "#475569" }}>
                  Room {t.room_name} · {t.bed_label}
                </small>
                <small style={{ color: "#94a3b8", fontSize: 11 }}>
                  Joined {day(t.joined_on)}
                </small>
              </div>,

              <div key={`rent-${t.id}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <b>{money(t.rent)}</b>
                {dues > 0 ? (
                  <span className="tenant-due-tag">
                    {money(dues)} due
                  </span>
                ) : (
                  <small style={{ color: "#16a34a" }}>Rent cleared</small>
                )}
              </div>,

              <div key={`dep-${t.id}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <b>{money(t.deposit_paid)}</b>
                <small style={{ color: "#64748b" }}>of {money(t.deposit_expected)}</small>
              </div>,

              <div key={`doc-${t.id}`}>
                {docCount > 0 ? (
                  <button
                    type="button"
                    className="tenant-doc-badge verified"
                    onClick={() => setDetail(t)}
                    title={`View ${docCount} uploaded documents in profile`}
                  >
                    <FileCheck2 size={13} /> {docCount} Doc{docCount === 1 ? "" : "s"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tenant-doc-badge pending"
                    onClick={() => {
                      setUploadDocTenantId(t.tenant_id || t.id);
                      setUploadDocOpen(true);
                    }}
                    title="No documents uploaded. Click to upload verification proof."
                  >
                    <AlertCircle size={13} /> Missing KYC (+Add)
                  </button>
                )}
              </div>,

              <Badge
                key={`badge-${t.id}`}
                tone={t.ended_on ? "gray" : t.notice_on ? "amber" : "green"}
              >
                {t.ended_on
                  ? "Checked out"
                  : t.notice_on
                    ? "On notice"
                    : "Active"}
              </Badge>,

              <div key={`actions-${t.id}`} className="row-actions">
                <button
                  className="text-btn"
                  onClick={() => setDetail(t)}
                  title="View tenant profile & documents"
                >
                  View <ChevronRight size={14} />
                </button>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-icon-btn"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
              </div>,
            ];
          })}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={filteredTenants.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50]}
        />
      </section>
    </div>
  );
}
