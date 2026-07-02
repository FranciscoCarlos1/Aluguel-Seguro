<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type Employee = {
  id: number
  name: string
  role: string
  department: string
  daily_work_minutes: number
  is_active: boolean
}

type WorkEntry = {
  id: number
  employee_id: number
  work_date: string
  clock_in: string | null
  lunch_out: string | null
  lunch_in: string | null
  clock_out: string | null
  notes: string | null
}

type Holiday = {
  id: number
  holiday_date: string
  description: string
}

type AppSettings = {
  non_working_weekdays: number[]
}

type OfficialSheetConfig = {
  shared_url: string | null
  auto_sync_enabled: boolean
  last_sync_at: string | null
}

type ImportResult = {
  imported_employees: number
  imported_entries: number
  updated_entries: number
  skipped_rows: number
}

type User = {
  id: number
  username: string
  display_name: string
  role: 'admin' | 'operator'
  is_active: boolean
  employee_id: number | null
}

type AuthResponse = {
  token: string
  user: User
}

type DaySummary = {
  work_date: string
  weekday_label: string
  is_non_working_day: boolean
  is_holiday: boolean
  holiday_description: string | null
  expected_minutes: number
  worked_minutes: number
  missing_minutes: number
  balance_minutes: number
  glosa_value: number
  entry: WorkEntry | null
}

type EmployeeMonthSummary = {
  employee: Employee
  expected_minutes: number
  worked_minutes: number
  missing_minutes: number
  balance_minutes: number
  glosa_value: number
  days: DaySummary[]
}

type MonthSummaryResponse = {
  year: number
  month: number
  start_date: string
  end_date: string
  non_working_weekdays: number[]
  holidays: string[]
  total_glosa_value: number
  employees: EmployeeMonthSummary[]
}

type DashboardResponse = {
  year: number
  month: number
  active_employees: number
  expected_minutes: number
  worked_minutes: number
  balance_minutes: number
  total_glosa_value: number
  indicator_score: number
  indicator_max_score: number
}

type CostConfig = {
  municipality: string
  cct_code: string
  contract_months: number
  service_type: string
  cbo_code: string
  salary_base: number
  monthly_work_days: number
  weekly_hours: number
  monthly_post_value: number
}

type IndicatorItem = {
  code: string
  title: string
  purpose: string
  target_description: string
  periodicity: string
  input_kind: string
  raw_value: number
  score: number
  max_score: number
  notes: string | null
}

type MonthlyIndicatorsResponse = {
  year: number
  month: number
  total_score: number
  max_score: number
  items: IndicatorItem[]
}

type ServiceQualityItem = {
  code: string
  category: string
  description: string
  rating: string | null
}

type ServiceQualitySummary = {
  total_answered: number
  count_o: number
  count_b: number
  count_r: number
  count_i: number
  count_n: number
  index_o: number
  index_b: number
  index_r: number
  index_i: number
  quality_score: number
  comment: string | null
}

type ServiceLevelBand = {
  label: string
  payment_description: string
  factor: number
  selected: boolean
}

type VtApuracao = {
  monthly_with_vt: number
  monthly_without_vt: number
  vt_monthly_difference: number
  vt_daily_difference_per_employee: number
  missing_vt_days: number
  vt_discount_value: number
  creche_monthly_difference: number
  paid_creche_value: number
  creche_discount_value: number
  monthly_reference_value: number
  service_level_factor: number
  monthly_due_with_imr: number
  final_billed_value: number
}

type MonthlyImrReportResponse = {
  year: number
  month: number
  unit_name: string
  contract_number: string
  manager_name: string
  contractor_name: string
  indicators: MonthlyIndicatorsResponse
  quality_items: ServiceQualityItem[]
  quality_summary: ServiceQualitySummary
  service_level_bands: ServiceLevelBand[]
  vt_apuracao: VtApuracao
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://127.0.0.1:8000/api'
const STORAGE_TOKEN_KEY = 'ifc-jornada-token'
const weekdayOptions = [
  { value: 0, label: 'Segunda' },
  { value: 1, label: 'Terca' },
  { value: 2, label: 'Quarta' },
  { value: 3, label: 'Quinta' },
  { value: 4, label: 'Sexta' },
  { value: 5, label: 'Sabado' },
  { value: 6, label: 'Domingo' },
]
const qualityRatingOptions = ['O', 'B', 'R', 'I', 'N'] as const

const today = new Date()
const selectedYear = ref(today.getFullYear())
const selectedMonth = ref(today.getMonth() + 1)
const selectedEmployeeId = ref<number | null>(null)
const selectedWorkDate = ref('')
const token = ref('')
const currentUser = ref<User | null>(null)

const employees = ref<Employee[]>([])
const users = ref<User[]>([])
const holidays = ref<Holiday[]>([])
const settings = ref<AppSettings>({ non_working_weekdays: [5, 6] })
const officialSheetConfig = ref<OfficialSheetConfig>({
  shared_url: '',
  auto_sync_enabled: false,
  last_sync_at: null,
})
const costConfig = ref<CostConfig>({
  municipality: 'Sao Bento do Sul',
  cct_code: 'SC000104/2026',
  contract_months: 30,
  service_type: 'Servente de Limpeza',
  cbo_code: '5143-20',
  salary_base: 1707.75,
  monthly_work_days: 22,
  weekly_hours: 40,
  monthly_post_value: 2049.3,
})
const monthSummary = ref<MonthSummaryResponse | null>(null)
const dashboard = ref<DashboardResponse | null>(null)
const monthlyImr = ref<MonthlyImrReportResponse | null>(null)
const loading = ref(false)
const authenticating = ref(false)
const submitting = ref(false)
const savingEntry = ref(false)
const savingRules = ref(false)
const savingHoliday = ref(false)
const savingUser = ref(false)
const savingOfficialSheet = ref(false)
const savingCostConfig = ref(false)
const savingIndicators = ref(false)
const syncingOfficialSheet = ref(false)
const downloadingReport = ref(false)
const downloadingImrReport = ref(false)
const errorMessage = ref('')
const officialSheetMessage = ref('')

const loginForm = ref({ username: 'admin', password: 'admin123' })
const editingEmployeeId = ref<number | null>(null)

const employeeForm = ref({
  name: '',
  role: 'Auxiliar',
  department: 'Administrativo',
  daily_work_minutes: 480,
})

const userForm = ref({
  username: '',
  display_name: '',
  password: '',
  role: 'operator' as 'admin' | 'operator',
  employee_id: '',
})

const newHoliday = ref({
  holiday_date: '',
  description: '',
})

const entryForm = ref({
  work_date: '',
  clock_in: '',
  lunch_out: '',
  lunch_in: '',
  clock_out: '',
  notes: '',
})

const monthInput = computed({
  get: () => `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`,
  set: (value: string) => {
    const [year, month] = value.split('-').map(Number)
    if (year && month) {
      selectedYear.value = year
      selectedMonth.value = month
    }
  },
})

const isAdmin = computed(() => currentUser.value?.role === 'admin')
const selectedEmployeeSummary = computed(() => {
  const summaries = monthSummary.value?.employees ?? []
  if (!summaries.length) {
    return null
  }
  if (selectedEmployeeId.value == null) {
    return summaries[0]
  }
  return summaries.find((item) => item.employee.id === selectedEmployeeId.value) ?? summaries[0]
})
const activeEmployees = computed(() => employees.value.filter((employee) => employee.is_active))
const hiddenInactiveCount = computed(() => employees.value.filter((employee) => !employee.is_active).length)
const monthlyIndicators = computed(() => monthlyImr.value?.indicators ?? null)
const qualityGroups = computed(() => {
  const groups = new Map<string, ServiceQualityItem[]>()
  for (const item of monthlyImr.value?.quality_items ?? []) {
    const current = groups.get(item.category) ?? []
    current.push(item)
    groups.set(item.category, current)
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }))
})

function updateSelectedEmployee(value: string) {
  selectedEmployeeId.value = value ? Number(value) : null
}

function handleSelectedEmployeeChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  updateSelectedEmployee(target?.value ?? '')
}

function resetEmployeeForm() {
  editingEmployeeId.value = null
  employeeForm.value = {
    name: '',
    role: 'Auxiliar',
    department: 'Administrativo',
    daily_work_minutes: 480,
  }
}

function formatMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : ''
  const absolute = Math.abs(totalMinutes)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  return `${sign}${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatMonthTitle(summary: MonthSummaryResponse | null): string {
  if (!summary) {
    return 'Mes nao carregado'
  }
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(summary.year, summary.month - 1, 1))
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

function formatRatio(value: number): string {
  return formatNumber(value, 4)
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100, 2)}%`
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Nunca sincronizada'
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function persistToken(nextToken: string) {
  token.value = nextToken
  if (nextToken) {
    localStorage.setItem(STORAGE_TOKEN_KEY, nextToken)
  } else {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token.value && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token.value}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Falha ao carregar ${path}`
    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        message = errorData.detail
      }
    } catch {
      // ignore parse errors
    }

    if (response.status === 401) {
      persistToken('')
      currentUser.value = null
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function loadData() {
  if (!token.value) {
    return
  }
  loading.value = true
  errorMessage.value = ''

  try {
    const baseCalls = [
      requestJson<User>('/auth/me'),
      requestJson<Employee[]>('/employees'),
      requestJson<MonthSummaryResponse>(`/months/${selectedYear.value}/${selectedMonth.value}`),
      requestJson<DashboardResponse>(`/dashboard?year=${selectedYear.value}&month=${selectedMonth.value}`),
      requestJson<AppSettings>('/settings'),
      requestJson<Holiday[]>('/holidays'),
      requestJson<MonthlyImrReportResponse>(`/imr/${selectedYear.value}/${selectedMonth.value}`),
    ] as const

    const baseResults = await Promise.all(baseCalls)
    currentUser.value = baseResults[0]
    employees.value = baseResults[1]
    monthSummary.value = baseResults[2]
    dashboard.value = baseResults[3]
    settings.value = baseResults[4]
    holidays.value = baseResults[5]
    monthlyImr.value = baseResults[6]

    if (isAdmin.value) {
      const adminResults = await Promise.all([
        requestJson<User[]>('/users'),
        requestJson<OfficialSheetConfig>('/official-sheet'),
        requestJson<CostConfig>('/cost-config'),
      ])
      users.value = adminResults[0]
      officialSheetConfig.value = adminResults[1]
      costConfig.value = adminResults[2]
    } else {
      users.value = []
      officialSheetConfig.value = { shared_url: '', auto_sync_enabled: false, last_sync_at: null }
      costConfig.value = {
        municipality: 'Sao Bento do Sul',
        cct_code: 'SC000104/2026',
        contract_months: 30,
        service_type: 'Servente de Limpeza',
        cbo_code: '5143-20',
        salary_base: 1707.75,
        monthly_work_days: 22,
        weekly_hours: 40,
        monthly_post_value: 2049.3,
      }
    }

    if (monthSummary.value.employees.length > 0) {
      selectedEmployeeId.value ??= monthSummary.value.employees[0].employee.id
    } else {
      selectedEmployeeId.value = null
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado'
    errorMessage.value = `${message}. Verifique se a API do backend esta rodando em ${API_BASE}.`
  } finally {
    loading.value = false
  }
}

async function login() {
  authenticating.value = true
  errorMessage.value = ''
  try {
    const result = await requestJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm.value),
    })
    persistToken(result.token)
    currentUser.value = result.user
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel autenticar'
  } finally {
    authenticating.value = false
  }
}

async function logout() {
  try {
    await requestJson<void>('/auth/logout', { method: 'POST' })
  } catch {
    // ignore logout errors
  }
  persistToken('')
  currentUser.value = null
}

async function saveEmployee() {
  submitting.value = true
  errorMessage.value = ''
  try {
    if (editingEmployeeId.value) {
      await requestJson<Employee>(`/employees/${editingEmployeeId.value}`, {
        method: 'PUT',
        body: JSON.stringify(employeeForm.value),
      })
    } else {
      await requestJson<Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm.value),
      })
    }
    resetEmployeeForm()
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar a funcionaria'
  } finally {
    submitting.value = false
  }
}

function startEditEmployee(employee: Employee) {
  editingEmployeeId.value = employee.id
  employeeForm.value = {
    name: employee.name,
    role: employee.role,
    department: employee.department,
    daily_work_minutes: employee.daily_work_minutes,
  }
}

async function saveUser() {
  savingUser.value = true
  errorMessage.value = ''
  try {
    await requestJson<User>('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: userForm.value.username,
        display_name: userForm.value.display_name,
        password: userForm.value.password,
        role: userForm.value.role,
        is_active: true,
        employee_id: userForm.value.employee_id ? Number(userForm.value.employee_id) : null,
      }),
    })
    userForm.value = {
      username: '',
      display_name: '',
      password: '',
      role: 'operator',
      employee_id: '',
    }
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel criar o usuario'
  } finally {
    savingUser.value = false
  }
}

async function saveOfficialSheetConfig() {
  savingOfficialSheet.value = true
  errorMessage.value = ''
  officialSheetMessage.value = ''
  try {
    officialSheetConfig.value = await requestJson<OfficialSheetConfig>('/official-sheet', {
      method: 'PUT',
      body: JSON.stringify(officialSheetConfig.value),
    })
    officialSheetMessage.value = 'Configuracao da planilha oficial salva.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar a planilha oficial'
  } finally {
    savingOfficialSheet.value = false
  }
}

async function syncOfficialSheetNow() {
  syncingOfficialSheet.value = true
  errorMessage.value = ''
  officialSheetMessage.value = ''
  try {
    const result = await requestJson<ImportResult>('/official-sheet/sync', {
      method: 'POST',
    })
    officialSheetMessage.value = `Sincronizacao concluida: ${result.imported_entries} lancamentos novos e ${result.updated_entries} atualizados.`
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel sincronizar a planilha oficial'
  } finally {
    syncingOfficialSheet.value = false
  }
}

async function saveCostConfig() {
  savingCostConfig.value = true
  errorMessage.value = ''
  try {
    costConfig.value = await requestJson<CostConfig>('/cost-config', {
      method: 'PUT',
      body: JSON.stringify(costConfig.value),
    })
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar os parametros do posto'
  } finally {
    savingCostConfig.value = false
  }
}

async function saveImrReport() {
  if (!monthlyImr.value) {
    return
  }
  savingIndicators.value = true
  errorMessage.value = ''
  try {
    monthlyImr.value = await requestJson<MonthlyImrReportResponse>(`/imr/${selectedYear.value}/${selectedMonth.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        indicators: monthlyImr.value.indicators.items.map((item) => ({
          code: item.code,
          raw_value: Number(item.raw_value) || 0,
          notes: item.notes || null,
        })),
        quality_items: monthlyImr.value.quality_items.map((item) => ({
          code: item.code,
          rating: item.rating || null,
        })),
        vt_apuracao: {
          missing_vt_days: Number(monthlyImr.value.vt_apuracao.missing_vt_days) || 0,
          paid_creche_value: Number(monthlyImr.value.vt_apuracao.paid_creche_value) || 0,
          comment: monthlyImr.value.quality_summary.comment || null,
        },
      }),
    })
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar o relatorio IMR'
  } finally {
    savingIndicators.value = false
  }
}

function syncEntryFormFromSummary() {
  const summary = selectedEmployeeSummary.value
  if (!summary) {
    selectedWorkDate.value = ''
    entryForm.value = {
      work_date: '',
      clock_in: '',
      lunch_out: '',
      lunch_in: '',
      clock_out: '',
      notes: '',
    }
    return
  }

  const firstDate = selectedWorkDate.value || summary.days[0]?.work_date || ''
  const day = summary.days.find((item) => item.work_date === firstDate) ?? summary.days[0]
  if (!day) {
    return
  }

  selectedWorkDate.value = day.work_date
  entryForm.value = {
    work_date: day.work_date,
    clock_in: day.entry?.clock_in ?? '',
    lunch_out: day.entry?.lunch_out ?? '',
    lunch_in: day.entry?.lunch_in ?? '',
    clock_out: day.entry?.clock_out ?? '',
    notes: day.entry?.notes ?? '',
  }
}

function editDay(day: DaySummary) {
  selectedWorkDate.value = day.work_date
  entryForm.value = {
    work_date: day.work_date,
    clock_in: day.entry?.clock_in ?? '',
    lunch_out: day.entry?.lunch_out ?? '',
    lunch_in: day.entry?.lunch_in ?? '',
    clock_out: day.entry?.clock_out ?? '',
    notes: day.entry?.notes ?? '',
  }
}

async function saveEntry() {
  const summary = selectedEmployeeSummary.value
  if (!summary || !entryForm.value.work_date) {
    return
  }

  savingEntry.value = true
  errorMessage.value = ''
  try {
    await requestJson<WorkEntry>('/work-entries', {
      method: 'POST',
      body: JSON.stringify({
        employee_id: summary.employee.id,
        work_date: entryForm.value.work_date,
        clock_in: entryForm.value.clock_in || null,
        lunch_out: entryForm.value.lunch_out || null,
        lunch_in: entryForm.value.lunch_in || null,
        clock_out: entryForm.value.clock_out || null,
        notes: entryForm.value.notes || null,
      }),
    })
    await loadData()
    selectedEmployeeId.value = summary.employee.id
    selectedWorkDate.value = entryForm.value.work_date
    syncEntryFormFromSummary()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar o lancamento'
  } finally {
    savingEntry.value = false
  }
}

async function toggleEmployee(employee: Employee) {
  try {
    await requestJson<Employee>(`/employees/${employee.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !employee.is_active }),
    })
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o status'
  }
}

async function saveRules() {
  savingRules.value = true
  errorMessage.value = ''
  try {
    settings.value = await requestJson<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings.value),
    })
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar as regras'
  } finally {
    savingRules.value = false
  }
}

function toggleWeekday(weekday: number) {
  const exists = settings.value.non_working_weekdays.includes(weekday)
  settings.value = {
    non_working_weekdays: exists
      ? settings.value.non_working_weekdays.filter((value) => value !== weekday)
      : [...settings.value.non_working_weekdays, weekday].sort((a, b) => a - b),
  }
}

async function createHoliday() {
  if (!newHoliday.value.holiday_date) {
    return
  }
  savingHoliday.value = true
  errorMessage.value = ''
  try {
    await requestJson<Holiday>('/holidays', {
      method: 'POST',
      body: JSON.stringify({
        holiday_date: newHoliday.value.holiday_date,
        description: newHoliday.value.description || 'Feriado',
      }),
    })
    newHoliday.value = { holiday_date: '', description: '' }
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel salvar o feriado'
  } finally {
    savingHoliday.value = false
  }
}

async function removeHoliday(holidayId: number) {
  try {
    await requestJson<void>(`/holidays/${holidayId}`, { method: 'DELETE' })
    await loadData()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel remover o feriado'
  }
}

async function downloadEmployeeReport() {
  const summary = selectedEmployeeSummary.value
  if (!summary) {
    return
  }

  downloadingReport.value = true
  errorMessage.value = ''
  try {
    const headers = new Headers()
    if (token.value) {
      headers.set('Authorization', `Bearer ${token.value}`)
    }

    const response = await fetch(
      `${API_BASE}/reports/employees/${summary.employee.id}/${selectedYear.value}/${selectedMonth.value}.pdf`,
      { headers },
    )

    if (!response.ok) {
      throw new Error('Nao foi possivel gerar o relatorio da funcionaria')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_${summary.employee.name.toLowerCase().replace(/\s+/g, '_')}_${selectedYear.value}_${String(selectedMonth.value).padStart(2, '0')}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel baixar o relatorio'
  } finally {
    downloadingReport.value = false
  }
}

async function downloadImrReport() {
  if (!monthlyImr.value) {
    return
  }

  downloadingImrReport.value = true
  errorMessage.value = ''
  try {
    const headers = new Headers()
    if (token.value) {
      headers.set('Authorization', `Bearer ${token.value}`)
    }

    const response = await fetch(
      `${API_BASE}/reports/imr/${selectedYear.value}/${selectedMonth.value}.pdf`,
      { headers },
    )

    if (!response.ok) {
      throw new Error('Nao foi possivel gerar o PDF do IMR')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_imr_${selectedYear.value}_${String(selectedMonth.value).padStart(2, '0')}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel baixar o PDF do IMR'
  } finally {
    downloadingImrReport.value = false
  }
}

watch([selectedYear, selectedMonth], () => {
  if (currentUser.value) {
    loadData()
  }
})

watch(selectedEmployeeSummary, () => {
  syncEntryFormFromSummary()
})

onMounted(async () => {
  const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY) ?? ''
  if (!storedToken) {
    return
  }
  persistToken(storedToken)
  await loadData()
})
</script>

<template>
  <div>
    <div v-if="!currentUser" class="login-shell">
      <section class="login-card">
        <p class="eyebrow">IFC Jornada</p>
        <h1>Acesso ao sistema</h1>
        <p class="hero-copy">Entre para acompanhar a equipe oficial, registrar jornadas da competencia e conferir glosa, IMR e relatorios.</p>
        <p v-if="errorMessage" class="feedback feedback-error">{{ errorMessage }}</p>
        <form class="login-form" @submit.prevent="login">
          <label class="field">
            <span>Usuario</span>
            <input v-model="loginForm.username" type="text" autocomplete="username" />
          </label>
          <label class="field">
            <span>Senha</span>
            <input v-model="loginForm.password" type="password" autocomplete="current-password" />
          </label>
          <button class="primary-button" :disabled="authenticating" type="submit">
            {{ authenticating ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </section>
    </div>

    <div v-else class="shell">
      <div class="topbar">
        <div>
          <strong>{{ currentUser.display_name }}</strong>
          <span class="topbar-meta">{{ currentUser.username }} · {{ currentUser.role }}</span>
        </div>
        <button class="ghost-button" type="button" @click="logout">Sair</button>
      </div>

    <header class="hero">
      <div>
        <p class="eyebrow">IFC Jornada</p>
        <h1>FISCALIZACAO DE CONTRATO DE SERVICO DE LIMPEZA.</h1>
      </div>

      <div class="hero-panel">
        <label class="field field-compact">
          <span>Competencia</span>
          <input v-model="monthInput" type="month" />
        </label>

        <div class="workflow-strip">
          <span>1. Sincronize as funcionarias da planilha oficial</span>
          <span>2. Lance ou confira a jornada do dia</span>
          <span>3. Acompanhe glosa mensal, IMR e PDF individual</span>
        </div>

        <div class="rule-card">
          <strong>Fluxo oficial do contrato</strong>
          <p>Periodo do dia 1 ao ultimo dia do mes.</p>
          <p>Sabado nao tem expediente regular e so entra quando houver compensacao.</p>
        </div>
      </div>
    </header>

    <p v-if="errorMessage" class="feedback feedback-error">{{ errorMessage }}</p>
    <p v-else-if="loading" class="feedback">Carregando dados do mes...</p>

    <section class="stats-grid">
      <article class="stat-card accent">
        <span>Funcionarias ativas</span>
        <strong>{{ dashboard?.active_employees ?? 0 }}</strong>
      </article>
      <article class="stat-card">
        <span>Horas previstas</span>
        <strong>{{ formatMinutes(dashboard?.expected_minutes ?? 0) }}</strong>
      </article>
      <article class="stat-card">
        <span>Horas lancadas</span>
        <strong>{{ formatMinutes(dashboard?.worked_minutes ?? 0) }}</strong>
      </article>
      <article class="stat-card">
        <span>Saldo do mes</span>
        <strong :class="(dashboard?.balance_minutes ?? 0) < 0 ? 'negative' : 'positive'">
          {{ formatMinutes(dashboard?.balance_minutes ?? 0) }}
        </strong>
      </article>
      <article class="stat-card">
        <span>Glosa estimada</span>
        <strong>{{ formatCurrency(dashboard?.total_glosa_value ?? 0) }}</strong>
      </article>
      <article class="stat-card">
        <span>IMR do mes</span>
        <strong>{{ dashboard?.indicator_score ?? 0 }}/{{ dashboard?.indicator_max_score ?? 0 }}</strong>
      </article>
    </section>

    <section class="rules-grid">
      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Regras</p>
            <h2>Dias sem expediente</h2>
          </div>
        </div>

        <div class="weekday-grid">
          <label v-for="item in weekdayOptions" :key="item.value" class="weekday-option">
            <input
              :checked="settings.non_working_weekdays.includes(item.value)"
              type="checkbox"
              @change="toggleWeekday(item.value)"
            />
            <span>{{ item.label }}</span>
          </label>
        </div>

        <button class="primary-button" :disabled="savingRules" type="button" @click="saveRules">
          {{ savingRules ? 'Salvando regras...' : 'Salvar regras de expediente' }}
        </button>
      </article>

      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Feriados</p>
            <h2>Calendario institucional</h2>
          </div>
        </div>

        <form class="holiday-form" @submit.prevent="createHoliday">
          <label class="field">
            <span>Data</span>
            <input v-model="newHoliday.holiday_date" type="date" />
          </label>
          <label class="field">
            <span>Descricao</span>
            <input v-model="newHoliday.description" type="text" placeholder="Ex.: Corpus Christi" />
          </label>
          <button class="primary-button" :disabled="savingHoliday" type="submit">
            {{ savingHoliday ? 'Salvando feriado...' : 'Adicionar feriado' }}
          </button>
        </form>

        <div class="holiday-list">
          <article v-for="holiday in holidays" :key="holiday.id" class="employee-card compact-card">
            <div>
              <h3>{{ formatDate(holiday.holiday_date) }}</h3>
              <p>{{ holiday.description }}</p>
            </div>
            <button class="ghost-button deactivate" type="button" @click="removeHoliday(holiday.id)">
              Remover
            </button>
          </article>
          <p v-if="holidays.length === 0" class="empty-state">Nenhum feriado cadastrado.</p>
        </div>
      </article>

      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Planilha oficial</p>
            <h2>Sincronizacao automatica</h2>
          </div>
        </div>

        <div class="import-box manual-box">
          <label class="field field-full">
            <span>Fonte oficial da planilha</span>
            <input v-model="officialSheetConfig.shared_url" type="text" placeholder="https://docs.google.com/... ou C:/caminho/arquivo.csv" />
          </label>
          <label class="weekday-option">
            <input v-model="officialSheetConfig.auto_sync_enabled" type="checkbox" />
            <span>Sincronizar automaticamente ao iniciar o backend e diariamente as 23h</span>
          </label>
          <p>As funcionarias oficiais podem ser puxadas de uma planilha compartilhada ou de um arquivo local CSV, XLSX ou ODS.</p>
          <p>Ultima sincronizacao: {{ formatDateTime(officialSheetConfig.last_sync_at) }}</p>
          <p v-if="officialSheetMessage" class="feedback">{{ officialSheetMessage }}</p>
          <div class="action-row">
            <button class="primary-button" :disabled="savingOfficialSheet" type="button" @click="saveOfficialSheetConfig">
              {{ savingOfficialSheet ? 'Salvando...' : 'Salvar fonte oficial' }}
            </button>
            <button class="ghost-button report-button" :disabled="syncingOfficialSheet || !officialSheetConfig.shared_url" type="button" @click="syncOfficialSheetNow">
              {{ syncingOfficialSheet ? 'Sincronizando...' : 'Sincronizar agora' }}
            </button>
          </div>
        </div>
      </article>

      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Custo do posto</p>
            <h2>Base da glosa contratual</h2>
          </div>
        </div>

        <form class="employee-form" @submit.prevent="saveCostConfig">
          <label class="field">
            <span>Municipio</span>
            <input v-model="costConfig.municipality" type="text" />
          </label>
          <label class="field">
            <span>CCT</span>
            <input v-model="costConfig.cct_code" type="text" />
          </label>
          <label class="field">
            <span>Tipo de servico</span>
            <input v-model="costConfig.service_type" type="text" />
          </label>
          <label class="field">
            <span>CBO</span>
            <input v-model="costConfig.cbo_code" type="text" />
          </label>
          <label class="field">
            <span>Salario base</span>
            <input v-model.number="costConfig.salary_base" type="number" min="0" step="0.01" />
          </label>
          <label class="field">
            <span>Valor mensal do posto</span>
            <input v-model.number="costConfig.monthly_post_value" type="number" min="0" step="0.01" />
          </label>
          <label class="field">
            <span>Dias trabalhados no mes</span>
            <input v-model.number="costConfig.monthly_work_days" type="number" min="1" step="1" />
          </label>
          <label class="field">
            <span>Carga horaria semanal</span>
            <input v-model.number="costConfig.weekly_hours" type="number" min="1" step="1" />
          </label>
          <label class="field field-full">
            <span>Meses de execucao contratual</span>
            <input v-model.number="costConfig.contract_months" type="number" min="1" step="1" />
          </label>
          <button class="primary-button" :disabled="savingCostConfig" type="submit">
            {{ savingCostConfig ? 'Salvando base...' : 'Salvar base de custo' }}
          </button>
        </form>
      </article>

      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Acesso</p>
            <h2>Usuarios e perfis</h2>
          </div>
        </div>

        <form class="user-form" @submit.prevent="saveUser">
          <label class="field">
            <span>Usuario</span>
            <input v-model="userForm.username" type="text" required />
          </label>
          <label class="field">
            <span>Nome exibido</span>
            <input v-model="userForm.display_name" type="text" required />
          </label>
          <label class="field">
            <span>Senha inicial</span>
            <input v-model="userForm.password" type="password" required />
          </label>
          <label class="field">
            <span>Perfil</span>
            <select v-model="userForm.role">
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label class="field field-full">
            <span>Vincular a funcionaria</span>
            <select v-model="userForm.employee_id">
              <option value="">Sem vinculo</option>
              <option v-for="employee in activeEmployees" :key="employee.id" :value="String(employee.id)">
                {{ employee.name }}
              </option>
            </select>
          </label>
          <button class="primary-button" :disabled="savingUser" type="submit">
            {{ savingUser ? 'Salvando usuario...' : 'Criar usuario' }}
          </button>
        </form>

        <div class="user-list">
          <article v-for="user in users" :key="user.id" class="employee-card compact-card">
            <div>
              <h3>{{ user.display_name }}</h3>
              <p>{{ user.username }} · {{ user.role }}</p>
            </div>
            <span class="pill subtle">{{ user.is_active ? 'Ativo' : 'Inativo' }}</span>
          </article>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article v-if="isAdmin" class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Equipe</p>
            <h2>Funcionarias oficiais e excecoes</h2>
          </div>
          <span class="pill">{{ activeEmployees.length }} ativas</span>
        </div>

        <p class="hero-copy compact-copy">A planilha oficial deve ser a fonte principal dos nomes. O cadastro abaixo existe para ajustes operacionais e excecoes controladas.</p>
        <p v-if="hiddenInactiveCount > 0" class="hero-copy compact-copy">{{ hiddenInactiveCount }} cadastro(s) inativo(s) antigo(s) estao ocultos desta lista principal.</p>

        <form class="employee-form" @submit.prevent="saveEmployee">
          <label class="field">
            <span>Nome</span>
            <input v-model="employeeForm.name" type="text" required />
          </label>
          <label class="field">
            <span>Cargo</span>
            <input v-model="employeeForm.role" type="text" />
          </label>
          <label class="field">
            <span>Setor</span>
            <input v-model="employeeForm.department" type="text" />
          </label>
          <div class="field static-field">
            <span>Jornada diaria padrao</span>
            <strong>480 minutos</strong>
          </div>
          <button class="primary-button" :disabled="submitting" type="submit">
            {{ submitting ? 'Salvando...' : editingEmployeeId ? 'Salvar alteracoes' : 'Adicionar funcionaria' }}
          </button>
          <button v-if="editingEmployeeId" class="ghost-button" type="button" @click="resetEmployeeForm">
            Cancelar edicao
          </button>
        </form>

        <div class="employee-list">
          <article v-for="employee in activeEmployees" :key="employee.id" class="employee-card">
            <div>
              <h3>{{ employee.name }}</h3>
              <p>{{ employee.role }} · {{ employee.department }}</p>
              <small>{{ formatMinutes(employee.daily_work_minutes) }} por dia</small>
            </div>
            <button
              class="ghost-button"
              :class="employee.is_active ? 'deactivate' : 'activate'"
              type="button"
              @click="toggleEmployee(employee)"
            >
              {{ employee.is_active ? 'Inativar' : 'Ativar' }}
            </button>
            <button class="ghost-button" type="button" @click="startEditEmployee(employee)">
              Editar
            </button>
          </article>
        </div>
      </article>

      <article class="panel wide">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Resumo mensal</p>
            <h2>{{ formatMonthTitle(monthSummary) }}</h2>
          </div>
          <span class="pill subtle">
            {{ monthSummary?.start_date ? formatDate(monthSummary.start_date) : '--' }} ate
            {{ monthSummary?.end_date ? formatDate(monthSummary.end_date) : '--' }}
          </span>
        </div>

        <div class="summary-cards">
          <button
            v-for="item in monthSummary?.employees ?? []"
            :key="item.employee.id"
            class="summary-card"
            :class="selectedEmployeeId === item.employee.id ? 'selected' : ''"
            type="button"
            @click="selectedEmployeeId = item.employee.id"
          >
            <strong>{{ item.employee.name }}</strong>
            <span>Previsto: {{ formatMinutes(item.expected_minutes) }}</span>
            <span>Trabalhado: {{ formatMinutes(item.worked_minutes) }}</span>
            <span>Nao trabalhado: {{ formatMinutes(item.missing_minutes) }}</span>
            <span>Glosa: {{ formatCurrency(item.glosa_value) }}</span>
            <span :class="item.balance_minutes < 0 ? 'negative' : 'positive'">
              Saldo: {{ formatMinutes(item.balance_minutes) }}
            </span>
          </button>
        </div>

        <div v-if="selectedEmployeeSummary" class="detail-panel">
          <div class="detail-header">
            <div>
              <h3>{{ selectedEmployeeSummary.employee.name }}</h3>
              <p>
                {{ selectedEmployeeSummary.employee.role }} ·
                {{ selectedEmployeeSummary.employee.department }}
              </p>
                <p class="detail-hint">Selecione um dia abaixo para lancar a jornada da funcionaria e atualizar o saldo do mes.</p>
            </div>
            <div class="detail-side">
              <div class="detail-totals">
                <span>Previsto {{ formatMinutes(selectedEmployeeSummary.expected_minutes) }}</span>
                <span>Trabalhado {{ formatMinutes(selectedEmployeeSummary.worked_minutes) }}</span>
                <span>Nao trabalhado {{ formatMinutes(selectedEmployeeSummary.missing_minutes) }}</span>
                <span>Glosa {{ formatCurrency(selectedEmployeeSummary.glosa_value) }}</span>
                <span :class="selectedEmployeeSummary.balance_minutes < 0 ? 'negative' : 'positive'">
                  Saldo {{ formatMinutes(selectedEmployeeSummary.balance_minutes) }}
                </span>
              </div>
              <button class="ghost-button report-button" :disabled="downloadingReport" type="button" @click="downloadEmployeeReport">
                {{ downloadingReport ? 'Gerando PDF...' : 'Baixar relatorio PDF' }}
              </button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Dia</th>
                  <th>Entrada</th>
                  <th>Saida</th>
                  <th>Previsto</th>
                  <th>Feito</th>
                  <th>Nao feito</th>
                  <th>Saldo</th>
                  <th>Glosa</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="day in selectedEmployeeSummary.days"
                  :key="day.work_date"
                  :class="selectedWorkDate === day.work_date ? 'row-selected' : ''"
                  @click="editDay(day)"
                >
                  <td>
                    {{ formatDate(day.work_date) }}
                    <small v-if="day.is_holiday" class="holiday-tag">{{ day.holiday_description }}</small>
                  </td>
                  <td>{{ day.weekday_label }}</td>
                  <td>{{ day.entry?.clock_in ?? '--:--' }}</td>
                  <td>{{ day.entry?.clock_out ?? '--:--' }}</td>
                  <td>{{ formatMinutes(day.expected_minutes) }}</td>
                  <td>{{ formatMinutes(day.worked_minutes) }}</td>
                  <td>{{ formatMinutes(day.missing_minutes) }}</td>
                  <td :class="day.balance_minutes < 0 ? 'negative' : 'positive'">
                    {{ formatMinutes(day.balance_minutes) }}
                  </td>
                  <td>{{ formatCurrency(day.glosa_value) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="monthlyImr && monthlyIndicators" class="indicator-panel">
            <div class="panel-heading panel-heading-tight">
              <div>
                <p class="eyebrow">IMR</p>
                <h2>Relatorio mensal conforme a planilha</h2>
                <p class="indicator-meta">{{ monthlyImr.unit_name }} · Contrato {{ monthlyImr.contract_number }} · Responsavel {{ monthlyImr.manager_name }}</p>
              </div>
              <span class="pill">{{ monthlyIndicators.total_score }}/{{ monthlyIndicators.max_score }} pontos</span>
            </div>

            <div class="imr-section-grid">
              <article class="indicator-card imr-meta-card">
                <strong>Identificacao</strong>
                <p>Contratada: {{ monthlyImr.contractor_name }}</p>
                <p>Competencia: {{ String(monthlyImr.month).padStart(2, '0') }}/{{ monthlyImr.year }}</p>
              </article>
              <article class="indicator-card imr-meta-card">
                <strong>Nivel de servico</strong>
                <p>Fator aplicado: {{ formatNumber(monthlyImr.vt_apuracao.service_level_factor, 2) }}</p>
                <p>Valor mensal devido: {{ formatCurrency(monthlyImr.vt_apuracao.monthly_due_with_imr) }}</p>
              </article>
            </div>

            <div class="indicator-list">
              <article v-for="item in monthlyIndicators.items" :key="item.code" class="indicator-card">
                <div class="indicator-topline">
                  <strong>{{ item.code }} · {{ item.title }}</strong>
                  <span class="pill subtle">{{ item.score }}/{{ item.max_score }}</span>
                </div>
                <p>{{ item.purpose }}</p>
                <p class="indicator-meta">Meta: {{ item.target_description }}</p>
                <div class="indicator-fields">
                  <label class="field">
                    <span>{{ item.input_kind === 'score' ? 'Pontuacao apurada automaticamente' : 'Ocorrencias no mes' }}</span>
                    <input v-model.number="item.raw_value" type="number" min="0" step="1" :max="item.input_kind === 'score' ? item.max_score : undefined" :disabled="!isAdmin || item.input_kind === 'score'" />
                  </label>
                  <label class="field field-full">
                    <span>Observacoes</span>
                    <input v-model="item.notes" type="text" :disabled="!isAdmin" placeholder="Livro de registros, pesquisa, observacao do fiscal..." />
                  </label>
                </div>
              </article>
            </div>

            <div class="imr-quality-panel">
              <div class="panel-heading panel-heading-tight">
                <div>
                  <p class="eyebrow">Planilha de Avaliacao</p>
                  <h3>Avaliacao da qualidade dos servicos</h3>
                </div>
                <span class="pill subtle">Pontuacao da pesquisa: {{ formatNumber(monthlyImr.quality_summary.quality_score) }}/25</span>
              </div>

              <div class="quality-groups">
                <section v-for="group in qualityGroups" :key="group.category" class="quality-group">
                  <h4>{{ group.category }}</h4>
                  <div class="quality-items">
                    <label v-for="item in group.items" :key="item.code" class="quality-row">
                      <span>{{ item.description }}</span>
                      <select v-model="item.rating" :disabled="!isAdmin">
                        <option value="">Selecione</option>
                        <option v-for="option in qualityRatingOptions" :key="option" :value="option">{{ option }}</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <label class="field field-full">
                <span>Comentario ou observacao</span>
                <textarea v-model="monthlyImr.quality_summary.comment" rows="3" :disabled="!isAdmin" placeholder="Espaco para observacoes gerais sobre a avaliacao do mes." />
              </label>

              <div class="quality-summary-grid">
                <article class="summary-box">
                  <strong>Totais por grau</strong>
                  <p>O: {{ monthlyImr.quality_summary.count_o }} · B: {{ monthlyImr.quality_summary.count_b }} · R: {{ monthlyImr.quality_summary.count_r }} · I: {{ monthlyImr.quality_summary.count_i }} · N: {{ monthlyImr.quality_summary.count_n }}</p>
                </article>
                <article class="summary-box">
                  <strong>Indices</strong>
                  <p>O: {{ formatRatio(monthlyImr.quality_summary.index_o) }} · B: {{ formatRatio(monthlyImr.quality_summary.index_b) }} · R: {{ formatRatio(monthlyImr.quality_summary.index_r) }} · I: {{ formatRatio(monthlyImr.quality_summary.index_i) }}</p>
                </article>
              </div>
            </div>

            <div class="imr-service-panel">
              <div class="panel-heading panel-heading-tight">
                <div>
                  <p class="eyebrow">Avaliacao de Nivel de Servico</p>
                  <h3>Faixa de pagamento aplicavel</h3>
                </div>
              </div>

              <div class="service-band-list">
                <article v-for="band in monthlyImr.service_level_bands" :key="band.label" :class="['service-band', { 'service-band-selected': band.selected }]">
                  <strong>{{ band.label }}</strong>
                  <p>{{ band.payment_description }}</p>
                  <span>Fator {{ formatNumber(band.factor, 2) }}</span>
                </article>
              </div>
            </div>

            <div class="imr-vt-panel">
              <div class="panel-heading panel-heading-tight">
                <div>
                  <p class="eyebrow">Apuracao VT</p>
                  <h3>Descontos e valor final a faturar</h3>
                </div>
              </div>

              <div class="vt-grid">
                <label class="field static-field">
                  <span>Valor mensal com VT</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.monthly_with_vt) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Valor mensal sem VT</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.monthly_without_vt) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Diferenca VT mensal</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.vt_monthly_difference) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Diferenca VT diaria por funcionario</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.vt_daily_difference_per_employee) }}</strong>
                </label>
                <label class="field">
                  <span>Quantidade de dias sem VT pago</span>
                  <input v-model.number="monthlyImr.vt_apuracao.missing_vt_days" type="number" min="0" step="1" :disabled="!isAdmin" />
                </label>
                <label class="field static-field">
                  <span>Valor a descontar VT</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.vt_discount_value) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Diferenca reembolso creche mensal</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.creche_monthly_difference) }}</strong>
                </label>
                <label class="field">
                  <span>Valor pago de reembolso creche</span>
                  <input v-model.number="monthlyImr.vt_apuracao.paid_creche_value" type="number" min="0" step="0.01" :disabled="!isAdmin" />
                </label>
                <label class="field static-field">
                  <span>Valor a descontar reembolso creche</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.creche_discount_value) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Valor mensal de referencia</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.monthly_reference_value) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Fator de ajuste de nivel de servico</span>
                  <strong>{{ formatPercent(monthlyImr.vt_apuracao.service_level_factor) }}</strong>
                </label>
                <label class="field static-field">
                  <span>Valor mensal devido</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.monthly_due_with_imr) }}</strong>
                </label>
                <label class="field static-field field-full">
                  <span>Valor mensal a faturar</span>
                  <strong>{{ formatCurrency(monthlyImr.vt_apuracao.final_billed_value) }}</strong>
                </label>
              </div>
            </div>

            <div class="action-row">
              <button class="ghost-button report-button" :disabled="downloadingImrReport" type="button" @click="downloadImrReport">
                {{ downloadingImrReport ? 'Gerando PDF do IMR...' : 'Baixar PDF do IMR' }}
              </button>
              <button v-if="isAdmin" class="primary-button" :disabled="savingIndicators" type="button" @click="saveImrReport">
                {{ savingIndicators ? 'Salvando IMR...' : 'Salvar relatorio IMR do mes' }}
              </button>
            </div>
          </div>

          <form class="entry-form" @submit.prevent="saveEntry">
            <div class="entry-form-header">
              <div>
                <strong>Lancamento diario</strong>
                <p>Informe os horarios reais da funcionaria para o dia selecionado e o sistema recalcula saldo e glosa automaticamente.</p>
              </div>
            </div>
            <div class="entry-form-grid">
              <label class="field field-full">
                <span>Funcionaria</span>
                <select :value="selectedEmployeeId ?? ''" @change="handleSelectedEmployeeChange">
                  <option value="">Selecione uma funcionaria</option>
                  <option v-for="item in monthSummary?.employees ?? []" :key="item.employee.id" :value="String(item.employee.id)">
                    {{ item.employee.name }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Data</span>
                <input v-model="entryForm.work_date" type="date" />
              </label>
              <label class="field">
                <span>Entrada</span>
                <input v-model="entryForm.clock_in" type="time" />
              </label>
              <label class="field">
                <span>Saida almoco</span>
                <input v-model="entryForm.lunch_out" type="time" />
              </label>
              <label class="field">
                <span>Retorno almoco</span>
                <input v-model="entryForm.lunch_in" type="time" />
              </label>
              <label class="field">
                <span>Saida final</span>
                <input v-model="entryForm.clock_out" type="time" />
              </label>
              <label class="field field-full">
                <span>Observacoes</span>
                <input v-model="entryForm.notes" type="text" placeholder="Atestado, compensacao, observacao interna..." />
              </label>
            </div>
            <button class="primary-button" :disabled="savingEntry" type="submit">
              {{ savingEntry ? 'Salvando lancamento...' : 'Salvar lancamento do dia' }}
            </button>
          </form>
        </div>

        <div v-else class="empty-state">
          Nenhuma funcionaria ativa disponivel para o mes selecionado.
        </div>
      </article>
    </section>
    </div>
  </div>
</template>
