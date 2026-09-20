"use client";
import React from "react";
import {
  BedDouble,
  ArrowDownLeft,
  Clock,
  Home,
  Receipt,
  ChevronRight,
  Wrench,
  CalendarDays,
  ShieldCheck,
  ArrowRight,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Stat } from "../common/Stat";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { money, dateValue, today } from "../utils";

export function OverviewView() {
  const {
    data,
    finance,
    occupancy,
    occupied,
    beds,
    collected,
    outstanding,
    dues,
    available,
    props,
    payments,
    expenses,
    spending,
    overdue,
    complaints,
    active,
    go,
    setFilter,
    setProperty,
  } = usePortal();

  const month = today().slice(0, 7);

  if (finance) {
    return (
      <>
        <div className="stats-grid">
          <Stat
            label="Total occupancy"
            value={`${occupancy}%`}
            note={`${occupied} of ${beds.length} beds occupied`}
            icon={BedDouble}
            color="featured"
          />
          <Stat
            label="Rent collected"
            value={money(collected)}
            note="Payments received this month"
            icon={ArrowDownLeft}
          />
          <Stat
            label="Outstanding dues"
            value={money(outstanding)}
            note={`${dues.length} unpaid or partially paid bills`}
            icon={Clock}
          />
          <Stat
            label="Available beds"
            value={String(available).padStart(2, "0")}
            note={`Across ${props.length} ${props.length === 1 ? "property" : "properties"}`}
            icon={Home}
          />
        </div>
        <div className="dashboard-grid">
          <section className="panel revenue-panel">
            <div className="panel-head">
              <div>
                <h2>Cash flow</h2>
                <p>Collections and paid expenses over time</p>
              </div>
              <span className="period">Last 6 months</span>
            </div>
            <div className="chart-legend">
              <span>
                <i className="green" /> Collections
              </span>
              <span>
                <i className="pale" /> Expenses
              </span>
            </div>
            <div className="bar-chart">
              {Array.from({ length: 6 }, (_, idx) => {
                const dt = new Date();
                dt.setDate(1);
                dt.setMonth(dt.getMonth() - 5 + idx);
                const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
                const inc = payments
                  .filter((p) => dateValue(p.paid_on).startsWith(m))
                  .reduce((s, p) => s + Number(p.amount), 0);
                const exp = expenses
                  .filter(
                    (e) =>
                      e.status === "Paid" &&
                      dateValue(e.spent_on).startsWith(m),
                  )
                  .reduce((s, e) => s + Number(e.amount), 0);
                const max = Math.max(
                  1,
                  ...Array.from({ length: 6 }, (_, j) => {
                    const dd = new Date();
                    dd.setDate(1);
                    dd.setMonth(dd.getMonth() - 5 + j);
                    const mm = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`;
                    return Math.max(
                      payments
                        .filter((p) => dateValue(p.paid_on).startsWith(mm))
                        .reduce((s, p) => s + Number(p.amount), 0),
                      expenses
                        .filter(
                          (e) =>
                            e.status === "Paid" &&
                            dateValue(e.spent_on).startsWith(mm),
                        )
                        .reduce((s, e) => s + Number(e.amount), 0),
                    );
                  }),
                );
                return (
                  <div className="chart-column" key={m}>
                    <div className="bars">
                      <div
                        title={`Collections: ${money(inc)}`}
                        style={{
                          height: `${Math.max(inc ? 3 : 0, (inc / max) * 100)}%`,
                        }}
                      />
                      <div
                        title={`Expenses: ${money(exp)}`}
                        style={{
                          height: `${Math.max(exp ? 3 : 0, (exp / max) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>
                      {dt.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="chart-summary">
              <span>
                This month’s cash surplus <b>{money(collected - spending)}</b>
              </span>
              <small>
                Collections minus paid expenses · excludes deposits
              </small>
            </div>
          </section>
          <section className="panel attention">
            <div className="panel-head">
              <h2>Needs your attention</h2>
              <span className="count">
                {overdue.length +
                  complaints.filter((c) => c.status !== "Resolved").length}
              </span>
            </div>
            <button
              onClick={() => {
                go("Rent & payments");
                setFilter("Outstanding");
              }}
            >
              <span className="attention-icon amber">
                <Receipt size={19} />
              </span>
              <span>
                <strong>{overdue.length} overdue rent bills</strong>
                <small>
                  {money(
                    overdue.reduce(
                      (s, i) => s + Number(i.amount) - Number(i.paid),
                      0,
                    ),
                  )}{" "}
                  awaiting collection
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => go("Maintenance")}>
              <span className="attention-icon blue">
                <Wrench size={19} />
              </span>
              <span>
                <strong>
                  {complaints.filter((c) => c.status !== "Resolved").length}{" "}
                  open requests
                </strong>
                <small>Keep your residents comfortable</small>
              </span>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => go("Reminders")}>
              <span className="attention-icon purple">
                <CalendarDays size={19} />
              </span>
              <span>
                <strong>
                  {active.filter((t) => t.notice_on).length} planned move-outs
                </strong>
                <small>Review notice and settlement</small>
              </span>
              <ChevronRight size={16} />
            </button>
            <div className="attention-note">
              <ShieldCheck size={19} />
              <p>
                A little follow-up goes a long way.
                <br />
                <b>Keep your PG running smoothly.</b>
              </p>
            </div>
          </section>
        </div>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Your properties</h2>
              <p>A quick check on occupancy and collections</p>
            </div>
            <button className="text-btn" onClick={() => go("Properties")}>
              View all properties <ArrowRight size={16} />
            </button>
          </div>
          <Table
            headers={[
              "PROPERTY",
              "OCCUPANCY",
              "BEDS AVAILABLE",
              "MONTHLY COLLECTIONS",
              "",
            ]}
            rows={props.map((p) => {
              const pb = data.beds.filter((b) => b.property_id === p.id);
              const used = pb.filter((b) => b.stay_id).length;
              const rate = pb.length
                ? Math.round((used / pb.length) * 100)
                : 0;
              return [
                <div className="property-cell" key={`prop-${p.id}`}>
                  <span className="property-icon">
                    <Building2 size={21} />
                  </span>
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.city} · {p.type}
                    </small>
                  </div>
                </div>,
                <div className="occupancy-cell" key={`occ-${p.id}`}>
                  <span>
                    {used}/{pb.length} beds <b>{rate}%</b>
                  </span>
                  <div className="progress">
                    <i style={{ width: `${rate}%` }} />
                  </div>
                </div>,
                <Badge tone="green" key={`badge-${p.id}`}>
                  {pb.filter((b) => !b.stay_id && !b.maintenance).length}{" "}
                  available
                </Badge>,
                <b key={`coll-${p.id}`}>
                  {money(
                    data.payments
                      .filter(
                        (pay) =>
                          pay.property_id === p.id &&
                          dateValue(pay.paid_on).startsWith(month),
                      )
                      .reduce((s, pay) => s + Number(pay.amount), 0),
                  )}
                </b>,
                <button
                  key={`btn-${p.id}`}
                  aria-label={`View ${p.name}`}
                  className="icon-btn"
                  onClick={() => {
                    setProperty(p.id);
                    go("Rooms & beds");
                  }}
                >
                  <ArrowUpRight size={18} />
                </button>,
              ];
            })}
          />
        </section>
      </>
    );
  }

  // Caretaker Overview
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Total occupancy"
          value={`${occupancy}%`}
          note={`${occupied} of ${beds.length} beds occupied`}
          icon={BedDouble}
          color="featured"
        />
        <Stat
          label="Available beds"
          value={String(available)}
          note="Across your assigned properties"
          icon={Home}
        />
        <Stat
          label="Open requests"
          value={String(
            complaints.filter((c) => c.status !== "Resolved").length,
          )}
          note="Maintenance to follow up"
          icon={Wrench}
        />
      </div>
      <section className="panel settings-card">
        <div>
          <h2>Keep your property running smoothly</h2>
          <p>
            Review room availability and follow up on maintenance
            requests.
          </p>
        </div>
        <button className="primary" onClick={() => go("Maintenance")}>
          View maintenance <ArrowRight size={16} />
        </button>
      </section>
    </>
  );
}
