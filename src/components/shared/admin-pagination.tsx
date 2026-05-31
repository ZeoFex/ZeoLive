"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  className,
}: AdminPaginationProps) {
  const start = page * pageSize + 1;
  const end = totalItems
    ? Math.min((page + 1) * pageSize, totalItems)
    : (page + 1) * pageSize;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i;
    if (page < 3) return i;
    if (page > totalPages - 4) return totalPages - 5 + i;
    return page - 2 + i;
  });

  return (
    <div className={cn("admin-pagination", className)}>
      <p className="text-sm text-slate-500">
        {totalItems != null ? (
          <>
            Showing {start} to {end} of {totalItems}
          </>
        ) : (
          <>
            Page {page + 1} of {totalPages}
          </>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="admin-pagination-btn"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={cn(
              "admin-pagination-btn",
              p === page && "admin-pagination-btn-active"
            )}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          className="admin-pagination-btn"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
