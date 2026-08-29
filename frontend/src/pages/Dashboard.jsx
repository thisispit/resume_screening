import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authedApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const { user } = useAuth()
  const [resume, setResume] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isCandidate = user?.role === 'candidate'
  const isRecruiter = user?.role === 'recruiter'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (isCandidate) {
          let res
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
          if (!cancelled) {
            setResume(res)
            setRecommendations(recs)
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

  const quickActions = [
    { icon: '📤', title: 'Upload Resume', desc: 'Upload a new resume for AI analysis', link: '/upload', color: 'linear-gradient(135deg, #0f2155, #1e3a8a)' },
    { icon: '🔍', title: 'Search Jobs', desc: 'Browse available job opportunities', link: '/', color: 'linear-gradient(135deg, #152c6e, #2a4a9f)' },
  ]

  const recentActivity = [
    { icon: '👋', text: 'Welcome to AI Resume Screening', time: 'Just now', type: 'welcome' },
    { icon: '🛡️', text: `Logged in as ${user?.role ?? 'unknown'}`, time: 'Account', type: 'system' },
  ]
  if (isCandidate) {
    recentActivity.push(
      resume
        ? { icon: '📄', text: `Resume: ${resume.original_filename}`, time: 'Profile', type: 'tip' }
        : { icon: '💡', text: 'Tip: Upload your resume to get started', time: 'Tip', type: 'tip' }
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
              ? 'Manage your posted jobs and applicants.'
              : 'View your uploaded resume, matching results, and analytics.'}
          </p>
        </div>
        <Link to="/upload" className="dash-upload-btn">
          <span>📤</span> Upload Resume
        </Link>
      </section>

      {error && (
        <section className="dash-error">
          <span className="msg-icon">⚠️</span>
          <p>{error}</p>
          {error.includes('log in') && <Link to="/login" className="msg-link">Log In →</Link>}
        </section>
      )}

      {!loading && !error && isCandidate && (
        <>
          <section className="dash-stats">
            <div className="dash-stat-card" style={{ '--stat-color': '#0f2155' }}>
              <div className="dsc-icon-wrap"><span className="dsc-icon">📄</span></div>
              <div className="dsc-info">
                <span className="dsc-value">{resume ? '1' : '0'}</span>
                <span className="dsc-label">Resumes Uploaded</span>
                <span className="dsc-change">{resume ? resume.original_filename : 'Upload your first resume'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#1e3a8a' }}>
              <div className="dsc-icon-wrap"><span className="dsc-icon">🎯</span></div>
              <div className="dsc-info">
                <span className="dsc-value">{recommendations?.length ?? 0}</span>
                <span className="dsc-label">Jobs Matched</span>
                <span className="dsc-change">{recommendations?.length ? 'Matches based on your resume' : 'Matches appear after analysis'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#152c6e' }}>
              <div className="dsc-icon-wrap"><span className="dsc-icon">📊</span></div>
              <div className="dsc-info">
                <span className="dsc-value">{resume?.total_experience_years ?? '--'}</span>
                <span className="dsc-label">Experience (yrs)</span>
                <span className="dsc-change">Extracted from resume</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
            <div className="dash-stat-card" style={{ '--stat-color': '#4a7dff' }}>
              <div className="dsc-icon-wrap"><span className="dsc-icon">🏆</span></div>
              <div className="dsc-info">
                <span className="dsc-value">{(recommendations?.[0]?.match_score ?? '--')}</span>
                <span className="dsc-label">Top Match</span>
                <span className="dsc-change">{recommendations?.[0]?.title ?? 'Best match score'}</span>
              </div>
              <div className="dsc-shape"></div>
            </div>
          </section>

          <section className="dash-content">
            {!resume && !loading && (
              <div className="dash-empty">
                <div className="dash-empty-shapes">
                  <div className="de-shape de-shape-1"></div>
                  <div className="de-shape de-shape-2"></div>
                  <div className="de-shape de-shape-3"></div>
                </div>
                <div className="dash-empty-icon">
                  <span>📋</span>
                  <div className="de-ring"></div>
                </div>
                <h3>No Resumes Uploaded Yet</h3>
                <p>Upload your first resume to see analysis results, job matches, and detailed reports here.</p>
                <Link to="/upload" className="dash-cta-btn">Upload Your First Resume →</Link>
              </div>
            )}

            {recommendations && recommendations.length > 0 && (
              <div className="dash-recs">
                <h3>Recommended Jobs for You</h3>
                <div className="recs-list">
                  {recommendations.map((rec) => (
                    <div key={rec.job_id} className="rec-card">
                      <div className="rec-top">
                        <h4>{rec.title}</h4>
                        <span className="rec-score">{Math.round(rec.match_score * 100)}%</span>
                      </div>
                      <p className="rec-company">
                        {rec.company_name || '—'}
                        {rec.location && ` · ${rec.location}`}
                        {rec.employment_type && ` · ${rec.employment_type}`}
                      </p>
                      {(rec.matched_skills?.length > 0 || rec.missing_skills?.length > 0) && (
                        <div className="rec-skills">
                          {rec.matched_skills?.map((s, i) => (
                            <span key={`m${i}`} className="rec-skill matched">{s}</span>
                          ))}
                          {rec.missing_skills?.map((s, i) => (
                            <span key={`x${i}`} className="rec-skill missing">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="rec-bars">
                        <div className="rec-bar"><span>Skills</span><div><i style={{ width: `${rec.skill_score * 100}%` }} /></div></div>
                        <div className="rec-bar"><span>Semantic</span><div><i style={{ width: `${rec.semantic_score * 100}%` }} /></div></div>
                        <div className="rec-bar"><span>Experience</span><div><i style={{ width: `${rec.experience_score * 100}%` }} /></div></div>
                        <div className="rec-bar"><span>Education</span><div><i style={{ width: `${rec.education_score * 100}%` }} /></div></div>
                      </div>
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
              <h3>Your Posted Jobs</h3>
              <div className="recs-list">
                {recommendations.map((job) => (
                  <div key={job.id} className="rec-card">
                    <div className="rec-top">
                      <h4>{job.title}</h4>
                      <span className={`rec-status ${job.is_active ? 'active' : 'inactive'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="rec-company">
                      {job.company_name || '—'}
                      {job.location && ` · ${job.location}`}
                    </p>
                    <div className="rec-skills">
                      {(job.required_skills || []).map((s, i) => (
                        <span key={i} className="rec-skill matched">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
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
