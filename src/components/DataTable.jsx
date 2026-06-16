import React, { useState } from 'react';

const PAGE_SIZE = 10;

/**
 * Reusable paginated data table.
 * Props: columns[{key,label,render}], rows[], actions(row)=>JSX, loading, emptyMsg
 */
export default function DataTable({ columns, rows = [], actions, loading, emptyMsg = 'No records found.' }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when rows change
  React.useEffect(() => { setPage(1); }, [rows.length]);

  if (loading) {
    return (
      <div className="bg-surface-container/20 border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high border-b border-border-subtle">
              <tr>
                {columns.map(c => (
                  <th key={c.key} className="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider">
                    {c.label}
                  </th>
                ))}
                {actions && <th className="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-surface-bright/5 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-6 py-4">
                      <div className="h-4 bg-surface-variant/40 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  {actions && <td className="px-6 py-4" />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-surface-container/20 border border-border-subtle rounded-lg p-12 text-center flex flex-col items-center justify-center select-none">
        <span className="material-symbols-outlined text-[48px] text-outline opacity-40 mb-3">folder_open</span>
        <p className="text-body-md text-on-surface-variant">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container/20 border border-border-subtle rounded-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-high border-b border-border-subtle">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider select-none">
                  {c.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 font-table-header text-table-header text-on-surface-variant uppercase tracking-wider text-right select-none" style={{ width: 140 }}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {slice.map((row, idx) => (
              <tr key={row.id ?? idx} className="hover:bg-surface-bright/5 transition-colors group">
                {columns.map(c => (
                  <td key={c.key} className="px-6 py-4 text-body-md text-on-surface">
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-surface-container flex items-center justify-between border-t border-border-subtle select-none">
          <span className="text-xs text-on-surface-variant font-body-md">
            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, rows.length)} of {rows.length} records
          </span>
          <div className="flex gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-variant transition-colors disabled:opacity-30"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <span className="material-symbols-outlined text-sm">first_page</span>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-variant transition-colors disabled:opacity-30"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2)
              .map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-primary text-on-primary shadow'
                      : 'border border-border-subtle hover:bg-surface-variant'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-variant transition-colors disabled:opacity-30"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-variant transition-colors disabled:opacity-30"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <span className="material-symbols-outlined text-sm">last_page</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

