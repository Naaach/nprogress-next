<script setup lang="ts">
import { ref, computed } from 'vue';
import { useProgress } from 'nprogress-next-vue';
import { ProgressBar } from 'nprogress-next-vue';

const progress = useProgress();
const secondProgress = useProgress({ color: '#e67e22' });

// ProgressBar expects a number, use status.value
const secondStatus = computed(() => secondProgress.status.value ?? 0);
</script>

<template>
  <div class="container">
    <div class="controls">
      <button class="button primary" @click="progress.start()">Start</button>
      <button class="button" @click="progress.set(0.5)">Set 50%</button>
      <button class="button" @click="progress.inc()">Increment</button>
      <button class="button" @click="progress.done()">Done</button>
      <button class="button" @click="progress.remove()">Remove</button>
    </div>

    <div class="instance-demo">
      <h2 class="h2">
        Isolated instance via <code>createProgress()</code>
      </h2>
      <p class="p">
        Second progress bar with custom color, mounted in this container.
      </p>
      <div class="second-container">
        <ProgressBar :progress="secondStatus" :color="secondColor" />
        <div class="controls">
          <button class="button" @click="secondProgress.start()">Start</button>
          <button class="button" @click="secondProgress.set(0.75)">Set 75%</button>
          <button class="button" @click="secondProgress.done()">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const secondColor = '#e67e22';
</script>

<style scoped>
.container {
  margin-top: 1.5rem;
}
.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.button {
  padding: 0.625rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s, border-color 0.15s;
}
.button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}
.button:active:not(:disabled) {
  background: #eee;
}
.primary {
  background: #29d;
  color: #fff;
  border-color: #29d;
}
.primary:hover:not(:disabled) {
  background: #238cc9;
  border-color: #238cc9;
}
.instance-demo {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}
.h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.p {
  margin-bottom: 1rem;
  color: #333;
}
.second-container {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
code {
  background: #f5f5f5;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>