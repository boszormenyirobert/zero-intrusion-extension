import { BASE_API_URL } from '../../config.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { renderInputFieldsDomain } from '../../rendering/renderInputFieldsDomain.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { renderTimeout, renderSuccess } from './renderDomainWriteFeedback.js';

export class DomainWrite {
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
    this.container.innerHTML = renderInputFieldsDomain();
    this.container.querySelector('#startRegistration').addEventListener('click', async () => {
    await this.startRegistration();
    });
  }
  payloadInputs = null;
  async startRegistration() {  
    if(!!this.payloadInputs === false){
      this.payloadInputs = await this.getWebRegistrationPayload();
    }
    const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, this.payloadInputs);

    qrRenderer(requestIdentifier['qrCode'], this.container);
    let response = await pollRegistrationState
    (
      requestIdentifier, 
      this.URL_POLL, 
      this.container, 
      'registrationProcessId'
    )

    if(response === false){
        renderTimeout(this.container, () => {
            this.container.innerHTML = '';
            this.startRegistration();
        });
    } else {
        renderSuccess(this.container);
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

  async getWebRegistrationPayload() {
    const domain = await getCurrentTabHost();
    const username = this.container.querySelector('#username').value.trim();
    const password = this.container.querySelector('#password').value.trim();
    const description = this.container.querySelector('#description').value.trim();
    const storage = await handleLocalStorage();

    return JSON.stringify({
      domain,
      userName: username,
      userPassword: password,
      description: description,
      type: 'registration-domain',
      source: 'extension',
      isNew: 'new',
      userPublicId: storage
    });
  }

}
