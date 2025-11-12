import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw, Trash2, AlertTriangle, Flame, CircleCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:3000/api';

export default function Notifications() {
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      // When opening, try to populate. If empty, trigger evaluation to create alerts.
      if (notifications.length === 0 && !loading) {
        try {
          await triggerBudgetCheck();
        } catch (_) {
          // fallback to simple fetch
          await fetchNotifications();
        }
      } else {
        await fetchNotifications();
      }
    }
  };

  const typeStyles = (n) => {
    const base = 'p-2 border rounded flex items-start justify-between';
    if (n.is_read) return `${base} bg-gray-50 border-gray-200`;
    switch (n.type) {
      case 'budget_exceeded':
        return `${base} bg-red-50 border-red-200`;
      case 'budget_fully_used':
        return `${base} bg-orange-50 border-orange-200`;
      case 'budget_warning':
      default:
        return `${base} bg-yellow-50 border-yellow-200`;
    }
  };

  const typeIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return <Flame size={16} className="text-red-600" />;
      case 'budget_fully_used':
        return <CircleCheck size={16} className="text-orange-600" />;
      case 'budget_warning':
      default:
        return <AlertTriangle size={16} className="text-yellow-700" />;
    }
  };

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

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center text-xs bg-red-600 text-white rounded-full px-2">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-96 bg-white border rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Notifications</span>
              {loading && <span className="text-xs text-gray-500">Loading...</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={triggerBudgetCheck} className="text-gray-600 hover:text-gray-900" title="Refresh budgets">
                <RefreshCw size={16} />
              </button>
              <button onClick={markAllRead} className="text-gray-600 hover:text-gray-900" title="Mark all read">
                <CheckCheck size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.notification_id} className={typeStyles(n)}>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      {typeIcon(n.type)}
                      <p className={`font-medium ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.type.replaceAll('_', ' ')}</p>
                    </div>
                    <p className="text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
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
              ))
            )}
          </div>

          <div className="flex items-center justify-end mt-2">
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}