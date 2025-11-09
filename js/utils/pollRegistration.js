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
  console.log('displayPoolProcess called');
  let feedback = container.querySelector('.polling-feedback');
  if (!feedback) {
    console.log('Creating new polling feedback element');
    feedback = document.createElement('div');
    feedback.classList.add('polling-feedback');
    feedback.dataset.count = '5';
    feedback.textContent = `Polling... ${5}`;
    feedback.style.color = '#ffc107';
    feedback.style.fontSize = '14px';
    feedback.style.marginTop = '10px';
    feedback.style.textAlign = 'center';
    container.append(feedback);
  } else {
    console.log('Updating existing polling feedback');
    let count = parseInt(feedback.dataset.count, 10);
    if (count > 1) {
      count--;
      feedback.dataset.count = count.toString();
      feedback.textContent = `Polling... ${count}`;
    }
  }
}