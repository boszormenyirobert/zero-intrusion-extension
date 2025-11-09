import { DomainRead } from '../login/domainRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';

export class DomainDelete {

  URL_IDENTITY = null;
  URL_POLL = null;

  constructor(container) {
    this.container = container;
    this.state = {
      requestIdentifier: null,
      hmac: null,
      domain: null,
      processId: null
    };

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/domain/delete/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/domain/delete/state`;  
  }

  async init() {
    // First load domain credentials using domainRead
    await this.loadDomainCredentials();
  }

  async loadDomainCredentials() {
    const domain = await getCurrentTabHost();
    const storage = handleLocalStorage();
    let payload = {};

    // Use EXACT same logic as domainRead.js
    if(storage){
        console.log(handleLocalStorage());
        payload = { domain, userPublicId:handleLocalStorage()}
    } else {
        payload = { domain, userPublicId:"" };
    }

    try {
      const requestIdentifier = await fetchIdentifier(
        `${BASE_API_URL}/api/credential-hub/domain/read/qr-identity`,
        JSON.stringify(payload)
      );

      if (!requestIdentifier?.domainProcessId) {
        console.error('domainProcessId not found.');
        this.displayError();
        return;
      }

      // Set up state exactly like domainRead.js
      this.state = {
        domain,
        requestIdentifier,
        hmac:  `HMAC ${requestIdentifier['xExtensionAuthTwo']}`,
        processId: requestIdentifier['domainProcessId']
      };

      // Show QR code first like domainRead does
      this.container.innerHTML = '';
      const title = document.createElement('h3');
      title.textContent = 'Loading Domain Credentials...';
      title.style.color = '#fff';
      title.style.marginBottom = '15px';
      this.container.appendChild(title);
      
      // Render QR code for authentication like domainRead
      qrRenderer(requestIdentifier.qrCode, this.container);

      // Poll for credentials using domainRead logic
      const credentials = await this.pollForCredentials();
      
      if (credentials && credentials.length > 0) {
        this.renderCredentialsDropdown(credentials);
      } else {
        this.displayNoCredentials();
      }
    } catch (error) {
      console.error('Error loading domain credentials:', error);
      this.displayError();
    }
  }

  async pollForCredentials() {
    const URL_POLL = `${BASE_API_URL}/api/credential-hub/domain/read/state`;
    const interval = 1800;
    const maxTries = 8;
    const { domain, requestIdentifier, hmac } = this.state;

    console.log('Delete polling state:', this.state);

    for (let attempt = 0; attempt < maxTries; attempt++) {
      try {
        const res = await fetch(URL_POLL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Extension-Auth': this.state['hmac']
          },
          body: JSON.stringify({
            domain: this.state['domain'],
            processId: this.state['processId'],
            iv: requestIdentifier.iv,
            type: 'extension'
          })
        });

        const data = await res.json();
        console.log('Delete polling response:', data);
        
        if (data.success) {   
          const availableCredentials = [];
          
          // Handle new response format with domainList array (EXACT same logic as domainRead)
          if (data.domainList && Array.isArray(data.domainList)) {
            data.domainList.forEach((item, index) => {
              if (data.process_check) { // Check process_check at root level
                const creds = typeof item.credential === 'string'
                  ? JSON.parse(item.credential)
                  : item.credential;
                availableCredentials.push({
                  key: index.toString(),
                  item: {
                    credential: item.credential,
                    description: item.description,
                    targetId: item.targetId,
                    publicId: data.publicId || null, // publicId might be at root level
                    process_check: data.process_check
                  },
                  creds: creds
                });
              }
            });
          } else {
            // Fallback to old format with numbered keys (EXACT same logic as domainRead)
            Object.keys(data).forEach((key) => {
                if (!isNaN(key)) { 
                  const item = data[key];
                  if(item.process_check) {
                    const creds = typeof item.credential === 'string'
                      ? JSON.parse(item.credential)
                      : item.credential;
                    availableCredentials.push({
                      key: key,
                      item: item,
                      creds: creds
                    });
                  }
                }
            });
          }

          // EXACT same logic as domainRead - if credentials found, return them
          if (availableCredentials.length > 0) {
            return availableCredentials;
          } else {
            // If no credentials, show polling process and CONTINUE looping (don't return)
            this.displayPoolProcess();
          }
        } else {
          console.log('No success in response, continuing polling...');
          this.displayPoolProcess();
        }
      } catch (e) {
        console.error('Delete polling error:', e);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.warn('Delete polling timed out');
    return null; // Timeout
  }

  renderCredentialsDropdown(credentials) {
    this.container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'Delete Domain Credential';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const select = document.createElement('select');
    select.style.padding = '8px';
    select.style.borderRadius = '4px';
    select.style.marginBottom = '10px';
    select.style.width = '100%';

    const placeholder = document.createElement('option');
    placeholder.textContent = 'Select credential to delete';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    credentials.forEach((credData, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${credData.creds.userName} - ${credData.item.description || 'No description'}`;
      option.title = credData.item.description;
      select.appendChild(option);
    });

    const warning = document.createElement('p');
    warning.textContent = 'This will permanently delete the selected credential. This action cannot be undone.';
    warning.style.color = '#ffc107';
    warning.style.marginBottom = '15px';
    warning.style.fontSize = '14px';

    const button = document.createElement('button');
    button.textContent = 'Delete Selected Credential';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#dc3545';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';

    button.addEventListener('click', () => {
      const selectedIndex = parseInt(select.value);
      if (!isNaN(selectedIndex) && selectedIndex >= 0) {
        const selectedCredential = credentials[selectedIndex];
        console.log('Selected credential for deletion:', selectedCredential);
        this.generateDeleteQrConfirmation(selectedCredential);
      } else {
        console.warn('No credential selected');
        alert('Please select a credential to delete.');
      }
    });

    this.container.append(title, select, warning, button);
  }

  displayNoCredentials() {
    this.container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'No Credentials Found';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'No credentials found for this domain.';
    msg.style.color = '#ffc107';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Refresh';
    retryBtn.style.padding = '8px 16px';
    retryBtn.style.backgroundColor = '#007bff';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.marginTop = '10px';

    retryBtn.addEventListener('click', () => {
      this.init();
    });

    this.container.append(title, msg, retryBtn);
  }

  displayError() {
    this.container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'Error Loading Credentials';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'Failed to load credentials for this domain.';
    msg.style.color = '#dc3545';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';
    retryBtn.style.padding = '8px 16px';
    retryBtn.style.backgroundColor = '#007bff';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.marginTop = '10px';

    retryBtn.addEventListener('click', () => {
      this.init();
    });

    this.container.append(title, msg, retryBtn);
  }

  displayPoolProcess() {
    let feedback = this.container.querySelector('.polling-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('polling-feedback');
      feedback.dataset.count = '5';
      feedback.textContent = '5';
      feedback.style.color = '#fff';
      feedback.style.marginTop = '10px';
      feedback.style.textAlign = 'center';
      this.container.append(feedback);
    } else {
      let count = parseInt(feedback.dataset.count, 10);
      if (count > 1) {
        count--;
        feedback.dataset.count = count.toString();
        feedback.textContent = count.toString();
      }
    }
  }

  async generateDeleteQrConfirmation(selectedCredential) {
    const storage = handleLocalStorage();
    let payload = { 
      type: 'delete-domain', 
      source: 'extension',
      domain: await getCurrentTabHost()
    };
    
    // Add the targetId of the selected credential
    if (selectedCredential.item.targetId) {
      payload.targetId = selectedCredential.item.targetId;
    }
    
    // Only add userPublicId if it exists and is not empty
    if (storage && storage.trim() !== "") {
      payload.userPublicId = storage;
    }

    const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, JSON.stringify(payload));

    qrRenderer(requestIdentifier['qrCode'], this.container);
    let response = await pollRegistrationState(
      requestIdentifier, 
      this.URL_POLL,
      this.container,
      'removeProcessId'
    );        
    if(response === false){
      this.displayTimeout();
    } else {
      this.displaySuccess();
    }   
  }

  displayTimeout() {
    this.container.innerHTML = '';

    const msg = document.createElement('p');
    msg.textContent = 'Login expired. Please try again.';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';

    retryBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
      const caller = new DomainDelete(this.container);
      caller.init();
    });

    this.container.append(msg, retryBtn);
  }

  displaySuccess(){
    this.container.innerHTML = `<p>Domain with its credentials: 'removed'</p>`;   
  }

}
