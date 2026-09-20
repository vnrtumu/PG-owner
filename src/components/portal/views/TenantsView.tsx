"use client";
import React from "react";
import { Search, ChevronRight } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { money } from "../utils";

export function TenantsView() {
  const {
    tenants,
    matches,
    search,
    setSearch,
    filter,
    setFilter,
    setDetail,
  } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Tenants"
            placeholder="Search tenants…"
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
            {["All", "Active", "Notice", "Checked out"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <Table
        headers={[
          "TENANT",
          "PROPERTY / BED",
          "MONTHLY RENT",
          "DEPOSIT RECEIVED",
          "STATUS",
          "",
        ]}
        rows={tenants
          .filter(matches)
          .filter(
            (t) =>
              filter === "All" ||
              (filter === "Active" && !t.ended_on) ||
              (filter === "Notice" && t.notice_on && !t.ended_on) ||
              (filter === "Checked out" && t.ended_on),
          )
          .map((t) => [
            <button
              key={`person-${t.id}`}
              className="person-cell"
              onClick={() => setDetail(t)}
            >
              <span className="avatar">
                {t.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span>
                <b>{t.name}</b>
                <small>{t.phone}</small>
              </span>
            </button>,
            <div key={`prop-${t.id}`}>
              <b>{t.property_name}</b>
              <small>
                Room {t.room_name} · {t.bed_label}
              </small>
            </div>,
            money(t.rent),
            <div key={`dep-${t.id}`}>
              {money(t.deposit_paid)}
              <small>of {money(t.deposit_expected)}</small>
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
            <button
              key={`view-${t.id}`}
              className="text-btn"
              onClick={() => setDetail(t)}
            >
              View <ChevronRight size={14} />
            </button>,
          ])}
      />
    </section>
  );
}
