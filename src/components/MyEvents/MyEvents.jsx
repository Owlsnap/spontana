import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase } from '../../lib/supabase';
import { dbRowToEvent } from '../../lib/mapEvent';
import './MyEvents.css';

const SWEDISH_CITIES = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping",
  "Örebro", "Västerås", "Helsingborg", "Norrköping", "Jönköping",
];

export default function MyEvents() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const deleteTimers = useRef({});

  useEffect(() => {
    if (!user) return;
    fetchMyEvents();
  }, [user]);

  async function fetchMyEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .eq('source', 'user')
      .order('date', { ascending: true });

    if (!error && data) {
      setEvents(data.map(dbRowToEvent));
    }
    setLoading(false);
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function startEdit(event) {
    setEditingId(event.id);
    setEditForm({
      eventName: event.eventName,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.location?.venue || '',
      city: event.location?.city || 'Stockholm',
      description: event.description,
      price: event.price?.amount ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(eventId) {
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .update({
        event_name: editForm.eventName,
        date: editForm.date,
        start_time: editForm.startTime,
        end_time: editForm.endTime,
        venue: editForm.venue,
        city: editForm.city,
        description: editForm.description,
        price_amount: parseInt(editForm.price) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .eq('created_by', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      setEvents(prev => prev.map(ev => {
        if (ev.id !== eventId) return ev;
        return {
          ...ev,
          eventName: editForm.eventName,
          date: editForm.date,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          location: { ...ev.location, venue: editForm.venue, city: editForm.city },
          description: editForm.description,
          price: { ...ev.price, amount: parseInt(editForm.price) || 0 },
        };
      }));
      toast.success(t('auth.eventUpdated'));
      setEditingId(null);
    }
    setSaving(false);
  }

  // ── Delete with Undo ─────────────────────────────────────────────────────────

  function handleDelete(event) {
    // Optimistically remove from list
    setEvents(prev => prev.filter(ev => ev.id !== event.id));

    let undone = false;

    const toastId = toast(t('auth.eventDeleted'), {
      duration: 4000,
      action: {
        label: t('auth.undo'),
        onClick: () => {
          undone = true;
          clearTimeout(deleteTimers.current[event.id]);
          delete deleteTimers.current[event.id];
          setEvents(prev => {
            // Re-insert in sorted order by date
            const restored = [...prev, event].sort((a, b) =>
              (a.date || '').localeCompare(b.date || '')
            );
            return restored;
          });
          toast.dismiss(toastId);
        },
      },
      onAutoClose: () => commitDelete(event.id, undone),
      onDismiss: () => commitDelete(event.id, undone),
    });

    // Safety net timer in case Sonner callbacks don't fire
    deleteTimers.current[event.id] = setTimeout(() => {
      commitDelete(event.id, undone);
    }, 4500);
  }

  async function commitDelete(eventId, undone) {
    if (undone) return;
    // Guard: only delete once
    if (!deleteTimers.current[eventId] && deleteTimers.current[eventId] !== undefined) return;
    clearTimeout(deleteTimers.current[eventId]);
    delete deleteTimers.current[eventId];

    await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('created_by', user.id);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="myevents-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="myevents-container">
      <h1 className="myevents-title">{t('auth.myEvents')}</h1>

      {events.length === 0 ? (
        <div className="myevents-empty">
          <p>{t('auth.noMyEvents')}</p>
          <Link to="/createevent" className="myevents-create-link">{t('welcome.createEvent')}</Link>
        </div>
      ) : (
        <div className="myevents-list">
          {events.map(event => (
            <div key={event.id} className="myevents-card">
              {editingId === event.id ? (
                <div className="myevents-edit-form">
                  <div className="edit-row">
                    <label>{t('createEvent.eventName')}</label>
                    <input
                      value={editForm.eventName}
                      onChange={e => setEditForm(f => ({ ...f, eventName: e.target.value }))}
                    />
                  </div>
                  <div className="edit-row edit-row-3col">
                    <div>
                      <label>{t('createEvent.date')}</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>{t('createEvent.startTime')}</label>
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>{t('createEvent.endTime')}</label>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="edit-row edit-row-2col">
                    <div>
                      <label>{t('createEvent.venue')}</label>
                      <input
                        value={editForm.venue}
                        onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label>{t('createEvent.city')}</label>
                      <select
                        value={editForm.city}
                        onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      >
                        {SWEDISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="edit-row">
                    <label>{t('createEvent.price')}</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                  <div className="edit-row">
                    <label>{t('createEvent.description')}</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="edit-actions">
                    <button className="edit-cancel-btn" onClick={cancelEdit} disabled={saving}>
                      {t('common.cancel')}
                    </button>
                    <button className="edit-save-btn" onClick={() => saveEdit(event.id)} disabled={saving}>
                      {saving ? '...' : t('common.save')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    className="myevents-thumb"
                    src={event.img || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400&auto=format'}
                    alt={event.eventName}
                  />
                  <div className="myevents-info">
                    <h3 className="myevents-name">{event.eventName}</h3>
                    <p className="myevents-meta">
                      {event.date}
                      {event.startTime && ` · ${event.startTime}`}
                      {event.location?.city && ` · ${event.location.city}`}
                      {event.type && ` · ${event.type}`}
                    </p>
                    {event.description && (
                      <p className="myevents-desc">
                        {event.description.length > 120
                          ? event.description.slice(0, 120) + '…'
                          : event.description}
                      </p>
                    )}
                  </div>
                  <div className="myevents-actions">
                    <button className="myevents-edit-btn" onClick={() => startEdit(event)}>
                      {t('common.edit')}
                    </button>
                    <button className="myevents-delete-btn" onClick={() => handleDelete(event)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
