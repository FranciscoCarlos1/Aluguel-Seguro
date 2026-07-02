from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


class EmployeeBase(BaseModel):
    name: str
    role: str = "Auxiliar"
    department: str = "Administrativo"
    daily_work_minutes: int = 480


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str
    role: str = "Auxiliar"
    department: str = "Administrativo"
    daily_work_minutes: int = 480


class EmployeeStatusUpdate(BaseModel):
    is_active: bool


class EmployeeRead(EmployeeBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class WorkEntryBase(BaseModel):
    work_date: date
    clock_in: time | None = None
    lunch_out: time | None = None
    lunch_in: time | None = None
    clock_out: time | None = None
    notes: str | None = None


class WorkEntryCreate(WorkEntryBase):
    employee_id: int


class WorkEntryRead(WorkEntryBase):
    id: int
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


class DaySummary(BaseModel):
    work_date: date
    weekday_label: str
    is_non_working_day: bool
    is_holiday: bool
    holiday_description: str | None = None
    expected_minutes: int
    worked_minutes: int
    missing_minutes: int
    balance_minutes: int
    glosa_value: float
    entry: WorkEntryRead | None = None


class EmployeeMonthSummary(BaseModel):
    employee: EmployeeRead
    expected_minutes: int
    worked_minutes: int
    missing_minutes: int
    balance_minutes: int
    glosa_value: float
    days: list[DaySummary]


class CostConfigRead(BaseModel):
    municipality: str
    cct_code: str
    contract_months: int
    service_type: str
    cbo_code: str
    salary_base: float
    monthly_work_days: int
    weekly_hours: int
    monthly_post_value: float


class CostConfigUpdate(BaseModel):
    municipality: str
    cct_code: str
    contract_months: int
    service_type: str
    cbo_code: str
    salary_base: float
    monthly_work_days: int
    weekly_hours: int
    monthly_post_value: float


class IndicatorEntryRead(BaseModel):
    code: str
    title: str
    purpose: str
    target_description: str
    periodicity: str
    input_kind: str
    raw_value: float
    score: float
    max_score: float
    notes: str | None = None


class IndicatorEntryUpdate(BaseModel):
    code: str
    raw_value: float = 0
    notes: str | None = None


class MonthlyIndicatorsResponse(BaseModel):
    year: int
    month: int
    total_score: float
    max_score: float
    items: list[IndicatorEntryRead]


class MonthlyIndicatorsUpdate(BaseModel):
    items: list[IndicatorEntryUpdate]


class MonthSummaryResponse(BaseModel):
    year: int
    month: int
    start_date: date
    end_date: date
    non_working_weekdays: list[int]
    holidays: list[date]
    total_glosa_value: float
    employees: list[EmployeeMonthSummary]


class DashboardResponse(BaseModel):
    year: int
    month: int
    active_employees: int
    expected_minutes: int
    worked_minutes: int
    balance_minutes: int
    total_glosa_value: float
    indicator_score: float
    indicator_max_score: float


class ServiceQualityItemRead(BaseModel):
    code: str
    category: str
    description: str
    rating: str | None = None


class ServiceQualityItemUpdate(BaseModel):
    code: str
    rating: str | None = None


class ServiceQualitySummaryRead(BaseModel):
    total_answered: int
    count_o: int
    count_b: int
    count_r: int
    count_i: int
    count_n: int
    index_o: float
    index_b: float
    index_r: float
    index_i: float
    quality_score: float
    comment: str | None = None


class VtApuracaoRead(BaseModel):
    monthly_with_vt: float
    monthly_without_vt: float
    vt_monthly_difference: float
    vt_daily_difference_per_employee: float
    missing_vt_days: int
    vt_discount_value: float
    creche_monthly_difference: float
    paid_creche_value: float
    creche_discount_value: float
    monthly_reference_value: float
    service_level_factor: float
    monthly_due_with_imr: float
    final_billed_value: float


class VtApuracaoUpdate(BaseModel):
    missing_vt_days: int = 0
    paid_creche_value: float = 0
    comment: str | None = None


class ServiceLevelBandRead(BaseModel):
    label: str
    payment_description: str
    factor: float
    selected: bool


class MonthlyImrReportResponse(BaseModel):
    year: int
    month: int
    unit_name: str
    contract_number: str
    manager_name: str
    contractor_name: str
    indicators: MonthlyIndicatorsResponse
    quality_items: list[ServiceQualityItemRead]
    quality_summary: ServiceQualitySummaryRead
    service_level_bands: list[ServiceLevelBandRead]
    vt_apuracao: VtApuracaoRead


class MonthlyImrReportUpdate(BaseModel):
    indicators: list[IndicatorEntryUpdate]
    quality_items: list[ServiceQualityItemUpdate]
    vt_apuracao: VtApuracaoUpdate


class MonthlyPeriodRead(BaseModel):
    id: int
    year: int
    month: int
    status: str
    generated_entries: bool
    created_at: datetime
    closed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class MonthlyRolloverResult(BaseModel):
    reference_date: date
    closed_periods: int
    opened_periods: int
    generated_entries: int
    periods: list[MonthlyPeriodRead]


class AppSettingsRead(BaseModel):
    non_working_weekdays: list[int]


class AppSettingsUpdate(BaseModel):
    non_working_weekdays: list[int]


class OfficialSheetConfigRead(BaseModel):
    shared_url: str | None = None
    auto_sync_enabled: bool = False
    last_sync_at: datetime | None = None


class OfficialSheetConfigUpdate(BaseModel):
    shared_url: str | None = None
    auto_sync_enabled: bool = False


class HolidayBase(BaseModel):
    holiday_date: date
    description: str = "Feriado"


class HolidayCreate(HolidayBase):
    pass


class HolidayRead(HolidayBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ImportResult(BaseModel):
    imported_employees: int
    imported_entries: int
    updated_entries: int
    skipped_rows: int


class UserBase(BaseModel):
    username: str
    display_name: str
    role: str = "operator"
    is_active: bool = True
    employee_id: int | None = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: UserRead
