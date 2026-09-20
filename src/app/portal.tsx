"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Building2, Loader2, CheckCircle2, X } from "lucide-react";
import type { Data } from "@/components/portal/types";
import { money, dateValue, today, f } from "@/components/portal/utils";
import {
  PortalProvider,
  usePortal,
} from "@/components/portal/context/PortalContext";
import { Sidebar } from "@/components/portal/layout/Sidebar";
import { Header, PageHeading } from "@/components/portal/layout/Header";
import { Footer } from "@/components/portal/layout/Footer";
import { FormDialog } from "@/components/portal/dialogs/FormDialog";
import { TenantDetailDialog } from "@/components/portal/dialogs/TenantDetailDialog";

import { OverviewView } from "@/components/portal/views/OverviewView";
import { PropertiesView } from "@/components/portal/views/PropertiesView";
import { RoomsBedsView } from "@/components/portal/views/RoomsBedsView";
import { TenantsView } from "@/components/portal/views/TenantsView";
import { EnquiriesView } from "@/components/portal/views/EnquiriesView";
import { RentPaymentsView } from "@/components/portal/views/RentPaymentsView";
import { ExpensesView } from "@/components/portal/views/ExpensesView";
import { MaintenanceView } from "@/components/portal/views/MaintenanceView";
import { DocumentsView } from "@/components/portal/views/DocumentsView";
import { TeamView } from "@/components/portal/views/TeamView";
import { ReportsView } from "@/components/portal/views/ReportsView";
import { RemindersView } from "@/components/portal/views/RemindersView";
import { SettingsView } from "@/components/portal/views/SettingsView";

function PortalContent() {
  const {
    page,
    toast,
    setToast,
    modal,
    setModal,
    detail,
    setDetail,
    data,
    refresh,
    act,
    property,
    setProperty,
    payment,
    ops,
    finance,
    tenantFields,
    bedField,
  } = usePortal();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Header />
        <main className="content">
          <PageHeading />
          {page === "Overview" && <OverviewView />}
          {page === "Properties" && <PropertiesView />}
          {page === "Rooms & beds" && <RoomsBedsView />}
          {page === "Tenants" && <TenantsView />}
          {page === "Enquiries" && <EnquiriesView />}
          {page === "Rent & payments" && <RentPaymentsView />}
          {page === "Expenses" && <ExpensesView />}
          {page === "Maintenance" && <MaintenanceView />}
          {page === "Documents" && <DocumentsView />}
          {page === "Team" && <TeamView />}
          {page === "Reports" && <ReportsView />}
          {page === "Reminders" && <RemindersView />}
          {page === "Settings" && <SettingsView />}
          <Footer />
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <FormDialog
          key={modal.action + String(modal.values?.id || "")}
          modal={modal}
          onClose={() => setModal(null)}
          properties={data.properties}
          beds={data.beds}
          tenants={data.tenants}
          onSubmit={async (values) => {
            if (modal.action === "document") {
              const r = await fetch("/api/documents", {
                method: "POST",
                body: values.formData,
              });
              const result = await r.json();
              if (!r.ok) throw Error(result.error);
              await refresh();
              setToast("Document uploaded securely.");
            } else {
              await act(modal.action, values);
              if (modal.action === "propertyDelete" && property === values.id)
                setProperty("all");
            }
          }}
        />
      )}
      {detail && (
        <TenantDetailDialog
          tenant={data.tenants.find((t) => t.id === detail.id) || detail}
          invoices={data.invoices.filter((i) => i.stay_id === detail.id)}
          onClose={() => setDetail(null)}
          onPay={payment}
          ops={ops}
          finance={finance}
          onAction={(kind, t) => {
            setDetail(null);
            if (kind === "edit")
              setModal({
                title: "Edit tenant profile",
                action: "tenantUpdate",
                fields: tenantFields,
                values: {
                  ...t,
                  agreement_expires: dateValue(t.agreement_expires),
                },
              });
            if (kind === "transfer")
              setModal({
                title: "Transfer bed",
                subtitle:
                  "Transfers within this PG preserve the agreed rent and deposit.",
                action: "transfer",
                fields: [bedField],
                values: { id: t.id, property_id: t.property_id },
              });
            if (kind === "deposit")
              setModal({
                title: "Record security deposit",
                subtitle: `Pending deposit: ${money(Number(t.deposit_expected) - Number(t.deposit_paid))}`,
                action: "deposit",
                fields: [
                  f("amount", "Amount received (₹)", "number"),
                  f("reference", "Payment reference", "text", false),
                ],
                values: {
                  id: t.id,
                  amount:
                    (Number(t.deposit_expected) - Number(t.deposit_paid)) / 100,
                },
              });
            if (kind === "notice")
              setModal({
                title: "Record move-out notice",
                action: "notice",
                fields: [f("notice_on", "Expected move-out date", "date")],
                values: { id: t.id, notice_on: today() },
              });
            if (kind === "checkout")
              setModal({
                title: "Settle & check out",
                subtitle: `Collected deposit: ${money(t.deposit_paid)}. Settle all rent bills first. Saving confirms the remaining deposit has been refunded and releases the bed.`,
                action: "checkout",
                fields: [
                  f("ended_on", "Checkout date", "date"),
                  f("deduction", "Deposit deduction (₹)", "number"),
                  f(
                    "reason",
                    "Settlement reason / refund reference",
                    "textarea",
                  ),
                ],
                values: { id: t.id, ended_on: today(), deduction: 0 },
                submit: "Confirm refund & checkout",
              });
          }}
        />
      )}
    </div>
  );
}

export default function Portal() {
  const [data, setData] = useState<Data | null>(null);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    const r = await fetch("/api/data", { cache: "no-store" });
    if (r.status === 401) {
      location.reload();
      return;
    }
    if (!r.ok) throw Error("Could not load your workspace. Please retry.");
    setData(await r.json());
    setLoadError("");
  }, []);

  useEffect(() => {
    refresh().catch((e) => setLoadError(e.message));
  }, [refresh]);

  if (!data)
    return (
      <div className="loading">
        <Building2 size={36} />
        <h2>{loadError || "Opening your workspace…"}</h2>
        {loadError ? (
          <button
            className="primary"
            onClick={() => refresh().catch((e) => setLoadError(e.message))}
          >
            Retry
          </button>
        ) : (
          <Loader2 className="spin" />
        )}
      </div>
    );

  return (
    <PortalProvider initialData={data} refresh={refresh} loadError={loadError}>
      <PortalContent />
    </PortalProvider>
  );
}
