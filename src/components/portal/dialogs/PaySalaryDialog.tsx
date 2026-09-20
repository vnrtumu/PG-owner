"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Wallet, CheckCircle2, Building2, User, CreditCard } from "lucide-react";
import type { StaffMember, SalaryPayout } from "../types";
import { money, today } from "../utils";

export function PaySalaryDialog({
  staff,
  period,
  onClose,
  onPaid,
}: {
  staff: StaffMember;
  period: string; // "YYYY-MM"
  onClose: () => void;
  onPaid: (payout: SalaryPayout, logToExpenses: boolean) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  const [year, monthNum] = period.split("-");
  const monthName = new Date(Number(year), Number(monthNum) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const [amountRupees, setAmountRupees] = useState(String(staff.salary / 100));
  const [method, setMethod] = useState<"UPI" | "Cash" | "Bank transfer">(
    staff.upi_id ? "UPI" : "Bank transfer",
  );
  const [paidOn, setPaidOn] = useState(today());
  const [reference, setReference] = useState(
    staff.upi_id ? `UPI-${Math.floor(100000 + Math.random() * 900000)}` : "",
  );
  const [notes, setNotes] = useState(`Salary for ${monthName}`);
  const [logToExpenses, setLogToExpenses] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(Number(amountRupees) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid salary amount.");
      return;
    }

    setBusy(true);
    try {
      const payout: SalaryPayout = {
        id: `pay-${Date.now()}`,
        staff_id: staff.id,
        staff_name: staff.name,
        role: staff.role,
        property_id: staff.property_id,
        property_name: staff.property_name,
        period,
        amount: parsedAmount,
        paid_on: paidOn,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onPaid(payout, logToExpenses);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record salary payout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog className="form-dialog" ref={ref} onCancel={onClose}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">STAFF PAYROLL DISBURSEMENT</span>
          <h2>Pay Salary: {staff.name}</h2>
          <p>
            {staff.role} · {staff.property_name} · <b>{monthName}</b>
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close salary payment dialog"
        >
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dialog-form-body">
        {error && <div className="form-error-banner">{error}</div>}

        <div className="form-field-group">
          <label className="form-label">Month & Payroll Cycle</label>
          <div className="form-static-val">
            <span className="period-pill">{monthName}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Contracted: <b>{money(staff.salary)}</b> / month
            </span>
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label">Disbursement Amount (₹)</label>
          <input
            type="number"
            step="1"
            min="1"
            required
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            className="form-input"
            placeholder="e.g. 20000"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label">Payment Mode</label>
          <div className="payment-mode-radios">
            {(["UPI", "Bank transfer", "Cash"] as const).map((m) => (
              <label
                key={m}
                className={`payment-mode-label ${method === m ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        {staff.upi_id && method === "UPI" && (
          <div className="staff-payee-info">
            <span>Payee UPI ID:</span>
            <code>{staff.upi_id}</code>
          </div>
        )}

        <div className="form-field-group">
          <label className="form-label">Payment Date</label>
          <input
            type="date"
            required
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label">Transaction Reference (Optional)</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="form-input"
            placeholder="UPI Ref ID, Cheque No, or Bank UTR"
          />
        </div>

        <div className="form-field-group">
          <label className="form-label">Remarks / Voucher Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            placeholder="e.g. Full September salary cleared"
          />
        </div>

        <div className="form-checkbox-row">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={logToExpenses}
              onChange={(e) => setLogToExpenses(e.target.checked)}
            />
            <span>Also log this payout in the <b>Expenses ledger</b> under <i>"Staff salary"</i></span>
          </label>
        </div>

        <div className="modal-foot">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Processing…" : `Confirm Payout (${money(Math.round(Number(amountRupees || 0) * 100))})`}
          </button>
        </div>
      </form>
    </dialog>
  );
}
