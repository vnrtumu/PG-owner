"use client";
import React from "react";
import { Search, BedDouble } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Badge } from "../common/Badge";
import { Empty } from "../common/Empty";
import { money } from "../utils";

export function RoomsBedsView() {
  const {
    data,
    occupied,
    available,
    beds,
    search,
    setSearch,
    scoped,
    matches,
    finance,
    ops,
    busy,
    setDetail,
    quick,
  } = usePortal();

  return (
    <>
      <div className="room-summary">
        <span>
          <i className="legend-dot occupied" />
          {occupied} occupied
        </span>
        <span>
          <i className="legend-dot vacant" />
          {available} available
        </span>
        <span>
          <i className="legend-dot maintenance" />
          {beds.filter((b) => b.maintenance).length} maintenance
        </span>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            aria-label="Search rooms"
            placeholder="Search room number, floor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="rooms-grid">
        {scoped(data.rooms)
          .filter(matches)
          .map((r) => (
            <section className="panel room-card" key={r.id}>
              <div className="panel-head">
                <div>
                  <h2>Room {r.name}</h2>
                  <p>
                    {r.property_name} · Floor {r.floor}
                  </p>
                </div>
                {finance ? (
                  <Badge>{money(r.rent)} / bed</Badge>
                ) : (
                  <Badge>
                    {beds.filter((b) => b.room_id === r.id).length} beds
                  </Badge>
                )}
              </div>
              <div className="bed-grid">
                {beds
                  .filter((b) => b.room_id === r.id)
                  .map((b) => (
                    <button
                      key={b.id}
                      className={`bed ${b.stay_id ? "occupied" : b.maintenance ? "maintenance" : "vacant"}`}
                      title={
                        b.stay_id
                          ? b.tenant_name
                          : b.maintenance
                            ? "Mark available"
                            : "Mark under maintenance"
                      }
                      onClick={() => {
                        if (b.stay_id) {
                          const t = data.tenants.find(
                            (t) => t.id === b.stay_id,
                          );
                          if (t) setDetail(t);
                        } else quick("maintenance", { id: b.id });
                      }}
                      disabled={
                        busy ||
                        (!ops &&
                          data.user.role !== "caretaker" &&
                          !b.stay_id)
                      }
                    >
                      <BedDouble size={25} />
                      <b>{b.label}</b>
                      <small>
                        {b.stay_id
                          ? b.tenant_name.split(" ")[0]
                          : b.maintenance
                            ? "Maintenance"
                            : "Available"}
                      </small>
                    </button>
                  ))}
              </div>
              <small className="room-tip">
                Select an empty bed to toggle maintenance.
              </small>
            </section>
          ))}
      </div>
      {!scoped(data.rooms).length && (
        <Empty
          title="No rooms yet"
          text="Create a room and we’ll add its beds automatically."
        />
      )}
    </>
  );
}
