import { BASE_API_URL } from '../../config.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { renderDelete } from '../../rendering/renderDelete.js';

export class DomainDelete {
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

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/domain/delete/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/domain/delete/state`;    
  }

  async init() {
    await this.detectDomainChanges();
    this.renderForm();
  }

  renderForm() {
    this.container.innerHTML = renderDelete();
    this.container.querySelector('#deleteDomain').addEventListener('click', async () => {
    await this.startRegistration();
    });
  }

  async startRegistration() {
    const payloadInputs = await this.getWebDeletePayload();
    const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, payloadInputs);

    qrRenderer(requestIdentifier['qrCode'], this.container);
    let response = await pollRegistrationState(
      requestIdentifier, 
      this.URL_POLL,
      this.container,
      'removeProcessId'
    );   
    this.container.innerHTML = `<p>Registration process: ${response === true ? 'success' : 'unsuccess'}</p>`;   

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

  async getWebDeletePayload() {
    const domain = await getCurrentTabHost();

    return JSON.stringify({
      domain,
      type: 'delete-domain',
      source: 'extension'
    });
  }


  displayTimeout() {
    this.container.innerHTML = '';

    const msg = document.createElement('p');
    msg.textContent = 'Login expired. Please try again.';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';

    retryBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
      const caller = new DomainWrite(this.container);
      caller.init();
    });

    this.container.append(msg, retryBtn);
  }

    displaySuccess(){
      this.container.innerHTML = `<p>Domain with its credentials: 'removed'</p>`;   
    }    
}
