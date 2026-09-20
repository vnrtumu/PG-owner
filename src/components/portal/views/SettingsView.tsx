"use client";
import React from "react";
import { History } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Badge } from "../common/Badge";
import { Table } from "../common/Table";
import { f } from "../utils";

export function SettingsView() {
  const { data, owner, go, setModal } = usePortal();

  return (
    <>
      <section className="panel settings-card">
        <div>
          <h2>Your account</h2>
          <p>
            {data.user.name} · {data.user.email}
          </p>
          <Badge tone="green">{data.user.role}</Badge>
        </div>
        <button
          className="secondary"
          onClick={() =>
            setModal({
              title: "Change your password",
              action: "password",
              fields: [
                f("current_password", "Current password", "password"),
                f(
                  "password",
                  "New password (12+ characters)",
                  "password",
                ),
              ],
            })
          }
        >
          Change password
        </button>
      </section>
      <section className="panel settings-card">
        <div>
          <h2>Billing policy</h2>
          <p>
            Monthly rent, prorated on joining. Checkout month is billed
            in full.
            <br />
            Security deposits are tracked separately. Set each PG’s due
            day under Properties.
          </p>
        </div>
        <button className="secondary" onClick={() => go("Properties")}>
          Property settings
        </button>
      </section>
      {owner && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Activity history</h2>
              <p>The latest 100 changes to your workspace</p>
            </div>
            <History size={20} />
          </div>
          <Table
            headers={["ACTION", "BY", "PROPERTY", "DATE"]}
            rows={data.audit.map((a) => [
              a.action.replace(/([A-Z])/g, " $1"),
              a.actor || "System",
              a.property_name || "Workspace",
              new Date(a.created_at).toLocaleString("en-IN"),
            ])}
          />
        </section>
      )}
    </>
  );
}
