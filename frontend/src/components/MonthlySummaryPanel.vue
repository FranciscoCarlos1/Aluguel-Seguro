<script setup lang="ts">
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
  entry: Record<string, unknown> | null
}

type EmployeeMonthSummary = {
  employee: {
    id: number
    name: string
    role: string
    department: string
  }
  expected_minutes: number
  worked_minutes: number
  missing_minutes: number
  balance_minutes: number
  glosa_value: number
  days: DaySummary[]
}

defineProps<{
  monthSummary: {
    start_date: string
    end_date: string
    employees: EmployeeMonthSummary[]
  } | null
  monthTitle: string
  selectedEmployeeId: number | null
  selectedEmployeeSummary: EmployeeMonthSummary | null
  selectedWorkDate: string
  downloadingReport: boolean
  formatDate: (value: string) => string
  formatMinutes: (value: number) => string
  formatCurrency: (value: number) => string
  onSelectEmployee: (employeeId: number) => void
  onEditDay: (day: any) => void
  onDownloadReport: () => void
}>()
</script>

<template>
  <article class="panel wide">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Resumo mensal</p>
        <h2>{{ monthTitle }}</h2>
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
        @click="onSelectEmployee(item.employee.id)"
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
          <button class="ghost-button report-button" :disabled="downloadingReport" type="button" @click="onDownloadReport">
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
              @click="onEditDay(day)"
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

      <slot />
    </div>

    <div v-else class="empty-state">
      Nenhuma funcionaria ativa disponivel para o mes selecionado.
    </div>
  </article>
</template>
