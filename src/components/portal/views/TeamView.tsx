"use client";
import React from "react";
import { Search } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";

export function TeamView() {
  const { data, matches, search, setSearch, busy, quick } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Team"
            placeholder="Search team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Table
        headers={[
          "TEAM MEMBER",
          "ROLE",
          "PROPERTY ACCESS",
          "STATUS",
          "",
        ]}
        rows={data.staff.filter(matches).map((u) => [
          <div key={`member-${u.id}`}>
            <b>{u.name}</b>
            <small>{u.email}</small>
          </div>,
          <Badge key={`role-${u.id}`}>{u.role}</Badge>,
          u.role === "owner"
            ? "All properties"
            : data.properties
                .filter((p) => u.property_ids.includes(p.id))
                .map((p) => p.name)
                .join(", "),
          <Badge
            key={`status-${u.id}`}
            tone={u.active ? "green" : "gray"}
          >
            {u.active ? "Active" : "Disabled"}
          </Badge>,
          u.role !== "owner" ? (
            <button
              key={`btn-${u.id}`}
              className="text-btn"
              disabled={busy}
              onClick={() => quick("staffAccess", { id: u.id })}
            >
              {u.active ? "Disable access" : "Enable access"}
            </button>
          ) : (
            "—"
          ),
        ])}
      />
    </section>
  );
}
