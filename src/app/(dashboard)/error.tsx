"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <p className="text-[14px] font-semibold tracking-tight">
        <span className="text-accent">D3</span>
        <span className="text-text-primary">Stats</span>
      </p>
      <p className="text-[48px] font-extralight text-text-muted mt-2">Error</p>
      <p className="text-text-secondary mt-2 text-sm max-w-md text-center">
        Something went wrong loading this page. This is usually caused by a temporary API issue.
      </p>
      <p className="text-text-muted mt-1 text-xs">
        The data source may be temporarily unavailable
      </p>
      <button
        onClick={reset}
        className="mt-6 btn-accent h-9 px-5 rounded-lg text-sm"
      >
        Try again
      </button>
      <Link
        href="/"
        className="mt-3 text-accent hover:underline text-sm"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
