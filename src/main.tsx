import {createRoot} from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
// @ts-ignore - virtual module
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA with automatic update handling
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Versi baru tersedia. Perbarui aplikasi sekarang?')) {
      updateSW(true);
    }
  },
  immediate: true
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
