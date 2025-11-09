import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from '../../utils/pollRegistration.js';
import { renderInputFieldsVault } from './../../rendering/renderInputFieldsVault.js';

export class VaultWrite {
  static activeController = null;

  URL_IDENTITY = null;
  URL_POLL = null;
  pollController = null;

  constructor(container) {
    this.container = container;
    this.state = {
      requestIdentifier: null,
      hmac: null,
      domain: null
    };

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/shared/registration/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/shared/registration/state`;    
  }

  async init() {
    await this.detectDomainChanges();
    this.renderForm();
  }

  renderForm() {
    this.container.innerHTML = renderInputFieldsVault();
    this.container.querySelector('#startRegistration').addEventListener('click', async () => {
    await this.startRegistration();
    });
  }

  payloadInputs = null;
  async startRegistration() {
    if(!!this.payloadInputs === false){
      this.payloadInputs = await this.getVaultRegistrationPayload();
    }
    const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, this.payloadInputs);

    qrRenderer(requestIdentifier['qrCode'], this.container);
    let response = await pollRegistrationState(
      requestIdentifier, 
      this.URL_POLL, 
      this.container,
      'registrationProcessId'
    );   
        if(response === false){
        this.displayTimeout();
    } else {
        this.displaySuccess();
    }  
  }

  async detectDomainChanges() {
    chrome.tabs.onActivated.addListener(() => this.checkDomainChangeAndRestartIfNeeded());
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (tab.active && changeInfo.url) this.checkDomainChangeAndRestartIfNeeded();
    });
  }

  async checkDomainChangeAndRestartIfNeeded() {
    const newDomain = await getCurrentTabHost().catch(() => null);
    if (
      this.state.requestIdentifier &&
      this.state.domain &&
      newDomain &&
      this.state.domain !== newDomain
    ) {
      console.warn('Domain changed. Restarting login...');
    }
  }

  async getVaultRegistrationPayload() {
    const storage = handleLocalStorage();

    return JSON.stringify({
      application: document.getElementById('application_name').value.trim(),
      description: document.getElementById('application_description').value.trim(),
      userName: document.getElementById('application_username').value.trim(),
      userPassword: document.getElementById('application_password').value.trim(),
      type: "registration-application",
      source: "extension",
      isNew: "new",
      userPublicId: storage
    });
  }

   displayTimeout() {
      this.container.innerHTML = '';

      const feedback = document.createElement('div');
      feedback.innerHTML = "Handy verification is missing.";
      
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Show my QR code';

      retryBtn.addEventListener('click', () => {
        this.container.innerHTML = '';
        this.startRegistration();
      });

      this.container.append(feedback, retryBtn);
  }  

  displaySuccess(){
    this.container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Registration Successful';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'Your credentials have been successfully registered and saved to the vault.';
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
      // Close or restart the interface
      this.container.innerHTML = '';
    });

    this.container.append(successIcon, title, message, closeBtn);
  }
}
