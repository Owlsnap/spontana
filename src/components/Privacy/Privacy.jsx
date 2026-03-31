import { Link } from 'react-router-dom';
import './Privacy.css';

export default function Privacy() {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <Link to="/" className="privacy-back">← Back</Link>

        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Last updated: April 2025</p>

        <section className="privacy-section">
          <p>
            Spontana is an event discovery platform for Stockholm. This page explains
            what data we collect, why, and what you can do about it.
            No legalese. Just the facts.
          </p>
        </section>

        <section className="privacy-section">
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Email address</strong> — when you create an account. Used to log you in
              and send account-related emails (confirmation, password reset). Nothing else.
            </li>
            <li>
              <strong>Events you create</strong> — stored so they appear on the platform.
              You own this data and can delete it at any time.
            </li>
            <li>
              <strong>Events you save</strong> — stored against your account so your saved
              list persists across devices.
            </li>
            <li>
              <strong>Newsletter email</strong> — if you subscribe via the footer form.
              Used only to send the newsletter. Unsubscribe any time by emailing us.
            </li>
            <li>
              <strong>Session cookies</strong> — Supabase (our backend) sets a session cookie
              to keep you logged in. It contains no tracking identifiers and is deleted
              when you log out.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>What we don't collect</h2>
          <ul>
            <li>No advertising tracking</li>
            <li>No third-party analytics cookies</li>
            <li>No selling of data to anyone, ever</li>
            <li>No fingerprinting</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>Who handles your data</h2>
          <p>We use the following sub-processors. They are all EU-compliant:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — database and authentication. Hosted on AWS
              EU (Frankfurt). <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase privacy policy</a>.
            </li>
            <li>
              <strong>Vercel</strong> — frontend hosting. Processes request logs briefly
              for CDN purposes. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel privacy policy</a>.
            </li>
          </ul>
          <p>No other parties have access to your data.</p>
        </section>

        <section className="privacy-section">
          <h2>How long we keep it</h2>
          <ul>
            <li>Account data — until you delete your account</li>
            <li>Events you created — until you delete them or your account</li>
            <li>Newsletter subscriptions — until you unsubscribe</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>Your rights (GDPR)</h2>
          <p>
            You are covered by GDPR and Swedish IMY (Integritetsskyddsmyndigheten) rules.
            You have the right to:
          </p>
          <ul>
            <li><strong>Access</strong> — ask what data we hold on you</li>
            <li><strong>Correction</strong> — fix incorrect data</li>
            <li><strong>Erasure</strong> — delete your account and all associated data</li>
            <li><strong>Portability</strong> — get a copy of your data</li>
            <li><strong>Objection</strong> — object to how we process your data</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:hello@spontana.app">hello@spontana.app</a>.
            We'll respond within 30 days.
          </p>
          <p>
            You can also delete your account directly from the{' '}
            <Link to="/myevents">My Events</Link> page — this permanently removes
            your account and all data we hold on you.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Cookies</h2>
          <p>
            We use one session cookie, set by Supabase, to keep you logged in.
            It is a strictly necessary cookie — no tracking, no ads, no analytics.
            Declining cookies means you can browse but not log in.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Contact</h2>
          <p>
            Questions about your privacy? Email{' '}
            <a href="mailto:hello@spontana.app">hello@spontana.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
