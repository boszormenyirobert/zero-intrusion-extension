export async function pollRegistrationState(data, path, container, process) {
  const interval = 1800; 
  const maxTries = 8;
  let tries = 0;

  return new Promise((resolve) => {
    const poller = async () => {
      tries++;

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

        if (res.ok) {
          const data = await res.json();
          if (data?.process_check || data?.registration_process_check) {
            return resolve(true);
          } else {
            displayPoolProcess(container);
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


function displayPoolProcess(container) {
  let feedback = container.querySelector('.polling-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.classList.add('polling-feedback');
    feedback.dataset.count = '5';
    feedback.textContent = '5';
    container.append(feedback);
  } else {
    let count = parseInt(feedback.dataset.count, 10);
    if (count > 1) {
      count--;
      feedback.dataset.count = count.toString();
      feedback.textContent = count.toString();
    }
  }
}