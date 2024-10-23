import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Enable, web3Accounts, web3FromAddress } from '@polkadot/extension-dapp';
import { VARA_APP_ADDRESS } from './consts'; // Dirección del contrato

function App() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [contractData, setContractData] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<any | null>(null); // Estado para el mensaje recibido

  // Inicialización de la API
  useEffect(() => {
    const initApi = async () => {
      try {
        const provider = new WsProvider('wss://testnet.vara.network');
        const api = await ApiPromise.create({ provider });
        setApi(api);

        // Habilitar la extensión de Polkadot.js
        const extensions = await web3Enable('my-dapp');
        if (extensions.length === 0) {
          console.error('No se encontraron extensiones habilitadas');
          return;
        }

        // Obtener las cuentas
        const accounts = await web3Accounts();
        setAccount(accounts[0]?.address || null);
        console.log('Cuenta seleccionada:', accounts[0]?.address);
      } catch (error) {
        console.error('Error al conectar con el nodo:', error);
      }
    };

    initApi();
  }, []);

  // Enviar mensaje al contrato
  const sendMessageToContract = async () => {
    if (!api || !account) {
      console.error('API o cuenta no disponible');
      return;
    }

    try {
      const injector = await web3FromAddress(account);

      // Configuración de parámetros de la llamada
      const value = 0; // Valor a enviar (TVARA)
      const gasLimit = 5000000000000000; // Ajusta el límite de gas según sea necesario
      const message = {
        service: 'VaraApp',
        function: 'DoSomething',
        payload: {}
      };

      // Enviar mensaje al contrato
      const tx = api.tx.gear.sendMessage(
        VARA_APP_ADDRESS,
        message,      // Mensaje a enviar
        value,        // Valor en tokens (TVARA)
        gasLimit,     // Límite de gas
        null          // Parámetro adicional si se requiere
      );

      const unsub = await tx.signAndSend(account, { signer: injector.signer }, (result) => {
        if (result.status.isInBlock) {
          console.log('Transaction included in block:', result.status.asInBlock.toHex());

          // Buscar el evento de respuesta del contrato
          result.events.forEach(({ event: { data, method } }) => {
            if (method === 'MessageReturned') {
              // Capturar el mensaje devuelto por el contrato
              const message = data[1].toString();
              console.log('Mensaje recibido del contrato:', message);
              setResponseMessage(message); // Guardar el mensaje recibido en el estado
            }
          });
        } else if (result.status.isFinalized) {
          console.log('Transaction finalized');
          unsub(); // Desuscribirse cuando la transacción haya sido finalizada
        }
      });
    } catch (error) {
      console.error('Error al enviar mensaje al contrato:', error);
    }
  };

  return (
    <div className="App">
      <h1>Vara App</h1>
      <button onClick={sendMessageToContract}>Enviar mensaje al contrato</button>
      {contractData && <p>Datos del contrato: {contractData}</p>}
      {responseMessage && (
        <p>Mensaje recibido del contrato: {JSON.stringify(responseMessage)}</p> // Mostrar el mensaje recibido como cadena JSON
      )}
    </div>
  );
}

export default App;
