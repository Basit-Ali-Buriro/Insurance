import React, { useState } from 'react';

const PAGE_SIZE = 10;

/**
 * Reusable paginated data table.
 * Props: columns[{key,label,render}], rows[], actions(row)=>JSX, actionsLabel, highlightId, loading, emptyMsg
 */
export default function DataTable({ columns, rows = [], actions, actionsLabel = 'Actions', highlightId, loading, emptyMsg = 'No records found.' }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when rows change
  React.useEffect(() => { setPage(1); }, [rows.length]);

  // Handle highlighting and page jumping
  React.useEffect(() => {
    if (highlightId && rows.length > 0) {
      const idx = rows.findIndex(r => String(r.id) === String(highlightId));
      if (idx !== -1) {
        const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
        setPage(targetPage);
        
        // Wait for rendering to complete
        setTimeout(() => {
          const row = document.querySelector(`tr[data-id="${highlightId}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlighted-row');
            setTimeout(() => {
              row.classList.remove('highlighted-row');
              // Clear the highlight param from URL
              const params = new URLSearchParams(window.location.search);
              if (params.has('highlight')) {
                params.delete('highlight');
                const newSearch = params.toString();
                const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
                window.history.replaceState(null, '', newUrl);
              }
            }, 4000);
          }
        }, 100);
      }
    }
  }, [highlightId, rows]);

  if (loading) {
    return (
      <div className="bg-slate-gray/30 border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="datatable-wrapper overflow-x-auto overflow-y-auto w-full" style={{ maxHeight: '80vh' }}>
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-slate-gray border-b border-outline-variant sticky top-0 z-20">
              <tr>
                {columns.map(c => (
                  <th key={c.key} className="px-5 py-3 font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider select-none">
                    {c.label}
                  </th>
                ))}
                {actions && <th className="px-5 py-3 font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider text-right select-none">{actionsLabel}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="hover:bg-electric-blue/5 transition-colors">
                  {columns.map(c => (
                    <td key={c.key} className="px-5 py-3.5">
                      <div className="h-4 bg-surface-container-highest/40 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  {actions && <td className="px-5 py-3.5" />}
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
      <div className="bg-slate-gray/30 border border-outline-variant rounded-xl p-12 text-center flex flex-col items-center justify-center select-none shadow-xl">
        <span className="material-symbols-outlined text-[48px] text-outline opacity-40 mb-3">folder_open</span>
        <p className="text-body-md text-on-surface-variant font-medium">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-gray/30 border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-2xl">
      <div className="datatable-wrapper overflow-x-auto overflow-y-auto w-full" style={{ maxHeight: '80vh' }}>
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="bg-slate-gray border-b border-outline-variant sticky top-0 z-20">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="px-5 py-3 font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider select-none">
                  {c.label}
                </th>
              ))}
              {actions && <th className="px-5 py-3 font-semibold text-label-sm text-on-surface-variant uppercase tracking-wider text-right select-none" style={{ width: 140 }}>{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-mono-data text-mono-data text-on-surface">
            {slice.map((row, idx) => (
              <tr key={row.id ?? idx} data-id={row.id} className="hover:bg-electric-blue/5 transition-all duration-150 group">
                {columns.map(c => (
                  <td key={c.key} className="px-5 py-3.5">
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                  </td>
                ))}
                {actions && (
                  <td className="px-5 py-3.5 text-right">
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
        <div className="px-6 py-3 bg-slate-gray flex items-center justify-between border-t border-outline-variant select-none">
          <span className="text-xs text-on-surface-variant font-medium font-body-md">
            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, rows.length)} of {rows.length} records
          </span>
          <div className="flex gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <span className="material-symbols-outlined text-sm font-bold">first_page</span>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2)
              .map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-electric-blue text-white shadow-md'
                      : 'border border-outline-variant hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-30"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <span className="material-symbols-outlined text-sm font-bold">last_page</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
