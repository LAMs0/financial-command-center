"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import LoadSampleDataButton from "./LoadSampleDataButton";

export default function EmptyStateActions() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Link
        className="inline-flex items-center gap-2 rounded-lg border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-300 transition hover:bg-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50"
        href="/import"
      >
        <Upload aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        Import data
      </Link>
      <LoadSampleDataButton />
    </div>
  );
}
