import { useState, useEffect, useCallback } from 'react';
import { fetchTickets, createTicket, addCustomerTicketMessage } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { formatDateTime } from '../utils';
import Modal from '../components/Modal';

export default function SupportCenter() {
  const { success, error } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });
  const [newTicketLoading, setNewTicketLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      error(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleNewTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
      error('Subject and message are required');
      return;
    }

    setNewTicketLoading(true);
    try {
      await createTicket({
        subject: newTicketForm.subject.trim(),
        message: newTicketForm.message.trim(),
        priority: newTicketForm.priority,
      });
      success('Support ticket created successfully');
      setShowNewTicketModal(false);
      setNewTicketForm({ subject: '', message: '', priority: 'medium' });
      loadTickets();
    } catch (err) {
      error(err.message || 'Failed to create ticket');
    } finally {
      setNewTicketLoading(false);
    }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      await addCustomerTicketMessage(ticketId, replyText.trim());
      success('Reply sent');
      setReplyText('');
      loadTickets();
    } catch (err) {
      error(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-xl">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Support Center</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage your support tickets</p>
          </div>
          <button className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-sm">
            <span className="material-symbols-outlined text-sm">add</span>
            New Ticket
          </button>
        </div>
        <div className="space-y-md">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-lg bg-surface rounded-xl border border-outline-variant animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-48 bg-surface-container rounded" />
                <div className="h-4 w-24 bg-surface-container rounded" />
              </div>
              <div className="h-20 bg-surface-container rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Support Center</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage your support tickets and get help from our team</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">support_agent</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No support tickets yet</p>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
            Create a new ticket to get help from our support team
          </p>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-sm mx-auto"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-md">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-surface rounded-xl border border-outline-variant overflow-hidden transition-all hover:border-primary hover:shadow-md">
              <div className="p-lg border-b border-outline-variant flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="font-title-lg text-title-lg text-on-surface truncate">{ticket.subject}</h3>
                    <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                    Created {formatDateTime(ticket.created_at)}
                    {ticket.updated_at !== ticket.created_at && (
                      <> · Updated {formatDateTime(ticket.updated_at)}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="px-4 py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center gap-sm whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  View
                </button>
              </div>

              <div className="p-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface">{ticket.customer_name || 'Customer'}</p>
                    <p className="font-label-md text-label-md text-outline">{ticket.customer_email}</p>
                  </div>
                  {ticket.admin_name && (
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-primary-container rounded-lg">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                      <span className="font-label-md text-label-md text-primary">Replied by {ticket.admin_name}</span>
                    </div>
                  )}
                </div>

                {ticket.last_message && (
                  <div className="mt-lg p-md bg-surface-container rounded-xl border border-outline-variant">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-label-md text-label-md text-on-surface-variant">Last message:</span>
                      <span className="font-label-md text-label-md text-outline">{formatDateTime(ticket.last_message.created_at)}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{ticket.last_message.message_body}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        title="Create New Support Ticket"
        actions={
          <div className="flex gap-md">
            <button onClick={() => setShowNewTicketModal(false)} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button onClick={handleNewTicketSubmit} disabled={newTicketLoading} className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">
              {newTicketLoading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleNewTicketSubmit} className="space-y-lg">
          <div>
            <label htmlFor="ticket-subject" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Subject <span className="text-error">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={newTicketForm.subject}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <label htmlFor="ticket-priority" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Priority
            </label>
            <select
              id="ticket-priority"
              value={newTicketForm.priority}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md"
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Standard support</option>
              <option value="high">High - Urgent issue</option>
              <option value="urgent">Urgent - Critical business impact</option>
            </select>
          </div>

          <div>
            <label htmlFor="ticket-message" className="block font-label-md text-label-md text-on-surface-variant mb-sm">
              Message <span className="text-error">*</span>
            </label>
            <textarea
              id="ticket-message"
              value={newTicketForm.message}
              onChange={(e) => setNewTicketForm(prev => ({ ...prev, message: e.target.value }))}
              rows={6}
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none"
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={selectedTicket?.subject}
        actions={
          <div className="flex gap-md">
            <button onClick={() => setSelectedTicket(null)} className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors">
              Close
            </button>
          </div>
        }
      >
        {selectedTicket && (
          <div className="space-y-lg max-h-[70vh] overflow-y-auto">
            <div className="flex flex-wrap items-center gap-3 p-md bg-surface-container rounded-xl border border-outline-variant">
              <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${getPriorityColor(selectedTicket.priority)}`}>
                {selectedTicket.priority}
              </span>
              <span className="font-label-md text-label-md text-outline ml-auto">
                {formatDateTime(selectedTicket.created_at)}
              </span>
            </div>

            <div className="space-y-md max-h-[50vh] overflow-y-auto pr-2">
              {selectedTicket.messages?.map((msg, idx) => (
                <div key={msg.id || idx} className={`p-md rounded-xl border ${msg.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-surface-container border-outline-variant'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {msg.is_internal ? (
                        <span className="material-symbols-outlined text-white text-sm">admin_panel_settings</span>
                      ) : (
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      )}
                    </div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">
                        {msg.is_internal ? 'Internal Note (Admin)' : (msg.sender_name || 'Support Team')}
                      </p>
                      <p className="font-label-md text-label-md text-outline">
                        {formatDateTime(msg.created_at)}
                      </p>
                    </div>
                    {msg.is_internal && (
                      <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-label-md text-label-md">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap">{msg.message_body}</p>
                </div>
              ))}
              {!selectedTicket.messages?.length && (
                <div className="text-center py-xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                  <p>No messages yet</p>
                </div>
              )}
            </div>

            <div className="p-lg bg-surface-container rounded-xl border border-outline-variant">
              <h4 className="font-title-lg text-title-lg text-on-surface mb-md">Reply to Ticket</h4>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-body-md text-body-md resize-none mb-md"
                placeholder="Type your reply here..."
              />
              <button
                onClick={() => handleReply(selectedTicket.id)}
                disabled={!replyText.trim() || replying}
                className="px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-sm"
              >
                {replying ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reply
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}