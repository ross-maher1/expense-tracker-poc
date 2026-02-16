"use client";

import { ChevronRight } from "lucide-react";

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
  actionLabel?: string;
};

/**
 * Reusable list row component.
 * Use this as a base for feature-specific list items.
 */
export default function ListRow({
  title,
  subtitle,
  meta,
  onClick,
  actionLabel,
}: ListRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between border-b border-dashed border-slate-200 py-3 last:border-b-0 ${
        onClick ? "cursor-pointer hover:bg-slate-50" : ""
      }`}
    >
      <div className="space-y-1">
        <p className="type-item-title text-base">{title}</p>
        {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
        {meta && <p className="text-[11px] text-slate-500">{meta}</p>}
      </div>
      {(actionLabel || onClick) && (
        <div className="flex items-center gap-2">
          {actionLabel && (
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {actionLabel}
            </span>
          )}
          {onClick && <ChevronRight size={16} className="text-slate-400" />}
        </div>
      )}
    </div>
  );
}
