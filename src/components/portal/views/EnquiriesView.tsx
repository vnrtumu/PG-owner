"use client";
import React from "react";
import { Search } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { day } from "../utils";

export function EnquiriesView() {
  const { data, scoped, matches, search, setSearch, ops, busy, quick } =
    usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Enquiries"
            placeholder="Search enquiries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Table
        headers={[
          "PROSPECT",
          "PROPERTY",
          "MOVE-IN",
          "FOLLOW-UP",
          "NOTES",
          "STATUS",
        ]}
        rows={scoped(data.bookings)
          .filter(matches)
          .map((b) => [
            <div key={`prospect-${b.id}`}>
              <b>{b.name}</b>
              <small>{b.phone}</small>
            </div>,
            b.property_name,
            day(b.move_in),
            day(b.follow_up),
            b.notes || "—",
            ops ? (
              <select
                key={`status-${b.id}`}
                aria-label={`Status for ${b.name}`}
                value={b.status}
                disabled={busy}
                onChange={(e) =>
                  quick("bookingStatus", {
                    id: b.id,
                    status: e.target.value,
                  })
                }
              >
                {["New", "Contacted", "Converted", "Cancelled"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            ) : (
              <Badge key={`badge-${b.id}`}>{b.status}</Badge>
            ),
          ])}
      />
    </section>
  );
}
