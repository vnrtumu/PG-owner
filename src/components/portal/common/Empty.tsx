import React from "react";
import { Building2 } from "lucide-react";

export function Empty({
  title = "Nothing here yet",
  text = "Add your first record to get started.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Building2 size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
