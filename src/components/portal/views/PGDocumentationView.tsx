"use client";
import React, { useState } from "react";
import {
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Upload,
  LayoutGrid,
  List,
  Building2,
  ShieldCheck,
  Calendar,
  FileCheck2,
  HardDrive,
  User,
  Plus,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { day } from "../utils";
import type { Row } from "../types";

export function PGDocumentationView({
  onViewDoc,
  onUploadDoc,
  onDeleteDoc,
}: {
  onViewDoc: (doc: Row) => void;
  onUploadDoc: () => void;
  onDeleteDoc?: (id: string) => Promise<void>;
}) {
  const { data, scoped, matches, search, setSearch, property, ops } = usePortal();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const allDocuments = scoped(data.documents || []);

  // Filter by search and category
  const filteredDocuments = allDocuments.filter((d) => {
    if (!matches(d)) return false;
    if (categoryFilter === "All") return true;
    if (categoryFilter === "Compliance") {
      return (
        d.category?.includes("Police") ||
        d.category?.includes("Fire") ||
        d.category?.includes("License") ||
        d.category?.includes("NOC")
      );
    }
    if (categoryFilter === "Agreements") {
      return d.category?.includes("Agreement");
    }
    if (categoryFilter === "Property") {
      return (
        d.category?.includes("Property") ||
        d.category?.includes("Deed") ||
        d.category?.includes("Utility") ||
        d.category?.includes("Electricity")
      );
    }
    if (categoryFilter === "Tenant KYC") {
      return (
        d.category?.includes("Identity") ||
        d.category?.includes("KYC") ||
        Boolean(d.tenant_id)
      );
    }
    return d.category === categoryFilter;
  });

  // Calculate high-level stats
  const totalDocs = allDocuments.length;
  const complianceCount = allDocuments.filter(
    (d) =>
      d.category?.includes("Police") ||
      d.category?.includes("Fire") ||
      d.category?.includes("License") ||
      d.category?.includes("NOC"),
  ).length;
  const agreementsCount = allDocuments.filter((d) =>
    d.category?.includes("Agreement"),
  ).length;
  const totalSizeBytes = allDocuments.reduce(
    (sum, d) => sum + (Number(d.size) || 0),
    0,
  );
  const totalSizeFormatted =
    totalSizeBytes >= 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.ceil(totalSizeBytes / 1024)} KB`;

  const handleDelete = async (doc: Row) => {
    if (!onDeleteDoc) return;
    if (
      window.confirm(
        `Delete "${doc.name}"? This removes the document permanently.`,
      )
    ) {
      await onDeleteDoc(doc.id);
    }
  };

  return (
    <div className="pg-docs-page">
      {/* KPI Stats Bar */}
      <div className="pg-docs-kpi-grid">
        <div className="pg-docs-kpi-card">
          <div className="kpi-icon-wrap primary-icon">
            <FileText size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">TOTAL DOCUMENTS</span>
            <h3 className="kpi-value">{totalDocs}</h3>
            <span className="kpi-sub">Across all properties</span>
          </div>
        </div>

        <div className="pg-docs-kpi-card">
          <div className="kpi-icon-wrap compliance-icon">
            <ShieldCheck size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">COMPLIANCE & LICENSES</span>
            <h3 className="kpi-value">{complianceCount}</h3>
            <span className="kpi-sub">Fire, Police, FSSAI, Trade</span>
          </div>
        </div>

        <div className="pg-docs-kpi-card">
          <div className="kpi-icon-wrap agreement-icon">
            <FileCheck2 size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">RENTAL AGREEMENTS</span>
            <h3 className="kpi-value">{agreementsCount}</h3>
            <span className="kpi-sub">Active tenant contracts</span>
          </div>
        </div>

        <div className="pg-docs-kpi-card">
          <div className="kpi-icon-wrap storage-icon">
            <HardDrive size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">STORAGE VAULT</span>
            <h3 className="kpi-value">{totalSizeFormatted}</h3>
            <span className="kpi-sub">Secure encrypted storage</span>
          </div>
        </div>
      </div>

      <section className="panel">
        {/* Main Toolbar */}
        <div className="toolbar">
          <div className="search">
            <Search size={17} />
            <input
              aria-label="Search PG Documentation"
              placeholder="Search documents by name, category, or tenant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid cards view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table list view"
              >
                <List size={16} />
              </button>
            </div>

            {ops && (
              <button
                type="button"
                className="primary"
                onClick={onUploadDoc}
              >
                <Upload size={16} /> Upload document
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="docs-category-tabs">
          {[
            { id: "All", label: "All Documents" },
            { id: "Compliance", label: "Compliance & NOC" },
            { id: "Property", label: "Property & Utility" },
            { id: "Agreements", label: "Agreements" },
            { id: "Tenant KYC", label: "Tenant KYC" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`doc-filter-tab ${categoryFilter === tab.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Display */}
        {filteredDocuments.length === 0 ? (
          <div className="docs-empty-state">
            <div className="empty-icon-wrap">
              <FileText size={36} />
            </div>
            <h3>No documents found</h3>
            <p>
              {search || categoryFilter !== "All"
                ? "Try adjusting your search query or category filter."
                : "Upload PG property deeds, fire NOC, rental agreements, or tenant documents to your secure repository."}
            </p>
            {ops && (
              <button
                type="button"
                className="primary"
                onClick={onUploadDoc}
              >
                <Plus size={16} /> Upload First Document
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Cards Grid View */
          <div className="doc-cards-grid">
            {filteredDocuments.map((doc) => {
              const isPdf = doc.mime === "application/pdf";
              const isImg = doc.mime?.startsWith("image/");
              const sizeStr =
                doc.size >= 1024 * 1024
                  ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.ceil(doc.size / 1024)} KB`;

              return (
                <div key={`card-${doc.id}`} className="doc-card">
                  <div className="doc-card-top">
                    <div
                      className={`doc-type-icon ${isPdf ? "pdf-type" : isImg ? "img-type" : "generic-type"}`}
                    >
                      <FileText size={24} />
                    </div>
                    <span className="doc-card-badge">{doc.category}</span>
                  </div>

                  <div className="doc-card-content">
                    <h4
                      className="doc-card-title"
                      title={doc.name}
                      onClick={() => onViewDoc(doc)}
                    >
                      {doc.name}
                    </h4>

                    <div className="doc-card-meta-row">
                      <span className="meta-prop">
                        <Building2 size={13} /> {doc.property_name}
                      </span>
                      {doc.tenant_name && (
                        <span className="meta-tenant">
                          <User size={13} /> {doc.tenant_name}
                        </span>
                      )}
                    </div>

                    <div className="doc-card-footer-info">
                      <span className="meta-date">
                        <Calendar size={13} /> {day(doc.created_at)}
                      </span>
                      <span className="meta-size">{sizeStr}</span>
                    </div>
                  </div>

                  <div className="doc-card-actions">
                    <button
                      type="button"
                      className="doc-action-btn view"
                      onClick={() => onViewDoc(doc)}
                      title="View document in browser"
                    >
                      <Eye size={15} /> View
                    </button>
                    <a
                      href={`/api/documents?id=${doc.id}`}
                      download={doc.name}
                      className="doc-action-btn download"
                      title="Download file"
                    >
                      <Download size={15} /> Download
                    </a>
                    {ops && onDeleteDoc && (
                      <button
                        type="button"
                        className="doc-action-btn delete"
                        onClick={() => handleDelete(doc)}
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
        ) : (
          /* Table View */
          <Table
            headers={[
              "DOCUMENT",
              "PROPERTY",
              "CATEGORY",
              "TENANT",
              "SIZE",
              "UPLOADED",
              "ACTIONS",
            ]}
            rows={filteredDocuments.map((d) => [
              <div
                key={`tbl-doc-${d.id}`}
                className="document-cell clickable"
                onClick={() => onViewDoc(d)}
              >
                <div
                  className={`doc-table-icon ${d.mime === "application/pdf" ? "pdf" : "img"}`}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <b className="doc-table-title">{d.name}</b>
                  <small>{d.mime}</small>
                </div>
              </div>,
              <span key={`tbl-p-${d.id}`} className="doc-table-prop">
                {d.property_name}
              </span>,
              <Badge key={`tbl-cat-${d.id}`}>{d.category}</Badge>,
              <span key={`tbl-t-${d.id}`} className="doc-table-tenant">
                {d.tenant_name || "—"}
              </span>,
              <span key={`tbl-s-${d.id}`} className="doc-table-size">
                {d.size >= 1024 * 1024
                  ? `${(d.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${Math.ceil(d.size / 1024)} KB`}
              </span>,
              day(d.created_at),
              <div key={`tbl-act-${d.id}`} className="row-actions">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => onViewDoc(d)}
                  title="View document in viewer"
                >
                  <Eye size={15} /> View
                </button>
                <a
                  className="text-btn"
                  href={`/api/documents?id=${d.id}`}
                  download={d.name}
                  title="Download file"
                >
                  <Download size={15} /> Download
                </a>
                {ops && onDeleteDoc && (
                  <button
                    type="button"
                    className="text-btn danger-hover"
                    onClick={() => handleDelete(d)}
                    title="Delete document"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>,
            ])}
          />
        )}
      </section>
    </div>
  );
}
