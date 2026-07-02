from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(120), default="Auxiliar")
    department: Mapped[str] = mapped_column(String(120), default="Administrativo")
    daily_work_minutes: Mapped[int] = mapped_column(Integer, default=480)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    entries: Mapped[list["WorkEntry"]] = relationship(
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    users: Mapped[list["User"]] = relationship(back_populates="employee")


class WorkEntry(Base):
    __tablename__ = "work_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), index=True)
    work_date: Mapped[date] = mapped_column(Date, index=True)
    clock_in: Mapped[time | None] = mapped_column(Time, nullable=True)
    lunch_out: Mapped[time | None] = mapped_column(Time, nullable=True)
    lunch_in: Mapped[time | None] = mapped_column(Time, nullable=True)
    clock_out: Mapped[time | None] = mapped_column(Time, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    employee: Mapped[Employee] = relationship(back_populates="entries")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), default="Usuario")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="operator")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)

    employee: Mapped[Employee | None] = relationship(back_populates="users")
    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    user: Mapped[User] = relationship(back_populates="sessions")


class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    non_working_weekdays_csv: Mapped[str] = mapped_column(String(32), default="5,6")


class OfficialSheetConfig(Base):
    __tablename__ = "official_sheet_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    shared_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    auto_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class CostConfig(Base):
    __tablename__ = "cost_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    municipality: Mapped[str] = mapped_column(String(120), default="Sao Bento do Sul")
    cct_code: Mapped[str] = mapped_column(String(64), default="SC000104/2026")
    contract_months: Mapped[int] = mapped_column(Integer, default=30)
    service_type: Mapped[str] = mapped_column(String(120), default="Servente de Limpeza")
    cbo_code: Mapped[str] = mapped_column(String(32), default="5143-20")
    salary_base: Mapped[int] = mapped_column(Integer, default=170775)
    monthly_work_days: Mapped[int] = mapped_column(Integer, default=22)
    weekly_hours: Mapped[int] = mapped_column(Integer, default=40)
    monthly_post_value: Mapped[int] = mapped_column(Integer, default=204930)


class IndicatorMonthlyRecord(Base):
    __tablename__ = "indicator_monthly_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    raw_value: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)


class ServiceQualityMonthlyRecord(Base):
    __tablename__ = "service_quality_monthly_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    code: Mapped[str] = mapped_column(String(32), index=True)
    category: Mapped[str] = mapped_column(String(120), default="")
    description: Mapped[str] = mapped_column(String(255), default="")
    rating: Mapped[str | None] = mapped_column(String(1), nullable=True)


class VtMonthlyRecord(Base):
    __tablename__ = "vt_monthly_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    missing_vt_days: Mapped[int] = mapped_column(Integer, default=0)
    paid_creche_value: Mapped[int] = mapped_column(Integer, default=0)
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    holiday_date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    description: Mapped[str] = mapped_column(String(160), default="Feriado")


class MonthlyPeriod(Base):
    __tablename__ = "monthly_periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    status: Mapped[str] = mapped_column(String(24), default="open")
    generated_entries: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
