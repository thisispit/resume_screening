import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-bg-shapes">
        <div className="nb-shape nb-shape-1"></div>
        <div className="nb-shape nb-shape-2"></div>
      </div>
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">📋</span>
        <span className="brand-text">AI Resume Screening</span>
        <span className="brand-badge">AI</span>
      </Link>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/upload" className={location.pathname === '/upload' ? 'active' : ''}>
          <span className="nav-icon">📤</span>
          <span>Upload Resume</span>
        </Link>
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
