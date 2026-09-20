"use client";
import React from "react";
import { Receipt, CalendarDays, UserRound } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Badge } from "../common/Badge";
import { Empty } from "../common/Empty";
import { money, day } from "../utils";

export function RemindersView() {
  const { data, overdue, active, scoped, payment, setDetail } = usePortal();

  return (
    <div className="reminder-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>Overdue bills</h2>
          <Badge tone="amber">{overdue.length}</Badge>
        </div>
        {overdue.length ? (
          overdue.map((i) => (
            <div className="reminder" key={i.id}>
              <Receipt size={20} />
              <div>
                <b>{i.tenant_name}</b>
                <small>
                  {money(Number(i.amount) - Number(i.paid))} · Due{" "}
                  {day(i.due_on)}
                </small>
              </div>
              <button className="text-btn" onClick={() => payment(i)}>
                Collect
              </button>
            </div>
          ))
        ) : (
          <Empty
            title="No overdue bills"
            text="You’re all caught up."
          />
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Upcoming dates</h2>
        </div>
        {active
          .filter((t) => t.notice_on || t.agreement_expires)
          .map((t) => (
            <div className="reminder" key={t.id}>
              <CalendarDays size={20} />
              <div>
                <b>{t.name}</b>
                <small>
                  {t.notice_on
                    ? `Move-out: ${day(t.notice_on)}`
                    : `Agreement expires: ${day(t.agreement_expires)}`}
                </small>
              </div>
              <button className="text-btn" onClick={() => setDetail(t)}>
                View
              </button>
            </div>
          ))}
        {!active.some((t) => t.notice_on || t.agreement_expires) && (
          <Empty
            title="No upcoming dates"
            text="Agreement expiries and notices will appear here."
          />
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Enquiry follow-ups</h2>
        </div>
        {scoped(data.bookings)
          .filter(
            (b) =>
              b.follow_up &&
              !["Cancelled", "Converted"].includes(b.status),
          )
          .map((b) => (
            <div className="reminder" key={b.id}>
              <UserRound size={20} />
              <div>
                <b>{b.name}</b>
                <small>
                  {b.phone} · {day(b.follow_up)}
                </small>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
