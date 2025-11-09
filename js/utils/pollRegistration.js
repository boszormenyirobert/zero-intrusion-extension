import { renderPollingProcess } from './renderPollingProcess.js';

export async function pollRegistrationState(data, path, container, process) {
  console.log('pollRegistrationState called with:', { data, path, process });
  const interval = 1800; 
  const maxTries = 8;
  let tries = 0;

  return new Promise((resolve) => {
    const poller = async () => {
      tries++;
      console.log(`Polling attempt ${tries}/${maxTries}`);

      try {
        const res = await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Extension-Auth': `HMAC ${data['xExtensionAuthTwo']}`
          },
          body: JSON.stringify({
            type: 'extension',
            processId: data[process]
          })
        });

        console.log('Polling response status:', res.status);
        if (res.ok) {
          const responseData = await res.json();
          console.log('Polling response data:', responseData);
          if (responseData?.process_check || responseData?.registration_process_check) {
            console.log('Success condition met, resolving true');
            return resolve(true);
          } else {
            console.log('Displaying polling process...');
            renderPollingProcess(container);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }

      if (tries < maxTries) {
        setTimeout(poller, interval);
      } else {
        return resolve(false);
      }
    };

    poller();
  });
}