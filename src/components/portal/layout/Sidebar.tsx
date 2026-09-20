"use client";
import React from "react";
import { Building2, LogOut } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { NAV_ITEMS } from "../utils";

export function Sidebar() {
  const { data, page, go, mobile, setMobile, owner, ops, complaints } =
    usePortal();

  const visibleNav = NAV_ITEMS.filter((n) =>
    data.user.role === "caretaker"
      ? ["Overview", "Rooms & beds", "Maintenance", "Settings"].includes(n.name)
      : n.name === "Team"
        ? owner
        : n.name === "Documents"
          ? ops
          : true,
  );

  return (
    <>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <button className="brand" onClick={() => go("Overview")}>
          <span className="brand-icon">
            <Building2 size={23} />
          </span>
          NestLedger<span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">OWNER WORKSPACE</div>
        <nav>
          {visibleNav.map((n, index) => {
            const Icon = n.icon;
            const unresolvedCount = complaints.filter(
              (c) => c.status !== "Resolved",
            ).length;

            return (
              <button
                key={n.name}
                aria-label={n.name}
                className={`${page === n.name ? "active" : ""} ${index === 5 || n.name === "Team" ? "nav-gap" : ""}`}
                onClick={() => go(n.name)}
              >
                <Icon size={19} />
                <span>{n.name}</span>
                {n.name === "Maintenance" && unresolvedCount > 0 && (
                  <b>{unresolvedCount}</b>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="owner-avatar">{data.user.name.charAt(0)}</div>
          <div>
            <strong>{data.user.name}</strong>
            <small>{data.user.role}</small>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
        />
      )}
    </>
  );
}
