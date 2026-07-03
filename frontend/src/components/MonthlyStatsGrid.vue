<script setup lang="ts">
defineProps<{
  dashboard: {
    active_employees: number
    expected_minutes: number
    worked_minutes: number
    balance_minutes: number
    total_glosa_value: number
    indicator_score: number
    indicator_max_score: number
  } | null
  formatMinutes: (value: number) => string
  formatCurrency: (value: number) => string
}>()
</script>

<template>
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
</template>
