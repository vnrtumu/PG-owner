"use client";
import React from "react";
import { Search, RefreshCw, Download, ArrowRight, Check, Share2 } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Table } from "../common/Table";
import { Badge } from "../common/Badge";
import { money, day, dateValue, today, f } from "../utils";

export function RentPaymentsView() {
  const {
    invoices,
    payments,
    active,
    matches,
    search,
    setSearch,
    filter,
    setFilter,
    ops,
    finance,
    busy,
    setModal,
    propertyField,
    defaultProp,
    payment,
    receipt,
    shareReceipt,
  } = usePortal();

  return (
    <section className="panel">
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search Rent & payments"
            placeholder="Search rent & payments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          {ops && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                setModal({
                  title: "Generate monthly rent",
                  subtitle:
                    "Creates this month’s bills once per active stay. First-month rent is prorated from the joining date.",
                  action: "rent",
                  fields: [propertyField],
                  values: { property_id: defaultProp },
                  submit: "Generate bills",
                })
              }
            >
              <RefreshCw size={15} /> Generate rent
            </button>
          )}
          {finance && (
            <button
              className="text-btn"
              onClick={() =>
                setModal({
                  title: "Add a charge",
                  action: "charge",
                  fields: [
                    {
                      name: "stay_id",
                      label: "Tenant",
                      type: "select",
                      required: true,
                      options: active.map((t) => ({
                        value: t.id,
                        label: `${t.name} · ${t.property_name}`,
                      })),
                    },
                    f("description", "Description"),
                    f("amount", "Amount (₹)", "number"),
                    f("due_on", "Due date", "date"),
                  ],
                  values: { due_on: today() },
                })
              }
            >
              + Add charge
            </button>
          )}
          <select
            aria-label="Status filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All", "Outstanding", "Paid", "Payments"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>

      {filter === "Payments" ? (
        <Table
          headers={[
            "TENANT",
            "INVOICE",
            "DATE",
            "METHOD",
            "AMOUNT",
            "",
          ]}
          rows={payments.filter(matches).map((p) => [
            p.tenant_name,
            `#${String(p.invoice_number).padStart(4, "0")}`,
            day(p.paid_on),
            p.method,
            <b key={`amt-${p.id}`}>{money(p.amount)}</b>,
            <div key={`actions-${p.id}`} className="row-actions">
              <button
                className="text-btn"
                onClick={() => receipt(p)}
                title="Print or download PDF receipt"
              >
                <Download size={14} /> Receipt
              </button>
              <button
                className="text-btn"
                onClick={() => shareReceipt(p)}
                title="Share receipt via WhatsApp, Copy, or Email"
              >
                <Share2 size={14} /> Share
              </button>
            </div>,
          ])}
        />
      ) : (
        <Table
          headers={[
            "INVOICE / TENANT",
            "PROPERTY",
            "DUE DATE",
            "BILLED",
            "BALANCE",
            "STATUS",
            "",
          ]}
          rows={invoices
            .filter(matches)
            .filter(
              (i) =>
                filter === "All" ||
                (filter === "Outstanding" &&
                  Number(i.amount) > Number(i.paid)) ||
                (filter === "Paid" &&
                  Number(i.amount) === Number(i.paid)),
            )
            .map((i) => {
              const balance = Number(i.amount) - Number(i.paid);
              const late = dateValue(i.due_on) < today();
              return [
                <div key={`inv-${i.id}`}>
                  <b>{i.tenant_name}</b>
                  <small>
                    #{String(i.number).padStart(4, "0")} · {i.description}
                  </small>
                </div>,
                i.property_name,
                day(i.due_on),
                money(i.amount),
                <b key={`bal-${i.id}`}>{money(balance)}</b>,
                <Badge
                  key={`badge-${i.id}`}
                  tone={!balance ? "green" : late ? "red" : "amber"}
                >
                  {!balance
                    ? "Paid"
                    : Number(i.paid) > 0
                      ? "Partial"
                      : late
                        ? "Overdue"
                        : "Pending"}
                </Badge>,
                balance > 0 ? (
                  <button
                    key={`btn-${i.id}`}
                    className="text-btn"
                    onClick={() => payment(i)}
                  >
                    Collect <ArrowRight size={14} />
                  </button>
                ) : (
                  <div key={`paid-act-${i.id}`} className="row-actions">
                    <span title="Paid in full">
                      <Check size={17} className="success-icon" />
                    </span>
                    {(() => {
                      const p = payments.find((x) => x.invoice_id === i.id);
                      return p ? (
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => shareReceipt(p)}
                          title="Share rent receipt with tenant"
                        >
                          <Share2 size={13} /> Share
                        </button>
                      ) : null;
                    })()}
                  </div>
                ),
              ];
            })}
        />
      )}
    </section>
  );
}
