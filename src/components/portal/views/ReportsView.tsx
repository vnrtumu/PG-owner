"use client";
import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  FileText,
  Download,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Stat } from "../common/Stat";
import { Table } from "../common/Table";
import { money, dateValue, today } from "../utils";

export function ReportsView() {
  const {
    props,
    payments,
    expenses,
    dues,
    collected,
    spending,
    active,
    exportReport,
  } = usePortal();

  const month = today().slice(0, 7);

  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Collections this month"
          value={money(collected)}
          note="Based on actual payment dates"
          icon={ArrowDownLeft}
        />
        <Stat
          label="Paid expenses"
          value={money(spending)}
          note="Pending expenses excluded"
          icon={ArrowUpRight}
        />
        <Stat
          label="Cash surplus"
          value={money(collected - spending)}
          note="Excludes security deposits"
          icon={TrendingUp}
          color="featured"
        />
        <Stat
          label="Deposits held"
          value={money(
            active.reduce((s, t) => s + Number(t.deposit_paid), 0),
          )}
          note="Refundable deposits, not income"
          icon={ShieldCheck}
        />
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Property performance</h2>
          <span className="period">
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <Table
          headers={[
            "PROPERTY",
            "COLLECTED",
            "PAID EXPENSES",
            "CASH SURPLUS",
            "OUTSTANDING DUES",
          ]}
          rows={props.map((p) => {
            const inc = payments
                .filter(
                  (x) =>
                    x.property_id === p.id &&
                    dateValue(x.paid_on).startsWith(month),
                )
                .reduce((s, x) => s + Number(x.amount), 0);
            const exp = expenses
                .filter(
                  (x) =>
                    x.property_id === p.id &&
                    x.status === "Paid" &&
                    dateValue(x.spent_on).startsWith(month),
                )
                .reduce((s, x) => s + Number(x.amount), 0);
            return [
              p.name,
              money(inc),
              money(exp),
              <b key={`surplus-${p.id}`}>{money(inc - exp)}</b>,
              money(
                dues
                  .filter((i) => i.property_id === p.id)
                  .reduce(
                    (s, i) => s + Number(i.amount) - Number(i.paid),
                    0,
                  ),
              ),
            ];
          })}
        />
      </section>
      <div className="export-grid">
        {["tenants", "invoices", "payments", "expenses"].map((t) => (
          <button
            className="panel export-card"
            key={t}
            onClick={() => exportReport(t)}
          >
            <FileText size={24} />
            <span>
              <b>{t.charAt(0).toUpperCase() + t.slice(1)} report</b>
              <small>Download all records for selected PG · CSV</small>
            </span>
            <Download size={18} />
          </button>
        ))}
      </div>
      <p className="footnote">
        CSV monetary amounts are in paise (₹1 = 100 paise). Cash surplus
        is a cash-flow measure, not an accounting profit statement.
      </p>
    </>
  );
}
