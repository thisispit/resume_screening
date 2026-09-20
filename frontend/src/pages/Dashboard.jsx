import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authedApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AtsGauge from '../components/AtsGauge'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [myApplications, setMyApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [applySuccess, setApplySuccess] = useState('')
  const [showAtsGauge, setShowAtsGauge] = useState(false)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [copiedSkills, setCopiedSkills] = useState(false)

  const handleCopySkills = () => {
    if (resume?.skills?.length) {
      navigator.clipboard.writeText(resume.skills.join(', '))
      setCopiedSkills(true)
      setTimeout(() => setCopiedSkills(false), 2000)
    }
  }

  // Recruiter applicant drawers, status & filters
  const [expandedJobId, setExpandedJobId] = useState(null)
  const [jobApplicants, setJobApplicants] = useState({}) // { [jobId]: CandidateSummary[] }
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [updatingAppId, setUpdatingAppId] = useState(null)
  const [applicantSearch, setApplicantSearch] = useState('')
  const [applicantMinScore, setApplicantMinScore] = useState('0')
  const [applicantStatus, setApplicantStatus] = useState('all')

  const getFilteredApplicants = (applicants) => {
    if (!applicants) return []
    return applicants.filter((item) => {
      const matchPercent = Math.round(item.application.match_score * 100)
      const minPercent = parseInt(applicantMinScore, 10) || 0
      if (matchPercent < minPercent) return false

      if (applicantStatus !== 'all' && item.application.status !== applicantStatus) {
        return false
      }

      if (applicantSearch.trim()) {
        const query = applicantSearch.toLowerCase().trim()
        const nameMatch = (item.candidate_name || '').toLowerCase().includes(query)
        const emailMatch = (item.candidate_email || '').toLowerCase().includes(query)
        const skillsMatch = (item.application.matched_skills || []).some((s) =>
          s.toLowerCase().includes(query)
        )
        if (!nameMatch && !emailMatch && !skillsMatch) return false
      }

      return true
    })
  }

  const isCandidate = user?.role === 'candidate'
  const isRecruiter = user?.role === 'recruiter'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (isCandidate) {
          let res = null
          try {
            res = await authedApi('/resumes/me')
          } catch (e) {
            if (e.status === 404) res = null
            else throw e
          }

          let recs = []
          try {
            recs = await authedApi('/resumes/me/recommendations')
          } catch (e) {
            if (e.status !== 401) recs = []
            else throw e
          }

          let apps = []
          try {
            apps = await authedApi('/applications/me')
          } catch {
            apps = []
          }

          if (!cancelled) {
            setResume(res)
            setRecommendations(recs)
            setMyApplications(apps)
          }
        } else {
          const jobs = await authedApi('/jobs/mine')
          if (!cancelled) setRecommendations(jobs)
        }
      } catch (err) {
        if (!cancelled) {
          if (err.status === 401) setError('Session expired. Please log in again.')
          else setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (user) {
      load()
    } else {
      setLoading(false)
      setError('Please log in to view your dashboard.')
    }
    return () => { cancelled = true }
  }, [user, isCandidate])

  const appliedJobIds = new Set(myApplications.map((app) => app.job_id))

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId)
    setApplySuccess('')
    try {
      const newApp = await authedApi('/applications', {
        method: 'POST',
        body: { job_id: jobId },
      })
      setMyApplications((prev) => [newApp, ...prev])
      setApplySuccess('Successfully applied to job!')
      setTimeout(() => setApplySuccess(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to submit application')
    } finally {
      setApplyingJobId(null)
    }
  }

  const toggleApplicants = async (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null)
      return
    }
    setExpandedJobId(jobId)
    if (!jobApplicants[jobId]) {
      setLoadingApplicants(true)
      try {
        const data = await authedApi(`/applications/job/${jobId}`)
        setJobApplicants((prev) => ({ ...prev, [jobId]: data }))
      } catch (err) {
        alert(err.message || 'Failed to fetch applicants')
      } finally {
        setLoadingApplicants(false)
      }
    }
  }

  const handleStatusChange = async (jobId, applicationId, newStatus) => {
    setUpdatingAppId(applicationId)
    try {
      await authedApi(`/applications/${applicationId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      setJobApplicants((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] || []).map((summary) =>
          summary.application.id === applicationId
            ? {
                ...summary,
                application: { ...summary.application, status: newStatus },
              }
            : summary
        ),
      }))
    } catch (err) {
      alert(err.message || 'Failed to update application status')
    } finally {
      setUpdatingAppId(null)
    }
  }

  const quickActions = [
    ...(isCandidate
      ? [
          { icon: '📤', title: 'Upload Resume', desc: 'Upload or refresh your resume for AI screening', link: '/upload', color: 'linear-gradient(135deg, #3F4A2C, #59663A)' },
          { icon: '🔍', title: 'Search Jobs', desc: 'Browse available openings and apply', link: '/', color: 'linear-gradient(135deg, #59663A, #96762B)' },
        ]
      : [
          { icon: '➕', title: 'Post a New Job', desc: 'Publish open roles with skill & experience requirements', link: '/post-job', color: 'linear-gradient(135deg, #3F4A2C, #59663A)' },
          { icon: '👥', title: 'Browse Candidates', desc: 'Screen applicants ranked by AI match score', link: '/dashboard', color: 'linear-gradient(135deg, #59663A, #96762B)' },
        ]),
  ]

  const recentActivity = [
    { icon: '👋', text: 'Welcome to AI Resume Screening', time: 'Just now', type: 'welcome' },
    { icon: '🛡️', text: `Logged in as ${user?.role ?? 'unknown'} (${user?.email})`, time: 'Account', type: 'system' },
  ]
  if (isCandidate) {
    recentActivity.push(
      resume
        ? { icon: '📄', text: `Resume: ${resume.original_filename}`, time: 'Profile', type: 'tip' }
        : { icon: '💡', text: 'Tip: Upload your resume to unlock AI matching', time: 'Tip', type: 'tip' }
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dash-decor">
        <div className="dash-circle dash-circle-1"></div>
        <div className="dash-circle dash-circle-2"></div>
        <div className="dash-blob dash-blob-1"></div>
        <div className="dash-grid-pattern"></div>
      </div>

      <section className="dash-header">
        <div className="dash-header-content">
          <div className="section-badge">Dashboard</div>
          <h1>{isRecruiter ? 'Recruiter Dashboard' : 'Candidate Dashboard'}</h1>
          <p>
            {isRecruiter
              ? 'Manage your posted job listings, review AI-ranked candidates, and progress applications.'
              : 'View your parsed resume, personalized AI job recommendations, and track applications.'}
          </p>
        </div>
        <div className="dash-header-actions">
          {isCandidate ? (
            <Link to="/upload" className="dash-upload-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Resume
            </Link>
          ) : (
            <Link to="/post-job" className="dash-upload-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post Job
            </Link>
          )}
          <button
            className="dash-logout-btn"
            onClick={() => { logout(); navigate('/') }}
            title="Log out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </section>

      {error && (
        <section className="dash-error">
          <span className="msg-icon">!</span>
          <p>{error}</p>
          {error.includes('log in') && <Link to="/login" className="msg-link">Log In →</Link>}
        </section>
      )}

      {applySuccess && (
        <section className="dash-success" style={{ margin: '0 2rem 1.5rem', padding: '1rem 1.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontWeight: 600 }}>
          ✓ {applySuccess}
        </section>
      )}

      {!loading && !error && isCandidate && (
        <>
          <section className="dash-stats">
            <div className="dash-stat-card" style={{ '--stat-color': '#3F4A2C' }}>
              <div className="dsc-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3F4A2C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="dsc-info">
                <span className="dsc-value">
                  {resume ? `${Math.round(resume.ats_score || 85)}%` : '--'}
                </span>
                <span className="dsc-label">ATS Health Index</span>
                <span className="dsc-change">
                  {resume ? ((resume.ats_score || 85) >= 80 ? 'ATS Optimized' : 'Needs Optimization') : 'Upload resume to begin'}
                </span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#59663A' }}>
              <div className="dsc-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#59663A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <div className="dsc-info">
                <span className="dsc-value">{recommendations?.length ?? 0}</span>
                <span className="dsc-label">Recommended Jobs</span>
                <span className="dsc-change">{recommendations?.length ? 'Ranked by AI match' : 'Upload resume to see matches'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#96762B' }}>
              <div className="dsc-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#96762B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="dsc-info">
                <span className="dsc-value">{resume?.total_experience_years != null ? `${resume.total_experience_years} yrs` : '--'}</span>
                <span className="dsc-label">Experience</span>
                <span className="dsc-change">{resume ? (resume.highest_education_level || 'Extracted') : 'Not extracted'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#6E7B45' }}>
              <div className="dsc-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E7B45" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="dsc-info">
                <span className="dsc-value">{myApplications.length}</span>
                <span className="dsc-label">Applications Sent</span>
                <span className="dsc-change">{myApplications.length ? 'Tracked below' : 'Apply to matches below'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
          </section>

          {resume && (
            <div style={{ maxWidth: '1320px', margin: '0 auto 2rem', padding: '0 clamp(1.5rem, 5vw, 5rem)' }}>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: (showAtsGauge || showProfileDrawer) ? '1.2rem' : '0' }}>
                <button
                  type="button"
                  className="dash-ats-toggle-btn"
                  style={{ flex: '1 1 300px' }}
                  onClick={() => {
                    setShowAtsGauge(!showAtsGauge)
                    if (!showAtsGauge) setShowProfileDrawer(false)
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  <span>{showAtsGauge ? 'Hide ATS Diagnostics' : 'Inspect Full ATS Readiness & Diagnostics'}</span>
                  <span>{showAtsGauge ? '▲' : '▼'}</span>
                </button>

                <button
                  type="button"
                  className="dash-ats-toggle-btn"
                  style={{ flex: '1 1 300px' }}
                  onClick={() => {
                    setShowProfileDrawer(!showProfileDrawer)
                    if (!showProfileDrawer) setShowAtsGauge(false)
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <span>{showProfileDrawer ? 'Hide Profile & Education' : 'Inspect Parsed Profile, Education & Projects'}</span>
                  <span>{showProfileDrawer ? '▲' : '▼'}</span>
                </button>
              </div>

              {showAtsGauge && (
                <div>
                  <AtsGauge
                    score={resume.ats_score}
                    breakdown={resume.ats_breakdown?.breakdown}
                    actionableTips={resume.ats_breakdown?.actionable_tips}
                    skillsCount={resume.skills?.length || 0}
                    experienceYears={resume.total_experience_years || 0}
                    hasEducation={(resume.education || []).length > 0}
                    summaryLength={resume.summary?.length || 0}
                  />
                </div>
              )}

              {showProfileDrawer && (
                <div className="pr-grid">
                  <div className="pr-card">
                    <div className="pr-card-header">
                      <h4>Contact Details</h4>
                      <span className="pr-count-tag">Identity</span>
                    </div>
                    <div className="pr-contact-list">
                      <p className="pr-contact-item"><strong>Name:</strong> <span>{resume.candidate_name || '—'}</span></p>
                      <p className="pr-contact-item"><strong>Email:</strong> <span>{resume.email || <em className="pr-hint">Not detected in document</em>}</span></p>
                      <p className="pr-contact-item"><strong>Phone:</strong> <span>{resume.phone || <em className="pr-hint">Not detected</em>}</span></p>
                      <p className="pr-contact-item"><strong>Location:</strong> <span>{resume.location || <em className="pr-hint">Not specified</em>}</span></p>
                    </div>

                    {resume.links && Object.keys(resume.links).length > 0 && (
                      <div className="pr-links-wrap">
                        {resume.links.github && (
                          <a href={resume.links.github} target="_blank" rel="noreferrer" className="pr-social-badge" title="View GitHub Profile">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                            GitHub ↗
                          </a>
                        )}
                        {resume.links.linkedin && (
                          <a href={resume.links.linkedin} target="_blank" rel="noreferrer" className="pr-social-badge" title="View LinkedIn Profile">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                              <rect x="2" y="9" width="4" height="12" />
                              <circle cx="4" cy="4" r="2" />
                            </svg>
                            LinkedIn ↗
                          </a>
                        )}
                        {resume.links.portfolio && (
                          <a href={resume.links.portfolio} target="_blank" rel="noreferrer" className="pr-social-badge" title="View Portfolio Website">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            Portfolio ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pr-card">
                    <div className="pr-card-header">
                      <h4>Skills & Technologies ({resume.skills?.length || 0})</h4>
                      {resume.skills && resume.skills.length > 0 && (
                        <button
                          type="button"
                          onClick={handleCopySkills}
                          className="pr-copy-pill"
                          title="Copy all skills as comma-separated text"
                        >
                          {copiedSkills ? '✓ Copied' : 'Copy List'}
                        </button>
                      )}
                    </div>
                    <div className="pr-tags">
                      {(resume.skills || []).map((s, i) => (
                        <span key={i} className="pr-tag">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="pr-card pr-wide">
                    <div className="pr-card-header">
                      <h4>Professional Summary</h4>
                      {resume.summary && <span className="pr-count-tag">{resume.summary.length} chars</span>}
                    </div>
                    {resume.summary ? (
                      <p className="pr-summary-text">“{resume.summary}”</p>
                    ) : (
                      <div className="pr-notice-box">
                        <p className="pr-notice-title">No explicit summary section detected</p>
                        <p className="pr-notice-sub">
                          Tip: Adding a 2-3 sentence overview at the top of your resume highlighting your primary focus and core technical competencies helps ATS parsers quickly categorize your profile.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pr-card pr-wide">
                    <div className="pr-card-header">
                      <h4>Education History ({(resume.education || []).length})</h4>
                      {resume.highest_education_level && resume.highest_education_level !== 'none' && (
                        <span className="pr-level-tag">
                          {resume.highest_education_level.replace('_', ' ').toUpperCase()} TIER
                        </span>
                      )}
                    </div>

                    {(resume.education || []).length === 0 ? (
                      <p className="pr-empty">No education details extracted.</p>
                    ) : (
                      <div className="pr-edu-grid">
                        {resume.education.map((ed, i) => (
                          <div key={i} className="pr-edu-item">
                            <div className="pr-edu-top">
                              <div>
                                <h5 className="pr-edu-degree">
                                  {ed.degree || 'Degree'}
                                  {ed.field_of_study && <span className="pr-edu-field"> — {ed.field_of_study}</span>}
                                </h5>
                                <p className="pr-edu-inst">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                  </svg>
                                  <span>{ed.institution || 'Educational Institution'}</span>
                                </p>
                              </div>
                              {ed.year && <span className="pr-edu-year">{ed.year}</span>}
                            </div>

                            {(ed.grade || ed.location) && (
                              <div className="pr-edu-meta">
                                {ed.grade && (
                                  <span className="pr-edu-pill grade-pill">
                                    <strong>Score:</strong> {ed.grade}
                                  </span>
                                )}
                                {ed.location && (
                                  <span className="pr-edu-pill loc-pill">
                                    📍 {ed.location}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pr-card pr-wide">
                    <h4>Experience ({resume.total_experience_years || 0} yrs)</h4>
                    {(resume.experience || []).length === 0 ? (
                      <div className="pr-notice-box">
                        <p className="pr-notice-title">No formal corporate employment history listed</p>
                        <p className="pr-notice-sub">Technical projects, open-source work, and practical engineering achievements are highlighted below.</p>
                      </div>
                    ) : (
                      <ul className="pr-list">
                        {resume.experience.map((exp, i) => (
                          <li key={i}>
                            <strong>{exp.title || 'Role'}</strong> at {exp.company || '—'}
                            {exp.duration_years != null && ` (${exp.duration_years} yrs)`}
                            {exp.start_date && ` · ${exp.start_date} – ${exp.end_date || 'Present'}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {resume.projects && resume.projects.length > 0 && (
                    <div className="pr-card pr-wide">
                      <div className="pr-card-header">
                        <h4>Technical Projects ({resume.projects.length})</h4>
                        <span className="pr-count-tag">Engineering Portfolio</span>
                      </div>
                      <div className="pr-projects-grid">
                        {resume.projects.map((proj, i) => (
                          <div key={i} className="pr-project-item">
                            <div className="pr-project-header">
                              <h5 className="pr-project-title">{proj.title}</h5>
                              {proj.year && <span className="pr-project-year">{proj.year}</span>}
                            </div>
                            {proj.tools && (
                              <div className="pr-project-tools">
                                <span className="pr-tools-label">Stack:</span>
                                <span className="pr-tools-text">{proj.tools}</span>
                              </div>
                            )}
                            {proj.highlights && proj.highlights.length > 0 ? (
                              <ul className="pr-project-bullets">
                                {proj.highlights.map((h, hi) => (
                                  <li key={hi}>{h}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="pr-project-desc">{proj.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resume.certifications && resume.certifications.length > 0 && (
                    <div className="pr-card pr-wide">
                      <div className="pr-card-header">
                        <h4>Certifications & Credentials ({resume.certifications.length})</h4>
                        <span className="pr-count-tag">Verified Credentials</span>
                      </div>
                      <div className="pr-certs-grid">
                        {resume.certifications.map((c, i) => {
                          const certName = typeof c === 'object' ? c.name : c
                          const certDate = typeof c === 'object' ? c.date : null
                          return (
                            <div key={i} className="pr-cert-item">
                              <div className="pr-cert-icon">✓</div>
                              <div className="pr-cert-info">
                                <span className="pr-cert-name">{certName}</span>
                                {certDate && <span className="pr-cert-date">{certDate}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <section className="dash-content">
            {!resume && (
              <div className="dash-empty">
                <div className="dash-empty-shapes">
                  <div className="de-shape de-shape-1"></div>
                  <div className="de-shape de-shape-2"></div>
                  <div className="de-shape de-shape-3"></div>
                </div>
                <div className="dash-empty-icon">
                  <span>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#3F4A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </span>
                  <div className="de-ring"></div>
                </div>
                <h3>No Resumes Ingested Yet</h3>
                <p>Upload your PDF or DOCX resume to extract skills, evaluate ATS readiness, and generate job matches.</p>
                <Link to="/upload" className="dash-cta-btn">Upload Your Resume →</Link>
              </div>
            )}

            {recommendations && recommendations.length > 0 && (
              <div className="dash-recs">
                <h3>Recommended Jobs for You (Ranked by AI)</h3>
                <div className="recs-list">
                  {recommendations.map((rec) => {
                    const alreadyApplied = appliedJobIds.has(rec.job_id)
                    const isApplyingThis = applyingJobId === rec.job_id
                    return (
                      <div key={rec.job_id} className="rec-card">
                        <div className="rec-top">
                          <div>
                            <h4>{rec.title}</h4>
                            <p className="rec-company">
                              {rec.company_name || 'Company'}
                              {rec.location && ` · 📍 ${rec.location}`}
                              {rec.employment_type && ` · ⏰ ${rec.employment_type}`}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span className="rec-score">{Math.round(rec.match_score * 100)}% Match</span>
                            <button
                              className="rec-apply-btn"
                              disabled={alreadyApplied || isApplyingThis}
                              onClick={() => handleApply(rec.job_id)}
                            >
                              {alreadyApplied ? '✓ Applied' : isApplyingThis ? 'Applying...' : 'Apply Now'}
                            </button>
                          </div>
                        </div>

                        {(rec.matched_skills?.length > 0 || rec.missing_skills?.length > 0) && (
                          <div className="rec-skills">
                            {rec.matched_skills?.map((s, i) => (
                              <span key={`m${i}`} className="rec-skill matched" title="Matched skill">✓ {s}</span>
                            ))}
                            {rec.missing_skills?.map((s, i) => (
                              <span key={`x${i}`} className="rec-skill missing" title="Skill gap">✗ {s}</span>
                            ))}
                          </div>
                        )}

                        <div className="rec-bars">
                          <div className="rec-bar"><span>Skills ({Math.round(rec.skill_score * 100)}%)</span><div><i style={{ width: `${rec.skill_score * 100}%` }} /></div></div>
                          <div className="rec-bar"><span>Semantic ({Math.round(rec.semantic_score * 100)}%)</span><div><i style={{ width: `${rec.semantic_score * 100}%` }} /></div></div>
                          <div className="rec-bar"><span>Experience ({Math.round(rec.experience_score * 100)}%)</span><div><i style={{ width: `${rec.experience_score * 100}%` }} /></div></div>
                          <div className="rec-bar"><span>Education ({Math.round(rec.education_score * 100)}%)</span><div><i style={{ width: `${rec.education_score * 100}%` }} /></div></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {myApplications && myApplications.length > 0 && (
              <div className="dash-recs" style={{ marginTop: '2.5rem' }}>
                <h3>My Submitted Applications ({myApplications.length})</h3>
                <div className="recs-list">
                  {myApplications.map((app) => (
                    <div key={app.id} className="rec-card">
                      <div className="rec-top">
                        <div>
                          <h4>{app.job?.title || `Job #${app.job_id}`}</h4>
                          <p className="rec-company">
                            {app.job?.company_name || 'Company'}
                            {app.job?.location && ` · 📍 ${app.job.location}`}
                            <span style={{ marginLeft: '0.8rem', color: '#64748b' }}>
                              Applied on {new Date(app.created_at).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span className={`app-status-badge app-status-${app.status}`}>
                            {app.status}
                          </span>
                          <span className="rec-score">{Math.round(app.match_score * 100)}% Match</span>
                        </div>
                      </div>

                      {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                        <div className="rec-skills">
                          {app.matched_skills?.map((s, i) => (
                            <span key={`m${i}`} className="rec-skill matched">✓ {s}</span>
                          ))}
                          {app.missing_skills?.map((s, i) => (
                            <span key={`x${i}`} className="rec-skill missing">✗ {s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !error && isRecruiter && (
        <section className="dash-content">
          {recommendations && recommendations.length > 0 ? (
            <div className="dash-recs">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                <h3 style={{ margin: 0 }}>Your Job Listings ({recommendations.length})</h3>
                <Link to="/post-job" className="applicant-toggle-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Post New Opening
                </Link>
              </div>

              <div className="recs-list">
                {recommendations.map((job) => {
                  const isExpanded = expandedJobId === job.id
                  const applicants = jobApplicants[job.id] || []
                  return (
                    <div key={job.id} className="rec-card">
                      <div className="rec-top">
                        <div>
                          <h4>{job.title}</h4>
                          <p className="rec-company">
                            {job.company_name || 'Your Company'}
                            {job.location && ` · 📍 ${job.location}`}
                            {job.employment_type && ` · ⏰ ${job.employment_type}`}
                            <span style={{ marginLeft: '0.8rem', color: '#64748b' }}>
                              Min Exp: {job.min_experience_years || 0} yrs
                            </span>
                          </p>
                        </div>
                        <span className={`rec-status ${job.is_active ? 'active' : 'inactive'}`}>
                          {job.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="rec-skills">
                        {(job.required_skills || []).map((s, i) => (
                          <span key={i} className="rec-skill matched">{s}</span>
                        ))}
                      </div>

                      <div className="rec-applicants-section">
                        <button
                          type="button"
                          className="applicant-toggle-btn"
                          onClick={() => toggleApplicants(job.id)}
                        >
                          <span>{isExpanded ? '▲ Hide Applicants' : '▼ View AI-Ranked Applicants'}</span>
                        </button>

                        {isExpanded && (
                          <div className="applicants-drawer">
                            {loadingApplicants && !jobApplicants[job.id] ? (
                              <p style={{ margin: '0.5rem 0', color: '#64748b' }}>Loading applicants ranked by AI...</p>
                            ) : applicants.length === 0 ? (
                              <p style={{ margin: '0.5rem 0', color: '#64748b' }}>No candidates have applied to this job yet.</p>
                            ) : (
                              <>
                                {/* Recruiter Search & Filter Toolbar */}
                                <div className="applicant-filter-toolbar">
                                  <div className="af-search-box">
                                    <span className="af-search-icon">
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                      </svg>
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="Filter by name, email, or skill (e.g. React, Python)..."
                                      value={applicantSearch}
                                      onChange={(e) => setApplicantSearch(e.target.value)}
                                      className="af-input"
                                    />
                                    {applicantSearch && (
                                      <button
                                        type="button"
                                        className="af-clear-btn"
                                        onClick={() => setApplicantSearch('')}
                                        title="Clear search"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>

                                  <div className="af-dropdowns">
                                    <select
                                      value={applicantMinScore}
                                      onChange={(e) => setApplicantMinScore(e.target.value)}
                                      className="af-select"
                                    >
                                      <option value="0">All Match Scores</option>
                                      <option value="80">80%+ Match (High Alignment)</option>
                                      <option value="70">70%+ Match (Strong Match)</option>
                                      <option value="50">50%+ Match (Moderate Match)</option>
                                    </select>

                                    <select
                                      value={applicantStatus}
                                      onChange={(e) => setApplicantStatus(e.target.value)}
                                      className="af-select"
                                    >
                                      <option value="all">All Statuses</option>
                                      <option value="applied">Applied</option>
                                      <option value="reviewed">Reviewed</option>
                                      <option value="shortlisted">Shortlisted</option>
                                      <option value="rejected">Rejected</option>
                                      <option value="hired">Hired</option>
                                    </select>

                                    {(applicantSearch || applicantMinScore !== '0' || applicantStatus !== 'all') && (
                                      <button
                                        type="button"
                                        className="af-reset-btn"
                                        onClick={() => {
                                          setApplicantSearch('')
                                          setApplicantMinScore('0')
                                          setApplicantStatus('all')
                                        }}
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="af-summary-line">
                                  <span>
                                    Showing <strong>{getFilteredApplicants(applicants).length}</strong> of{' '}
                                    <strong>{applicants.length}</strong> applicant{applicants.length > 1 ? 's' : ''} (ranked by AI)
                                  </span>
                                </div>

                                {getFilteredApplicants(applicants).length === 0 ? (
                                  <div className="af-no-results">
                                    <p>No candidates match your current filter criteria.</p>
                                    <button
                                      type="button"
                                      className="af-reset-btn"
                                      onClick={() => {
                                        setApplicantSearch('')
                                        setApplicantMinScore('0')
                                        setApplicantStatus('all')
                                      }}
                                    >
                                      Clear Filters
                                    </button>
                                  </div>
                                ) : (
                                  getFilteredApplicants(applicants).map((summary, idx) => (
                                    <div key={summary.application.id} className="applicant-item">
                                      <div className="applicant-header">
                                        <div>
                                          <span style={{ fontWeight: 800, color: '#3F4A2C', marginRight: '0.5rem' }}>
                                            #{idx + 1}
                                          </span>
                                          <span className="applicant-name">{summary.candidate_name}</span>
                                          <span className="applicant-email">({summary.candidate_email})</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                          {summary.resume_ats_score > 0 && (
                                            <span className="applicant-ats-pill" title="ATS Resume Readability Score">
                                              ATS: {Math.round(summary.resume_ats_score)}%
                                            </span>
                                          )}
                                          <span className="applicant-score-pill">
                                            {Math.round(summary.application.match_score * 100)}% Match
                                          </span>
                                        </div>
                                      </div>

                                      <div className="applicant-meta">
                                        <span>Experience: <strong>{summary.total_experience_years} yrs</strong></span>
                                        {summary.highest_education_level && summary.highest_education_level !== 'none' && (
                                          <span>Edu: <strong style={{ textTransform: 'capitalize' }}>{summary.highest_education_level.replace('_', ' ')}</strong></span>
                                        )}
                                        {summary.resume_location && (
                                          <span>📍 <strong>{summary.resume_location}</strong></span>
                                        )}
                                        <span>Applied: <strong>{new Date(summary.application.created_at).toLocaleDateString()}</strong></span>
                                      </div>

                                      {summary.resume_links && Object.keys(summary.resume_links).length > 0 && (
                                        <div className="applicant-social-links" style={{ display: 'flex', gap: '0.45rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                          {summary.resume_links.github && (
                                            <a href={summary.resume_links.github} target="_blank" rel="noreferrer" className="pr-social-badge" style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}>
                                              GitHub ↗
                                            </a>
                                          )}
                                          {summary.resume_links.linkedin && (
                                            <a href={summary.resume_links.linkedin} target="_blank" rel="noreferrer" className="pr-social-badge" style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}>
                                              LinkedIn ↗
                                            </a>
                                          )}
                                          {summary.resume_links.portfolio && (
                                            <a href={summary.resume_links.portfolio} target="_blank" rel="noreferrer" className="pr-social-badge" style={{ padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}>
                                              Portfolio ↗
                                            </a>
                                          )}
                                        </div>
                                      )}

                                      <div className="rec-skills">
                                        {(summary.application.matched_skills || []).map((s, i) => (
                                          <span key={`m${i}`} className="rec-skill matched">✓ {s}</span>
                                        ))}
                                        {(summary.application.missing_skills || []).map((s, i) => (
                                          <span key={`x${i}`} className="rec-skill missing">✗ {s}</span>
                                        ))}
                                      </div>

                                      <div className="applicant-controls">
                                        <span style={{ fontSize: '0.86rem', color: '#475569' }}>
                                          Status: <strong style={{ textTransform: 'capitalize' }}>{summary.application.status}</strong>
                                        </span>
                                        <select
                                          className="applicant-status-select"
                                          value={summary.application.status}
                                          disabled={updatingAppId === summary.application.id}
                                          onChange={(e) =>
                                            handleStatusChange(job.id, summary.application.id, e.target.value)
                                          }
                                        >
                                          <option value="applied">Applied</option>
                                          <option value="reviewed">Reviewed</option>
                                          <option value="shortlisted">Shortlisted ⭐</option>
                                          <option value="rejected">Rejected</option>
                                          <option value="hired">Hired 🎉</option>
                                        </select>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="dash-empty">
              <div className="dash-empty-icon"><span>💼</span><div className="de-ring"></div></div>
              <h3>No Jobs Posted Yet</h3>
              <p>Post a job to start screening candidates with AI match scores.</p>
              <Link to="/post-job" className="dash-cta-btn">Post a Job →</Link>
            </div>
          )}
        </section>
      )}

      <section className="dash-content">
        <div className="dash-quick-actions">
          <h3>Quick Actions</h3>
          <div className="dqa-list">
            {quickActions.map((a, i) => (
              <Link key={i} to={a.link} className="dqa-card">
                <div className="dqa-icon" style={{ background: a.color }}>
                  <span>{a.icon}</span>
                </div>
                <div className="dqa-info">
                  <h4>{a.title}</h4>
                  <p>{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="dash-activity">
          <h3>Recent Activity</h3>
          <div className="da-list">
            {recentActivity.map((a, i) => (
              <div key={i} className={`da-item da-${a.type}`}>
                <span className="da-icon">{a.icon}</span>
                <div className="da-info">
                  <p>{a.text}</p>
                  <span>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
