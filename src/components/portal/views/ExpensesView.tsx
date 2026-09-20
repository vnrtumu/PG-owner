"use client";
import React from "react";
import { Search } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { money, day } from "../utils";

export function ExpensesView() {
  const { expenses, matches, search, setSearch, busy, quick } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Expenses"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Table
        headers={[
          "EXPENSE",
          "PROPERTY",
          "DATE",
          "AMOUNT",
          "STATUS",
          "",
        ]}
        rows={expenses.filter(matches).map((e) => [
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
            "—"
          ),
        ])}
      />
    </section>
  );
}
