import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrder, updateOrder, deleteOrder } from '../services/api';
import { formatDateTime } from '../utils';
import { useNotification } from '../contexts/NotificationContext';
import Modal from '../components/Modal';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch {
        error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id, navigate, error]);

  async function handleStatusChange(newStatus) {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateOrder(id, { status: newStatus });
      setOrder(updated);
      success(`Order status updated to ${newStatus}`);
    } catch {
      error('Failed to update order status');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving) return;
    setSaving(true);
    try {
      await deleteOrder(id);
      success('Order deleted successfully');
      navigate('/orders');
    } catch {
      error('Failed to delete order');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-[800px] mx-auto space-y-lg">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{order.id}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">{order.campaignName || 'Untitled Campaign'}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="space-y-md">
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Status</span>
              <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                order.status === 'Running' ? 'bg-blue-100 text-blue-700' :
                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'Failed' ? 'bg-red-100 text-red-700' :
                'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Contacts</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">{order.contactCount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Estimated Cost</span>
              <span className="font-body-md text-body-md text-on-surface font-semibold">${order.estimatedCost || '0.00'}</span>
            </div>
          </div>
          <div className="space-y-md">
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Created</span>
              <span className="font-body-md text-body-md text-on-surface">{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Updated</span>
              <span className="font-body-md text-body-md text-on-surface">{formatDateTime(order.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">File</span>
              <span className="font-body-md text-body-md text-on-surface">{order.file?.filename || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Order Timeline</h2>
        <div className="space-y-4">
          {(() => {
            const steps = [
              { status: 'Created', time: order.createdAt, done: true },
              { status: 'Processing', time: order.status === 'Processing' ? order.updatedAt : null, done: ['Processing', 'Running', 'Completed'].includes(order.status) },
              { status: 'Running', time: order.status === 'Running' ? order.updatedAt : null, done: ['Running', 'Completed'].includes(order.status) },
              { status: 'Completed', time: order.status === 'Completed' ? order.updatedAt : null, done: order.status === 'Completed' },
            ].filter(s => s.done || s.time);
            return steps.map((step, i) => (
              <div key={step.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-primary' : 'bg-outline-variant'}`} />
                  {i < steps.length - 1 && <div className="w-0.5 h-8 bg-outline-variant" />}
                </div>
                <div className="pb-4">
                  <p className={`font-body-md text-body-md ${step.done ? 'text-on-surface font-semibold' : 'text-outline'}`}>{step.status}</p>
                  {step.time && (
                    <p className="font-label-md text-label-md text-outline">
                      {new Date(step.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface mb-lg">Actions</h2>
        <div className="flex flex-wrap gap-md">
          {order.status === 'Created' && (
            <button
              onClick={() => { setPendingStatus('Processing'); setShowStatusConfirm(true); }}
              disabled={saving}
              className="px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start Processing
            </button>
          )}
          {order.status === 'Processing' && (
            <button
              onClick={() => { setPendingStatus('Running'); setShowStatusConfirm(true); }}
              disabled={saving}
              className="px-xl py-2 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              Start Running
            </button>
          )}
          {(order.status === 'Running' || order.status === 'Processing') && (
            <button
              onClick={() => { setPendingStatus('Completed'); setShowStatusConfirm(true); }}
              disabled={saving}
              className="px-xl py-2 font-body-md text-body-md bg-green-600 text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              Mark Complete
            </button>
          )}
          <button
            onClick={() => setShowDelete(true)}
            disabled={saving}
            className="px-xl py-2 font-body-md text-body-md text-error border border-error rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete Order
          </button>
        </div>
      </div>

      <Modal
        isOpen={showStatusConfirm}
        onClose={() => { setShowStatusConfirm(false); setPendingStatus(null); }}
        title="Confirm Status Change"
        actions={
          <>
            <button
              onClick={() => { setShowStatusConfirm(false); setPendingStatus(null); }}
              className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowStatusConfirm(false); handleStatusChange(pendingStatus); }}
              disabled={saving}
              className="px-lg py-2 font-body-md text-body-md bg-primary text-white rounded-lg hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Confirm'}
            </button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          Change status from <strong>{order.status}</strong> to <strong>{pendingStatus}</strong>?
        </p>
      </Modal>

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Order"
        actions={
          <>
            <button
              onClick={() => setShowDelete(false)}
              className="px-lg py-2 font-body-md text-body-md text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-lg py-2 font-body-md text-body-md bg-error text-white rounded-lg hover:shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="font-body-md text-body-md text-on-surface-variant">
          Are you sure you want to delete order <strong>{order.id}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}