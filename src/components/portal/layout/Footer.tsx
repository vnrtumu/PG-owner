"use client";
import React from "react";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="page-footer">
      <span>
        NestLedger <span>·</span> A clearer view of your PG business
      </span>
      <span>
        <ShieldCheck size={13} /> Private owner workspace
      </span>
    </footer>
  );
}
