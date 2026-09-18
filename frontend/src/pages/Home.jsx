import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const searchSuggestions = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Machine Learning Engineer',
  'UI/UX Designer', 'Cloud Engineer', 'Product Manager', 'Solutions Architect'
]

const howItWorks = [
  {
    num: '01',
    title: 'Resume Ingestion',
    desc: 'Upload PDF or DOCX documents. Personal details, career history, and credentials are structured cleanly.'
  },
  {
    num: '02',
    title: 'Competency Analysis',
    desc: 'Extracts technical skills, verifies career duration, and normalizes educational backgrounds.'
  },
  {
    num: '03',
    title: 'Criteria-Based Matching',
    desc: 'Evaluates candidates against verified job requirements using explainable, weighted compatibility scoring.'
  },
  {
    num: '04',
    title: 'Structured Decisions',
    desc: 'Candidates track submission status; recruiters screen ranked talent with transparent evaluation criteria.'
  }
]

const coreCapabilities = [
  {
    title: 'Applicant Tracking System (ATS) Readiness',
    desc: 'Evaluate resume compatibility with industry standard ATS parsers. Get actionable keyword and formatting suggestions before applying.',
    points: ['Real-time ATS scoring index', 'Keyword density detection', 'Career duration calculation', 'Section structure verification']
  },
  {
    title: 'Explainable Candidate Ranking',
    desc: 'Screen candidates using weighted criteria: technical skill overlap, semantic role alignment, experience duration, and degree requirements.',
    points: ['Objective multi-factor scoring', 'Direct skill-gap identification', 'Custom status pipelines', 'Exportable candidate summaries']
  }
]

const recommendedJobs = [
  { id: 'sample-1', title: 'Senior Full-Stack Engineer', company_name: 'TechCorp Solutions', location: 'Remote / Bangalore', employment_type: 'Full-time', required_skills: ['React', 'Python', 'FastAPI', 'PostgreSQL'], salary_min: 14, salary_max: 22 },
  { id: 'sample-2', title: 'Data Scientist & ML Engineer', company_name: 'DataFlow Analytics', location: 'Hyderabad', employment_type: 'Full-time', required_skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'], salary_min: 12, salary_max: 18 },
  { id: 'sample-3', title: 'Lead DevOps Engineer', company_name: 'CloudFirst Networks', location: 'Pune', employment_type: 'Full-time', required_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], salary_min: 16, salary_max: 24 },
  { id: 'sample-4', title: 'Product UI/UX Designer', company_name: 'DesignStudio Labs', location: 'Mumbai', employment_type: 'Full-time', required_skills: ['Figma', 'Design Systems', 'User Research'], salary_min: 10, salary_max: 16 }
]

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [liveJobs, setLiveJobs] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api('/jobs')
      .then(setLiveJobs)
      .catch(() => {})
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.length > 0) {
      const filtered = searchSuggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 6))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    runSearch(suggestion)
  }

  const runSearch = async (query) => {
    const term = (query ?? searchQuery).trim()
    if (!term) return
    setSearching(true)
    setSearchError('')
    try {
      const jobs = await api(`/jobs?search=${encodeURIComponent(term)}`)
      setSearchResults(jobs)
      if (resultsRef.current) {
        setTimeout(() => resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
      }
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    runSearch()
  }

  const displayJobs = searchResults || (liveJobs.length > 0 ? liveJobs : recommendedJobs)

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section hero-split">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Automated Candidate Screening & Job Matching
          </div>
          <h1>
            Recruitment Built for <br />
            <span className="hero-highlight">Clarity and Precision.</span>
          </h1>
          <p className="hero-subtitle">
            Analyze qualifications, extract technical competencies, and generate objective match scores based on real job requirements.
          </p>

          <div className="hero-cta-row">
            <Link to="/upload" className="hero-primary-btn">
              Submit Resume for Review →
            </Link>
            <Link to="/post-job" className="hero-secondary-btn">
              Post an Opening
            </Link>
          </div>

          <div className="search-container" ref={searchRef}>
            <form className="search-box" onSubmit={handleSearch}>
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search openings by role or skill (e.g. React, Python, Data Science)..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                className="search-input"
              />
              <button type="submit" className="search-btn">Search</button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                    <span className="suggestion-text">{s}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults && (
              <div className={`search-feedback ${searchResults.length === 0 ? 'empty' : ''}`}>
                {searchResults.length > 0
                  ? `Showing ${searchResults.length} matching role${searchResults.length > 1 ? 's' : ''} for "${searchQuery}".`
                  : `No positions found matching "${searchQuery}".`}
              </div>
            )}

            {searchError && (
              <div className="search-feedback empty">
                {searchError}
              </div>
            )}
          </div>

          <div className="hero-tags">
            <span className="hero-tags-label">Popular Searches:</span>
            {['Frontend Developer', 'Data Scientist', 'Python Developer', 'DevOps Engineer'].map(tag => (
              <span key={tag} className="tag" onClick={() => handleSuggestionClick(tag)}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Hero Right: Clean Editorial Evaluation Showcase */}
        <div className="hero-right">
          <div className="hero-cards-stage">
            <div className="hero-editorial-card">
              <div className="hec-top">
                <div>
                  <span className="hec-eyebrow">Candidate Evaluation</span>
                  <h4>Alex Morgan</h4>
                  <p className="hec-role">Senior Full-Stack Developer · 6.5 yrs exp</p>
                </div>
                <div className="hec-score-badge">
                  <span className="hec-score-val">92%</span>
                  <span className="hec-score-sub">Match Index</span>
                </div>
              </div>

              <div className="hec-skills-list">
                <span className="hec-tag matched">React.js</span>
                <span className="hec-tag matched">Python</span>
                <span className="hec-tag matched">FastAPI</span>
                <span className="hec-tag matched">PostgreSQL</span>
                <span className="hec-tag matched">System Design</span>
                <span className="hec-tag missing">AWS Cloud</span>
              </div>

              <div className="hec-metrics">
                <div className="hec-metric-row">
                  <span>Skills Alignment</span>
                  <div className="hec-track"><div className="hec-bar" style={{ width: '95%' }}></div></div>
                  <strong>95%</strong>
                </div>
                <div className="hec-metric-row">
                  <span>Relevant Experience</span>
                  <div className="hec-track"><div className="hec-bar" style={{ width: '88%' }}></div></div>
                  <strong>88%</strong>
                </div>
                <div className="hec-metric-row">
                  <span>Credential Verification</span>
                  <div className="hec-track"><div className="hec-bar" style={{ width: '100%' }}></div></div>
                  <strong>100%</strong>
                </div>
              </div>

              <div className="hec-footer">
                <span className="hec-status-pill">Shortlisted for Review</span>
                <span className="hec-time">Updated Today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        {[
          { num: '10,000+', label: 'Resumes Screened' },
          { num: '5,000+', label: 'Successful Matches' },
          { num: '96.5%', label: 'Evaluation Consistency' },
          { num: '500+', label: 'Hiring Companies' }
        ].map((s, i) => (
          <div key={i} className="stat-item">
            <span className="stat-number">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Workflow Section */}
      <section className="how-it-works-section">
        <div className="how-it-works-header">
          <div className="section-badge">Workflow</div>
          <h2 className="section-title">Structured 4-Step Screening Pipeline</h2>
          <p className="section-subtitle">
            Designed for transparent, objective evaluations without black-box complexity.
          </p>
        </div>

        <div className="steps-grid">
          {howItWorks.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-card-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="capabilities-section">
        <div className="cap-header">
          <div className="section-badge">Platform Capabilities</div>
          <h2 className="section-title">Engineered for Candidates and Recruitment Teams</h2>
        </div>

        <div className="cap-grid">
          {coreCapabilities.map((cap, i) => (
            <div key={i} className="cap-card">
              <h3>{cap.title}</h3>
              <p>{cap.desc}</p>
              <ul className="cap-points">
                {cap.points.map((pt, j) => (
                  <li key={j}>✓ {pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Jobs Listing Section */}
      <section className="jobs-section" ref={resultsRef}>
        <div className="jobs-section-header">
          <div>
            <div className="section-badge">Opportunities</div>
            <h2 className="section-title">Open Positions</h2>
            <p className="section-subtitle">Explore positions and submit your resume for automated compatibility scoring.</p>
          </div>
          <Link to="/upload" className="section-header-link">Submit Resume →</Link>
        </div>

        <div className="jobs-list">
          {searching && <p className="jcn-loading">Searching open positions...</p>}
          {searchError && <p className="jcn-loading">{searchError}</p>}
          {!searching && displayJobs.map((job) => (
            <div key={job.id} className="job-card-new">
              <div className="jcn-center">
                <h3>{job.title}</h3>
                <p className="jcn-company">{job.company_name || 'Organization'}</p>
                <div className="jcn-meta">
                  <span>📍 {job.location || 'Remote'}</span>
                  {job.salary_min != null && <span>💰 ₹{job.salary_min}-{job.salary_max || ''} LPA</span>}
                  <span>⏰ {job.employment_type || 'Full-time'}</span>
                </div>
                <div className="jcn-skills">
                  {(job.required_skills || []).map((skill, j) => (
                    <span key={j} className="jcn-skill">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="jcn-right">
                <Link to="/upload" className="jcn-apply">Apply with Resume →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Callout */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Streamline Your Evaluation Process?</h2>
          <p>Candidates discover matching roles with ATS insight. Hiring managers review qualified talent with confidence.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link to="/upload" className="cta-btn">Submit Resume</Link>
            <Link to="/post-job" className="hero-secondary-btn" style={{ background: 'transparent', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
              Post a Position
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
