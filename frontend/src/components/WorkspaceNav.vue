<script setup lang="ts">
const props = defineProps<{
  sections: readonly {
    id: string
    eyebrow: string
    title: string
    description: string
  }[]
}>()
</script>

<template>
  <section class="workspace-nav panel">
    <div class="panel-heading workspace-nav-heading">
      <div>
        <p class="eyebrow">Mapa do sistema</p>
        <h2>Cada coisa no seu lugar</h2>
      </div>
      <span class="pill subtle">Acesso direto</span>
    </div>

    <div class="workspace-nav-grid">
      <a v-for="section in props.sections" :key="section.id" class="workspace-link-card" :href="`#${section.id}`">
        <span class="workspace-link-kicker">{{ section.eyebrow }}</span>
        <strong>{{ section.title }}</strong>
        <p>{{ section.description }}</p>
      </a>
    </div>
  </section>
</template>
