"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Modal, Row } from "../types";

export function FormDialog({
  modal,
  onClose,
  onSubmit,
  properties,
  beds,
  tenants,
}: {
  modal: Modal;
  onClose: () => void;
  onSubmit: (d: Row) => Promise<void>;
  properties: Row[];
  beds: Row[];
  tenants: Row[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Row>(modal.values || {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog ref={ref} onCancel={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const fd = new FormData(e.currentTarget);
            const data = { ...values, ...Object.fromEntries(fd) };
            if (modal.action === "staff")
              data.property_ids = fd.getAll("property_ids");
            if (modal.action === "document") data.formData = fd;
            await onSubmit(data);
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-head">
          <div>
            <h2>{modal.title}</h2>
            {modal.subtitle && <p>{modal.subtitle}</p>}
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
        <div className="form-grid">
          {modal.fields.map((field) => {
            let options = field.options;
            if (field.name === "property_id")
              options = properties.map((p) => ({ value: p.id, label: p.name }));
            if (field.name === "bed_id")
              options = beds
                .filter(
                  (b) =>
                    b.property_id === values.property_id &&
                    !b.stay_id &&
                    !b.maintenance,
                )
                .map((b) => ({
                  value: b.id,
                  label: `Room ${b.room_name} · ${b.label}`,
                }));
            if (field.name === "tenant_id")
              options = tenants
                .filter((t) => t.property_id === values.property_id)
                .map((t) => ({ value: t.tenant_id, label: t.name }));
            return (
              <label
                key={field.name}
                className={
                  field.type === "textarea" || field.type === "checkboxes"
                    ? "full"
                    : ""
                }
              >
                {field.label}
                {field.required && <span className="required"> *</span>}
                {field.type === "checkboxes" ? (
                  <div className="check-list">
                    {properties.map((p) => (
                      <label key={p.id}>
                        <input
                          type="checkbox"
                          name="property_ids"
                          value={p.id}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.name]: e.target.value,
                        ...(field.name === "property_id"
                          ? { bed_id: "", tenant_id: "" }
                          : {}),
                      })
                    }
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    required={field.required}
                    defaultValue={values[field.name]}
                    rows={3}
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    required={field.required}
                    defaultValue={
                      field.type === "file" ? undefined : values[field.name]
                    }
                    min={
                      field.min ?? (field.type === "number" ? "0" : undefined)
                    }
                    max={field.max}
                    step={field.type === "number" ? "0.01" : undefined}
                    accept={
                      field.type === "file" ? ".pdf,.jpg,.jpeg,.png" : undefined
                    }
                    autoComplete={
                      field.type === "password" ? "new-password" : undefined
                    }
                  />
                )}{" "}
                {field.hint && <small>{field.hint}</small>}
              </label>
            );
          })}
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={modal.action === "propertyDelete" ? "danger" : "primary"}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="spin" /> Saving…
              </>
            ) : (
              modal.submit || "Save changes"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
