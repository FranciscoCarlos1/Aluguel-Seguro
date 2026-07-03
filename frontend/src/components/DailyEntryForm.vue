<script setup lang="ts">
defineProps<{
  selectedEmployeeId: number | null
  employees: {
    employee: {
      id: number
      name: string
    }
  }[]
  entryForm: {
    work_date: string
    clock_in: string
    clock_out: string
    notes: string
  }
  savingEntry: boolean
  onEmployeeChange: (event: Event) => void
  onSaveEntry: () => void
}>()
</script>

<template>
  <form class="entry-form" @submit.prevent="onSaveEntry">
    <div class="entry-form-header">
      <div>
        <strong>Lancamento diario</strong>
        <p>Informe os horarios reais da funcionaria para o dia selecionado e o sistema recalcula saldo e glosa automaticamente.</p>
      </div>
    </div>
    <div class="entry-form-grid">
      <label class="field field-full">
        <span>Funcionaria</span>
        <select :value="selectedEmployeeId ?? ''" @change="onEmployeeChange">
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
