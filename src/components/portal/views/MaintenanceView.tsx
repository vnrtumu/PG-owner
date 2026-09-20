"use client";
import React from "react";
import { Search } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { day } from "../utils";

export function MaintenanceView() {
  const {
    complaints,
    matches,
    search,
    setSearch,
    filter,
    setFilter,
    busy,
    quick,
  } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Maintenance"
            placeholder="Search maintenance…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <select
            aria-label="Status filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All", "Open", "In progress", "Resolved"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <Table
        headers={[
          "REQUEST",
          "PROPERTY / LOCATION",
          "PRIORITY",
          "ASSIGNED TO",
          "STATUS",
        ]}
        rows={complaints
          .filter(matches)
          .filter((c) => filter === "All" || c.status === filter)
          .map((c) => [
            <div key={`req-${c.id}`}>
              <b>{c.title}</b>
              <small>{c.notes || day(c.created_at)}</small>
            </div>,
            <div key={`loc-${c.id}`}>
              {c.property_name}
              <small>{c.location}</small>
            </div>,
            <Badge
              key={`badge-${c.id}`}
              tone={
                c.priority === "High"
                  ? "red"
                  : c.priority === "Medium"
                    ? "amber"
                    : "gray"
              }
            >
              {c.priority}
            </Badge>,
            c.assigned_to || "Unassigned",
            <select
              key={`status-${c.id}`}
              aria-label={`Status for ${c.title}`}
              value={c.status}
              disabled={busy}
              onChange={(e) =>
                quick("complaintStatus", {
                  id: c.id,
                  status: e.target.value,
                })
              }
            >
              {["Open", "In progress", "Resolved"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>,
          ])}
      />
    </section>
  );
}
