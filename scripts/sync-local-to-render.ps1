param(
    [string]$LocalApiBase = "http://127.0.0.1:8000/api",
    [string]$RemoteApiBase = "https://ifc-jornada-api.onrender.com/api",
    [string]$Username = "admin",
    [string]$Password = "admin123",
    [int]$Year = 2026,
    [int]$Month = 7,
    [string]$CsvPath = "C:\Users\francisco.sousa\Downloads\Controle de acesso Limpeza_Minister - RGF JULHO 2026.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-ApiJson {
    param(
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers,
        $Body = $null
    )

    $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $Headers
        TimeoutSec = 120
    }

    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = ($Body | ConvertTo-Json -Depth 12 -Compress)
    }

    Invoke-RestMethod @params
}

function New-AuthHeaders {
    param([string]$ApiBase)

    $loginBody = @{ username = $Username; password = $Password }
    $response = Invoke-ApiJson -Method POST -Uri "$ApiBase/auth/login" -Headers @{} -Body $loginBody
    return @{ Authorization = "Bearer $($response.token)" }
}

function Normalize-Collection {
    param($Value)

    if ($null -eq $Value) {
        return @()
    }

    if ($Value -is [System.Array]) {
        if ($Value.Count -eq 1 -and $Value[0] -is [System.Array]) {
            return @($Value[0])
        }

        return @($Value)
    }

    return @($Value)
}

function Convert-ImrToUpdatePayload {
    param($Imr)

    return @{
        indicators = @($Imr.indicators.items | ForEach-Object {
            @{
                code = $_.code
                raw_value = [double]$_.raw_value
                notes = $_.notes
            }
        })
        quality_items = @($Imr.quality_items | ForEach-Object {
            @{
                code = $_.code
                rating = $_.rating
            }
        })
        vt_apuracao = @{
            missing_vt_days = [int]$Imr.vt_apuracao.missing_vt_days
            paid_creche_value = [double]$Imr.vt_apuracao.paid_creche_value
            comment = $null
        }
    }
}

$localHeaders = New-AuthHeaders -ApiBase $LocalApiBase
$remoteHeaders = New-AuthHeaders -ApiBase $RemoteApiBase

$localSettings = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/settings" -Headers $localHeaders
$localOfficialSheet = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/official-sheet" -Headers $localHeaders
$localCostConfig = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/cost-config" -Headers $localHeaders
$localHolidays = Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$LocalApiBase/holidays" -Headers $localHeaders)
$localEmployees = Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$LocalApiBase/employees" -Headers $localHeaders)
$localMonth = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/months/${Year}/${Month}?include_inactive=true" -Headers $localHeaders
$localImr = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/imr/${Year}/${Month}" -Headers $localHeaders

Invoke-ApiJson -Method PUT -Uri "$RemoteApiBase/settings" -Headers $remoteHeaders -Body @{
    non_working_weekdays = @($localSettings.non_working_weekdays)
} | Out-Null

Invoke-ApiJson -Method PUT -Uri "$RemoteApiBase/official-sheet" -Headers $remoteHeaders -Body @{
    shared_url = $localOfficialSheet.shared_url
    auto_sync_enabled = [bool]$localOfficialSheet.auto_sync_enabled
} | Out-Null

Invoke-ApiJson -Method PUT -Uri "$RemoteApiBase/cost-config" -Headers $remoteHeaders -Body @{
    municipality = $localCostConfig.municipality
    cct_code = $localCostConfig.cct_code
    contract_months = [int]$localCostConfig.contract_months
    service_type = $localCostConfig.service_type
    cbo_code = $localCostConfig.cbo_code
    salary_base = [double]$localCostConfig.salary_base
    monthly_work_days = [int]$localCostConfig.monthly_work_days
    weekly_hours = [int]$localCostConfig.weekly_hours
    monthly_post_value = [double]$localCostConfig.monthly_post_value
} | Out-Null

$remoteHolidayKeys = @{}
foreach ($holiday in (Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$RemoteApiBase/holidays" -Headers $remoteHeaders))) {
    if (-not ($holiday.PSObject.Properties.Name -contains 'holiday_date')) {
        continue
    }
    $remoteHolidayKeys["$($holiday.holiday_date)|$($holiday.description)"] = $true
}

foreach ($holiday in $localHolidays) {
    if (-not ($holiday.PSObject.Properties.Name -contains 'holiday_date')) {
        continue
    }
    $key = "$($holiday.holiday_date)|$($holiday.description)"
    if (-not $remoteHolidayKeys.ContainsKey($key)) {
        Invoke-ApiJson -Method POST -Uri "$RemoteApiBase/holidays" -Headers $remoteHeaders -Body @{
            holiday_date = $holiday.holiday_date
            description = $holiday.description
        } | Out-Null
    }
}

if (Test-Path $CsvPath) {
    Invoke-RestMethod -Method POST -Uri "$RemoteApiBase/imports/files" -Headers $remoteHeaders -Form @{ file = Get-Item $CsvPath } -TimeoutSec 240 | Out-Null
}

$remoteEmployees = Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$RemoteApiBase/employees" -Headers $remoteHeaders)
$remoteEmployeeByName = @{}
foreach ($employee in $remoteEmployees) {
    $remoteEmployeeByName[$employee.name] = $employee
}

$localEmployeeNames = @{}
foreach ($employee in $localEmployees) {
    $localEmployeeNames[$employee.name] = $true
    $payload = @{
        name = $employee.name
        role = $employee.role
        department = $employee.department
        daily_work_minutes = [int]$employee.daily_work_minutes
    }

    if ($remoteEmployeeByName.ContainsKey($employee.name)) {
        $remoteEmployee = Invoke-ApiJson -Method PUT -Uri "$RemoteApiBase/employees/$($remoteEmployeeByName[$employee.name].id)" -Headers $remoteHeaders -Body $payload
        Invoke-ApiJson -Method PATCH -Uri "$RemoteApiBase/employees/$($remoteEmployee.id)/status" -Headers $remoteHeaders -Body @{ is_active = [bool]$employee.is_active } | Out-Null
        $remoteEmployeeByName[$employee.name] = $remoteEmployee
    }
    else {
        $createdEmployee = Invoke-ApiJson -Method POST -Uri "$RemoteApiBase/employees" -Headers $remoteHeaders -Body $payload
        Invoke-ApiJson -Method PATCH -Uri "$RemoteApiBase/employees/$($createdEmployee.id)/status" -Headers $remoteHeaders -Body @{ is_active = [bool]$employee.is_active } | Out-Null
        $remoteEmployeeByName[$employee.name] = $createdEmployee
    }
}

foreach ($employee in (Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$RemoteApiBase/employees" -Headers $remoteHeaders))) {
    if (-not $localEmployeeNames.ContainsKey($employee.name) -and $employee.is_active) {
        Invoke-ApiJson -Method PATCH -Uri "$RemoteApiBase/employees/$($employee.id)/status" -Headers $remoteHeaders -Body @{ is_active = $false } | Out-Null
    }
}

$remoteEmployees = Normalize-Collection (Invoke-ApiJson -Method GET -Uri "$RemoteApiBase/employees" -Headers $remoteHeaders)
$remoteEmployeeByName = @{}
foreach ($employee in $remoteEmployees) {
    $remoteEmployeeByName[$employee.name] = $employee
}

foreach ($employeeSummary in $localMonth.employees) {
    $employeeName = $employeeSummary.employee.name
    if (-not $remoteEmployeeByName.ContainsKey($employeeName)) {
        continue
    }

    $remoteEmployeeId = $remoteEmployeeByName[$employeeName].id
    foreach ($day in $employeeSummary.days) {
        if ($null -eq $day.entry) {
            continue
        }

        Invoke-ApiJson -Method POST -Uri "$RemoteApiBase/work-entries" -Headers $remoteHeaders -Body @{
            employee_id = [int]$remoteEmployeeId
            work_date = $day.entry.work_date
            clock_in = $day.entry.clock_in
            lunch_out = $day.entry.lunch_out
            lunch_in = $day.entry.lunch_in
            clock_out = $day.entry.clock_out
            notes = $day.entry.notes
        } | Out-Null
    }
}

$imrPayload = Convert-ImrToUpdatePayload -Imr $localImr
Invoke-ApiJson -Method PUT -Uri "$RemoteApiBase/imr/${Year}/${Month}" -Headers $remoteHeaders -Body $imrPayload | Out-Null

$localDashboard = Invoke-ApiJson -Method GET -Uri "$LocalApiBase/dashboard?year=${Year}&month=${Month}" -Headers $localHeaders
$remoteDashboard = Invoke-ApiJson -Method GET -Uri "$RemoteApiBase/dashboard?year=${Year}&month=${Month}" -Headers $remoteHeaders

[pscustomobject]@{
    local_active_employees = $localDashboard.active_employees
    remote_active_employees = $remoteDashboard.active_employees
    local_worked_minutes = $localDashboard.worked_minutes
    remote_worked_minutes = $remoteDashboard.worked_minutes
    local_glosa = $localDashboard.total_glosa_value
    remote_glosa = $remoteDashboard.total_glosa_value
    local_indicator_score = $localDashboard.indicator_score
    remote_indicator_score = $remoteDashboard.indicator_score
} | ConvertTo-Json -Compress