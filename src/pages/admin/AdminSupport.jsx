import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminTickets, fetchAdminTicket, addAdminTicketMessage, updateTicket } from '../../services/api';
import { formatDateTime } from '../../utils';
import { SkeletonTable } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_OPTIONS = ['All', 'open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['All', 'low', 'medium', 'high', 'urgent'];

const STATUS_BADGES = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const PRIORITY_BADGES = {
  low: { bg: 'bg-gray-100', text: 'text-gray-700' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function AdminSupport() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 300);
  const fetchIdRef = useRef(0);

  const fetchTickets = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminTickets({
        search: debouncedSearch,
        status: status === 'All' ? undefined : status,
        priority: priority === 'All' ? undefined : priority,
        sort: 'createdAt',
        order: sortOrder,
        page: pageNum,
        limit,
      });
      if (fetchId !== fetchIdRef.current) return;
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      if (fetchId !== fetchIdRef.current) return;
      setTickets([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, status, priority, sortOrder, page, limit]);

  useEffect(() => {
    fetchTickets(page);
  }, [fetchTickets, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sortOrder]);

  async function handleViewTicket(ticket) {
    try {
      const data = await fetchAdminTicket(ticket.id);
      setSelectedTicket(data);
      setShowTicketModal(true);
    } catch (err) {
      notifyError('Failed to load ticket');
    }
  }

  async function handleSendReply() {
    if (!replyBody.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await addAdminTicketMessage(selectedTicket.id, replyBody.trim(), isInternal, attachments);
      notifySuccess(isInternal ? 'Internal note added' : 'Reply sent');
      setReplyBody('');
      setIsInternal(false);
      setAttachments([]);
      const data = await fetchAdminTicket(selectedTicket.id);
      setSelectedTicket(data);
    } catch (err) {
      notifyError('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!selectedTicket) return;
    try {
      const updated = await updateTicket(selectedTicket.id, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
      if (selectedTicket.id === selectedTicket?.id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      notifySuccess(`Ticket status updated to ${newStatus}`);
    } catch {
      notifyError('Failed to update status');
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  }

  function removeAttachment(index) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  function openTicketModal(ticket) {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    setReplyBody('');
    setIsInternal(false);
    setAttachments([]);
  }

  if (loading) {
    return (
      <div className="space-y-lg">
        <div className="animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">Support Desk</h1>
          <SkeletonTable rows={5} cols={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Support Desk</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{total} total tickets</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-md animate-stagger animate-stagger-1">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
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
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
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
        <SkeletonTable rows={5} cols={6} />
      ) : tickets.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">support_agent</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No tickets found</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {search || status !== 'All' || priority !== 'All' ? 'Try adjusting your filters' : 'No support tickets yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Ticket ID</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Subject</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Customer</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Priority</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Created</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {tickets.map((ticket, index) => (
                    <tr key={ticket.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                      <td className="px-lg py-4">
                        <Link to={`/admin/support/${ticket.id}`} className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-primary">{ticket.id}</span>
                          <span className="font-label-md text-label-md text-outline truncate max-w-xs">{ticket.subject}</span>
                        </Link>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{ticket.subject}</td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">
                        {ticket.customer_name || ticket.customer_email || '—'}
                      </td>
                      <td className="px-lg py-4">
                        <span className={`px-2 py-1 rounded font-label-md text-xs ${PRIORITY_BADGES[ticket.priority] || 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${STATUS_BADGES[ticket.status] || 'bg-surface-container-highest text-on-surface-variant'}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(ticket.created_at)}</td>
                      <td className="px-lg py-4">
                        <Link to={`/admin/support/${ticket.id}`} className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex" title="View details">
                          <span className="material-symbols-outlined text-on-surface-variant">visibility</span>
                        </Link>
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
        isOpen={showTicketModal}
        onClose={() => { setShowTicketModal(false); setSelectedTicket(null); setReplyBody(''); setIsInternal(false); setAttachments([]); }}
        title={selectedTicket ? `Ticket ${selectedTicket.id}` : 'Ticket Details'}
        actions={
          <>
            <button onClick={() => { setShowTicketModal(false); setSelectedTicket(null); }} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">Close</button>
            <button onClick={handleSendReply} disabled={!replyBody.trim() || sending} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">{sending ? 'Sending...' : 'Send'}</button>
          </>
        }
      >
        {selectedTicket && (
          <>
            <div className="flex items-center gap-3 mb-lg p-lg bg-surface-container rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              </div>
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface">{selectedTicket.subject}</h3>
                <p className="font-label-md text-label-md text-outline">{selectedTicket.customer_name || selectedTicket.customer_email}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={`px-2 py-1 rounded font-label-md text-xs ${PRIORITY_BADGES[selectedTicket.priority] || 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1).replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${STATUS_BADGES[selectedTicket.status] || 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-lg">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <h4 className="font-title-md text-title-md text-on-surface mb-md">Conversation</h4>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  <div className="space-y-md">
                    {selectedTicket.messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.is_internal ? 'bg-warning-container rounded-xl p-lg ml-8' : 'bg-surface-container-lowest rounded-xl p-lg'}`}>
                        <div className="flex items-center gap-sm mb-sm">
                          <span className="font-body-md text-body-md font-semibold text-on-surface">{msg.sender_name}</span>
                          <span className="font-label-md text-label-md text-outline">{msg.sender_role}</span>
                          {msg.is_internal && <span className="px-2 py-0.5 bg-warning-container text-warning text-xs font-medium rounded">Internal</span>}
                          <span className="font-label-md text-label-md text-outline ml-auto">{formatDateTime(msg.created_at)}</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{msg.message_body}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-sm flex flex-wrap gap-sm">
                            {msg.attachments.map((att) => (
                              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-primary-container text-primary rounded-lg text-sm font-medium inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">attachment</span>
                                {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center py-xl">No messages yet</p>
                )}
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
                <h4 className="font-title-md text-title-md text-on-surface mb-lg">Reply</h4>
                <div className="space-y-md">
                  <div>
                    <label className="flex items-center gap-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className="font-body-md text-body-md text-on-surface">Internal note (not visible to customer)</span>
                    </label>
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-sm" htmlFor="reply-body">Message</label>
                    <textarea
                      id="reply-body"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
                      placeholder="Type your reply..."
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">Attachments</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx,.zip"
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
                    />
                    {attachments.length > 0 && (
                      <div className="mt-sm flex flex-wrap gap-sm">
                        {attachments.map((file, i) => (
                          <span key={i} className="px-3 py-1 bg-primary-container text-primary rounded-lg text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">attachment</span>
                            {file.name}
                            <button onClick={() => removeAttachment(i)} className="ml-1 hover:text-error">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}