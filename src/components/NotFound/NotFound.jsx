import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-container">
      <span className="notfound-code">404</span>
      <h1 className="notfound-title">Nothing here.</h1>
      <p className="notfound-text">That page doesn't exist. Try something else.</p>
      <Link to="/" className="notfound-link">← Back to events</Link>
    </div>
  );
}
