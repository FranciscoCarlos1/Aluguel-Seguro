<script setup lang="ts">
type WorkspaceNavItem = {
  key: string
  label: string
  eyebrow: string
  description: string
}

defineProps<{
  sections: WorkspaceNavItem[]
  activeSection: string
  activeLabel: string
  activeDescription: string
}>()

const emit = defineEmits<{
  select: [sectionKey: string]
}>()
</script>

<template>
  <section class="workspace-nav-shell">
    <div class="workspace-nav-header">
      <div>
        <p class="eyebrow">Modulos do sistema</p>
        <h2>{{ activeLabel }}</h2>
        <p class="workspace-nav-copy">{{ activeDescription }}</p>
      </div>
      <span class="pill subtle">{{ sections.length }} areas</span>
    </div>

    <div class="workspace-nav-grid">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        class="workspace-nav-card"
        :class="{ 'workspace-nav-card-active': activeSection === section.key }"
        @click="emit('select', section.key)"
      >
        <span class="workspace-nav-eyebrow">{{ section.eyebrow }}</span>
        <strong>{{ section.label }}</strong>
        <small>{{ section.description }}</small>
        <span v-if="activeSection === section.key" class="workspace-nav-state">Modulo aberto</span>
      </button>
    </div>
  </section>
</template>