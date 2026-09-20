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

export type StaffMember = {
  id: string;
  name: string;
  role: "Manager" | "Caretaker" | "Cook" | "Housekeeping" | "Security" | "Maintenance";
  phone: string;
  email?: string;
  property_id: string;
  property_name: string;
  salary: number; // in paise
  joined_on: string;
  upi_id?: string;
  bank_account?: string;
  status: "Active" | "Inactive";
};

export type SalaryPayout = {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  property_id: string;
  property_name: string;
  period: string; // YYYY-MM e.g. "2026-09"
  amount: number; // in paise
  paid_on: string;
  method: "UPI" | "Cash" | "Bank transfer";
  reference?: string;
  notes?: string;
};

