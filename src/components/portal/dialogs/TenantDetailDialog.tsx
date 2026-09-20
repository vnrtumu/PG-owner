"use client";
import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Row } from "../types";
import { day, money } from "../utils";

export function TenantDetailDialog({
  tenant: t,
  invoices,
  onClose,
  onAction,
  onPay,
  ops,
  finance,
}: {
  tenant: Row;
  invoices: Row[];
  onClose: () => void;
  onAction: (kind: string, t: Row) => void;
  onPay: (i: Row) => void;
  ops: boolean;
  finance: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog className="detail-dialog" ref={ref} onCancel={onClose}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">TENANT PROFILE</span>
          <h2>{t.name}</h2>
          <p>
            {t.property_name} · Room {t.room_name} · {t.bed_label}
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close tenant"
        >
          <X />
        </button>
      </div>
      <div className="detail-body">
        <div className="detail-grid">
          {Object.entries({
            Phone: t.phone,
            Email: t.email || "—",
            Joined: day(t.joined_on),
            "Monthly rent": money(t.rent),
            "Deposit received": money(t.deposit_paid),
            "Deposit expected": money(t.deposit_expected),
            "Emergency contact": `${t.emergency_name || "—"} ${t.emergency_phone}`,
            "College / workplace": t.occupation || "—",
            Address: t.address || "—",
            "Agreement expires": day(t.agreement_expires),
            "Move-out notice": day(t.notice_on),
            ...(t.ended_on
              ? {
                  "Checked out": day(t.ended_on),
                  "Deposit refunded": money(t.deposit_refund),
                  "Deposit deducted": money(t.deposit_deduction),
                  Settlement: t.settlement_reason,
                }
              : {}),
          }).map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <h3>Bills</h3>
        {invoices.length ? (
          invoices.map((i) => (
            <div className="reminder" key={i.id}>
              <div>
                <b>{i.description}</b>
                <small>Due {day(i.due_on)}</small>
              </div>
              <strong>{money(Number(i.amount) - Number(i.paid))} due</strong>
              {Number(i.amount) > Number(i.paid) && finance && (
                <button
                  className="text-btn"
                  onClick={() => {
                    onClose();
                    onPay(i);
                  }}
                >
                  Collect
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No bills generated yet.</p>
        )}
        <div className="detail-actions">
          {ops && (
            <button className="secondary" onClick={() => onAction("edit", t)}>
              Edit profile
            </button>
          )}
          {!t.ended_on && (
            <>
              {ops && (
                <>
                  <button
                    className="secondary"
                    onClick={() => onAction("transfer", t)}
                  >
                    Transfer bed
                  </button>
                  <button
                    className="secondary"
                    onClick={() => onAction("notice", t)}
                  >
                    Record notice
                  </button>
                </>
              )}
              {finance &&
                Number(t.deposit_paid) < Number(t.deposit_expected) && (
                  <button
                    className="secondary"
                    onClick={() => onAction("deposit", t)}
                  >
                    Collect deposit
                  </button>
                )}
              {ops && (
                <button
                  className="danger"
                  onClick={() => onAction("checkout", t)}
                >
                  Check out
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
