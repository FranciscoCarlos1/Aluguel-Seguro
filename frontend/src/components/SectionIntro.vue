<script setup lang="ts">
const props = defineProps<{
  eyebrow: string
  title: string
  description: string
  id?: string
  embedded?: boolean
}>()
</script>

<template>
  <div :id="props.id" :class="['section-copy', { 'section-copy-embedded': props.embedded }]">
    <p class="eyebrow">{{ props.eyebrow }}</p>
    <h2>{{ props.title }}</h2>
    <p>{{ props.description }}</p>
  </div>
</template>
