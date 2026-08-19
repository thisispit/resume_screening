import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
  {
    num: '01',
    title: 'Upload Resume',
    desc: 'Upload your resume in PDF format. Our AI extracts all relevant information automatically.',
    icon: '📄'
  },
  {
    num: '02',
    title: 'AI Analysis',
    desc: 'Our advanced AI analyzes your skills, experience, education, and qualifications.',
    icon: '🤖'
  },
  {
    num: '03',
    title: 'Smart Matching',
    desc: 'Get matched with the best job opportunities based on your profile.',
    icon: '🎯'
  },
  {
    num: '04',
    title: 'Get Hired',
    desc: 'Apply with confidence using AI-powered resume feedback and interview prep.',
    icon: '🚀'
  }
]

const bigFeatures = [
  {
    icon: '📄',
    title: 'Resume Upload & Analysis',
    desc: 'Upload your resume and our AI will instantly extract and analyze all key information including skills, experience, education, and certifications.',
    features: ['PDF text extraction', 'Skill identification', 'Experience parsing', 'Education verification'],
    link: '/upload',
    linkText: 'Upload Your Resume',
    color: '#667eea'
  },
  {
    icon: '📊',
    title: 'ATS Score & Optimization',
    desc: 'See your Applicant Tracking System score and get actionable suggestions to improve your resume for better visibility to recruiters.',
    features: ['Real-time ATS scoring', 'Keyword optimization', 'Format suggestions', 'Industry-specific tips'],
    link: '/dashboard',
    linkText: 'Check Your Score',
    color: '#764ba2'
  }
]

const smallFeatures = [
  {
    icon: '🎯',
    title: 'Skill Matching',
    desc: 'Match your skills with job requirements instantly.',
    link: '/dashboard'
  },
  {
    icon: '📈',
    title: 'Candidate Ranking',
    desc: 'See how you rank against other applicants.',
    link: '/dashboard'
  },
  {
    icon: '💬',
    title: 'AI Feedback',
    desc: 'Get personalized resume improvement tips.',
    link: '/upload'
  },
  {
    icon: '🎙️',
    title: 'Interview Prep',
    desc: 'Generate AI interview questions for your role.',
    link: '/dashboard'
  }
]

const jobCategories = [
  { icon: '💻', name: 'Software Engineering', count: 245, color: '#667eea', topSkills: ['Java', 'Python', 'React'] },
  { icon: '📊', name: 'Data Science', count: 183, color: '#764ba2', topSkills: ['Python', 'SQL', 'TensorFlow'] },
  { icon: '🎨', name: 'UI/UX Design', count: 127, color: '#f093fb', topSkills: ['Figma', 'Adobe XD', 'CSS'] },
  { icon: '📱', name: 'Mobile Development', count: 98, color: '#4facfe', topSkills: ['React Native', 'Flutter', 'Swift'] },
  { icon: '☁️', name: 'Cloud Computing', count: 156, color: '#43e97b', topSkills: ['AWS', 'Azure', 'Docker'] },
  { icon: '🔒', name: 'Cybersecurity', count: 89, color: '#fa709a', topSkills: ['Network Security', 'Penetration Testing', 'SIEM'] }
]

const recommendedJobs = [
  {
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'Bangalore, India',
    salary: '₹12-18 LPA',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    type: 'Full-time',
    posted: '2 days ago',
    logo: '🏢'
  },
  {
    title: 'Data Scientist',
    company: 'DataFlow Solutions',
    location: 'Hyderabad, India',
    salary: '₹10-16 LPA',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    type: 'Full-time',
    posted: '1 day ago',
    logo: '🔬'
  },
  {
    title: 'UI/UX Designer',
    company: 'DesignStudio',
    location: 'Mumbai, India',
    salary: '₹8-14 LPA',
    skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
    type: 'Full-time',
    posted: '3 days ago',
    logo: '🎨'
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudFirst Tech',
    location: 'Pune, India',
    salary: '₹14-22 LPA',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    type: 'Full-time',
    posted: '5 hours ago',
    logo: '☁️'
  }
]

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    alert(`Searching for: ${suggestion}. Backend not connected yet.`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (searchQuery) {
      alert(`Searching for: ${searchQuery}. Backend not connected yet.`)
    }
  }

  return (
    <div className="home-page">

      {/* Hero Section */}
      <section className="hero-section">
        <h1>AI Resume Screening<br />& Job Matching</h1>
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
        <div className="stat-item"><span className="stat-number">10K+</span><span className="stat-label">Resumes Analyzed</span></div>
        <div className="stat-item"><span className="stat-number">5K+</span><span className="stat-label">Jobs Matched</span></div>
        <div className="stat-item"><span className="stat-number">95%</span><span className="stat-label">Accuracy Rate</span></div>
        <div className="stat-item"><span className="stat-number">500+</span><span className="stat-label">Companies</span></div>
      </section>

      {/* How It Works - Left Sidebar Layout */}
      <section className="how-it-works-section">
        <div className="how-it-works-left">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in 4 simple steps</p>
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
          <div className="how-it-works-visual">
            <div className="visual-card visual-card-1">
              <span>📄</span>
              <p>Upload</p>
            </div>
            <div className="visual-card visual-card-2">
              <span>🤖</span>
              <p>Analyze</p>
            </div>
            <div className="visual-card visual-card-3">
              <span>🎯</span>
              <p>Match</p>
            </div>
            <div className="visual-card visual-card-4">
              <span>🚀</span>
              <p>Hired</p>
            </div>
          </div>
        </div>
      </section>

      {/* Big Feature Cards */}
      <section className="section">
        <h2 className="section-title">Powerful Features</h2>
        <p className="section-subtitle">Everything you need to land your dream job</p>

        <div className="big-features">
          {bigFeatures.map((feature, i) => (
            <div key={i} className="big-feature-card">
              <div className="big-feature-left">
                <span className="big-feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <Link to={feature.link} className="card-link">{feature.linkText} →</Link>
              </div>
              <div className="big-feature-right">
                <ul>
                  {feature.features.map((f, j) => (
                    <li key={j}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="small-features">
          {smallFeatures.map((feature, i) => (
            <div key={i} className="small-feature-card">
              <span className="small-feature-icon">{feature.icon}</span>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
              <Link to={feature.link} className="small-card-link">Learn More →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Job Categories - Attractive Design */}
      <section className="section categories-section">
        <h2 className="section-title">Popular Job Categories</h2>
        <p className="section-subtitle">Explore opportunities across various domains</p>
        <div className="categories-grid">
          {jobCategories.map((cat, i) => (
            <div key={i} className="category-card" style={{ borderTopColor: cat.color }}>
              <div className="category-header">
                <span className="category-icon">{cat.icon}</span>
                <div>
                  <h4>{cat.name}</h4>
                  <span className="category-count">{cat.count} open positions</span>
                </div>
              </div>
              <div className="category-skills">
                {cat.topSkills.map((skill, j) => (
                  <span key={j} className="cat-skill">{skill}</span>
                ))}
              </div>
              <div className="category-bar">
                <div className="category-bar-fill" style={{ width: `${(cat.count / 250) * 100}%`, background: cat.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Jobs */}
      <section className="section">
        <h2 className="section-title">Recommended Jobs</h2>
        <p className="section-subtitle">Popular opportunities you might be interested in</p>
        <div className="jobs-grid">
          {recommendedJobs.map((job, i) => (
            <div key={i} className="job-card">
              <div className="job-top">
                <span className="job-logo">{job.logo}</span>
                <div>
                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                </div>
                <span className="job-type">{job.type}</span>
              </div>
              <div className="job-details">
                <span>📍 {job.location}</span>
                <span>💰 {job.salary}</span>
              </div>
              <div className="job-skills">
                {job.skills.map((skill, j) => (
                  <span key={j} className="skill-tag">{skill}</span>
                ))}
              </div>
              <div className="job-footer">
                <span className="job-posted">{job.posted}</span>
                <Link to="/upload" className="job-apply-btn">Apply Now →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Find Your Dream Job?</h2>
        <p>Upload your resume now and let our AI do the hard work for you.</p>
        <Link to="/upload" className="cta-btn">Get Started Free →</Link>
      </section>
    </div>
  )
}

export default Home
