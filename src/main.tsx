import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeDataAccess } from './data/DataAccessLayer';

// Initialize Supabase data before rendering the app
initializeDataAccess()
  .then(() => {
    console.log('[IRM Sentinel] Data layer initialized');
  })
  .catch((err) => {
    console.warn('[IRM Sentinel] Data layer init error, using fallback:', err);
  })
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
