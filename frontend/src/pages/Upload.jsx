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
  const navigate = useNavigate()

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
                <span>🎯 View AI Job Matches</span>
                <span>→</span>
              </button>
            </div>

            <AtsGauge
              score={Math.min(98, Math.round(55 + ((result.skills?.length || 0) * 3) + ((result.total_experience_years || 0) * 5) + ((result.education?.length ? 1 : 0) * 10)))}
              skillsCount={result.skills?.length || 0}
              experienceYears={result.total_experience_years || 0}
              hasEducation={(result.education || []).length > 0}
              summaryLength={result.summary?.length || 0}
            />

            <div className="pr-grid">
              <div className="pr-card">
                <h4>Contact</h4>
                <p><strong>Name:</strong> {result.candidate_name || '—'}</p>
                <p><strong>Email:</strong> {result.email || '—'}</p>
                <p><strong>Phone:</strong> {result.phone || '—'}</p>
                <p><strong>Location:</strong> {result.location || '—'}</p>
              </div>
              <div className="pr-card">
                <h4>Skills ({result.skills?.length || 0})</h4>
                <div className="pr-tags">
                  {(result.skills || []).map((s, i) => (
                    <span key={i} className="pr-tag">{s}</span>
                  ))}
                </div>
              </div>
              <div className="pr-card pr-wide">
                <h4>Summary</h4>
                <p>{result.summary || 'No summary extracted.'}</p>
              </div>
              <div className="pr-card pr-wide">
                <h4>Experience ({result.total_experience_years || 0} yrs)</h4>
                {(result.experience || []).length === 0 && <p className="pr-empty">No experience extracted.</p>}
                <ul className="pr-list">
                  {(result.experience || []).map((exp, i) => (
                    <li key={i}>
                      {exp.title || 'Role'} at {exp.company || '—'}
                      {exp.duration_years != null && ` (${exp.duration_years} yrs)`}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pr-card pr-wide">
                <h4>Education</h4>
                {(result.education || []).length === 0 && <p className="pr-empty">No education extracted.</p>}
                <ul className="pr-list">
                  {(result.education || []).map((ed, i) => (
                    <li key={i}>
                      {ed.degree || 'Degree'}
                      {ed.institution && ` · ${ed.institution}`}
                      {ed.year && ` · ${ed.year}`}
                    </li>
                  ))}
                </ul>
              </div>
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
