<script setup lang="ts">
import Demo from './Demo.vue';
</script>

<template>
  <main class="main">
    <h1 class="h1">
      nprogress-next
      <span class="subtitle">Vue Example</span>
    </h1>
    <p class="desc">
      <code>ProgressBar</code> at app root + <code>useProgress()</code> composable in a component.
    </p>
    <ProgressBar color="#29d" />
    <Demo />
    <p class="note">
      Plugin registered via <code>app.use(NProgressNext)</code>.
      Color passed via <code>color</code> prop.
      Styles auto-injected via <code>import 'nprogress-next-vue/styles.css'</code>.
    </p>
  </main>
</template>

<style scoped>
.main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
.h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #666;
  font-weight: 400;
}
.desc {
  margin-bottom: 2rem;
  color: #333;
}
.note {
  margin-top: 2rem;
  font-size: 0.875rem;
  color: #666;
}
code {
  background: #f5f5f5;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>