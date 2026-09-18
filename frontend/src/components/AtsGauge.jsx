import React from 'react'

export default function AtsGauge({
  score = 85,
  skillsCount = 0,
  experienceYears = 0,
  hasEducation = true,
  summaryLength = 0,
}) {
  // Normalize score between 0 and 100
  const cleanScore = Math.max(0, Math.min(100, Math.round(score)))

  // SVG circle calculation
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference

  // Color theme according to score
  let color = '#10b981' // emerald
  let rating = 'Excellent (ATS Optimized)'
  let ratingBadge = 'badge-excellent'
  if (cleanScore < 60) {
    color = '#f59e0b' // amber
    rating = 'Needs Optimization'
    ratingBadge = 'badge-warning'
  } else if (cleanScore < 80) {
    color = '#3b82f6' // blue
    rating = 'Competitive (Good Match)'
    ratingBadge = 'badge-good'
  }

  // Calculate component sub-scores for breakdown
  const skillsScore = Math.min(100, Math.round((skillsCount / 8) * 100))
  const experienceScore = Math.min(100, Math.round(experienceYears > 0 ? Math.min(100, 50 + experienceYears * 15) : 50))
  const educationScore = hasEducation ? 95 : 40
  const formattingScore = summaryLength > 40 ? 95 : 65

  return (
    <div className="ats-gauge-container">
      <div className="ats-gauge-header">
        <div>
          <span className="ats-badge-pill">ATS Score Visualizer</span>
          <h3>Applicant Tracking System (ATS) Readiness</h3>
        </div>
        <span className={`ats-rating-tag ${ratingBadge}`}>{rating}</span>
      </div>

      <div className="ats-gauge-body">
        {/* Circular SVG Gauge */}
        <div className="ats-radial-wrap">
          <svg className="ats-svg" width="180" height="180" viewBox="0 0 180 180">
            <circle
              className="ats-circle-bg"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="14"
            />
            <circle
              className="ats-circle-progress"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke={color}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div className="ats-radial-center">
            <span className="ats-radial-number" style={{ color }}>{cleanScore}%</span>
            <span className="ats-radial-label">ATS Score</span>
          </div>
        </div>

        {/* Sub-score breakdown */}
        <div className="ats-breakdown-list">
          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Skills Density ({skillsCount} detected)</span>
              <strong>{skillsScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${skillsScore}%`, background: '#3b82f6' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Experience Profile ({experienceYears} yrs)</span>
              <strong>{experienceScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${experienceScore}%`, background: '#10b981' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Education & Credentials</span>
              <strong>{educationScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${educationScore}%`, background: '#8b5cf6' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Resume Structure & Summary</span>
              <strong>{formattingScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${formattingScore}%`, background: '#f59e0b' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Tips */}
      <div className="ats-tips-box">
        <h4>💡 Actionable ATS Optimization Tips</h4>
        <ul>
          {cleanScore >= 80 ? (
            <>
              <li>✓ Strong keyword density matching software and data roles.</li>
              <li>✓ Clear career progression and education credentials detected.</li>
              <li>Tip: Tailor your summary section for each specific application to achieve 95%+.</li>
            </>
          ) : (
            <>
              <li>Add industry-standard keywords related to your target job titles.</li>
              <li>Quantify bullet points with metrics (e.g., "improved performance by 25%").</li>
              <li>Ensure clear section headings (Skills, Work Experience, Education).</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
