"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export default function Modal({ title, triggerLabel, children }: { title: string; triggerLabel: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return <><button type="button" className="btn-secondary" onClick={() => setOpen(true)}>{triggerLabel}</button>{open ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="modal-panel" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button type="button" className="icon-link" aria-label="닫기" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="modal-body">{children}</div></section></div> : null}</>;
}
