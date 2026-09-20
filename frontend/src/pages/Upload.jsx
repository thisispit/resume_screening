import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authedApi } from '../api/client'
import AtsGauge from '../components/AtsGauge'

function Upload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedSkills, setCopiedSkills] = useState(false)
  const navigate = useNavigate()

  const handleCopySkills = () => {
    if (result?.skills?.length) {
      navigator.clipboard.writeText(result.skills.join(', '))
      setCopiedSkills(true)
      setTimeout(() => setCopiedSkills(false), 2000)
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
    setError('')
    setResult(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && /\.(pdf|docx)$/i.test(droppedFile.name)) {
      setFile(droppedFile)
      setMessage('')
      setError('')
      setResult(null)
    } else {
      setError('Please upload a PDF or DOCX file.')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.')
      return
    }
    setUploading(true)
    setError('')
    setMessage('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const data = await authedApi('/resumes/upload', {
        method: 'POST',
        body: formData,
        isForm: true,
      })
      setResult(data)
      setMessage(`Resume "${file.name}" uploaded and analyzed successfully.`)
    } catch (err) {
      if (err.status === 401) {
        setError('Please log in as a candidate to upload your resume.')
      } else {
        setError(err.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: 'Automated Ingestion',
      desc: 'Accurately extracts contact info, career duration, competencies, and educational history.'
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: 'ATS Compliance Index',
      desc: 'Evaluates format readability, keyword density, and section structure according to ATS standards.'
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: 'Criteria Matching',
      desc: 'Calculates skill overlap, experience relevance, and degree compatibility with open positions.'
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      title: 'Actionable Diagnostics',
      desc: 'Provides specific feedback on missing keywords, section headers, and formatting improvements.'
    }
  ]

  return (
    <div className="upload-page">
      <div className="upload-decor">
        <div className="up-circle up-circle-1"></div>
        <div className="up-circle up-circle-2"></div>
        <div className="up-circle up-circle-3"></div>
        <div className="up-blob up-blob-1"></div>
        <div className="up-blob up-blob-2"></div>
        <div className="up-grid-pattern"></div>
      </div>

      <section className="upload-header">
        <div className="section-badge">Evaluation Pipeline</div>
        <h1>Candidate Resume Ingestion</h1>
        <p>Upload your document to evaluate parser compatibility, assess ATS readiness, and generate job matches.</p>
      </section>

      <section className="upload-main">
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="ua-bg-shapes">
            <div className="ua-shape ua-shape-1"></div>
            <div className="ua-shape ua-shape-2"></div>
            <div className="ua-shape ua-shape-3"></div>
          </div>

          {!file ? (
            <div className="ua-content">
              <div className="ua-icon-wrap">
                <span className="ua-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <div className="ua-icon-ring"></div>
                <div className="ua-icon-dots">
                  <span></span><span></span><span></span><span></span>
                </div>
              </div>
              <h3>Drag & Drop Your Resume</h3>
              <p>or click to browse files from your computer</p>
              <div className="ua-formats">
                <span className="format-tag">PDF</span>
                <span className="format-tag">DOCX</span>
              </div>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
          ) : (
            <div className="ua-content ua-has-file">
              <div className="ua-file-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>{file.name}</h3>
              <p className="ua-file-size">{(file.size / 1024).toFixed(1)} KB</p>
              <div className="ua-actions">
                <button onClick={handleUpload} className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
                <button onClick={() => { setFile(null); setMessage(''); setResult(null); setError('') }} className="btn btn-secondary">
                  Choose Different File
                </button>
              </div>
            </div>
          )}
        </div>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <p>Analyzing your resume with AI...</p>
          </div>
        )}

        {error && (
          <div className="upload-message error">
            <span className="msg-icon">⚠️</span>
            <p>{error}</p>
            {error.includes('log in') && <Link to="/login" className="msg-link">Log In →</Link>}
          </div>
        )}

        {result && (
          <div className="parse-result">
            <div className="upload-message" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="msg-icon">✅</span>
                <p style={{ margin: 0, fontWeight: 700 }}>{message}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="rec-apply-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span>View Job Recommendations</span>
                <span>→</span>
              </button>
            </div>

            <AtsGauge
              score={result.ats_score}
              breakdown={result.ats_breakdown?.breakdown}
              actionableTips={result.ats_breakdown?.actionable_tips}
              skillsCount={result.skills?.length || 0}
              experienceYears={result.total_experience_years || 0}
              hasEducation={(result.education || []).length > 0}
              summaryLength={result.summary?.length || 0}
            />

            <div className="pr-grid">
              <div className="pr-card">
                <div className="pr-card-header">
                  <h4>Contact Details</h4>
                  <span className="pr-count-tag">Identity</span>
                </div>
                <div className="pr-contact-list">
                  <p className="pr-contact-item"><strong>Name:</strong> <span>{result.candidate_name || '—'}</span></p>
                  <p className="pr-contact-item"><strong>Email:</strong> <span>{result.email || <em className="pr-hint">Not detected in document</em>}</span></p>
                  <p className="pr-contact-item"><strong>Phone:</strong> <span>{result.phone || <em className="pr-hint">Not detected</em>}</span></p>
                  <p className="pr-contact-item"><strong>Location:</strong> <span>{result.location || <em className="pr-hint">Not specified</em>}</span></p>
                </div>

                {result.links && Object.keys(result.links).length > 0 && (
                  <div className="pr-links-wrap">
                    {result.links.github && (
                      <a href={result.links.github} target="_blank" rel="noreferrer" className="pr-social-badge" title="View GitHub Profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </svg>
                        GitHub ↗
                      </a>
                    )}
                    {result.links.linkedin && (
                      <a href={result.links.linkedin} target="_blank" rel="noreferrer" className="pr-social-badge" title="View LinkedIn Profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect x="2" y="9" width="4" height="12" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                        LinkedIn ↗
                      </a>
                    )}
                    {result.links.portfolio && (
                      <a href={result.links.portfolio} target="_blank" rel="noreferrer" className="pr-social-badge" title="View Portfolio Website">
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
                  <h4>Skills & Technologies ({result.skills?.length || 0})</h4>
                  {result.skills && result.skills.length > 0 && (
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
                  {(result.skills || []).map((s, i) => (
                    <span key={i} className="pr-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="pr-card pr-wide">
                <div className="pr-card-header">
                  <h4>Professional Summary</h4>
                  {result.summary && <span className="pr-count-tag">{result.summary.length} chars</span>}
                </div>
                {result.summary ? (
                  <p className="pr-summary-text">“{result.summary}”</p>
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
                  <h4>Education History ({(result.education || []).length})</h4>
                  {result.highest_education_level && result.highest_education_level !== 'none' && (
                    <span className="pr-level-tag">
                      {result.highest_education_level.replace('_', ' ').toUpperCase()} TIER
                    </span>
                  )}
                </div>

                {(result.education || []).length === 0 ? (
                  <p className="pr-empty">No education details extracted.</p>
                ) : (
                  <div className="pr-edu-grid">
                    {result.education.map((ed, i) => (
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
                <h4>Experience ({result.total_experience_years || 0} yrs)</h4>
                {(result.experience || []).length === 0 ? (
                  <div className="pr-notice-box">
                    <p className="pr-notice-title">No formal corporate employment history listed</p>
                    <p className="pr-notice-sub">Technical projects, open-source work, and practical engineering achievements are highlighted below.</p>
                  </div>
                ) : (
                  <ul className="pr-list">
                    {result.experience.map((exp, i) => (
                      <li key={i}>
                        <strong>{exp.title || 'Role'}</strong> at {exp.company || '—'}
                        {exp.duration_years != null && ` (${exp.duration_years} yrs)`}
                        {exp.start_date && ` · ${exp.start_date} – ${exp.end_date || 'Present'}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {result.projects && result.projects.length > 0 && (
                <div className="pr-card pr-wide">
                  <div className="pr-card-header">
                    <h4>Technical Projects ({result.projects.length})</h4>
                    <span className="pr-count-tag">Engineering Portfolio</span>
                  </div>
                  <div className="pr-projects-grid">
                    {result.projects.map((proj, i) => (
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

              {result.certifications && result.certifications.length > 0 && (
                <div className="pr-card pr-wide">
                  <div className="pr-card-header">
                    <h4>Certifications & Credentials ({result.certifications.length})</h4>
                    <span className="pr-count-tag">Verified Credentials</span>
                  </div>
                  <div className="pr-certs-grid">
                    {result.certifications.map((c, i) => {
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
          </div>
        )}
      </section>

      <section className="upload-features">
        <div className="uf-shapes">
          <div className="uf-shape uf-shape-1"></div>
          <div className="uf-shape uf-shape-2"></div>
        </div>
        <h2>What Happens After Upload?</h2>
        <p>Our AI goes to work instantly</p>
        <div className="uf-grid">
          {features.map((f, i) => (
            <div key={i} className="uf-card">
              <div className="uf-card-icon">
                <span>{f.icon}</span>
              </div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="upload-steps">
        <h2>Structured Screening Process</h2>
        <div className="us-grid">
          <div className="us-card">
            <div className="us-num">1</div>
            <div className="us-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h4>Ingest Document</h4>
            <p>Upload your PDF or DOCX resume securely</p>
          </div>
          <div className="us-arrow">→</div>
          <div className="us-card">
            <div className="us-num">2</div>
            <div className="us-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h4>Parser Extraction</h4>
            <p>Normalize technical competencies and work history</p>
          </div>
          <div className="us-arrow">→</div>
          <div className="us-card">
            <div className="us-num">3</div>
            <div className="us-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h4>ATS Score & Match</h4>
            <p>Inspect radial ATS readiness and role compatibility</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Upload
