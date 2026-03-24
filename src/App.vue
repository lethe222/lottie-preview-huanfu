<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="Home">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
// Layout component
</script>

<style>
/* Global styles can go here if any */
</style>
