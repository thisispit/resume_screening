"""Resume model — stores the uploaded file and extracted information."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # file info
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf / docx
    file_size_bytes: Mapped[int] = mapped_column(nullable=False, default=0)

    # raw text
    raw_text: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # extracted structured data
    candidate_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(150), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    education: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    experience: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    projects: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    certifications: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    total_experience_years: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    highest_education_level: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    links: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # ATS compliance scoring
    ats_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ats_breakdown: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    # parsing metadata
    parser_version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    owner = relationship("User", back_populates="resumes")
    applications = relationship(
        "Application", back_populates="resume", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_resume_one_per_user"),
    )

    def __repr__(self) -> str:
        return f"<Resume id={self.id} user_id={self.user_id} file={self.original_filename!r}>"
