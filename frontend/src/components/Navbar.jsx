import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const { authenticated, user, logout } = useAuth()

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
        {authenticated && user?.role === 'recruiter' && (
          <Link to="/post-job" className={location.pathname === '/post-job' ? 'active' : ''}>
            <span className="nav-icon">➕</span>
            <span>Post Job</span>
          </Link>
        )}
        {authenticated ? (
          <button onClick={logout} className="nav-auth-btn logout">
            <span className="nav-icon">🚪</span>
            <span>{user?.full_name ?? 'Logout'}</span>
          </button>
        ) : (
          <Link to="/login" className="nav-auth-btn login">
            <span className="nav-icon">🔑</span>
            <span>Login</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
