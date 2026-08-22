import { Link } from 'react-router-dom'

function Dashboard() {
  const stats = [
    { icon: '📄', label: 'Resumes Uploaded', value: '0', change: 'Upload your first resume', color: '#0f2155' },
    { icon: '🎯', label: 'Jobs Matched', value: '0', change: 'Matches appear after analysis', color: '#1e3a8a' },
    { icon: '📊', label: 'Avg ATS Score', value: '--', change: 'Score calculated after upload', color: '#152c6e' },
    { icon: '🏆', label: 'Ranking', value: '--', change: 'Rank among other candidates', color: '#4a7dff' }
  ]

  const quickActions = [
    { icon: '📤', title: 'Upload Resume', desc: 'Upload a new resume for AI analysis', link: '/upload', color: 'linear-gradient(135deg, #0f2155, #1e3a8a)' },
    { icon: '🔍', title: 'Search Jobs', desc: 'Browse available job opportunities', link: '/', color: 'linear-gradient(135deg, #152c6e, #2a4a9f)' },
    { icon: '📈', title: 'View Reports', desc: 'Check detailed analysis reports', link: '/dashboard', color: 'linear-gradient(135deg, #1e3a8a, #4a7dff)' }
  ]

  const recentActivity = [
    { icon: '👋', text: 'Welcome to AI Resume Screening', time: 'Just now', type: 'welcome' },
    { icon: '🚀', text: 'System ready for resume uploads', time: 'System', type: 'system' },
    { icon: '💡', text: 'Tip: Upload your resume to get started', time: 'Tip', type: 'tip' }
  ]

  return (
    <div className="dashboard-page">

      {/* Decorative Background */}
      <div className="dash-decor">
        <div className="dash-circle dash-circle-1"></div>
        <div className="dash-circle dash-circle-2"></div>
        <div className="dash-blob dash-blob-1"></div>
        <div className="dash-grid-pattern"></div>
      </div>

      {/* Header */}
      <section className="dash-header">
        <div className="dash-header-content">
          <div className="section-badge">Dashboard</div>
          <h1>Recruiter Dashboard</h1>
          <p>View uploaded resumes, matching results, and analytics.</p>
        </div>
        <Link to="/upload" className="dash-upload-btn">
          <span>📤</span> Upload Resume
        </Link>
      </section>

      {/* Stats Cards */}
      <section className="dash-stats">
        {stats.map((s, i) => (
          <div key={i} className="dash-stat-card" style={{ '--stat-color': s.color }}>
            <div className="dsc-icon-wrap">
              <span className="dsc-icon">{s.icon}</span>
            </div>
            <div className="dsc-info">
              <span className="dsc-value">{s.value}</span>
              <span className="dsc-label">{s.label}</span>
              <span className="dsc-change">{s.change}</span>
            </div>
            <div className="dsc-shape"></div>
          </div>
        ))}
      </section>

      {/* Main Content Grid */}
      <section className="dash-content">

        {/* Empty State */}
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

        {/* Quick Actions */}
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

        {/* Activity Feed */}
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

        {/* What You'll See */}
        <div className="dash-preview">
          <h3>What You'll See After Upload</h3>
          <div className="dp-grid">
            <div className="dp-card">
              <span className="dp-icon">📊</span>
              <h4>ATS Score</h4>
              <p>See how your resume performs with Applicant Tracking Systems</p>
            </div>
            <div className="dp-card">
              <span className="dp-icon">🎯</span>
              <h4>Job Matches</h4>
              <p>View jobs ranked by compatibility with your profile</p>
            </div>
            <div className="dp-card">
              <span className="dp-icon">📝</span>
              <h4>Extracted Data</h4>
              <p>Review all information parsed from your resume</p>
            </div>
            <div className="dp-card">
              <span className="dp-icon">💬</span>
              <h4>AI Feedback</h4>
              <p>Get personalized suggestions to improve your resume</p>
            </div>
          </div>
        </div>

      </section>
    </div>
  )
}

export default Dashboard
