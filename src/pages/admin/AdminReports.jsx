import { useState, useEffect, useCallback } from 'react';
import { fetchAdminReports } from '../../services/api';
import { formatDateTime, formatFileSize } from '../../utils';
import { SkeletonTable } from '../../components/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../../components/Modal';

export default function AdminReports() {
  const { success, error: notifyError } = useNotification();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportUploading, setReportUploading] = useState(false);
  const limit = 20;

  const fetchReports = useCallback(async (pageNum = page) => {
    setLoading(true);
    try {
      const data = await fetchAdminReports({ search, status, sort: 'createdAt', order: sortOrder, page: pageNum, limit });
      setReports(data.reports || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, sortOrder, page, limit]);

  useEffect(() => {
    fetchReports(page);
  }, [fetchReports, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, sortOrder]);

  async function handleReportUpload(e) {
    e.preventDefault();
    if (!reportFile) { notifyError('Please select a report file'); return; }
    if (!selectedReport) return;

    setReportUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('remarks', reportRemarks);
      
      const res = await fetch(`/api/admin/reports/${selectedReport.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, ...data } : r));
      success('Report uploaded successfully');
      setShowUploadModal(false);
      setReportFile(null);
      setReportRemarks('');
    } catch (err) {
      notifyError('Failed to upload report');
    } finally {
      setReportUploading(false);
    }
  }

  function openUploadModal(report) {
    setSelectedReport(report);
    setShowUploadModal(true);
  }

  const STATUS_BADGES = {
    generated: { bg: 'bg-blue-100', text: 'text-blue-700' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700' },
    failed: { bg: 'bg-red-100', text: 'text-red-700' },
  };

  function renderPageNumbers() {
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
  }

  function renderHeader() {
    return (
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Reports</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and download broadcast performance reports</p>
        </div>
        <button
          onClick={() => { setSelectedReport({ id: 'new' }); setShowUploadModal(true); }}
          className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-sm">cloud_upload</span>
          Upload Report
        </button>
      </div>
    );
  }

  function renderFilters() {
    return (
      <div className="flex flex-col md:flex-row gap-md animate-stagger animate-stagger-1">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
        >
          {['All', 'generated', 'delivered', 'failed'].map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
    );
  }

  function renderLoading() {
    return (
      <SkeletonTable rows={5} cols={6} />
    );
  }

  function renderEmpty() {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-3">description</span>
        <p className="font-title-lg text-title-lg text-on-surface mb-2">No reports found</p>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {search || status !== 'All' ? 'Try adjusting your filters' : 'No reports uploaded yet'}
        </p>
      </div>
    );
  }

  function renderTable() {
    return (
      <div className="space-y-xl">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container">
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Report ID</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Campaign</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Order</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Type</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Size</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Uploaded</th>
                  <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {reports.map((report, index) => (
                  <tr key={report.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                    <td className="px-lg py-4">
                      <span className="font-body-md text-body-md font-semibold text-primary">{report.id}</span>
                    </td>
                    <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{report.campaignName || '—'}</td>
                    <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{report.orderId || '—'}</td>
                    <td className="px-lg py-4 font-label-md text-label-md text-on-surface">{report.fileType || '—'}</td>
                    <td className="px-lg py-4">
                      <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${STATUS_BADGES[report.status] || 'bg-surface-container-highest text-on-surface-variant'}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-lg py-4 font-label-md text-label-md text-outline">{report.fileSize ? formatFileSize(report.fileSize) : '—'}</td>
                    <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(report.createdAt)}</td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        {report.fileUrl && (
                          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex" title="Download">
                            <span className="material-symbols-outlined text-on-surface-variant">cloud_download</span>
                          </a>
                        )}
                        <button
                          onClick={() => openUploadModal(report)}
                          className="p-2 rounded-full hover:bg-primary-container transition-colors inline-flex"
                          title="Replace/Upload Report"
                        >
                          <span className="material-symbols-outlined text-primary">cloud_upload</span>
                        </button>
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
                {renderPageNumbers()}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 font-body-md text-body-md border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>

        <Modal
          isOpen={showUploadModal}
          onClose={() => { setShowUploadModal(false); setSelectedReport(null); setReportFile(null); setReportRemarks(''); }}
          title="Upload Performance Report"
          actions={
            <div className="flex gap-md">
              <button onClick={() => { setShowUploadModal(false); setSelectedReport(null); setReportFile(null); setReportRemarks(''); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
              <button onClick={handleReportUpload} disabled={!reportFile || reportUploading} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">{reportUploading ? 'Uploading...' : 'Upload Report'}</button>
            </div>
          }
        >
          <div className="space-y-md">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Upload the performance report for <strong>{selectedReport?.campaignName || selectedReport?.id}</strong>.
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

  if (loading) {
    return (
      <div className="space-y-xl">
        {renderHeader()}
        {renderFilters()}
        {renderLoading()}
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      {renderHeader()}
      {renderFilters()}
      {reports.length === 0 ? renderEmpty() : renderTable()}
    </div>
  );
}