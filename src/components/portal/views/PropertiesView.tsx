"use client";
import React from "react";
import { Building2, ArrowRight } from "lucide-react";
import { usePortal } from "../context/PortalContext";
import { Badge } from "../common/Badge";
import { Empty } from "../common/Empty";
import { f } from "../utils";

export function PropertiesView() {
  const {
    data,
    props,
    matches,
    owner,
    setProperty,
    go,
    addProperty,
    setModal,
  } = usePortal();

  return (
    <div className="property-grid">
      {props.filter(matches).map((p) => {
        const pb = data.beds.filter((b) => b.property_id === p.id);
        const used = pb.filter((b) => b.stay_id).length;

        return (
          <article className="panel property-card" key={p.id}>
            <div className="property-art">
              <Building2 size={44} />
              <Badge>{p.type}</Badge>
            </div>
            <div className="property-body">
              <h2>{p.name}</h2>
              <p>
                {p.address}, {p.city}
              </p>
              <div className="property-numbers">
                <div>
                  <b>
                    {
                      data.rooms.filter((r) => r.property_id === p.id)
                        .length
                    }
                  </b>
                  <small>Rooms</small>
                </div>
                <div>
                  <b>
                    {used}/{pb.length}
                  </b>
                  <small>Occupied beds</small>
                </div>
                <div>
                  <b>
                    {
                      pb.filter((b) => !b.stay_id && !b.maintenance)
                        .length
                    }
                  </b>
                  <small>Available</small>
                </div>
              </div>
              <div className="progress">
                <i
                  style={{
                    width: `${pb.length ? (used / pb.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="amenities">
                {p.amenities || "No amenities added yet"}
              </p>
              <div className="card-actions">
                <button
                  className="secondary"
                  onClick={() => {
                    setProperty(p.id);
                    go("Rooms & beds");
                  }}
                >
                  Manage property <ArrowRight size={15} />
                </button>
                {owner && (
                  <div className="property-edit-actions">
                    <button
                      className="text-btn"
                      onClick={() => addProperty(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-btn delete-property"
                      aria-label={`Delete ${p.name}`}
                      onClick={() =>
                        setModal({
                          title: "Delete property?",
                          subtitle: `This permanently removes ${p.name}, its empty rooms and beds, and staff assignments. Properties with tenant or operational records cannot be deleted. Activity history is retained.`,
                          action: "propertyDelete",
                          fields: [
                            f(
                              "confirmation",
                              `Type “${p.name}” to confirm`,
                            ),
                          ],
                          values: { id: p.id },
                          submit: "Delete property",
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
      {!props.length && (
        <Empty
          title="Your first PG starts here"
          text="Add a property, then create rooms and beds."
        />
      )}
    </div>
  );
}
