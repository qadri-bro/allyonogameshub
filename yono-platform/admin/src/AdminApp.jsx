import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Edit2, ExternalLink, Gamepad2, LayoutDashboard, LogOut, Plus,
  RefreshCw, Search, Trash2, UploadCloud, X
} from 'lucide-react';
import './style.css';
import './admin-enhancements.css';

const API = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : '';

const WEBSITE = import.meta.env.DEV
  ? (import.meta.env.VITE_WEBSITE_URL || 'http://localhost:5173')
  : '';

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, clicks: 0 });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [featured, setFeatured] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  function logout() {
    localStorage.removeItem('gh_token');
    setToken('');
  }

  async function load() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [gamesResponse, statsResponse] = await Promise.all([
        fetch(`${API}/api/admin/games`, { headers }),
        fetch(`${API}/api/admin/stats`, { headers })
      ]);
      if (gamesResponse.status === 401 || statsResponse.status === 401) {
        logout();
        return;
      }
      const [gameData, statsData] = await Promise.all([
        readResponse(gamesResponse),
        readResponse(statsResponse)
      ]);
      setGames(gameData);
      setStats(statsData);
    } catch (requestError) {
      setError(requestError.message || 'Cannot connect to API. Start the backend first.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await readResponse(response);
      localStorage.setItem('gh_token', data.token);
      setToken(data.token);
      setPassword('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openNew() {
    setEditing(null);
    setFeatured(false);
    setModal(true);
  }

  function openEdit(game) {
    setEditing(game);
    setFeatured(Boolean(game.isFeatured));
    setModal(true);
  }

  async function remove(id) {
    if (!window.confirm('Delete this game and its uploaded files?')) return;
    setError('');
    try {
      await readResponse(await fetch(`${API}/api/admin/games/${id}`, {
        method: 'DELETE',
        headers
      }));
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('isFeatured', String(featured));
    try {
      const response = await fetch(
        `${API}/api/admin/games${editing ? `/${editing.id}` : ''}`,
        { method: editing ? 'PUT' : 'POST', headers, body: form }
      );
      await readResponse(response);
      setModal(false);
      setEditing(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const filtered = games.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!token) {
    return (
      <div className="login-wrap">
        <form className="login" onSubmit={login}>
          <div className="logo"><Gamepad2 /></div>
          <span className="overline">GAMEHUB CONTROL CENTER</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage your game library.</p>
          {error && <div className="error">{error}</div>}
          <label>Email address
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="admin@example.com" />
          </label>
          <label>Password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} required placeholder="Enter password" />
          </label>
          <button className="btn primary full">Sign in to dashboard</button>
          <small>Admin access only · Secure session</small>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebrand">
          <span><Gamepad2 /></span>
          <b>GAMEHUB<small>ADMIN PANEL</small></b>
        </div>
        <div className="side-label">WORKSPACE</div>
        <a className="side-link active"><LayoutDashboard size={18} /> Dashboard</a>
        <a className="side-link active"><Gamepad2 size={18} /> Games library</a>
        <div className="side-bottom">
          <div className="admin-user">
            <div className="avatar">A</div>
            <span><b>Administrator</b><small>Full access</small></span>
          </div>
          <button onClick={logout} className="logout"><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="overline">OVERVIEW</span><h1>Dashboard</h1></div>
          <div className="top-actions">
            <a href={WEBSITE} target="_blank" rel="noreferrer">View website <ExternalLink size={15} /></a>
            <button className="btn primary" onClick={openNew}><Plus size={17} /> Add new game</button>
          </div>
        </header>
        {error && <div className="error notice" role="alert">{error}<button onClick={() => setError('')}><X size={15} /></button></div>}

        <section className="stats">
          <div className="stat"><span>Total games</span><b>{stats.total}</b><small>All listings</small><Gamepad2 /></div>
          <div className="stat"><span>Published</span><b>{stats.published}</b><small>Visible on website</small><LayoutDashboard /></div>
          <div className="stat"><span>Download / referral clicks</span><b>{stats.clicks}</b><small>Clicks only, not installs or sign-ups</small><ExternalLink /></div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><h2>Game library</h2><p>Manage your listings, download links, APKs and highlights.</p></div>
            <div className="tools">
              <div className="search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search games" /></div>
              <button className="icon-btn" onClick={load} title="Refresh" disabled={loading}><RefreshCw size={17} /></button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>GAME</th><th>CATEGORY</th><th>VERSION</th><th>CLICKS</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {filtered.map(game => (
                  <tr key={game.id}>
                    <td><div className="game-name">{game.thumbnail ? <img src={`${API}${game.thumbnail}`} alt="" /> : <span className="mini"><Gamepad2 /></span>}<b>{game.name}</b></div></td>
                    <td>{game.category}</td><td>{game.version || '—'}</td><td>{game.clicks}</td>
                    <td><span className={`status ${game.status}`}>{game.status}</span>{game.isFeatured && <span className="featured-tag">Featured</span>}</td>
                    <td><div className="actions"><button onClick={() => openEdit(game)} title="Edit"><Edit2 size={16} /></button><button onClick={() => remove(game.id)} title="Delete"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="no-data">{loading ? 'Loading games…' : 'No games found. Add your first game to get started.'}</div>}
          </div>
        </section>
        <div className="footnote">Uploads are saved on your backend server. Only publish listings and links you are authorised to share.</div>
      </main>

      {modal && (
        <div className="overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) { setModal(false); setEditing(null); }
        }}>
          <form className="modal" onSubmit={save}>
            <div className="modal-head">
              <div><span className="overline">GAME MANAGEMENT</span><h2>{editing ? 'Edit game' : 'Add a new game'}</h2></div>
              <button type="button" className="icon-btn" onClick={() => { setModal(false); setEditing(null); }}><X /></button>
            </div>
            <div className="form-grid">
              <label>Game name *<input name="name" required defaultValue={editing?.name || ''} placeholder="e.g. Classic Puzzle" /></label>
              <label>Category<input name="category" defaultValue={editing?.category || 'Featured'} placeholder="Arcade, Puzzle..." /></label>
              <label>Signup bonus (reported)<input name="signupBonus" defaultValue={editing?.signupBonus || ''} placeholder="e.g. Approx. ₹25" /></label>
              <label>Minimum withdrawal (reported)<input name="minWithdrawal" defaultValue={editing?.minWithdrawal || ''} placeholder="e.g. Around ₹100" /></label>
              <label>Version<input name="version" defaultValue={editing?.version || '1.0.0'} /></label>
              <label>File size<input name="size" defaultValue={editing?.size || ''} placeholder="e.g. 45 MB" /></label>
              <label className="wide">Description<textarea name="description" rows="3" defaultValue={editing?.description || ''} placeholder="Short game description" /></label>
              <label className="wide">Download / referral link
                <input name="referralUrl" type="text" defaultValue={editing?.referralUrl || ''} placeholder="https://... or /games/..." />
                <small>Use the provider's official HTTPS referral link. The website shows this separately from an uploaded APK; only the provider can confirm sign-ups or login attribution.</small>
              </label>
              <label>Upload APK (.apk)<input name="apk" type="file" accept=".apk" /><small>{editing?.hasApk ? 'An APK is already uploaded. Choose a file to replace it.' : 'Maximum 120 MB.'}</small></label>
              <label>Thumbnail image<input name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" /><small>JPG, PNG or WEBP</small></label>
              <label className="wide">Listing status
                <select name="status" defaultValue={editing?.status || 'draft'}>
                  <option value="draft">Draft — hidden from website</option>
                  <option value="published">Published — visible on website</option>
                </select>
              </label>
              <label className="wide checkbox-row">
                <input type="checkbox" checked={featured} onChange={event => setFeatured(event.target.checked)} />
                Show in the “New / Highlighted” tab
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn light" onClick={() => { setModal(false); setEditing(null); }}>Cancel</button>
              <button disabled={busy} className="btn primary">{busy ? 'Saving...' : editing ? 'Save changes' : 'Add game'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
