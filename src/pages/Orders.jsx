import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/api';
import { formatDateTime } from '../utils';
import { useDebounce } from '../hooks/useDebounce';
import { ORDER_STATUSES } from '../constants';
import { SkeletonTable } from '../components/Skeleton';

const STATUS_OPTIONS = ['All', ...Object.values(ORDER_STATUSES)];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const limit = 10;

  const debouncedSearch = useDebounce(search);
  const fetchIdRef = useRef(0);

  const fetchOrders = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await getOrders({ search: debouncedSearch, status, sort: 'createdAt', order: sortOrder, page: pageNum, limit });
      if (fetchId !== fetchIdRef.current) return;
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      if (fetchId !== fetchIdRef.current) return;
      setOrders([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, status, sortOrder, page, limit]);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortOrder]);

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Orders</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{total} total orders</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-md">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">sort</span>
          <span className="font-body-md text-body-md">{sortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">shopping_cart</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No orders found</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {search || status !== 'All' ? 'Try adjusting your filters' : 'Launch a campaign to create your first order'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Order ID</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Campaign</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Contacts</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Created</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-4">
                        <span className="font-body-md text-body-md font-semibold text-primary">{order.id}</span>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{order.campaignName || '—'}</td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{order.contactCount || 0}</td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'Failed' ? 'bg-red-100 text-red-700' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(order.createdAt)}</td>
                      <td className="px-lg py-4">
                        <Link to={`/orders/${order.id}`} className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex">
                          <span className="material-symbols-outlined text-on-surface-variant">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="font-label-md text-label-md text-outline">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {(() => {
                  const maxVisible = 5;
                  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                  if (endPage - startPage < maxVisible - 1) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }
                  return Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                    const pageNum = startPage + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-body-md text-body-md transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-white'
                            : 'border border-outline-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}