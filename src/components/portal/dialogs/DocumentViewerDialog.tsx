"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  Printer,
  ExternalLink,
  Trash2,
  FileText,
  Building2,
  User,
  Calendar,
  HardDrive,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import type { Row } from "../types";
import { day } from "../utils";

export function DocumentViewerDialog({
  doc,
  onClose,
  onDelete,
  onToast,
  canDelete = true,
}: {
  doc: Row;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
  canDelete?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const isPdf = doc.mime === "application/pdf";
  const isImage = doc.mime?.startsWith("image/");
  const inlineUrl = `/api/documents?id=${doc.id}&view=1`;
  const downloadUrl = `/api/documents?id=${doc.id}`;

  const handleDelete = async () => {
    if (!onDelete) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${doc.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(doc.id);
      onToast(`"${doc.name}" was deleted.`);
      onClose();
    } catch (e: any) {
      onToast(e.message || "Could not delete document.");
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    if (isImage) {
      const win = window.open(inlineUrl, "_blank");
      if (win) {
        win.focus();
        win.onload = () => win.print();
      }
    } else {
      window.open(inlineUrl, "_blank");
    }
  };

  return (
    <dialog ref={ref} onCancel={onClose} className="doc-viewer-dialog">
      <div className="doc-viewer-head">
        <div className="doc-viewer-info">
          <div className="doc-viewer-icon-badge">
            <FileText size={20} />
          </div>
          <div>
            <div className="doc-title-row">
              <h3>{doc.name}</h3>
              <span className="doc-category-badge">{doc.category}</span>
            </div>
            <p>
              {doc.property_name}
              {doc.tenant_name ? ` · Tenant: ${doc.tenant_name}` : " · PG Document"}
              {` · ${Math.ceil(doc.size / 1024)} KB · ${day(doc.created_at)}`}
            </p>
          </div>
        </div>

        <div className="doc-viewer-actions">
          {isImage && (
            <div className="doc-zoom-controls">
              <button
                type="button"
                className="icon-btn-sm"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="doc-zoom-level">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className="icon-btn-sm"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="icon-btn-sm"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate"
              >
                <RotateCw size={16} />
              </button>
            </div>
          )}

          <a
            href={inlineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-btn-sm"
            title="Open original file in new tab"
          >
            <ExternalLink size={15} /> New Tab
          </a>

          <button
            type="button"
            className="secondary-btn-sm"
            onClick={handlePrint}
            title="Print document"
          >
            <Printer size={15} /> Print
          </button>

          <a
            href={downloadUrl}
            download={doc.name}
            className="primary-btn-sm"
            title="Download document file"
          >
            <Download size={15} /> Download
          </a>

          {canDelete && onDelete && (
            <button
              type="button"
              className="danger-btn-sm"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete this document permanently"
            >
              <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          )}

          <button
            type="button"
            className="icon-btn close-btn"
            onClick={onClose}
            aria-label="Close document viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="doc-viewer-body">
        {/* Main Content Area */}
        <div className="doc-content-area">
          {isPdf ? (
            <div className="doc-iframe-container">
              <iframe
                src={inlineUrl}
                className="doc-iframe"
                title={doc.name}
              />
              <div className="doc-iframe-fallback">
                <span>PDF not rendering directly?</span>
                <a
                  href={inlineUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-btn"
                >
                  <ExternalLink size={14} /> Open in browser viewer
                </a>
              </div>
            </div>
          ) : isImage ? (
            <div className="doc-image-container">
              <img
                src={inlineUrl}
                alt={doc.name}
                className="doc-preview-img"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
              />
            </div>
          ) : (
            <div className="doc-unsupported-container">
              <FileText size={48} />
              <h4>{doc.name}</h4>
              <p>This file format cannot be previewed directly in the browser.</p>
              <a href={downloadUrl} className="primary" download={doc.name}>
                <Download size={16} /> Download File ({Math.ceil(doc.size / 1024)} KB)
              </a>
            </div>
          )}
        </div>

        {/* Sidebar Metadata */}
        <aside className="doc-meta-sidebar">
          <h4>DOCUMENT DETAILS</h4>
          <div className="doc-meta-list">
            <div className="doc-meta-item">
              <span className="doc-meta-label">
                <HardDrive size={14} /> Category
              </span>
              <span className="doc-meta-value font-medium">{doc.category}</span>
            </div>
            <div className="doc-meta-item">
              <span className="doc-meta-label">
                <Building2 size={14} /> PG Property
              </span>
              <span className="doc-meta-value">{doc.property_name}</span>
            </div>
            <div className="doc-meta-item">
              <span className="doc-meta-label">
                <User size={14} /> Linked Tenant
              </span>
              <span className="doc-meta-value">
                {doc.tenant_name || "PG Property Document"}
              </span>
            </div>
            <div className="doc-meta-item">
              <span className="doc-meta-label">
                <Calendar size={14} /> Uploaded On
              </span>
              <span className="doc-meta-value">{day(doc.created_at)}</span>
            </div>
            <div className="doc-meta-item">
              <span className="doc-meta-label">File Size</span>
              <span className="doc-meta-value">
                {doc.size >= 1024 * 1024
                  ? `${(doc.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${Math.ceil(doc.size / 1024)} KB`}
              </span>
            </div>
            <div className="doc-meta-item">
              <span className="doc-meta-label">File Type</span>
              <span className="doc-meta-value">{doc.mime}</span>
            </div>
          </div>

          <div className="doc-meta-tip">
            <p>
              💡 <b>Tip:</b> All documents are encrypted and stored securely with strict role-based access control.
            </p>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
