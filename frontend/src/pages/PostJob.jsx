import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authedApi } from '../api/client'

function PostJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    min_experience_years: '0',
    education_level: 'bachelor',
    location: '',
    employment_type: 'full-time',
    salary_min: '',
    salary_max: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const skills = form.required_skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (skills.length === 0) {
      setError('Please enter at least one required skill.')
      setLoading(false)
      return
    }

    const payload = {
      title: form.title,
      description: form.description,
      required_skills: skills,
      min_experience_years: parseFloat(form.min_experience_years) || 0,
      education_level: form.education_level,
      location: form.location || null,
      employment_type: form.employment_type,
      salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
      salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
    }

    try {
      await authedApi('/jobs', {
        method: 'POST',
        body: payload,
      })
      navigate('/dashboard')
    } catch (err) {
      if (err.status === 401) setError('Please log in as a recruiter to post jobs.')
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-decor">
        <div className="up-circle up-circle-1"></div>
        <div className="up-circle up-circle-2"></div>
        <div className="up-blob up-blob-1"></div>
      </div>

      <section className="upload-header">
        <div className="section-badge">Recruiter</div>
        <h1>Post a Job</h1>
        <p>Create a job listing to start screening candidates with AI match scores.</p>
      </section>

      <section className="job-form-wrap">
        <form className="job-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Job Title *</span>
            <input
              type="text"
              required
              minLength={3}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
            />
          </label>

          <label className="auth-field">
            <span>Description *</span>
            <textarea
              required
              minLength={20}
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </label>

          <div className="auth-field">
            <span>Required Skills * (comma separated)</span>
            <input
              type="text"
              required
              value={form.required_skills}
              onChange={(e) => update('required_skills', e.target.value)}
              placeholder="e.g. React, TypeScript, CSS"
            />
          </div>

          <div className="job-form-row">
            <label className="auth-field">
              <span>Min Experience (years)</span>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={form.min_experience_years}
                onChange={(e) => update('min_experience_years', e.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Education Level</span>
              <select value={form.education_level} onChange={(e) => update('education_level', e.target.value)}>
                <option value="any">Any</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </label>
          </div>

          <div className="job-form-row">
            <label className="auth-field">
              <span>Location</span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="City, Country"
              />
            </label>

            <label className="auth-field">
              <span>Employment Type</span>
              <select value={form.employment_type} onChange={(e) => update('employment_type', e.target.value)}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </label>
          </div>

          <div className="job-form-row">
            <label className="auth-field">
              <span>Salary Min</span>
              <input
                type="number"
                min="0"
                value={form.salary_min}
                onChange={(e) => update('salary_min', e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label className="auth-field">
              <span>Salary Max</span>
              <input
                type="number"
                min="0"
                value={form.salary_max}
                onChange={(e) => update('salary_max', e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="job-form-actions">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
            <Link to="/dashboard" className="auth-back center">← Back to Dashboard</Link>
          </div>
        </form>
      </section>
    </div>
  )
}

export default PostJob
