import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import App from './App.jsx';
import './assets/css/variables.css';
import './assets/css/base.css';
import './assets/css/layout.css';
import './assets/css/components.css';
import './assets/css/utilities.css';
import './assets/css/auth.css';
import './assets/css/responsive.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
