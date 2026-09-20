"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Building2,
  PieChart,
  Check,
  AlertCircle,
  TrendingUp,
  Save,
} from "lucide-react";
import type { Row } from "../types";
import { PG_INVESTMENT_COMPONENTS, money } from "../utils";

export function PropertyInvestmentDialog({
  property,
  onClose,
  onSave,
  onToast,
}: {
  property: Row;
  onClose: () => void;
  onSave: (propertyId: string, breakdown: Record<string, number>) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Existing breakdown values in paise -> convert to Rupees for input
  const initialBreakdown: Record<string, number> = {};
  const rawBreakdown = property.buying_cost_breakdown || {};
  for (const comp of PG_INVESTMENT_COMPONENTS) {
    const paiseVal = rawBreakdown[comp.key] || 0;
    initialBreakdown[comp.key] = paiseVal ? paiseVal / 100 : 0;
  }

  const [breakdown, setBreakdown] =
    useState<Record<string, number>>(initialBreakdown);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const totalRupees = Object.values(breakdown).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0,
  );

  const handleValueChange = (key: string, valStr: string) => {
    const num = Math.max(0, parseFloat(valStr) || 0);
    setBreakdown((prev) => ({ ...prev, [key]: num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave(property.id, breakdown);
      onToast(`Capital investment for "${property.name}" updated successfully.`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update capital investment.");
      setSaving(false);
    }
  };

  return (
    <dialog ref={ref} onCancel={onClose} className="property-investment-dialog">
      <div className="modal-head">
        <div>
          <span className="eyebrow">CAPITAL EXPENDITURE</span>
          <h2>PG Buying & Setup Cost Breakdown</h2>
          <p>
            {property.name} · {property.address}, {property.city}
          </p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="investment-dialog-form">
        {error && (
          <div className="form-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Investment Summary Banner */}
        <div className="investment-summary-card">
          <div className="investment-summary-main">
            <div className="investment-summary-icon">
              <PieChart size={28} />
            </div>
            <div>
              <span className="summary-label">TOTAL PG BUYING & SETUP INVESTMENT</span>
              <h3 className="summary-total-amt">
                {money(totalRupees * 100)}
              </h3>
              <p className="summary-note">
                Auto-calculated sum of all segregated capital components below
              </p>
            </div>
          </div>

          {/* Visual Distribution Bar */}
          {totalRupees > 0 && (
            <div className="investment-distribution-bar" title="Investment distribution">
              {PG_INVESTMENT_COMPONENTS.map((comp) => {
                const val = breakdown[comp.key] || 0;
                if (!val) return null;
                const pct = (val / totalRupees) * 100;
                return (
                  <div
                    key={comp.key}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: comp.color,
                    }}
                    className="distribution-segment"
                    title={`${comp.label}: ${money(val * 100)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Segregated Components Form Grid */}
        <div className="investment-components-list">
          <div className="components-list-header">
            <span>COST COMPONENT</span>
            <span>AMOUNT (₹)</span>
          </div>

          {PG_INVESTMENT_COMPONENTS.map((comp) => {
            const val = breakdown[comp.key] || 0;
            const pct = totalRupees > 0 ? (val / totalRupees) * 100 : 0;

            return (
              <div key={comp.key} className="investment-row">
                <div className="investment-row-info">
                  <div
                    className="investment-color-dot"
                    style={{ backgroundColor: comp.color }}
                  />
                  <div>
                    <label
                      htmlFor={`comp-${comp.key}`}
                      className="investment-comp-label"
                    >
                      {comp.label}
                    </label>
                    <small className="investment-comp-desc">
                      {comp.description}
                    </small>
                  </div>
                  {val > 0 && totalRupees > 0 && (
                    <span className="investment-pct-pill">
                      {pct.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="investment-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    id={`comp-${comp.key}`}
                    type="number"
                    min="0"
                    step="1000"
                    className="investment-number-input"
                    value={val || ""}
                    placeholder="0"
                    onChange={(e) =>
                      handleValueChange(comp.key, e.target.value)
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="investment-tip-banner">
          <TrendingUp size={18} className="tip-icon" />
          <p>
            <b>Breakeven Tracking:</b> This total capital investment is dynamically compared against your monthly operating profits (collections minus expenses) to calculate your live breakeven point and recovery timeline.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Capital Investment"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
