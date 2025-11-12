import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, RefreshCw, Trash2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:3000/api';

export default function NotificationsPage() {
  const token = localStorage.getItem('accessToken');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all | unread | warning | fully_used | exceeded

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load notifications');
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('❌ Notifications fetch error:', err.message);
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const triggerBudgetCheck = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/check-budgets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to check budgets');
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(data.unreadCount || 0);
      toast.success('Budgets evaluated');
    } catch (err) {
      console.error('❌ Budget check error:', err.message);
      toast.error(err.message || 'Failed to check budgets');
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchNotifications();
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('❌ Mark all read error:', err.message);
      toast.error(err.message || 'Failed to mark all read');
    }
  };

  const markOneRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchNotifications();
        toast.success('Notification marked as read');
      }
    } catch (err) {
      console.error('❌ Mark read error:', err.message);
      toast.error(err.message || 'Failed to mark read');
    }
  };

  const deleteOne = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchNotifications();
        toast.success('Notification deleted');
      }
    } catch (err) {
      console.error('❌ Delete notification error:', err.message);
      toast.error(err.message || 'Failed to delete notification');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'warning':
        return notifications.filter(n => n.type === 'budget_warning');
      case 'fully_used':
        return notifications.filter(n => n.type === 'budget_fully_used');
      case 'exceeded':
        return notifications.filter(n => n.type === 'budget_exceeded');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-gray-500">Unread: {unreadCount}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={triggerBudgetCheck} className="px-3 py-2 rounded border hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw size={16} /> Refresh budgets
          </button>
          <button onClick={markAllRead} className="px-3 py-2 rounded border hover:bg-gray-50 flex items-center gap-2">
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="warning">Warnings (≥80%)</option>
          <option value="fully_used">Fully Used (100%)</option>
          <option value="exceeded">Exceeded (&gt;100%)</option>
        </select>
      </div>

      <div className="grid gap-2">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div key={n.notification_id} className={`p-3 border rounded ${n.is_read ? 'bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{n.type.replaceAll('_', ' ')}</p>
                  <p className="text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!n.is_read && (
                    <button onClick={() => markOneRead(n.notification_id)} className="text-blue-600 hover:text-blue-800" title="Mark read">
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button onClick={() => deleteOne(n.notification_id)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}