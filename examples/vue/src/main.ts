import { createApp } from 'vue';
import { ProgressBar, NProgressNext } from 'nprogress-next-vue';
import 'nprogress-next-vue/styles.css';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.use(NProgressNext);
app.component('ProgressBar', ProgressBar);
app.mount('#app');