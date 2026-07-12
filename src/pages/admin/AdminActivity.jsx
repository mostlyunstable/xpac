import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchActivityLogs } from '../../services/api';
import { formatDateTime } from '../../utils';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminActivity() {
  const [activity, setActivity] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const fetchIdRef = useRef(0);

  const debouncedUserId = useDebounce(userId, 300);
  const debouncedEntityType = useDebounce(entityType, 300);
  const debouncedEntityId = useDebounce(entityId, 300);

  const fetchActivity = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await fetchActivityLogs({ 
        userId: debouncedUserId || undefined, 
        entityType: debouncedEntityType || undefined, 
        entityId: debouncedEntityId || undefined, 
        page: pageNum, 
        limit: pageSize 
      });
      if (fetchId !== fetchIdRef.current) return;
      setActivity(data.activity || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      if (fetchId !== fetchIdRef.current) return;
      setActivity([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedUserId, debouncedEntityType, debouncedEntityId, page, pageSize]);

  useEffect(() => {
    fetchActivity(page);
  }, [fetchActivity, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedUserId, debouncedEntityType, debouncedEntityId, pageSize]);

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">Activity Logs</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">System-wide audit trail of all actions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Activity Logs</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">System-wide audit trail of all actions</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg animate-stagger animate-stagger-1">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Filters</h2>
        <div className="flex flex-col md:flex-row gap-md">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">person</span>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Filter by User ID"
              className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">category</span>
            <input
              type="text"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="Entity Type (e.g. campaign, order, user)"
              className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">tag</span>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Entity ID"
              className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
            className="px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
          >
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : activity.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center animate-fade-in">
          <span className="material-symbols-outlined text-3xl text-outline mb-2">history</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No activity matches your filters</p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Action</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Entity Type</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Entity ID</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">User</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">IP Address</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {activity.map((a, index) => (
                    <tr key={a.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                      <td className="px-lg py-4">
                        <span className="px-2 py-1 rounded font-label-md text-label-md bg-primary-container text-primary">{a.action}</span>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{a.entity_type}</td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{a.entity_id || '—'}</td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{a.name || a.email || 'System'}</td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{a.ip_address || '—'}</td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-lg py-md border-t border-outline-variant">
                <p className="font-label-md text-label-md text-outline">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                  {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
                    return Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                      const pageNum = startPage + i;
                      return (
                        <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-10 h-10 rounded-lg font-body-md text-body-md transition-colors ${page === pageNum ? 'bg-primary text-white' : 'border border-outline-variant hover:bg-surface-container-high'}`}>
                          {pageNum}
                        </button>
                      );
                    });
                  })()}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}