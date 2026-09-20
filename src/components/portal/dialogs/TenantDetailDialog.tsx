"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  FileText,
  Upload,
  Eye,
  Download,
  Trash2,
  FileCheck2,
  AlertCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  Plus,
} from "lucide-react";
import type { Row } from "../types";
import { day, money } from "../utils";
import { usePortal } from "../context/PortalContext";

export function TenantDetailDialog({
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
  const { data, setViewDoc, setUploadDocOpen, setUploadDocTenantId, deleteDoc } = usePortal();
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "bills">("details");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  // Filter documents belonging to this tenant
  const tenantDocs = (data.documents || []).filter(
    (d) => d.tenant_id === t.tenant_id || d.tenant_id === t.id,
  );

  const phone = t.phone ? String(t.phone).replace(/[^0-9]/g, "") : "";
  const intlPhone = phone.length === 10 ? `91${phone}` : phone;
  const waUrl = phone ? `https://wa.me/${intlPhone}` : "";

  const handleUploadDoc = () => {
    setUploadDocTenantId(t.tenant_id || t.id);
    setUploadDocOpen(true);
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm("Are you sure you want to delete this tenant document?")) {
      await deleteDoc(id);
    }
  };

  return (
    <dialog className="detail-dialog" ref={ref} onCancel={onClose}>
      <div className="modal-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="avatar large">
            {t.name
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <span className="eyebrow">TENANT PROFILE</span>
            <h2>{t.name}</h2>
            <p>
              {t.property_name} · Room {t.room_name} · {t.bed_label}
            </p>
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close tenant"
        >
          <X />
        </button>
      </div>

      {/* Tenant Navigation Tabs */}
      <div className="tenant-modal-tabs">
        <button
          type="button"
          className={`tenant-modal-tab-btn ${activeTab === "details" ? "active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Overview & Info
        </button>
        <button
          type="button"
          className={`tenant-modal-tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          Documents & KYC ({tenantDocs.length})
          {tenantDocs.length === 0 && <span className="missing-dot" title="Missing KYC" />}
        </button>
        <button
          type="button"
          className={`tenant-modal-tab-btn ${activeTab === "bills" ? "active" : ""}`}
          onClick={() => setActiveTab("bills")}
        >
          Bills & Dues ({invoices.length})
        </button>
      </div>

      <div className="detail-body">
        {/* Tab 1: Tenant Information Overview */}
        {activeTab === "details" && (
          <>
            <div className="detail-grid">
              {Object.entries({
                Phone: t.phone,
                Email: t.email || "—",
                Joined: day(t.joined_on),
                "Monthly rent": money(t.rent),
                "Deposit received": money(t.deposit_paid),
                "Deposit expected": money(t.deposit_expected),
                "Emergency contact": `${t.emergency_name || "—"} ${t.emergency_phone || ""}`,
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

            {/* Document summary banner inside Overview */}
            <div className="tenant-doc-summary-strip">
              <div className="strip-info">
                <FileCheck2 size={18} className={tenantDocs.length ? "text-green" : "text-amber"} />
                <span>
                  {tenantDocs.length
                    ? `${tenantDocs.length} verification document${tenantDocs.length === 1 ? "" : "s"} on file`
                    : "No verification documents uploaded yet"}
                </span>
              </div>
              <div className="strip-actions">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setActiveTab("documents")}
                >
                  View documents →
                </button>
                {ops && (
                  <button
                    type="button"
                    className="secondary mini-btn"
                    onClick={handleUploadDoc}
                  >
                    <Plus size={13} /> Add doc
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Tenant Documents & KYC Repository */}
        {activeTab === "documents" && (
          <div className="tenant-docs-tab-content">
            <div className="tenant-docs-head-bar">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
                  Verified Documents & Agreements
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Government IDs, rental agreements, police verification forms, and student/workplace proofs.
                </p>
              </div>
              {ops && (
                <button
                  type="button"
                  className="primary"
                  onClick={handleUploadDoc}
                  style={{ gap: 6 }}
                >
                  <Upload size={15} /> Upload document
                </button>
              )}
            </div>

            {tenantDocs.length === 0 ? (
              <div className="tenant-no-docs-box">
                <div className="no-docs-icon">
                  <FileText size={32} />
                </div>
                <h4 style={{ margin: "0 0 4px", color: "#334155" }}>
                  No KYC documents found for {t.name}
                </h4>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 12.5 }}>
                  Upload an Aadhaar card, rental agreement, or police verification form to complete this tenant's file.
                </p>
                {ops && (
                  <button
                    type="button"
                    className="primary"
                    onClick={handleUploadDoc}
                  >
                    <Upload size={15} style={{ marginRight: 6 }} /> Upload Tenant Document
                  </button>
                )}
              </div>
            ) : (
              <div className="tenant-docs-grid">
                {tenantDocs.map((doc) => {
                  const sizeKb = doc.size ? Math.round(Number(doc.size) / 1024) : 0;
                  const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

                  return (
                    <div key={doc.id} className="tenant-doc-card">
                      <div className="tenant-doc-icon-wrap">
                        <FileText size={20} />
                      </div>
                      <div className="tenant-doc-info">
                        <b className="tenant-doc-name" title={doc.name}>
                          {doc.name}
                        </b>
                        <div className="tenant-doc-meta">
                          <span className="tenant-doc-cat-pill">{doc.category || "Tenant Document"}</span>
                          <span>·</span>
                          <span>{sizeStr}</span>
                          <span>·</span>
                          <span>{day(doc.created_at)}</span>
                        </div>
                      </div>
                      <div className="tenant-doc-actions">
                        <button
                          type="button"
                          className="doc-icon-btn preview"
                          onClick={() => setViewDoc(doc)}
                          title="Preview in document viewer"
                        >
                          <Eye size={15} /> View
                        </button>
                        <a
                          href={`/api/documents?id=${doc.id}`}
                          download
                          className="doc-icon-btn download"
                          title="Download document"
                        >
                          <Download size={15} />
                        </a>
                        {ops && (
                          <button
                            type="button"
                            className="doc-icon-btn delete"
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Delete document"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bills & Invoices History */}
        {activeTab === "bills" && (
          <div className="tenant-bills-tab-content">
            <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#0f172a" }}>Billing Ledger</h4>
            {invoices.length ? (
              invoices.map((i) => {
                const balance = Number(i.amount) - Number(i.paid);
                return (
                  <div className="reminder" key={i.id} style={{ marginBottom: 10 }}>
                    <div>
                      <b>{i.description}</b>
                      <small>Due {day(i.due_on)} · Billed {money(i.amount)}</small>
                    </div>
                    <strong>{balance > 0 ? `${money(balance)} due` : "Cleared"}</strong>
                    {balance > 0 && finance && (
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
                );
              })
            ) : (
              <p style={{ color: "#64748b", fontSize: 13 }}>No bills generated yet.</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="detail-actions">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#16a34a" }}
              title="Message tenant on WhatsApp"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
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
