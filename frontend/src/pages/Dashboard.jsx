function Dashboard() {
  const features = [
    { icon: '📋', title: 'Uploaded Resumes', desc: 'View all uploaded resumes' },
    { icon: '📝', title: 'Extracted Info', desc: 'See parsed resume data' },
    { icon: '🎯', title: 'Job Matching', desc: 'View matching scores' },
    { icon: '🏆', title: 'Rankings', desc: 'Candidate rankings' }
  ]

  return (
    <div className="page">
      <h1>Recruiter Dashboard</h1>
      <p>View uploaded resumes and matching results.</p>

      <div className="dashboard-placeholder">
        <p className="dashboard-title">No resumes uploaded yet.</p>
        <p className="dashboard-subtitle">This dashboard will show:</p>
        <div className="dashboard-grid">
          {features.map((feature, index) => (
            <div key={index} className="dashboard-item">
              <span className="dashboard-icon">{feature.icon}</span>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
