import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.scss';

// Environment configuration is validated automatically when imported
// See: src/infrastructure/config/env.ts

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
