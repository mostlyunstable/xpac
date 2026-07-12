import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminUsers, fetchAdminUser, updateAdminUser, deactivateUser, activateUser } from '../../services/api';
import { formatDateTime } from '../../utils';
import { SkeletonCard } from '../../components/Skeleton';
import { useNotification } from '../../contexts/NotificationContext';

const STATUS_OPTIONS = ['All', 'active', 'suspended', 'deleted'];

export default function AdminUsers() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', company: '', status: '' });
  const [saving, setSaving] = useState(false);
  const fetchIdRef = useRef(0);

  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async (pageNum = page) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const data = await fetchAdminUsers({ 
        search: debouncedSearch, 
        status: status === 'All' ? undefined : status,
        page: pageNum, 
        limit: 20 
      });
      if (fetchId !== fetchIdRef.current) return;
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      if (fetchId !== fetchIdRef.current) return;
      setUsers([]);
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  async function handleEdit(user) {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, company: user.company || '', status: user.status });
    setEditingUser(user);
    setShowUserModal(true);
  }

  async function handleView(user) {
    try {
      const data = await fetchAdminUser(user.id);
      setSelectedUser(data);
      setShowUserModal(true);
    } catch (err) {
      notifyError('Failed to load user details');
    }
  }

  async function handleSaveEdit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updated = await updateAdminUser(editingUser.id, editForm);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
      notifySuccess('User updated successfully!');
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      notifyError('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!selectedUser) return;
    try {
      await deactivateUser(selectedUser.id);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: 'suspended' } : u));
      notifySuccess('User deactivated');
      setShowUserModal(false);
    } catch (err) {
      notifyError('Failed to deactivate user');
    }
  }

  async function handleActivate() {
    if (!selectedUser) return;
    try {
      await activateUser(selectedUser.id);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: 'active' } : u));
      notifySuccess('User activated');
      setShowUserModal(false);
    } catch (err) {
      notifyError('Failed to activate user');
    }
  }

  function openEditFromView() {
    if (!selectedUser) return;
    setEditForm({ name: selectedUser.name, email: selectedUser.email, company: selectedUser.company || '', status: selectedUser.status });
    setEditingUser(selectedUser);
  }

  if (loading) {
    return (
      <div className="space-y-lg">
        <div className="animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-lg">Customer Management</h1>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Customer Management</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{total} total customers</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-md animate-stagger animate-stagger-1">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">people</span>
          <p className="font-title-lg text-title-lg text-on-surface mb-2">No customers found</p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {search || status !== 'All' ? 'Try adjusting your filters' : 'No customers registered yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Customer</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Company</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Last Login</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Created</th>
                    <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-surface-container-low transition-colors animate-stagger" style={{ animationDelay: `${index * 40}ms` }}>
                      <td className="px-lg py-4">
                        <span className="font-body-md text-body-md font-semibold text-primary">{user.name}</span>
                        <p className="font-label-md text-label-md text-outline truncate max-w-xs">{user.id}</p>
                      </td>
                      <td className="px-lg py-4 font-body-md text-body-md text-on-surface">{user.company || '—'}</td>
                      <td className="px-lg py-4">
                        <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">
                        {user.last_login ? formatDateTime(user.last_login) : 'Never'}
                      </td>
                      <td className="px-lg py-4 font-label-md text-label-md text-outline">{formatDateTime(user.created_at)}</td>
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(user)}
                            className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex"
                            title="View details"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant">visibility</span>
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-full hover:bg-surface-container-high transition-colors inline-flex"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-on-surface-variant">edit</span>
                          </button>
                          {user.status === 'active' && (
                            <button
                              onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                              className="p-2 rounded-full hover:bg-red-50 transition-colors inline-flex text-error"
                              title="Deactivate"
                            >
                              <span className="material-symbols-outlined text-error">block</span>
                            </button>
                          )}
                          {user.status === 'suspended' && (
                            <button
                              onClick={() => { setSelectedUser(user); handleActivate(); }}
                              className="p-2 rounded-full hover:bg-green-50 transition-colors inline-flex text-green-600"
                              title="Activate"
                            >
                              <span className="material-symbols-outlined text-green-600">check_circle</span>
                            </button>
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
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
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

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}