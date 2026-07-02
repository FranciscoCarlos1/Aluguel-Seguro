<script setup lang="ts">
type EmployeeOption = {
  employee: {
    id: number
    name: string
  }
}

type EntryFormModel = {
  work_date: string
  clock_in: string
  clock_out: string
  notes: string
}

defineProps<{
  activeSection: string
  entryForm: EntryFormModel
  employees: EmployeeOption[]
  savingEntry: boolean
  selectedEmployeeId: number | null
}>()

const emit = defineEmits<{
  'employee-change': [event: Event]
  'submit-entry': []
}>()
</script>

<template>
  <form class="entry-form" @submit.prevent="emit('submit-entry')">
    <div class="entry-form-header">
      <div>
        <strong>Lancamento diario</strong>
        <p>Informe os horarios reais da funcionaria para o dia selecionado e o sistema recalcula saldo e glosa automaticamente.</p>
      </div>
      <span v-if="activeSection === 'monthly-summary'" class="pill subtle">Editor rapido liberado no resumo</span>
    </div>
    <div class="entry-form-grid">
      <label class="field field-full">
        <span>Funcionaria</span>
        <select :value="selectedEmployeeId ?? ''" @change="emit('employee-change', $event)">
          <option value="">Selecione uma funcionaria</option>
          <option v-for="item in employees" :key="item.employee.id" :value="String(item.employee.id)">
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
</template>