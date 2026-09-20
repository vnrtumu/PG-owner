import React from "react";
import type { LucideIcon } from "lucide-react";

export function Stat({
  label,
  value,
  note,
  icon: Icon,
  color = "",
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon | any;
  color?: string;
}) {
  return (
    <div className={`stat ${color}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
