import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminOrders, updateOrderStatus } from '../../services/api';
import { formatDateTime } from '../../utils';
import { ORDER_STATUSES } from '../../constants';
import { SkeletonTable } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_OPTIONS = ['All', ...Object.values(ORDER_STATUSES)];

export default function AdminOrders() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportUploading, setReportUploading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 300);
  const fetchIdRef = useRef(0);

  const fetchOrders = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminOrders({ 
        search: debouncedSearch, 
        status, 
        sort: 'createdAt', 
        order: sortOrder, 
        page: pageNum, 
        limit 
      });
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

  function openStatusModal(order, newStatus) {
    setPendingStatus(newStatus);
    setSelectedOrder(order);
    setShowStatusModal(true);
  }

  async function confirmStatusChange() {
    if (!selectedOrder || !pendingStatus) return;
    try {
      const updated = await updateOrderStatus(selectedOrder.id, pendingStatus);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
      notifySuccess(`Order status updated to ${pendingStatus}`);
      setShowStatusModal(false);
      setPendingStatus(null);
      setSelectedOrder(null);
    } catch {
      notifyError('Failed to update order status');
    }
  }

  function openReportModal(order) {
    setSelectedOrder(order);
    setShowReportModal(true);
  }

  async function handleReportUpload(e) {
    e.preventDefault();
    if (!reportFile) { notifyError('Please select a report file'); return; }
    if (!selectedOrder) return;

    setReportUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('remarks', reportRemarks);
      
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/report`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...data } : o));
      notifySuccess('Report uploaded successfully');
      setShowReportModal(false);
      setReportFile(null);
      setReportRemarks('');
    } catch (err) {
      notifyError('Failed to upload report');
    } finally {
      setReportUploading(false);
    }
  }

  const statusBadgeClass = (status) => {
    const base = 'px-3 py-1 rounded-full font-label-md text-label-md status-badge ';
    switch (status) {
      case 'Completed': return base + 'bg-green-100 text-green-700';
      case 'In Progress': return base + 'bg-blue-100 text-blue-700';
      case 'Placed': return base + 'bg-yellow-100 text-yellow-700';
      case 'Failed': return base + 'bg-red-100 text-red-700';
      case 'Queued': return base + 'bg-purple-100 text-purple-700';
      case 'Paused': return base + 'bg-gray-100 text-gray-700';
      case 'Cancelled': return base + 'bg-red-100 text-red-700';
      default: return base + 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  if (loading) {
    return (
      <div className="space-y-lg">
        <div className="animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">Order Management</h1>
          <SkeletonTable rows={5} cols={7} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Order Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{total} total orders</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-md animate-stagger animate-stagger-1">
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
        <SkeletonTable rows={5} cols={7} />
      ) : orders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">shopping_cart</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No orders found</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {search || status !== 'All' ? 'Try adjusting your filters' : 'No orders in the system yet'}
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
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Customer</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Campaign</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Contacts</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Created</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orders.map((order, index) => (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                      <td className="px-lg py-4">
                        <Link to={`/admin/orders/${order.id}`} className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-primary">{order.id}</span>
                        </Link>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                        {order.customer_name || order.user_id}
                        <p className="font-label-md text-label-md text-outline truncate max-w-xs">{order.customer_email || '—'}</p>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                        {order.campaign_name || '—'}
                        <p className="font-label-md text-label-md text-outline truncate max-w-xs">{order.id}</p>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{order.contact_count || 0}</td>
                      <td className="px-lg py-4">
                        <span className={statusBadgeClass(order.status)}>{order.status}</span>
                      </td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(order.created_at)}</td>
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/orders/${order.id}`} className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex" title="View details">
                            <span className="material-symbols-outlined text-on-surface-variant">visibility</span>
                          </Link>
                          <select
                            value={order.status}
                            onChange={(e) => openStatusModal(order, e.target.value)}
                            disabled={order.status === 'Completed' || order.status === 'Failed' || order.status === 'Cancelled'}
                            className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md text-sm"
                          >
                            {Object.values(ORDER_STATUSES).filter(s => s !== order.status).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {!order.report_file_url && !['Completed', 'Failed', 'Cancelled'].includes(order.status) && (
                            <button
                              onClick={() => openReportModal(order)}
                              className="p-2 rounded-full hover:bg-primary-container transition-colors inline-flex"
                              title="Upload report"
                            >
                              <span className="material-symbols-outlined text-primary">cloud_upload</span>
                            </button>
                          )}
                          {order.report_file_url && (
                            <a href={order.report_file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-green-50 transition-colors inline-flex" title="Download report">
                              <span className="material-symbols-outlined text-green-600">cloud_download</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-lg py-md border-t border-outline-variant">
                <p className="font-label-md text-label-md text-outline">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
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

      <Modal
        isOpen={showStatusModal}
        onClose={() => { setShowStatusModal(false); setPendingStatus(null); setSelectedOrder(null); }}
        title="Confirm Status Change"
        actions={
          <>
            <button onClick={() => { setShowStatusModal(false); setPendingStatus(null); setSelectedOrder(null); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={confirmStatusChange} disabled={!pendingStatus} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">{pendingStatus === 'Completed' && !selectedOrder?.report_file_url ? 'Upload Report First' : 'Confirm'}</button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          Change status from <strong>{selectedOrder?.status}</strong> to <strong>{pendingStatus}</strong>?
        </p>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setSelectedOrder(null); setReportFile(null); setReportRemarks(''); }}
        title="Upload Performance Report"
        actions={
          <>
            <button onClick={() => { setShowReportModal(false); setSelectedOrder(null); setReportFile(null); setReportRemarks(''); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={handleReportUpload} disabled={!reportFile || reportUploading} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">{reportUploading ? 'Uploading...' : 'Upload Report'}</button>
          </>
        }
      >
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Upload the performance report for <strong>{selectedOrder?.id}</strong>.
          </p>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="report-file">Report File (CSV, PDF, ZIP)</label>
            <input
              id="report-file"
              type="file"
              accept=".csv,.pdf,.zip"
              onChange={(e) => setReportFile(e.target.files?.[0])}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
            {reportFile && <p className="mt-1 font-label-md text-label-md text-primary">Selected: {reportFile.name}</p>}
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="report-remarks">Admin Remarks</label>
            <textarea
              id="report-remarks"
              value={reportRemarks}
              onChange={(e) => setReportRemarks(e.target.value)}
              rows={4}
              placeholder="Enter any remarks for the customer..."
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function statusBadgeClass(status) {
  const base = 'px-3 py-1 rounded-full font-label-md text-label-md status-badge ';
  switch (status) {
    case 'Completed': return base + 'bg-green-100 text-green-700';
    case 'In Progress': return base + 'bg-blue-100 text-blue-700';
    case 'Placed': return base + 'bg-yellow-100 text-yellow-700';
    case 'Failed': return base + 'bg-red-100 text-red-700';
    case 'Queued': return base + 'bg-purple-100 text-purple-700';
    case 'Paused': return base + 'bg-gray-100 text-gray-700';
    case 'Cancelled': return base + 'bg-red-100 text-red-700';
    default: return base + 'bg-surface-container-highest text-on-surface-variant';
  }
}