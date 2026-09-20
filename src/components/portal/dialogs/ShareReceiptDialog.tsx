"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Mail,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import type { Data, Row } from "../types";
import {
  money,
  day,
  printReceipt,
  formatReceiptText,
  getWhatsAppShareUrl,
} from "../utils";

export function ShareReceiptDialog({
  payment,
  data,
  onClose,
  onToast,
}: {
  payment: Row;
  data: Data;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const invoice = data.invoices.find((i) => i.id === payment.invoice_id);
  const property = data.properties.find((x) => x.id === payment.property_id);

  // Find tenant details to get phone & email if not attached directly to payment
  const tenant =
    data.tenants.find(
      (t) =>
        t.name === payment.tenant_name ||
        t.tenant_id === payment.tenant_id ||
        (invoice && t.id === invoice.stay_id),
    ) || {};

  const tenantPhone = payment.tenant_phone || tenant.phone || "";
  const tenantEmail = payment.tenant_email || tenant.email || "";

  const receiptText = formatReceiptText(payment, data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      onToast("Receipt copied to clipboard.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onToast("Could not copy to clipboard. Please copy manually.");
    }
  };

  const handleWhatsApp = () => {
    if (!tenantPhone) {
      onToast("No phone number found for this tenant.");
      return;
    }
    const url = getWhatsAppShareUrl(tenantPhone, receiptText);
    window.open(url, "_blank");
  };

  const handleEmail = () => {
    if (!tenantEmail) {
      onToast("No email address found for this tenant.");
      return;
    }
    const subject = encodeURIComponent(
      `Rent Payment Receipt - ${property?.name || "NestLedger"}`,
    );
    const body = encodeURIComponent(receiptText);
    window.location.href = `mailto:${tenantEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <dialog ref={ref} onCancel={onClose} className="share-dialog">
      <div className="modal-head">
        <div>
          <span className="eyebrow">SHARE RECEIPT</span>
          <h2>Rent Payment Receipt</h2>
          <p>
            {payment.tenant_name} · {money(payment.amount)} · Invoice #
            {String(invoice?.number || payment.invoice_number || "").padStart(
              4,
              "0",
            )}
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

      <div className="share-dialog-body">
        {/* Recipient summary */}
        <div className="share-recipient-card">
          <div>
            <strong>Recipient: {payment.tenant_name}</strong>
            <small>
              {tenantPhone ? `📱 ${tenantPhone}` : "No phone registered"}
              {tenantEmail ? ` · ✉️ ${tenantEmail}` : ""}
            </small>
          </div>
          <div className="share-recipient-badge">
            {property?.name || "Property"}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="share-actions-grid">
          <button
            type="button"
            className="share-action-btn whatsapp"
            onClick={handleWhatsApp}
            title={tenantPhone ? `Send to ${tenantPhone}` : "Add phone number to send"}
          >
            <span className="share-action-icon">
              <MessageCircle size={20} />
            </span>
            <div>
              <b>Share on WhatsApp</b>
              <small>
                {tenantPhone ? `Send to ${tenantPhone}` : "No phone number"}
              </small>
            </div>
            <ExternalLink size={15} className="action-arrow" />
          </button>

          <button
            type="button"
            className="share-action-btn copy"
            onClick={handleCopy}
          >
            <span className="share-action-icon">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </span>
            <div>
              <b>{copied ? "Copied to Clipboard!" : "Copy Receipt Text"}</b>
              <small>Paste in SMS, chats or notes</small>
            </div>
          </button>

          <button
            type="button"
            className="share-action-btn pdf"
            onClick={() => {
              printReceipt(payment, data, onToast);
            }}
          >
            <span className="share-action-icon">
              <Download size={20} />
            </span>
            <div>
              <b>Print / Save PDF</b>
              <small>Official printable receipt</small>
            </div>
          </button>

          {tenantEmail && (
            <button
              type="button"
              className="share-action-btn email"
              onClick={handleEmail}
            >
              <span className="share-action-icon">
                <Mail size={20} />
              </span>
              <div>
                <b>Email to Tenant</b>
                <small>{tenantEmail}</small>
              </div>
            </button>
          )}
        </div>

        {/* Text Preview */}
        <div className="share-preview-wrap">
          <div className="share-preview-head">
            <span>RECEIPT TEXT PREVIEW</span>
            <button type="button" className="text-btn" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="share-preview-text">{receiptText}</pre>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" className="secondary" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="primary"
          onClick={handleWhatsApp}
        >
          <MessageCircle size={17} /> Send via WhatsApp
        </button>
      </div>
    </dialog>
  );
}
