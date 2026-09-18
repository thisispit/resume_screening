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
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : 1}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
            />
          </label>

          {mode === 'register' && (
            <>
              <div className="auth-field">
                <span>I am a</span>
                <div className="auth-role">
                  <button
                    type="button"
                    className={form.role === 'candidate' ? 'role-btn active' : 'role-btn'}
                    onClick={() => update('role', 'candidate')}
                  >
                    🙋 Candidate
                  </button>
                  <button
                    type="button"
                    className={form.role === 'recruiter' ? 'role-btn active' : 'role-btn'}
                    onClick={() => update('role', 'recruiter')}
                  >
                    🏢 Recruiter
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
