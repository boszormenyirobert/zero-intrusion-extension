import { BASE_API_URL } from '../../config.js';
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
    return JSON.stringify({
      application: document.getElementById('application_name').value.trim(),
      description: document.getElementById('application_description').value.trim(),
      userName: document.getElementById('application_username').value.trim(),
      userPassword: document.getElementById('application_password').value.trim(),
      type: "registration-application",
      source: "extension",
      isNew: "new"
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
    this.container.innerHTML = `<p>Registration process: 'success'</p>`;   
  }
}
