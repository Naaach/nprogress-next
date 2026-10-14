import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProgressBar } from 'nprogress-next-react';
import 'nprogress-next-react/styles.css';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProgressBar color="#29d" />
    <App />
  </React.StrictMode>
);