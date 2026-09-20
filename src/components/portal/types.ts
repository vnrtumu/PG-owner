import type { LucideIcon } from "lucide-react";

export type Row = Record<string, any>;

export type Data = {
  user: Row;
  properties: Row[];
  rooms: Row[];
  beds: Row[];
  tenants: Row[];
  invoices: Row[];
  payments: Row[];
  expenses: Row[];
  complaints: Row[];
  bookings: Row[];
  documents: Row[];
  staff: Row[];
  audit: Row[];
  demo: boolean;
};

export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  min?: string;
  max?: string;
};

export type Modal = {
  title: string;
  subtitle?: string;
  action: string;
  fields: Field[];
  values?: Row;
  submit?: string;
};

export type NavItem = {
  name: string;
  icon: LucideIcon;
};
