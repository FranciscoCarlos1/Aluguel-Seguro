from datetime import date
import os
import threading

from fastapi import Depends, FastAPI, File, Header, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db, SessionLocal
from . import schemas, services


def configured_cors_origins() -> list[str]:
    raw_value = os.getenv("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174")
    return [item.strip() for item in raw_value.split(",") if item.strip()]


app = FastAPI(title="IFC Jornada API", version="0.1.0")
scheduler_stop_event = threading.Event()
scheduler_thread: threading.Thread | None = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def official_sheet_scheduler_loop(stop_event: threading.Event) -> None:
    while not stop_event.wait(60):
        with SessionLocal() as db:
            services.sync_official_sheet_if_due(db)


@app.on_event("startup")
def startup() -> None:
    global scheduler_thread
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        services.ensure_default_admin(db)
        services.auto_sync_official_sheet_if_enabled(db)
        services.ensure_monthly_rollover(db)
    if scheduler_thread is None or not scheduler_thread.is_alive():
        scheduler_stop_event.clear()
        scheduler_thread = threading.Thread(
            target=official_sheet_scheduler_loop,
            args=(scheduler_stop_event,),
            name="official-sheet-scheduler",
            daemon=True,
        )
        scheduler_thread.start()


@app.on_event("shutdown")
def shutdown() -> None:
    scheduler_stop_event.set()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Nao autenticado")
    token = authorization.removeprefix("Bearer ").strip()
    user = services.get_user_by_token(db, token)
    if user is None:
        raise HTTPException(status_code=401, detail="Sessao invalida")
    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito ao perfil administrador")
    return current_user


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = services.authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario ou senha invalidos")
    session = services.create_session(db, user)
    return schemas.AuthResponse(token=session.token, user=schemas.UserRead.model_validate(user))


@app.post("/api/auth/logout", status_code=204)
def logout(
    authorization: str | None = Header(default=None),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if authorization and authorization.startswith("Bearer "):
        services.delete_session(db, authorization.removeprefix("Bearer ").strip())


@app.get("/api/auth/me", response_model=schemas.UserRead)
def me(current_user=Depends(get_current_user)):
    return schemas.UserRead.model_validate(current_user)


@app.get("/api/users", response_model=list[schemas.UserRead])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.list_users(db)


@app.post("/api/users", response_model=schemas.UserRead, status_code=201)
def post_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.create_user(db, payload)


@app.get("/api/settings", response_model=schemas.AppSettingsRead)
def get_settings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return services.get_settings_payload(db)


@app.put("/api/settings", response_model=schemas.AppSettingsRead)
def put_settings(
    payload: schemas.AppSettingsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.update_settings(db, payload)


@app.get("/api/official-sheet", response_model=schemas.OfficialSheetConfigRead)
def get_official_sheet_config(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.get_official_sheet_config_payload(db)


@app.put("/api/official-sheet", response_model=schemas.OfficialSheetConfigRead)
def put_official_sheet_config(
    payload: schemas.OfficialSheetConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.update_official_sheet_config(db, payload)


@app.get("/api/cost-config", response_model=schemas.CostConfigRead)
def get_cost_config(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.get_cost_config_payload(db)


@app.put("/api/cost-config", response_model=schemas.CostConfigRead)
def put_cost_config(
    payload: schemas.CostConfigUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.update_cost_config(db, payload)


@app.get("/api/indicators/{year}/{month}", response_model=schemas.MonthlyIndicatorsResponse)
def get_indicators(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return services.get_monthly_indicators(db, year, month)


@app.put("/api/indicators/{year}/{month}", response_model=schemas.MonthlyIndicatorsResponse)
def put_indicators(
    year: int,
    month: int,
    payload: schemas.MonthlyIndicatorsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return services.update_monthly_indicators(db, year, month, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/imr/{year}/{month}", response_model=schemas.MonthlyImrReportResponse)
def get_imr_report(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return services.get_monthly_imr_report(db, year, month)


@app.put("/api/imr/{year}/{month}", response_model=schemas.MonthlyImrReportResponse)
def put_imr_report(
    year: int,
    month: int,
    payload: schemas.MonthlyImrReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return services.update_monthly_imr_report(db, year, month, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/official-sheet/sync", response_model=schemas.ImportResult)
def post_official_sheet_sync(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    try:
        return services.sync_official_sheet(db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/holidays", response_model=list[schemas.HolidayRead])
def get_holidays(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return services.list_holidays(db)


@app.post("/api/holidays", response_model=schemas.HolidayRead, status_code=201)
def post_holiday(
    payload: schemas.HolidayCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.create_holiday(db, payload)


@app.delete("/api/holidays/{holiday_id}", status_code=204)
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    deleted = services.delete_holiday(db, holiday_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Feriado nao encontrado")


@app.post("/api/imports/files", response_model=schemas.ImportResult, status_code=201)
async def post_file_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    content = await file.read()
    try:
        return services.import_uploaded_file(db, file.filename or "arquivo.csv", content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/employees", response_model=list[schemas.EmployeeRead])
def get_employees(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return services.list_employees(db)


@app.post("/api/employees", response_model=schemas.EmployeeRead, status_code=201)
def post_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.create_employee(db, payload)


@app.put("/api/employees/{employee_id}", response_model=schemas.EmployeeRead)
def put_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    employee = services.update_employee(db, employee_id, payload)
    if employee is None:
        raise HTTPException(status_code=404, detail="Funcionaria nao encontrada")
    return employee


@app.patch("/api/employees/{employee_id}/status", response_model=schemas.EmployeeRead)
def patch_employee_status(
    employee_id: int,
    payload: schemas.EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    employee = services.update_employee_status(db, employee_id, payload.is_active)
    if employee is None:
        raise HTTPException(status_code=404, detail="Funcionaria nao encontrada")
    return employee


@app.post("/api/work-entries", response_model=schemas.WorkEntryRead, status_code=201)
def post_work_entry(
    payload: schemas.WorkEntryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return services.upsert_work_entry(db, payload)


@app.get("/api/months/{year}/{month}", response_model=schemas.MonthSummaryResponse)
def get_month_summary(
    year: int,
    month: int,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return services.build_month_summary(db, year, month, include_inactive)


@app.get("/api/reports/employees/{employee_id}/{year}/{month}.csv")
def get_employee_report_csv(
    employee_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        filename, content = services.build_employee_report_csv(db, employee_id, year, month)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="text/csv; charset=utf-8", headers=headers)


@app.get("/api/reports/employees/{employee_id}/{year}/{month}.pdf")
def get_employee_report_pdf(
    employee_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        filename, content = services.build_employee_report_pdf(db, employee_id, year, month)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="application/pdf", headers=headers)


@app.get("/api/reports/imr/{year}/{month}.pdf")
def get_imr_report_pdf(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        filename, content = services.build_imr_report_pdf(db, year, month)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type="application/pdf", headers=headers)


@app.get("/api/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    return services.build_dashboard(db, year or today.year, month or today.month)


@app.get("/api/rollover/monthly", response_model=schemas.MonthlyRolloverResult)
def get_monthly_rollover_status(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.ensure_monthly_rollover(db)


@app.post("/api/rollover/monthly", response_model=schemas.MonthlyRolloverResult)
def post_monthly_rollover(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    return services.ensure_monthly_rollover(db)