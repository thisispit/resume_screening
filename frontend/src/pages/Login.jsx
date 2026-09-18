import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login({ initialMode }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isRegisterRoute =
    initialMode === 'register' ||
    location.pathname === '/register' ||
    location.pathname === '/signup'

  const [mode, setMode] = useState(isRegisterRoute ? 'register' : 'login') // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode)
    } else if (location.pathname === '/register' || location.pathname === '/signup') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    }
  }, [initialMode, location.pathname])
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'candidate',
    companyName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({
          full_name: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          company_name: form.role === 'recruiter' ? form.companyName || null : null,
        })
        await login(form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-decor">
        <div className="up-circle up-circle-1"></div>
        <div className="up-circle up-circle-2"></div>
        <div className="up-blob up-blob-1"></div>
      </div>

      <div className="auth-card">
        <div className="auth-card-head">
          <div className="section-badge">Account</div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>
            {mode === 'login'
              ? 'Log in to continue to your dashboard.'
              : 'Sign up as a candidate or recruiter.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setMode('login'); setError('') }}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setMode('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="auth-field">
              <span>Full Name</span>
              <input
                type="text"
                required
                minLength={2}
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Aarav Sharma"
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <>
              <div className="auth-field">
                <span>Account Role</span>
                <div className="auth-role">
                  <button
                    type="button"
                    className={form.role === 'candidate' ? 'role-btn active' : 'role-btn'}
                    onClick={() => update('role', 'candidate')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Candidate
                  </button>
                  <button
                    type="button"
                    className={form.role === 'recruiter' ? 'role-btn active' : 'role-btn'}
                    onClick={() => update('role', 'recruiter')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                      <line x1="9" y1="22" x2="9" y2="22.01" />
                      <line x1="15" y1="22" x2="15" y2="22.01" />
                      <line x1="9" y1="18" x2="9" y2="18.01" />
                      <line x1="15" y1="18" x2="15" y2="18.01" />
                      <line x1="9" y1="14" x2="9" y2="14.01" />
                      <line x1="15" y1="14" x2="15" y2="14.01" />
                    </svg>
                    Recruiter
                  </button>
                </div>
              </div>

              {form.role === 'recruiter' && (
                <label className="auth-field">
                  <span>Company Name</span>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    placeholder="Your company"
                  />
                </label>
              )}
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log In'
                : 'Create Account'}
          </button>
        </form>

        <p className="auth-demo">
          Demo accounts: recruiter@demo.com / recruiter1234 · candidate@demo.com / candidate1234
        </p>

        <Link to="/" className="auth-back">← Back to Home</Link>
      </div>
    </div>
  )
}

export default Login
