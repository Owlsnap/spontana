import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function Admin() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null); // id of event being actioned

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, event_name, date, start_time, city, category, created_by, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(error.message);
    } else {
      setEvents(data ?? []);
    }
    setLoading(false);
  }

  async function approve(id) {
    setWorking(id);
    const { error } = await supabase
      .from('events')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Event approved.');
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    setWorking(null);
  }

  async function reject(id) {
    setWorking(id);
    const { error } = await supabase
      .from('events')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast('Event rejected.');
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    setWorking(null);
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin</h1>
        <span className="admin-subtitle">Pending event approvals</span>
      </div>

      {loading ? (
        <p className="admin-loading">Loading...</p>
      ) : events.length === 0 ? (
        <div className="admin-empty">
          <p>Nothing pending. You're up to date.</p>
        </div>
      ) : (
        <div className="admin-list">
          <div className="admin-count">{events.length} pending</div>
          {events.map(event => (
            <div key={event.id} className="admin-row">
              <div className="admin-event-info">
                <span className="admin-event-name">{event.event_name || '—'}</span>
                <span className="admin-event-meta">
                  {event.date && <span>{event.date}</span>}
                  {event.start_time && <span>{event.start_time}</span>}
                  {event.city && <span>{event.city}</span>}
                  {event.category && <span className="admin-category">{event.category}</span>}
                </span>
                <span className="admin-creator" title={event.created_by}>
                  by {event.created_by ? event.created_by.slice(0, 8) + '…' : 'unknown'}
                </span>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-btn admin-approve"
                  onClick={() => approve(event.id)}
                  disabled={working === event.id}
                >
                  {working === event.id ? '…' : 'Approve'}
                </button>
                <button
                  className="admin-btn admin-reject"
                  onClick={() => reject(event.id)}
                  disabled={working === event.id}
                >
                  {working === event.id ? '…' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
