<script setup lang="ts">
type Employee = {
  id: number
  name: string
  role: string
  department: string
  daily_work_minutes: number
  is_active: boolean
}

defineProps<{
  isAdmin: boolean
  activeEmployees: Employee[]
  hiddenInactiveCount: number
  employeeForm: {
    name: string
    role: string
    department: string
    daily_work_minutes: number
  }
  editingEmployeeId: number | null
  submitting: boolean
  formatMinutes: (value: number) => string
  onSaveEmployee: () => void
  onResetEmployeeForm: () => void
  onToggleEmployee: (employee: Employee) => void
  onStartEditEmployee: (employee: Employee) => void
}>()
</script>

<template>
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

    <form class="employee-form" @submit.prevent="onSaveEmployee">
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
      <button v-if="editingEmployeeId" class="ghost-button" type="button" @click="onResetEmployeeForm">
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
          @click="onToggleEmployee(employee)"
        >
          {{ employee.is_active ? 'Inativar' : 'Ativar' }}
        </button>
        <button class="ghost-button" type="button" @click="onStartEditEmployee(employee)">
          Editar
        </button>
      </article>
    </div>
  </article>
</template>
