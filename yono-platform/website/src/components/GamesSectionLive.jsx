import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppsLogo from '../assets/images/yonogames.png';
import {
  faBuildingColumns,
  faDownload,
  faGift
} from '@fortawesome/free-solid-svg-icons';


const API = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : '';


function GamesSectionLive() {
  const [activeTab, setActiveTab] = useState('new');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadGames() {
      try {
        const response = await fetch(`${API}/api/games`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Could not load games (${response.status}).`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('The games API returned an invalid response.');
        setGames(data);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadGames();
    return () => controller.abort();
  }, []);

  const visibleGames = activeTab === 'old'
    ? games.filter(game => game.isFeatured)
    : games;

  function downloadLink(game) {
    return `${API}/api/download/${encodeURIComponent(game.slug)}`;
  }

  function referralLink(game) {
    return `${API}/api/referral/${encodeURIComponent(game.slug)}`;
  }

  function renderGame(game) {
    return (
      <li className="app-item-yono-games" key={game.id}>
        <div className="app-icon-yg-container">
          <img
            src={game.thumbnail ? `${API}${game.thumbnail}` : AppsLogo}
            alt={`${game.name} app logo`}
            className="app-icon_dont_copy_created_by_yono-games"
            loading="lazy"
          />
        </div>
        <div className="app-details_dont_copy_created_by_yono-games">
          <h3 className="app-title_dont_copy_created_by_yono-games">{game.name}</h3>
          {game.signupBonus && (
            <span className="bonus-amount_dont_copy_created_by_yono-games">
              <FontAwesomeIcon icon={faGift} aria-hidden="true" /> Sign Up Bonus {game.signupBonus}<br />
            </span>
          )}
          {game.minWithdrawal && (
            <span className="withdrawal-amount_dont_copy_created_by_yono-games">
              <FontAwesomeIcon icon={faBuildingColumns} aria-hidden="true" /> Min. Withdraw {game.minWithdrawal}
            </span>
          )}
          {game.description && <p className="download-count">{game.description}</p>}
        </div>
        <div className="game-actions">
          {game.hasApk && (
            <a href={downloadLink(game)} className="download-button_dont_copy_created_by_yono-games">
              <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Download APK
            </a>
          )}
          {game.hasReferralLink && (
            <a href={referralLink(game)} className="referral-button" target="_blank" rel="noreferrer">
              Official / referral link
            </a>
          )}
          {!game.hasApk && !game.hasReferralLink && (
            <span className="download-button_dont_copy_created_by_yono-games" aria-disabled="true" title="No APK or referral link is available">
              Link unavailable
            </span>
          )}
        </div>
      </li>
    );
  }

  return (
    <section className="section" id="apps">
      <div className="section-header">
        <h2 className="section-title">All Yono Games Apps &amp; Yono Rummy Overview</h2>
        <p className="section-subtitle">
          Compare listed apps using reported signup bonus and minimum withdrawal information. Figures are indicative, not a current offer or payout promise; confirm terms with the operator.
        </p>
      </div>
      <div className="tabs">
        <button id="newTab" className={`tab ${activeTab === 'new' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('new')}>All Apps</button>
        <button id="oldTab" className={`tab ${activeTab === 'old' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('old')}>New / Highlighted</button>
      </div>

      <div id={activeTab === 'new' ? 'new' : 'old'} className="content active">
        {loading && <p role="status">Loading games…</p>}
        {error && <p role="alert">{error} Please try again later.</p>}
        {!loading && !error && visibleGames.length === 0 && (
          <p role="status">{activeTab === 'old' ? 'No highlighted games are published yet.' : 'No published games are available yet.'}</p>
        )}
        {visibleGames.length > 0 && <ul className="app-list-yono-games">{visibleGames.map(renderGame)}</ul>}
      </div>

      <div className="table-scroll" role="region" aria-label="Scroll the app comparison table" tabIndex={0}>
        <table id="iTable" aria-label="Yono Games app comparison">
          <thead>
            <tr><th scope="col">App Logo</th><th scope="col">App Name</th><th scope="col">Signup Bonus</th><th scope="col">Min. Withdrawal</th><th scope="col">Action</th></tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={game.id}>
                <td><img className="table-logo" src={game.thumbnail ? `${API}${game.thumbnail}` : AppsLogo} alt={`${game.name} app logo`} loading="lazy" width={42} height={42} /></td>
                <td>{game.name}</td>
                <td>{game.signupBonus || 'Not listed; confirm terms'}</td>
                <td>{game.minWithdrawal || 'Not listed; confirm in app'}</td>
                <td>
                  <div className="game-actions">
                    {game.hasApk && <a className="table-action" href={downloadLink(game)} aria-label={`Download ${game.name} APK`}>Download APK</a>}
                    {game.hasReferralLink && <a className="table-action" href={referralLink(game)} target="_blank" rel="noreferrer" aria-label={`Open ${game.name} referral link`}>Referral link</a>}
                    {!game.hasApk && !game.hasReferralLink && <span>Link unavailable</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default GamesSectionLive;
