"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, UserPlus, Building2, Phone, Wallet, Shield } from "lucide-react";
import type { StaffMember, Row } from "../types";
import { today } from "../utils";

export function AddStaffDialog({
  properties,
  onClose,
  onAdd,
}: {
  properties: Row[];
  onClose: () => void;
  onAdd: (staff: StaffMember) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffMember["role"]>("Cook");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState(properties[0]?.id || "");
  const [salaryRupees, setSalaryRupees] = useState("15000");
  const [joinedOn, setJoinedOn] = useState(today());
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter staff member's name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a contact phone number.");
      return;
    }
    const salaryVal = Number(salaryRupees);
    if (isNaN(salaryVal) || salaryVal <= 0) {
      setError("Please enter a valid monthly salary amount.");
      return;
    }

    const prop = properties.find((p) => p.id === propertyId);

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: name.trim(),
      role,
      phone: phone.trim(),
      email: email.trim() || undefined,
      property_id: propertyId,
      property_name: prop?.name || "All Properties",
      salary: Math.round(salaryVal * 100),
      joined_on: joinedOn,
      upi_id: upiId.trim() || undefined,
      status: "Active",
    };

    onAdd(newStaff);
    onClose();
  };

  return (
    <dialog className="form-dialog" ref={ref} onCancel={onClose}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">NEW TEAM ONBOARDING</span>
          <h2>Add Staff Member</h2>
          <p>Register a manager, cook, housekeeping, security, or caretaker.</p>
        </div>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close add staff dialog"
        >
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="dialog-form-body">
        {error && <div className="form-error-banner">{error}</div>}

        <div className="form-field-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="e.g. Ramesh Chandra"
          />
        </div>

        <div className="form-field-grid">
          <div className="form-field-group">
            <label className="form-label">Role / Designation</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffMember["role"])}
              className="form-select"
            >
              <option value="Manager">PG Manager</option>
              <option value="Caretaker">Caretaker / Warden</option>
              <option value="Cook">Cook / Kitchen Staff</option>
              <option value="Housekeeping">Housekeeping / Cleaning</option>
              <option value="Security">Security Guard</option>
              <option value="Maintenance">Maintenance & Electrician</option>
            </select>
          </div>

          <div className="form-field-group">
            <label className="form-label">Assigned PG Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="form-select"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field-grid">
          <div className="form-field-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="form-field-group">
            <label className="form-label">Monthly Salary (₹)</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={salaryRupees}
              onChange={(e) => setSalaryRupees(e.target.value)}
              className="form-input"
              placeholder="e.g. 15000"
            />
          </div>
        </div>

        <div className="form-field-grid">
          <div className="form-field-group">
            <label className="form-label">Joining Date</label>
            <input
              type="date"
              required
              value={joinedOn}
              onChange={(e) => setJoinedOn(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field-group">
            <label className="form-label">UPI ID for Payments (Optional)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="form-input"
              placeholder="name@okbank"
            />
          </div>
        </div>

        <div className="form-field-group">
          <label className="form-label">Email Address (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="staff@example.com"
          />
        </div>

        <div className="modal-foot">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Register Staff Member
          </button>
        </div>
      </form>
    </dialog>
  );
}
