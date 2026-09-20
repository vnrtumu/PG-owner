"use client";
import React from "react";
import { usePortal } from "../context/PortalContext";
import { PGDocumentationView } from "./PGDocumentationView";

export function DocumentsView() {
  const { setViewDoc, setUploadDocOpen, deleteDoc } = usePortal();

  return (
    <PGDocumentationView
      onViewDoc={(doc) => setViewDoc(doc)}
      onUploadDoc={() => setUploadDocOpen(true)}
      onDeleteDoc={deleteDoc}
    />
  );
}
