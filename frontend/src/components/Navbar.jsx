import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const { authenticated, user, logout } = useAuth()

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
  const isRecruiter = user?.role === 'recruiter'

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
        <span className="brand-text">ResumeScreen</span>
        <span className="brand-edition-tag">Pro</span>
      </Link>

      <nav className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/upload" className={location.pathname === '/upload' ? 'active' : ''}>
          Upload Resume
        </Link>
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          Dashboard
        </Link>
        {authenticated && isRecruiter && (
          <Link to="/post-job" className={location.pathname === '/post-job' ? 'active' : ''}>
            Post a Job
          </Link>
        )}

        {authenticated ? (
          <div className="nav-user-actions">
            <div className="nav-profile-pill">
              <span className="nav-avatar-circle">{userInitial}</span>
              <div className="nav-user-details">
                <span className="nav-user-name">{user?.full_name?.split(' ')[0]}</span>
                <span className="nav-user-role-label">{isRecruiter ? 'Recruiter' : 'Candidate'}</span>
              </div>
            </div>
            <button onClick={logout} className="nav-auth-btn logout" title="Sign out">
              Sign Out
            </button>
          </div>
        ) : (
          <div className="nav-auth-group">
            <Link to="/login" className="nav-auth-btn login-link">
              Log In
            </Link>
            <Link to="/register" className="nav-auth-btn signup-link">
              Create Account
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
