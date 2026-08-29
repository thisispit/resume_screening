import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const searchSuggestions = [
  'Data Scientist', 'Data Analyst', 'Data Engineering',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Software Engineer', 'Software Developer',
  'UI/UX Designer', 'Product Designer', 'Graphic Designer',
  'Mobile Developer', 'Android Developer', 'iOS Developer',
  'DevOps Engineer', 'Cloud Engineer', 'System Administrator',
  'Machine Learning Engineer', 'AI Engineer', 'Deep Learning',
  'Cybersecurity Analyst', 'Network Engineer', 'Security Engineer',
  'Project Manager', 'Business Analyst', 'Product Manager',
  'QA Engineer', 'Test Engineer', 'Automation Engineer',
  'Database Administrator', 'SQL Developer', 'Data Warehouse',
  'Blockchain Developer', 'Web Developer', 'Python Developer',
  'Java Developer', 'React Developer', 'Angular Developer',
  'Node.js Developer', 'Django Developer', 'Flask Developer',
  'AWS Engineer', 'Azure Engineer', 'GCP Engineer',
  'Technical Writer', 'Solutions Architect', 'IT Consultant'
]

const howItWorks = [
  { num: '01', title: 'Upload Resume', desc: 'Upload your resume in PDF format. Our AI extracts all relevant information automatically.', icon: '📄' },
  { num: '02', title: 'AI Analysis', desc: 'Our advanced AI analyzes your skills, experience, education, and qualifications.', icon: '🤖' },
  { num: '03', title: 'Smart Matching', desc: 'Get matched with the best job opportunities based on your profile.', icon: '🎯' },
  { num: '04', title: 'Get Hired', desc: 'Apply with confidence using AI-powered resume feedback and interview prep.', icon: '🚀' }
]

const bigFeatures = [
  {
    icon: '📄', title: 'Resume Upload & Analysis', shape: 'hexagon',
    desc: 'Upload your resume and our AI will instantly extract and analyze all key information including skills, experience, education, and certifications.',
    features: ['PDF text extraction', 'Skill identification', 'Experience parsing', 'Education verification'],
    link: '/upload', linkText: 'Upload Your Resume'
  },
  {
    icon: '📊', title: 'ATS Score & Optimization', shape: 'diamond',
    desc: 'See your Applicant Tracking System score and get actionable suggestions to improve your resume for better visibility to recruiters.',
    features: ['Real-time ATS scoring', 'Keyword optimization', 'Format suggestions', 'Industry-specific tips'],
    link: '/dashboard', linkText: 'Check Your Score'
  }
]

const smallFeatures = [
  { icon: '🎯', title: 'Skill Matching', desc: 'Match your skills with job requirements instantly.', link: '/dashboard', shape: 'circle' },
  { icon: '📈', title: 'Candidate Ranking', desc: 'See how you rank against other applicants.', link: '/dashboard', shape: 'triangle' },
  { icon: '💬', title: 'AI Feedback', desc: 'Get personalized resume improvement tips.', link: '/upload', shape: 'star' },
  { icon: '🎙️', title: 'Interview Prep', desc: 'Generate AI interview questions for your role.', link: '/dashboard', shape: 'pentagon' }
]

const jobCategories = [
  { icon: '💻', name: 'Software Engineering', count: 245, color: '#0f2155', topSkills: ['Java', 'Python', 'React'] },
  { icon: '📊', name: 'Data Science', count: 183, color: '#152c6e', topSkills: ['Python', 'SQL', 'TensorFlow'] },
  { icon: '🎨', name: 'UI/UX Design', count: 127, color: '#4a7dff', topSkills: ['Figma', 'Adobe XD', 'CSS'] },
  { icon: '📱', name: 'Mobile Development', count: 98, color: '#2a4a9f', topSkills: ['React Native', 'Flutter', 'Swift'] },
  { icon: '☁️', name: 'Cloud Computing', count: 156, color: '#1e3a8a', topSkills: ['AWS', 'Azure', 'Docker'] },
  { icon: '🔒', name: 'Cybersecurity', count: 89, color: '#0a1640', topSkills: ['Network Security', 'Penetration Testing', 'SIEM'] }
]

const recommendedJobs = [
  { title: 'Senior Frontend Developer', company: 'TechCorp Inc.', location: 'Bangalore, India', salary: '₹12-18 LPA', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'], type: 'Full-time', posted: '2 days ago', logo: '🏢' },
  { title: 'Data Scientist', company: 'DataFlow Solutions', location: 'Hyderabad, India', salary: '₹10-16 LPA', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'], type: 'Full-time', posted: '1 day ago', logo: '🔬' },
  { title: 'UI/UX Designer', company: 'DesignStudio', location: 'Mumbai, India', salary: '₹8-14 LPA', skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'], type: 'Full-time', posted: '3 days ago', logo: '🎨' },
  { title: 'DevOps Engineer', company: 'CloudFirst Tech', location: 'Pune, India', salary: '₹14-22 LPA', skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], type: 'Full-time', posted: '5 hours ago', logo: '☁️' }
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
      .catch(() => { /* backend may be down; fall back to static */ })
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.length > 0) {
      const filtered = searchSuggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 8))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    runSearch()
  }

  const runSearch = async () => {
    if (!searchQuery) return
    setSearching(true)
    setSearchError('')
    try {
      const jobs = await api(`/jobs?search=${encodeURIComponent(searchQuery)}`)
      setSearchResults(jobs)
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

  return (
    <div className="home-page">

      {/* Decorative Background Shapes */}
      <div className="home-decor">
        <div className="deco-circle deco-circle-1"></div>
        <div className="deco-circle deco-circle-2"></div>
        <div className="deco-circle deco-circle-3"></div>
        <div className="deco-blob deco-blob-1"></div>
        <div className="deco-blob deco-blob-2"></div>
        <div className="deco-wave"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          AI-Powered Resume Screening
        </div>
        <h1>Find Your Dream Job<br /><span className="hero-highlight">With AI Power</span></h1>
        <p className="hero-subtitle">
          Upload your resume and let our AI analyze, score, and match you with the best job opportunities.
        </p>

        <div className="search-container" ref={searchRef}>
          <form className="search-box" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for jobs... (e.g., Data Scientist, Frontend Developer)"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search Jobs</button>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-item" onClick={() => handleSuggestionClick(s)}>
                  <span className="suggestion-icon">🔍</span>
                  <span className="suggestion-text">{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hero-tags">
          {['Frontend Developer', 'Data Scientist', 'UI/UX Designer', 'Backend Developer', 'DevOps Engineer', 'ML Engineer'].map(tag => (
            <span key={tag} className="tag" onClick={() => handleSuggestionClick(tag)}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-bg-shape"></div>
        {[
          { num: '10K+', label: 'Resumes Analyzed', icon: '📄' },
          { num: '5K+', label: 'Jobs Matched', icon: '💼' },
          { num: '95%', label: 'Accuracy Rate', icon: '✅' },
          { num: '500+', label: 'Companies', icon: '🏢' }
        ].map((s, i) => (
          <div key={i} className="stat-item">
            <span className="stat-icon">{s.icon}</span>
            <span className="stat-number">{s.num}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="how-it-works-section">
        <div className="how-it-works-bg"></div>
        <div className="how-it-works-left">
          <div className="section-badge">How It Works</div>
          <h2 className="section-title">Get Started in 4 Simple Steps</h2>
          <div className="steps-list">
            {howItWorks.map((step, i) => (
              <div key={i} className="step-item">
                <div className="step-left">
                  <div className="step-num">{step.num}</div>
                  {i < howItWorks.length - 1 && <div className="step-line"></div>}
                </div>
                <div className="step-right">
                  <span className="step-icon">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="how-it-works-right">
          <div className="visual-cards-stack">
            <div className="visual-card vc-1"><span>📄</span><p>Upload</p></div>
            <div className="visual-card vc-2"><span>🤖</span><p>Analyze</p></div>
            <div className="visual-card vc-3"><span>🎯</span><p>Match</p></div>
            <div className="visual-card vc-4"><span>🚀</span><p>Hired</p></div>
          </div>
          <div className="visual-shapes">
            <div className="v-shape v-shape-1"></div>
            <div className="v-shape v-shape-2"></div>
            <div className="v-shape v-shape-3"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-bg-shapes">
          <div className="f-shape f-shape-1"></div>
          <div className="f-shape f-shape-2"></div>
          <div className="f-shape f-shape-3"></div>
        </div>
        <div className="section-badge">Features</div>
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">Everything you need to land your dream job</p>

        <div className="big-features">
          {bigFeatures.map((feature, i) => (
            <div key={i} className={`big-feature-card bfc-${feature.shape}`}>
              <div className="bfc-glow"></div>
              <div className="bfc-shape-icon">
                <span>{feature.icon}</span>
                <div className={`shape-bg shape-${feature.shape}`}></div>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <ul>
                {feature.features.map((f, j) => (
                  <li key={j}>✓ {f}</li>
                ))}
              </ul>
              <Link to={feature.link} className="card-link">{feature.linkText} →</Link>
            </div>
          ))}
        </div>

        <div className="small-features">
          {smallFeatures.map((feature, i) => (
            <div key={i} className={`small-feature-card sfc-${feature.shape}`}>
              <div className="sfc-icon-wrap">
                <span className="sfc-icon">{feature.icon}</span>
                <div className={`sfc-shape sfc-shape-${feature.shape}`}></div>
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
              <Link to={feature.link} className="small-card-link">Learn More →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Categories + Jobs */}
      <section className="explore-section">
        <div className="explore-bg">
          <div className="exp-shape exp-shape-1"></div>
          <div className="exp-shape exp-shape-2"></div>
        </div>
        <div className="explore-container">
          <div className="categories-panel">
            <div className="cp-header">
              <div className="section-badge section-badge-light">Categories</div>
              <h2>Popular Job Categories</h2>
              <p>Explore opportunities across various domains</p>
            </div>
            <div className="cat-list">
              {jobCategories.map((cat, i) => (
                <div key={i} className="cat-item" style={{ '--cat-color': cat.color }}>
                  <span className="cat-item-icon">{cat.icon}</span>
                  <div className="cat-item-info">
                    <h4>{cat.name}</h4>
                    <span>{cat.count} open positions</span>
                  </div>
                  <div className="cat-item-bar">
                    <div className="cat-item-bar-fill" style={{ width: `${(cat.count / 250) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="categories-cta">
              <span className="categories-count-big">898+</span>
              <span className="categories-label">Total Open Positions</span>
            </div>
          </div>

          <div className="jobs-panel">
            <div className="jobs-panel-header">
              <div>
                <div className="section-badge">Jobs</div>
                <h2>{searchResults ? `Results for "${searchQuery}"` : 'Recommended Jobs'}</h2>
                <p>Popular opportunities you might be interested in</p>
              </div>
              <Link to="/dashboard" className="view-all-btn">View All →</Link>
            </div>
            <div className="jobs-list">
              {searching && <p className="jcn-loading">Searching jobs...</p>}
              {searchError && <p className="jcn-loading">{searchError}</p>}
              {!searchResults && !searching && (liveJobs.length > 0 ? liveJobs : recommendedJobs).map((job, i) => (
                <div key={job.id ?? i} className="job-card-new">
                  <div className="jcn-left">
                    <div className="jcn-logo-wrap">
                      <span className="jcn-logo">{job.logo ?? '💼'}</span>
                    </div>
                  </div>
                  <div className="jcn-center">
                    <h3>{job.title}</h3>
                    <p className="jcn-company">{job.company_name ?? job.company}</p>
                    <div className="jcn-meta">
                      <span>📍 {job.location || 'Remote'}</span>
                      {job.salary_min != null && <span>💰 {job.salary_min}-{job.salary_max ?? ''}</span>}
                      <span>⏰ {job.employment_type ?? 'Full-time'}</span>
                    </div>
                    <div className="jcn-skills">
                      {(job.required_skills ?? job.skills ?? []).map((skill, j) => (
                        <span key={j} className="jcn-skill">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="jcn-right">
                    <span className="jcn-type">{job.employment_type ?? job.type}</span>
                    <Link to="/upload" className="jcn-apply">Apply →</Link>
                  </div>
                </div>
              ))}
              {searchResults && searchResults.length > 0 && searchResults.map((job, i) => (
                <div key={job.id} className="job-card-new">
                  <div className="jcn-left">
                    <div className="jcn-logo-wrap"><span className="jcn-logo">💼</span></div>
                  </div>
                  <div className="jcn-center">
                    <h3>{job.title}</h3>
                    <p className="jcn-company">{job.company_name}</p>
                    <div className="jcn-meta">
                      <span>📍 {job.location || 'Remote'}</span>
                      {job.salary_min != null && <span>💰 {job.salary_min}-{job.salary_max ?? ''}</span>}
                      <span>⏰ {job.employment_type}</span>
                    </div>
                    <div className="jcn-skills">
                      {(job.required_skills ?? []).map((skill, j) => (
                        <span key={j} className="jcn-skill">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="jcn-right">
                    <span className="jcn-type">{job.employment_type}</span>
                    <Link to="/upload" className="jcn-apply">Apply →</Link>
                  </div>
                </div>
              ))}
              {searchResults && searchResults.length === 0 && !searching && (
                <p className="jcn-loading">No jobs found for "{searchQuery}".</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-shapes">
          <div className="cta-shape cta-shape-1"></div>
          <div className="cta-shape cta-shape-2"></div>
          <div className="cta-shape cta-shape-3"></div>
        </div>
        <div className="cta-content">
          <h2>Ready to Find Your Dream Job?</h2>
          <p>Upload your resume now and let our AI do the hard work for you.</p>
          <Link to="/upload" className="cta-btn">Get Started Free →</Link>
        </div>
      </section>
    </div>
  )
}

export default Home
