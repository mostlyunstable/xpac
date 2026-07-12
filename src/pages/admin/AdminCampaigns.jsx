import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminCampaigns, updateCampaignStatus } from '../../services/api';
import { formatDateTime } from '../../utils';
import { CAMPAIGN_STATUSES } from '../../constants';
import { SkeletonTable } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_OPTIONS = ['All', ...Object.values(CAMPAIGN_STATUSES)];

export default function AdminCampaigns() {
  const { success, error } = useNotification();
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportUploading, setReportUploading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 300);
  const fetchIdRef = useRef(0);

  const fetchCampaigns = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminCampaigns({ 
        search: debouncedSearch, 
        status, 
        sort: 'created_at', 
        order: sortOrder, 
        page: pageNum, 
        limit 
      });
      if (fetchId !== fetchIdRef.current) return;
      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      error('Failed to load campaigns');
      setCampaigns([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, status, sortOrder, page, limit, error]);

  useEffect(() => {
    fetchCampaigns(page);
  }, [fetchCampaigns, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sortOrder]);

  async function handleStatusChange(campaign, newStatus) {
    setPendingStatus(newStatus);
    setSelectedCampaign(campaign);
    setShowStatusModal(true);
  }

  async function confirmStatusChange() {
    if (!selectedCampaign || !pendingStatus) return;
    try {
      const updated = await updateCampaignStatus(selectedCampaign.id, pendingStatus);
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? updated : c));
      success(`Campaign status updated to ${pendingStatus}`);
      
      if (['In Progress', 'Completed', 'Failed'].includes(pendingStatus)) {
        const template = emailTemplates();
        if (pendingStatus === 'In Progress') {
          sendEmail({ to: selectedCampaign.customer_email, ...template.statusInProgress(selectedCampaign.customer_name, selectedCampaign.id) });
        } else if (pendingStatus === 'Completed' || pendingStatus === 'Failed') {
          sendEmail({ to: selectedCampaign.customer_email, ...template.orderCompleted(selectedCampaign.customer_name, selectedCampaign.id, `/orders/${selectedCampaign.id}`) });
        }
      }
    } catch (err) {
      error('Failed to update campaign status');
    } finally {
      setShowStatusModal(false);
      setPendingStatus(null);
      setSelectedCampaign(null);
    }
  }

  async function handleReportUpload(e) {
    e.preventDefault();
    if (!reportFile) { error('Please select a report file'); return; }
    if (!selectedCampaign) return;

    setReportUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('remarks', reportRemarks);
      
      const res = await fetch(`/api/admin/campaigns/${selectedCampaign.id}/report`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? { ...c, ...data } : c));
      success('Report uploaded successfully');
      setShowReportModal(false);
      setReportFile(null);
      setReportRemarks('');
    } catch (err) {
      error('Failed to upload report');
    } finally {
      setReportUploading(false);
    }
  }

  function openReportModal(campaign) {
    setSelectedCampaign(campaign);
    setShowReportModal(true);
  }

  function openStatusModal(campaign, newStatus) {
    setSelectedCampaign(campaign);
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Broadcast Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{total} total broadcasts</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-md animate-stagger animate-stagger-1">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search broadcasts..."
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
      ) : campaigns.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">campaign</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No broadcasts found</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {search || status !== 'All' ? 'Try adjusting your filters' : 'No broadcasts in the system yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Broadcast Name</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Customer</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Contacts</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Created</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {campaigns.map((campaign, index) => (
                    <tr key={campaign.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                      <td className="px-lg py-4">
                        <span className="font-body-md text-body-md font-semibold text-primary">{campaign.campaign_name}</span>
                        <p className="font-label-md text-label-md text-outline truncate max-w-xs">{campaign.id}</p>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                        {campaign.customer_name || campaign.customer_email || '—'}
                      </td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full font-label-md text-label-md status-badge ${
                          campaign.status === 'Completed' ? 'status-completed' :
                          campaign.status === 'In Progress' ? 'status-running' :
                          campaign.status === 'Placed' ? 'status-queued' :
                          campaign.status === 'Failed' ? 'status-failed' :
                          'status-processing'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{campaign.contact_count || 0}</td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(campaign.created_at)}</td>
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/campaigns/${campaign.id}`} className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex" title="View details">
                            <span className="material-symbols-outlined text-on-surface-variant">visibility</span>
                          </Link>
                          <select
                            value={campaign.status}
                            onChange={(e) => openStatusModal(campaign, e.target.value)}
                            disabled={campaign.status === 'Completed' || campaign.status === 'Failed' || campaign.status === 'Cancelled'}
                            className="px-3 py-1.5 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md text-sm"
                          >
                            {Object.values(CAMPAIGN_STATUSES).filter(s => s !== campaign.status).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {!campaign.report_file_url && !['Completed', 'Failed', 'Cancelled'].includes(campaign.status) && (
                            <button
                              onClick={() => openReportModal(campaign)}
                              className="p-2 rounded-full hover:bg-primary-container transition-colors inline-flex"
                              title="Upload report"
                            >
                              <span className="material-symbols-outlined text-primary">cloud_upload</span>
                            </button>
                          )}
                          {campaign.report_file_url && (
                            <a href={campaign.report_file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-green-100 transition-colors inline-flex" title="Download report">
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
              <div className="flex items-center justify-between">
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
        onClose={() => { setShowStatusModal(false); setPendingStatus(null); setSelectedCampaign(null); }}
        title="Confirm Status Change"
        actions={
          <>
            <button onClick={() => { setShowStatusModal(false); setPendingStatus(null); setSelectedCampaign(null); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={confirmStatusChange} disabled={pendingStatus === 'Completed' && !reportFile} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{pendingStatus === 'Completed' && !reportFile ? 'Upload Report First' : 'Confirm'}</button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          Change status from <strong>{selectedCampaign?.status}</strong> to <strong>{pendingStatus}</strong>?
        </p>
      </Modal>

      <Modal
        isOpen={showReportModal}
        onClose={() => { setShowReportModal(false); setSelectedCampaign(null); setReportFile(null); setReportRemarks(''); }}
        title="Upload Performance Report"
        actions={
          <>
            <button onClick={() => { setShowReportModal(false); setSelectedCampaign(null); setReportFile(null); setReportRemarks(''); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
            <button onClick={handleReportUpload} disabled={!reportFile || reportUploading} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {reportUploading ? 'Uploading...' : 'Upload Report'}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Upload the performance report for <strong>{selectedCampaign?.campaign_name}</strong>.
          </p>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">Report File (CSV, PDF, ZIP)</label>
            <input
              type="file"
              accept=".csv,.pdf,.zip"
              onChange={(e) => setReportFile(e.target.files?.[0])}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            />
            {reportFile && <p className="mt-1 font-label-md text-label-md text-primary">Selected: {reportFile.name}</p>}
          </div>
          <div>
            <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">Admin Remarks</label>
            <textarea
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