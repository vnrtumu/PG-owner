"use client";
import React from "react";
import { Search, FileText, Download } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { day } from "../utils";

export function DocumentsView() {
  const { data, scoped, matches, search, setSearch } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Documents"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
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
            <div key={`doc-${d.id}`} className="document-cell">
              <FileText size={20} />
              <div>
                <b>{d.name}</b>
                <small>{Math.ceil(d.size / 1024)} KB</small>
              </div>
            </div>,
            d.property_name,
            d.tenant_name || "Property document",
            <Badge key={`badge-${d.id}`}>{d.category}</Badge>,
            day(d.created_at),
            <a
              key={`dl-${d.id}`}
              className="text-btn"
              href={`/api/documents?id=${d.id}`}
            >
              <Download size={15} /> Download
            </a>,
          ])}
      />
    </section>
  );
}
