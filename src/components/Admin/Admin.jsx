import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import './Admin.css';

const TABS = ['Approvals', 'Events', 'Stats'];
const PAGE_SIZE = 50;

export default function Admin() {
  const [tab, setTab] = useState('Approvals');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin</h1>
      </div>
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="admin-panel">
        {tab === 'Approvals' && <ApprovalsTab />}
        {tab === 'Events' && <EventsTab />}
        {tab === 'Stats' && <StatsTab />}
      </div>
    </div>
  );
}

// ── Approvals ────────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);

  useEffect(() => { fetchPending(); }, []);

  async function fetchPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, event_name, date, start_time, city, type, created_by, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) toast.error(error.message);
    else setEvents(data ?? []);
    setLoading(false);
  }

  async function approve(id) {
    setWorking(id);
    const { error } = await supabase.from('events').update({ status: 'active' }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Event approved.'); setEvents(prev => prev.filter(e => e.id !== id)); }
    setWorking(null);
  }

  async function reject(id) {
    setWorking(id);
    const { error } = await supabase.from('events').update({ status: 'rejected' }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast('Event rejected.'); setEvents(prev => prev.filter(e => e.id !== id)); }
    setWorking(null);
  }

  if (loading) return <p className="admin-empty">Loading...</p>;
  if (events.length === 0) return <p className="admin-empty">Nothing pending. You're up to date.</p>;

  return (
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
              {event.type && (
                <span className="admin-badge">{event.type}</span>
              )}
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
  );
}

// ── Events ───────────────────────────────────────────────────────────────────

const SOURCE_OPTIONS = ['all', 'ticketmaster', 'visitstockholm', 'user'];
const STATUS_OPTIONS = ['all', 'active', 'pending', 'rejected'];

const SORT_COLUMNS = {
  event_name: 'Name',
  date: 'Date',
  created_at: 'Added',
};

function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortCol, setSortCol] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { setPage(0); }, [source, status, search, sortCol, sortAsc]);

  useEffect(() => { fetchEvents(); }, [source, status, search, sortCol, sortAsc, page]);

  async function fetchEvents() {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('id, event_name, date, source, status, type, created_at', { count: 'exact' })
      .order(sortCol, { ascending: sortAsc })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (source !== 'all') query = query.eq('source', source);
    if (status !== 'all') query = query.eq('status', status);
    if (search.trim()) query = query.ilike('event_name', `%${search.trim()}%`);

    const { data, error, count } = await query;
    if (error) toast.error(error.message);
    else { setEvents(data ?? []); setTotal(count ?? 0); }
    setLoading(false);
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast('Event deleted.'); setEvents(prev => prev.filter(e => e.id !== id)); setTotal(t => t - 1); }
    setConfirmDelete(null);
  }

  function toggleSort(col) {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <form className="admin-search-row" onSubmit={handleSearch}>
        <input
          className="admin-search"
          type="text"
          placeholder="Search by name…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <button className="admin-btn admin-search-btn" type="submit">Search</button>
        {search && (
          <button className="admin-btn-text muted" type="button" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Clear
          </button>
        )}
      </form>

      <div className="admin-filters">
        <div className="admin-filter-group">
          <label className="admin-filter-label">Source</label>
          <div className="admin-filter-pills">
            {SOURCE_OPTIONS.map(s => (
              <button
                key={s}
                className={`admin-pill${source === s ? ' active' : ''}`}
                onClick={() => setSource(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-filter-group">
          <label className="admin-filter-label">Status</label>
          <div className="admin-filter-pills">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className={`admin-pill${status === s ? ' active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="admin-empty">Loading...</p>
      ) : events.length === 0 ? (
        <p className="admin-empty">No events match these filters.</p>
      ) : (
        <>
          <div className="admin-count">{total} events</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {Object.entries(SORT_COLUMNS).map(([col, label]) => (
                    <th key={col} className="admin-th-sortable" onClick={() => toggleSort(col)}>
                      {label}
                      <span className="admin-sort-icon">
                        {sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕'}
                      </span>
                    </th>
                  ))}
                  <th>Source</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td className="admin-td-name">{event.event_name || '—'}</td>
                    <td className="admin-td-mono">{event.date || '—'}</td>
                    <td className="admin-td-mono">{event.created_at ? event.created_at.slice(0, 10) : '—'}</td>
                    <td><span className={`admin-badge source-${event.source}`}>{event.source}</span></td>
                    <td><span className={`admin-badge status-${event.status}`}>{event.status}</span></td>
                    <td className="admin-td-muted">{event.type || '—'}</td>
                    <td className="admin-td-actions">
                      {confirmDelete === event.id ? (
                        <span className="admin-confirm-row">
                          <button className="admin-btn-text danger" onClick={() => deleteEvent(event.id)}>Delete</button>
                          <button className="admin-btn-text" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button className="admin-btn-text muted" onClick={() => setConfirmDelete(event.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn-page"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                ← Prev
              </button>
              <span className="admin-page-info">{page + 1} / {totalPages}</span>
              <button
                className="admin-btn admin-btn-page"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: total },
      { count: ticketmaster },
      { count: visitstockholm },
      { count: userSubmitted },
      { count: active },
      { count: pending },
      { count: rejected },
      { count: thisWeek },
      { count: thisMonth },
    ] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('source', 'ticketmaster'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('source', 'visitstockholm'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('source', 'user'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ]);

    setStats({ total, ticketmaster, visitstockholm, userSubmitted, active, pending, rejected, thisWeek, thisMonth });
    setLoading(false);
  }

  if (loading) return <p className="admin-empty">Loading...</p>;

  return (
    <div className="admin-stats">
      <div className="admin-stats-section">
        <div className="admin-stats-label">Overview</div>
        <div className="admin-stats-grid">
          <StatCard label="Total events" value={stats.total} />
          <StatCard label="Added this week" value={stats.thisWeek} accent />
          <StatCard label="Added this month" value={stats.thisMonth} />
        </div>
      </div>

      <div className="admin-stats-section">
        <div className="admin-stats-label">By source</div>
        <div className="admin-stats-grid">
          <StatCard label="Ticketmaster" value={stats.ticketmaster} />
          <StatCard label="Visitstockholm" value={stats.visitstockholm} />
          <StatCard label="User submitted" value={stats.userSubmitted} />
        </div>
      </div>

      <div className="admin-stats-section">
        <div className="admin-stats-label">By status</div>
        <div className="admin-stats-grid">
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Pending approval" value={stats.pending} warn={stats.pending > 0} />
          <StatCard label="Rejected" value={stats.rejected} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, warn }) {
  return (
    <div className={`admin-stat-card${accent ? ' accent' : ''}${warn ? ' warn' : ''}`}>
      <span className="admin-stat-value">{value ?? '—'}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}
