import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const location = useLocation()
  const { authenticated, user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [prevPath, setPrevPath] = useState(location.pathname)

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname)
    setMobileMenuOpen(false)
  }

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
  const isRecruiter = user?.role === 'recruiter'

  return (
    <>
      <header className={`navbar ${mobileMenuOpen ? 'nav-expanded' : ''}`}>
        <div className="nav-top-bar">
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
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

          <button
            type="button"
            className={`nav-mobile-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="nav-toggle-icon"
            >
              <line x1="4" y1="6" x2="20" y2="6" className="toggle-line line-top" />
              <line x1="4" y1="12" x2="20" y2="12" className="toggle-line line-mid" />
              <line x1="4" y1="18" x2="20" y2="18" className="toggle-line line-bot" />
            </svg>
          </button>
        </div>

        <nav className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="nav-links-core">
            <Link
              to="/"
              className={`nav-link-item ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span className="nav-link-text">Home</span>
            </Link>

            <Link
              to="/upload"
              className={`nav-link-item ${location.pathname === '/upload' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <span className="nav-link-text">Upload Resume</span>
            </Link>

            <Link
              to="/dashboard"
              className={`nav-link-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
              </span>
              <span className="nav-link-text">Dashboard</span>
            </Link>

            {authenticated && isRecruiter && (
              <Link
                to="/post-job"
                className={`nav-link-item ${location.pathname === '/post-job' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-link-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <span className="nav-link-text">Post a Job</span>
              </Link>
            )}
          </div>

          {authenticated ? (
            <div className="nav-user-section">
              <div className="nav-profile-pill">
                <span className="nav-avatar-circle">{userInitial}</span>
                <div className="nav-user-details">
                  <span className="nav-user-name">{user?.full_name || 'User'}</span>
                  <span className="nav-user-role-label">{isRecruiter ? 'Recruiter' : 'Candidate'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                }}
                className="nav-auth-btn logout"
                title="Sign out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="nav-auth-group">
              <Link
                to="/login"
                className="nav-auth-btn login-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="nav-auth-btn signup-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Backdrop overlay behind mobile drawer */}
      <div
        className={`nav-backdrop ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  )
}

export default Navbar
