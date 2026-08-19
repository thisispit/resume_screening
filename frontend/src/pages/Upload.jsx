import { useState } from 'react'

function Upload() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

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
    setMessage(`Selected: ${file.name}. Backend not connected yet - this is Step 1.`)
  }

  return (
    <div className="page">
      <h1>Upload Resume</h1>
      <p>Upload your resume in PDF format for analysis.</p>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <span role="img" aria-label="upload">📤</span>
        </div>
        <p className="upload-text">Drag & drop your resume here</p>
        <p className="upload-subtext">or</p>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        <button onClick={handleUpload} className="btn">
          Upload Resume
        </button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default Upload
