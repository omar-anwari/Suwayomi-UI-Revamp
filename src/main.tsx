import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'urql';
import { client } from './urql';
import App from './App';
import { initTheme } from './theme';
import './index.css';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </StrictMode>,
);
