from __future__ import annotations

from typing import Any

import requests

API_BASE = 'https://ifc-jornada-api.onrender.com/api'
USERNAME = 'admin'
PASSWORD = 'admin123'
YEAR = 2026
MONTH = 7

MERGES = {
    1: 8,
    2: 11,
    3: 7,
    4: 9,
    5: 12,
    6: 10,
}


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

    month = session.get(
        f'{API_BASE}/months/{YEAR}/{MONTH}?include_inactive=true',
        timeout=120,
    )
    month.raise_for_status()
    month_data = month.json()
    summaries = {item['employee']['id']: item for item in month_data['employees']}

    moved: list[dict[str, Any]] = []
    inactivated: list[int] = []

    for source_id, target_id in MERGES.items():
        source = summaries.get(source_id)
        target = summaries.get(target_id)
        if not source or not target:
            continue

        target_days = {day['work_date']: day for day in target['days']}
        for source_day in source['days']:
            source_entry = source_day.get('entry')
            if not source_entry:
                continue
            work_date = source_day['work_date']
            target_day = target_days.get(work_date)
            target_has_real_entry = bool(target_day and target_day.get('entry'))

            should_override = False
            if not target_has_real_entry:
                should_override = True
            else:
                target_entry = target_day['entry']
                if target_entry['clock_in'] == '00:00:00' and source_entry['clock_in'] != '00:00:00':
                    should_override = True

            if not should_override:
                continue

            payload = {
                'employee_id': target_id,
                'work_date': work_date,
                'clock_in': source_entry['clock_in'],
                'lunch_out': None,
                'lunch_in': None,
                'clock_out': source_entry['clock_out'],
                'notes': source_entry.get('notes'),
            }
            response = session.post(f'{API_BASE}/work-entries', json=payload, timeout=120)
            response.raise_for_status()
            moved.append(
                {
                    'source_id': source_id,
                    'target_id': target_id,
                    'work_date': work_date,
                    'clock_in': source_entry['clock_in'],
                    'clock_out': source_entry['clock_out'],
                }
            )

        response = session.patch(
            f'{API_BASE}/employees/{source_id}/status',
            json={'is_active': False},
            timeout=120,
        )
        response.raise_for_status()
        inactivated.append(source_id)

    final_month = session.get(
        f'{API_BASE}/months/{YEAR}/{MONTH}?include_inactive=true',
        timeout=120,
    )
    final_month.raise_for_status()
    final_data = final_month.json()

    print(
        {
            'moved': moved,
            'inactivated': inactivated,
            'employees': [
                {
                    'id': item['employee']['id'],
                    'name': item['employee']['name'],
                    'worked_minutes': item['worked_minutes'],
                    'active': item['employee']['is_active'],
                }
                for item in final_data['employees']
            ],
        }
    )


if __name__ == '__main__':
    main()
