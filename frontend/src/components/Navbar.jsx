import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span role="img" aria-label="resume">📋</span> AI Resume Screening
      </Link>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Resume</Link>
        <Link to="/dashboard">Dashboard</Link>
      </div>
    </nav>
  )
}

export default Navbar
