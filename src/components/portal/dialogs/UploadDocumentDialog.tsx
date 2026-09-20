"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  FileText,
  Building2,
  User,
  Check,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import type { Row } from "../types";

export const PG_DOCUMENT_CATEGORIES = [
  "Property Deed & Lease",
  "Police Verification",
  "Fire Safety NOC",
  "Trade License",
  "FSSAI Food License",
  "Electricity & Utility",
  "Rental Agreement",
  "PG Rules & Notice",
  "Tenant KYC / Identity",
  "Expense Receipt",
  "Other",
];

export function UploadDocumentDialog({
  properties,
  tenants,
  defaultProp,
  initialTenantId,
  onClose,
  onUploaded,
  onToast,
}: {
  properties: Row[];
  tenants: Row[];
  defaultProp: string;
  initialTenantId?: string;
  onClose: () => void;
  onUploaded: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const matchedTenant = initialTenantId
    ? tenants.find((t) => (t.tenant_id || t.id) === initialTenantId || t.id === initialTenantId)
    : null;

  const [propertyId, setPropertyId] = useState(
    matchedTenant?.property_id ||
      (defaultProp !== "all" && defaultProp ? defaultProp : properties[0]?.id || ""),
  );
  const [category, setCategory] = useState(
    initialTenantId ? "Tenant KYC / Identity" : PG_DOCUMENT_CATEGORIES[0],
  );
  const [customTitle, setCustomTitle] = useState("");
  const [tenantId, setTenantId] = useState(
    initialTenantId ? (matchedTenant ? (matchedTenant.tenant_id || matchedTenant.id) : initialTenantId) : "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Filter tenants for selected property
  const propertyTenants = tenants.filter(
    (t) => !propertyId || t.property_id === propertyId,
  );

  const handleFileChange = (file: File) => {
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5 MB. Please select a smaller file.");
      return;
    }
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG documents are allowed.");
      return;
    }
    setSelectedFile(file);
    if (!customTitle) {
      // Auto-populate clean title
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setCustomTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please choose a document to upload.");
      return;
    }
    if (!propertyId) {
      setError("Please choose a property.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("property_id", propertyId);
      formData.append("category", category);
      if (customTitle.trim()) {
        formData.append("name", customTitle.trim());
      }
      if (tenantId) {
        formData.append("tenant_id", tenantId);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      onToast(`Document "${customTitle || selectedFile.name}" uploaded securely.`);
      await onUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
      setUploading(false);
    }
  };

  return (
    <dialog ref={ref} onCancel={onClose} className="upload-doc-dialog">
      <div className="modal-head">
        <div>
          <span className="eyebrow">DOCUMENT REPOSITORY</span>
          <h2>Upload PG Documentation</h2>
          <p>Securely store deeds, licenses, agreements, utility bills & compliance proofs.</p>
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

      <form onSubmit={handleSubmit} className="upload-doc-form">
        {error && (
          <div className="form-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and drop zone */}
        <div
          className={`doc-dropzone ${dragOver ? "drag-over" : ""} ${selectedFile ? "has-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="dropzone-file-preview">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Thumbnail"
                  className="dropzone-thumb"
                />
              ) : (
                <div className="dropzone-doc-icon">
                  <FileText size={36} />
                </div>
              )}
              <div className="dropzone-file-meta">
                <strong>{selectedFile.name}</strong>
                <small>
                  {selectedFile.size >= 1024 * 1024
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : `${Math.ceil(selectedFile.size / 1024)} KB`}{" "}
                  · {selectedFile.type || "Document"}
                </small>
                <span className="dropzone-change-hint">Click to change file</span>
              </div>
              <Check className="success-icon" size={24} />
            </div>
          ) : (
            <div className="dropzone-placeholder">
              <div className="dropzone-upload-icon">
                <Upload size={28} />
              </div>
              <p className="dropzone-title">
                <b>Click to upload</b> or drag and drop file here
              </p>
              <p className="dropzone-hint">
                PDF, JPG, or PNG · Maximum file size: 5 MB
              </p>
            </div>
          )}
        </div>

        {/* Category Quick Selector */}
        <div className="form-group">
          <label className="form-label">Documentation Category</label>
          <div className="category-chips-grid">
            {PG_DOCUMENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-chip ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="doc-name">
            Document Title / Description
          </label>
          <input
            id="doc-name"
            type="text"
            className="input-control"
            placeholder="e.g. Fire Safety Certificate 2026, PG Lease Agreement"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
        </div>

        {/* Property & Tenant assignment row */}
        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label" htmlFor="doc-prop">
              PG Property <span className="required-star">*</span>
            </label>
            <div className="select-wrapper">
              <Building2 size={16} className="field-icon" />
              <select
                id="doc-prop"
                value={propertyId}
                onChange={(e) => {
                  setPropertyId(e.target.value);
                  setTenantId("");
                }}
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doc-tenant">
              Linked Tenant <small>(Optional)</small>
            </label>
            <div className="select-wrapper">
              <User size={16} className="field-icon" />
              <select
                id="doc-tenant"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="">None (Property-level Document)</option>
                {propertyTenants.map((t) => (
                  <option key={t.id} value={t.tenant_id || t.id}>
                    {t.name} ({t.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary"
            disabled={uploading || !selectedFile}
          >
            <FolderPlus size={16} />
            {uploading ? "Uploading..." : "Save & Upload Document"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
