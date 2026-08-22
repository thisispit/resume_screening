import { useState } from 'react'
import { Link } from 'react-router-dom'

function Upload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setMessage('')
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
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setMessage('')
    } else {
      setMessage('Please upload a PDF file only.')
    }
  }

  const handleUpload = () => {
    if (!file) {
      setMessage('Please select a file first.')
      return
    }
    setUploading(true)
    setTimeout(() => {
      setMessage(`Selected: ${file.name}. Backend not connected yet - this is Step 1.`)
      setUploading(false)
    }, 1500)
  }

  const features = [
    { icon: '🤖', title: 'AI-Powered Analysis', desc: 'Advanced NLP extracts skills, experience, and qualifications automatically.' },
    { icon: '⚡', title: 'Instant Results', desc: 'Get your resume scored and analyzed in seconds, not hours.' },
    { icon: '🎯', title: 'Smart Matching', desc: 'AI matches your profile with the most relevant job opportunities.' },
    { icon: '📊', title: 'Detailed Report', desc: 'Receive comprehensive feedback on strengths and areas for improvement.' }
  ]

  return (
    <div className="upload-page">

      {/* Decorative Background */}
      <div className="upload-decor">
        <div className="up-circle up-circle-1"></div>
        <div className="up-circle up-circle-2"></div>
        <div className="up-circle up-circle-3"></div>
        <div className="up-blob up-blob-1"></div>
        <div className="up-blob up-blob-2"></div>
        <div className="up-grid-pattern"></div>
      </div>

      {/* Header */}
      <section className="upload-header">
        <div className="section-badge">Upload</div>
        <h1>Upload Your Resume</h1>
        <p>Let our AI analyze your resume and find the best job matches for you.</p>
      </section>

      {/* Upload Area */}
      <section className="upload-main">
        <div className={`upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}>
          <div className="ua-bg-shapes">
            <div className="ua-shape ua-shape-1"></div>
            <div className="ua-shape ua-shape-2"></div>
            <div className="ua-shape ua-shape-3"></div>
          </div>

          {!file ? (
            <div className="ua-content">
              <div className="ua-icon-wrap">
                <span className="ua-icon">📤</span>
                <div className="ua-icon-ring"></div>
                <div className="ua-icon-dots">
                  <span></span><span></span><span></span><span></span>
                </div>
              </div>
              <h3>Drag & Drop Your Resume</h3>
              <p>or click to browse files</p>
              <div className="ua-formats">
                <span className="format-tag">PDF</span>
                <span className="format-tag">Max 10MB</span>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
          ) : (
            <div className="ua-content ua-has-file">
              <div className="ua-file-icon">📄</div>
              <h3>{file.name}</h3>
              <p className="ua-file-size">{(file.size / 1024).toFixed(1)} KB</p>
              <div className="ua-actions">
                <button onClick={handleUpload} className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
                <button onClick={() => { setFile(null); setMessage('') }} className="btn btn-secondary">
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

        {message && (
          <div className="upload-message">
            <span className="msg-icon">✅</span>
            <p>{message}</p>
            <Link to="/dashboard" className="msg-link">View Dashboard →</Link>
          </div>
        )}
      </section>

      {/* Features Grid */}
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

      {/* Steps */}
      <section className="upload-steps">
        <h2>Simple 3-Step Process</h2>
        <div className="us-grid">
          <div className="us-card">
            <div className="us-num">1</div>
            <div className="us-icon">📤</div>
            <h4>Upload PDF</h4>
            <p>Drag & drop or select your resume file</p>
          </div>
          <div className="us-arrow">→</div>
          <div className="us-card">
            <div className="us-num">2</div>
            <div className="us-icon">🤖</div>
            <h4>AI Analysis</h4>
            <p>Our AI extracts and analyzes your profile</p>
          </div>
          <div className="us-arrow">→</div>
          <div className="us-card">
            <div className="us-num">3</div>
            <div className="us-icon">🎯</div>
            <h4>Get Results</h4>
            <p>View matches, scores, and recommendations</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Upload
