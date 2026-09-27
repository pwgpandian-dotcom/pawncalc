import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// registerType:'autoUpdate' only makes the service worker itself self-activate
// (skipWaiting/clientsClaim) — it does NOT reload an already-open tab/installed
// PWA on its own. registerSW() from the plugin's virtual module is what actually
// wires that up: it detects a new deployment and reloads once the new worker has
// taken control, so an already-installed PWA updates itself with no reinstall.
// Also poll periodically, since a long-lived open tab won't otherwise notice a
// new deployment until its next full navigation.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});
void updateSW;
