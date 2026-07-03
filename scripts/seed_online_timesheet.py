from pathlib import Path
import sys
from typing import Any

import requests

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from backend.app import services

API_BASE = 'https://ifc-jornada-api.onrender.com/api'
USERNAME = 'admin'
PASSWORD = 'admin123'
FILE_PATH = ROOT_DIR / 'Cálculo Mensal de Jornada.ods'
DEFAULT_ROLE = 'Auxiliar de limpeza'
DEFAULT_DEPARTMENT = 'Administrativo'


def to_json_time(value):
    return value.isoformat() if value is not None else None


def main() -> None:
    session = requests.Session()
    login = session.post(
        f'{API_BASE}/auth/login',
        json={'username': USERNAME, 'password': PASSWORD},
        timeout=120,
    )
    login.raise_for_status()
    token = login.json()['token']
    session.headers.update({'Authorization': f'Bearer {token}'})

    employees_response = session.get(f'{API_BASE}/employees', timeout=120)
    employees_response.raise_for_status()
    employees = employees_response.json()
    employees_by_name = {services.normalize_text(item['name']): item for item in employees}

    content = FILE_PATH.read_bytes()
    total_created = 0
    total_updated = 0
    processed_employees: list[str] = []

    for rows in services.rows_from_ods_sheets(content):
        employee_name = services.find_single_employee_name(rows)
        header_index = services.find_single_employee_summary_header(rows)
        if not employee_name or header_index is None:
            continue

        normalized_name = services.normalize_text(employee_name)
        employee = employees_by_name.get(normalized_name)
        if employee is None:
            create_response = session.post(
                f'{API_BASE}/employees',
                json={
                    'name': employee_name,
                    'role': DEFAULT_ROLE,
                    'department': DEFAULT_DEPARTMENT,
                    'daily_work_minutes': 480,
                },
                timeout=120,
            )
            create_response.raise_for_status()
            employee = create_response.json()
            employees_by_name[normalized_name] = employee

        processed_employees.append(employee_name)

        for row in rows[header_index + 1 :]:
            if len(row) <= 2 or not row[1].strip():
                continue
            try:
                work_date = services.parse_date(row[1])
                worked_minutes = int((row[2] or '').strip())
            except ValueError:
                continue

            payload = services.entry_payload_from_worked_minutes(worked_minutes)
            response = session.post(
                f'{API_BASE}/work-entries',
                json={
                    'employee_id': employee['id'],
                    'work_date': work_date.isoformat(),
                    'clock_in': to_json_time(payload['clock_in']),
                    'lunch_out': None,
                    'lunch_in': None,
                    'clock_out': to_json_time(payload['clock_out']),
                    'notes': None,
                },
                timeout=120,
            )
            response.raise_for_status()
            returned: dict[str, Any] = response.json()
            if returned.get('id'):
                total_updated += 1

    month_response = session.get(f'{API_BASE}/months/2026/7', timeout=120)
    month_response.raise_for_status()
    month_data = month_response.json()

    print({
        'processed_employees': processed_employees,
        'total_posts': total_updated,
        'employees_in_month': len(month_data['employees']),
        'worked_minutes': [
            {
                'name': item['employee']['name'],
                'worked_minutes': item['worked_minutes'],
            }
            for item in month_data['employees']
        ],
    })


if __name__ == '__main__':
    main()
