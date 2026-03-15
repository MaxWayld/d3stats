"use client";
import { useState } from "react";

interface Props {
  address: string;
  display?: string;
  className?: string;
}

export default function CopyAddress({ address, display, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 transition-colors ${className}`}
      title={address}
    >
      <span>{display || address}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30 group-hover:opacity-60 shrink-0">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {copied && (
        <span className="text-[10px] text-accent ml-0.5">Copied!</span>
      )}
    </button>
  );
}
