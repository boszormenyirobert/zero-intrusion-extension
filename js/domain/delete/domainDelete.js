import { DomainRead } from '../login/domainRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { DomainShared } from '../shared/domainShared.js';

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
    try {
      // Use shared initialization logic
      this.state = await DomainShared.initializeDomainRequest();

      // Display QR code using shared utility
      DomainShared.displayQRCode(
        this.state.requestIdentifier.qrCode, 
        this.container, 
        'Loading Domain Credentials...'
      );

      // Poll for credentials using shared logic
      const credentials = await DomainShared.pollForCredentials(
        this.state,
        null, // no abort signal
        () => this.displayPoolProcess()
      );
      
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
    this.container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Credential Deleted Successfully';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'The selected domain credential has been permanently removed from your vault.';
    message.style.color = '#fff';
    message.style.textAlign = 'center';
    message.style.marginBottom = '20px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '10px 20px';
    closeBtn.style.backgroundColor = '#007bff';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'block';
    closeBtn.style.margin = '0 auto';

    closeBtn.addEventListener('click', () => {
      // Optionally restart the delete process or close the interface
      this.container.innerHTML = '';
      const caller = new DomainDelete(this.container);
      caller.init();
    });

    this.container.append(successIcon, title, message, closeBtn);
  }

}
