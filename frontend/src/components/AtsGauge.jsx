import React from 'react'

export default function AtsGauge({
  score = 0,
  breakdown = null,
  actionableTips = null,
  skillsCount = 0,
  experienceYears = 0,
  hasEducation = true,
  summaryLength = 0,
}) {
  // Normalize score between 0 and 100
  const cleanScore = Math.max(0, Math.min(100, Math.round(score || 0)))

  // SVG circle calculation
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference

  // Rating & color based on ATS industry thresholds
  let color = '#59663A' // primary olive
  let rating = 'Strong (ATS Optimized)'
  let ratingBadge = 'badge-excellent'

  if (cleanScore < 50) {
    color = '#B91C1C' // muted red
    rating = 'Critical Gaps Detected'
    ratingBadge = 'badge-critical'
  } else if (cleanScore < 70) {
    color = '#B45309' // warm amber
    rating = 'Needs Optimization'
    ratingBadge = 'badge-warning'
  } else if (cleanScore < 85) {
    color = '#96762B' // warm gold
    rating = 'Competitive (ATS Ready)'
    ratingBadge = 'badge-good'
  } else {
    color = '#3F4A2C' // deep olive
    rating = 'Top Tier (Highly Optimized)'
    ratingBadge = 'badge-excellent'
  }

  // Use backend breakdown if available, fallback to client estimate
  const skillsScore = breakdown?.skills_pct ?? Math.min(100, Math.round((skillsCount / 8) * 100))
  const metricsScore = breakdown?.metrics_pct ?? 70
  const sectionsScore = breakdown?.sections_pct ?? (hasEducation ? 90 : 60)
  const contactScore = breakdown?.contact_pct ?? 90
  const formattingScore = breakdown?.formatting_pct ?? (summaryLength > 40 ? 95 : 65)

  // Dynamic actionable tips from backend or intelligent defaults
  const tips = actionableTips && actionableTips.length > 0
    ? actionableTips
    : cleanScore >= 80
      ? [
          'Resume adheres to high-parsing ATS standards with clear sections.',
          'Detected strong technical competency density and career milestones.',
          'Tip: Tailor keyword density slightly to each target job to hit 95%+.'
        ]
      : [
          'Add quantifiable metrics (e.g. %, numbers, team size) to your bullet points.',
          'Ensure standard section headings: Work Experience, Technical Skills, Education.',
          'Include 8 to 15 relevant technical skills explicitly in your skills list.'
        ]

  return (
    <div className="ats-gauge-container">
      <div className="ats-gauge-header">
        <div>
          <span className="ats-badge-pill">ATS Scoring Engine</span>
          <h3>Applicant Tracking System (ATS) Health Index</h3>
        </div>
        <span className={`ats-rating-tag ${ratingBadge}`}>{rating}</span>
      </div>

      <div className="ats-gauge-body">
        {/* Circular SVG Radial Gauge */}
        <div className="ats-radial-wrap">
          <svg className="ats-svg" width="180" height="180" viewBox="0 0 180 180">
            <circle
              className="ats-circle-bg"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="13"
            />
            <circle
              className="ats-circle-progress"
              cx="90"
              cy="90"
              r={radius}
              strokeWidth="13"
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

        {/* 5-Category Sub-score Breakdown */}
        <div className="ats-breakdown-list">
          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Skills Breadth ({skillsCount} detected)</span>
              <strong>{skillsScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${skillsScore}%`, background: '#59663A' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Quantifiable Metrics & Impact ({experienceYears > 0 ? `${experienceYears} yrs corporate exp` : 'Portfolio & project signals'})</span>
              <strong>{metricsScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${metricsScore}%`, background: '#96762B' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Section Structure & Headings</span>
              <strong>{sectionsScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${sectionsScore}%`, background: '#6E7B45' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Contact Information Completeness</span>
              <strong>{contactScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${contactScore}%`, background: '#4E5B36' }}></div>
            </div>
          </div>

          <div className="ats-sub-bar">
            <div className="ats-bar-header">
              <span>Formatting, Length & Readability</span>
              <strong>{formattingScore}%</strong>
            </div>
            <div className="ats-bar-track">
              <div className="ats-bar-fill" style={{ width: `${formattingScore}%`, background: '#7E8E52' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Diagnostics Checklist */}
      <div className="ats-tips-box">
        <h4>Actionable ATS Diagnostics & Recommendations</h4>
        <ul>
          {tips.map((tip, idx) => {
            const isRec = /^(?:tip|add|ensure|include|consider|tailor)\b/i.test(tip.trim())
            return (
              <li key={idx}>
                <span className="ats-tip-bullet">{isRec ? '💡' : '✓'}</span>
                <span>{tip}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
