"use client";
import React from "react";
import {
  Menu,
  Home,
  ChevronRight,
  Building2,
  Bell,
  Download,
  Plus,
  Upload,
} from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { today, f, sel } from "../utils";

export function Header() {
  const {
    data,
    page,
    go,
    property,
    setProperty,
    mobile,
    setMobile,
    overdue,
    complaints,
  } = usePortal();

  return (
    <header className="topbar">
      <div className="crumb">
        <button
          className="icon-btn mobile-menu"
          onClick={() => setMobile(!mobile)}
          aria-label="Open navigation"
        >
          <Menu />
        </button>
        <Home size={16} />
        <ChevronRight size={14} />
        <span>{page}</span>
      </div>
      <div className="top-actions">
        <div className="property-select">
          <Building2 size={16} />
          <select
            aria-label="Filter by property"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
          >
            <option value="all">All properties</option>
            {data.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="icon-btn notification"
          aria-label="View reminders"
          onClick={() => go("Reminders")}
        >
          <Bell size={19} />
          {(overdue.length > 0 ||
            complaints.some((c) => c.status !== "Resolved")) && <i />}
        </button>
        <span className="small-avatar">{data.user.name.charAt(0)}</span>
      </div>
    </header>
  );
}

export function PageHeading() {
  const {
    data,
    page,
    props,
    finance,
    ops,
    owner,
    exportReport,
    addTenant,
    addProperty,
    setModal,
    propertyField,
    defaultProp,
  } = usePortal();

  const actionButton = () => {
    if (page === "Overview" || page === "Tenants")
      return ops ? (
        <button className="primary" onClick={addTenant}>
          <Plus size={17} /> Add tenant
        </button>
      ) : null;
    if (page === "Properties")
      return owner ? (
        <button className="primary" onClick={() => addProperty()}>
          <Plus size={17} /> Add property
        </button>
      ) : null;
    if (page === "Rooms & beds")
      return ops ? (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Add a room",
              action: "room",
              fields: [
                propertyField,
                f("name", "Room number"),
                f("floor", "Floor"),
                {
                  ...f("beds", "Number of beds", "number"),
                  min: "1",
                  max: "12",
                },
                f("rent", "Default rent per bed (₹)", "number"),
              ],
              values: {
                property_id: defaultProp,
                floor: "Ground",
                beds: 2,
                rent: 8000,
              },
            })
          }
        >
          <Plus size={17} /> Add room
        </button>
      ) : null;
    if (page === "Expenses")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Record an expense",
              action: "expense",
              fields: [
                propertyField,
                sel("category", "Category", [
                  "Lease rent",
                  "Salaries",
                  "Groceries",
                  "Electricity",
                  "Water",
                  "Internet",
                  "Repairs",
                  "Other",
                ]),
                f("description", "Description"),
                f("amount", "Amount (₹)", "number"),
                f("spent_on", "Expense date", "date"),
                sel("status", "Payment status", ["Paid", "Pending"]),
              ],
              values: {
                property_id: defaultProp,
                spent_on: today(),
                status: "Paid",
                category: "Groceries",
              },
            })
          }
        >
          <Plus size={17} /> Add expense
        </button>
      );
    if (page === "Maintenance")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Log a maintenance request",
              action: "complaint",
              fields: [
                propertyField,
                f("title", "Issue"),
                f("location", "Room / location"),
                sel("priority", "Priority", ["Low", "Medium", "High"]),
                f("assigned_to", "Assigned to", "text", false),
                f("notes", "Details", "textarea", false),
              ],
              values: { property_id: defaultProp, priority: "Medium" },
            })
          }
        >
          <Plus size={17} /> New request
        </button>
      );
    if (page === "Enquiries")
      return ops ? (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "New enquiry",
              subtitle:
                "Track a potential tenant. Enquiries do not reserve a bed.",
              action: "booking",
              fields: [
                propertyField,
                f("name", "Name"),
                f("phone", "Phone", "tel"),
                f("move_in", "Expected move-in", "date"),
                f("follow_up", "Follow-up date", "date", false),
                f("notes", "Notes", "textarea", false),
              ],
              values: { property_id: defaultProp, move_in: today() },
            })
          }
        >
          <Plus size={17} /> Add enquiry
        </button>
      ) : null;
    if (page === "Documents")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Upload a document",
              subtitle: "Private files · PDF, JPG or PNG · Maximum 5 MB",
              action: "document",
              fields: [
                propertyField,
                {
                  name: "tenant_id",
                  label: "Tenant (optional)",
                  type: "select",
                },
                sel("category", "Category", [
                  "Identity",
                  "Agreement",
                  "Property",
                  "Expense receipt",
                  "Other",
                ]),
                f("file", "Document", "file"),
              ],
              values: { property_id: defaultProp, category: "Identity" },
            })
          }
        >
          <Upload size={17} /> Upload document
        </button>
      );
    if (page === "Team")
      return (
        <button
          className="primary"
          onClick={() =>
            setModal({
              title: "Invite a team member",
              subtitle:
                "Create their login and select the PGs they can access.",
              action: "staff",
              fields: [
                f("name", "Name"),
                f("email", "Email", "email"),
                f("password", "Initial password (12+ characters)", "password"),
                sel("role", "Role", ["manager", "accountant", "caretaker"]),
                {
                  name: "property_ids",
                  label: "Assigned properties",
                  type: "checkboxes",
                },
              ],
              values: { role: "manager" },
            })
          }
        >
          <Plus size={17} /> Add team member
        </button>
      );
    return null;
  };

  const pageDescriptions: Record<string, string> = {
    Overview: `Here’s what’s happening across ${props.length === 1 ? props[0].name : `your ${props.length} properties`} today.`,
    Properties: "A clear view of every place you manage.",
    "Rooms & beds": "Make room for what’s next. Track every bed in one place.",
    Tenants: "The people who make your properties a home.",
    Enquiries: "Keep the conversation going, from first enquiry to move-in.",
    "Rent & payments": "Stay on top of every bill and every payment.",
    Expenses: "Know where your money goes.",
    Maintenance: "Small fixes. Better stays.",
    Documents: "Important paperwork, safely in one place.",
    Reports: "A closer look at your business numbers.",
    Team: "The right access for the right people.",
    Settings: "Make this workspace work for you.",
    Reminders: "Your follow-ups, dues and upcoming dates.",
  };

  return (
    <>
      {data.demo && (
        <div className="demo-banner">
          <span>
            <span className="demo-tag">DEMO</span> You’re exploring sample
            PG data. Your production database starts empty.
          </span>
          <span>Local workspace</span>
        </div>
      )}

      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {page === "Overview"
              ? new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "YOUR OWNER WORKSPACE"}
          </div>
          <h1>{page === "Overview" ? `Your business, at a glance.` : page}</h1>
          <p>{pageDescriptions[page]}</p>
        </div>
        <div className="heading-actions">
          {[
            "Overview",
            "Tenants",
            "Rent & payments",
            "Expenses",
            "Reports",
          ].includes(page) &&
            finance && (
              <button
                className="secondary"
                onClick={() =>
                  exportReport(
                    page === "Tenants"
                      ? "tenants"
                      : page === "Expenses"
                        ? "expenses"
                        : "invoices",
                  )
                }
              >
                <Download size={16} /> Export
              </button>
            )}
          {actionButton()}
        </div>
      </div>
    </>
  );
}
