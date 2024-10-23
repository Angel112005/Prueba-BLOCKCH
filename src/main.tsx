import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ApiPromise, WsProvider } from '@polkadot/api';

const initApi = async () => {
  const provider = new WsProvider('wss://node.vara.network'); // Cambia a tu nodo Gear/Vara
  const api = await ApiPromise.create({ provider });

  return api;
};

initApi().then(api => {
  console.log('API Conectada', api);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
