import { BASE_API_URL, SECURE_DEVICE } from '../../config.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { initVaultInteractions } from './initVaultInteractions.js';
import { getOutputCredentialsHTML } from '../../vault/login/getOutputCredentialsHTML.js';
import { renderPollingProcess } from './../../rendering/renderPollingProcess.js';

export class DomainRead {
  static activeController = null;

  URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/domain/read/qr-identity`;
  URL_POLL = `${BASE_API_URL}/api/credential-hub/domain/read/state`;
  pollController = null;

  constructor(container) {
    this.container = container;
    this.state = {
      requestIdentifier: null,
      hmac: null,
      domain: null,
      processId: null
    };
  }

  async init() {
    await this.detectDomainChanges();
    await this.render();
    await this.pollLoginState();
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

  async render() {
    const domain = await getCurrentTabHost();
    const storage = this.handleLocalStorage();
    let payload = {};

    if(storage){
        console.log(this.handleLocalStorage());
        payload = { domain, userPublicId:this.handleLocalStorage()}
    } else {
        payload = { domain, userPublicId:"" };
    }

      const requestIdentifier = await fetchIdentifier(
        this.URL_IDENTITY,
        JSON.stringify(payload)
      );


    if (!requestIdentifier?.domainProcessId) {
      console.error('domainProcessId not found.');
      return;
    }

    this.state = {
      domain,
      requestIdentifier,
      hmac:  `HMAC ${requestIdentifier['xExtensionAuthTwo']}`,
      processId: requestIdentifier['domainProcessId']
    };
    
    if(this.checkIsPublicIdExist()){
        this.autoLoginNotifier(requestIdentifier.qrCode, this.container, this.checkIsPublicIdExist());
    } 
    
    qrRenderer(requestIdentifier.qrCode, this.container);    
  }

  checkIsPublicIdExist(){
      return this.handleLocalStorage() ? true : false;
  }

async pollLoginState() {
  if (DomainRead.activeController) {
    DomainRead.activeController.abort();
  }

  this.pollController = new AbortController();
  DomainRead.activeController = this.pollController;
  const signal = this.pollController.signal;

  const interval = 1800; 
  const maxTries = 8;
  const { domain, requestIdentifier, hmac } = this.state;

  console.log(this.state);

  for (let attempt = 0; attempt < maxTries; attempt++) {
    try {
      const res = await fetch(this.URL_POLL, {
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
        }),
        signal
      });

      const data = await res.json();
      if (data.success) {        
        if (data.success && data.process_check) {
          const creds = typeof data.credential === 'string'
            ? JSON.parse(data.credential)
            : data.credential;
          this.autoFillCredentials(creds, data.publicId);
          this.displayCredentials(creds, data.description, data.targetId);
          return;
        } else {
          this.displayPoolProcess();
        }
      } else {
        console.warn('Polling returned non-ok response:', res.status);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn('Polling aborted');
        return;
      }
      console.error('Polling error:', e);
    }

    // Fix 1 másodperces várakozás minden iteráció végén
    await new Promise(res => setTimeout(res, interval));
  }

  this.displayTimeout();
}

  autoLogin(credential){
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("start autoLogin");
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "fillLoginFields",
            password: credential.userPassword,
            previous:  credential.userName
        });
    });
  }

  displayCredentials(credentials, description = null, targetId) {
    this.container.innerHTML = '<h3>Login Data</h3>';

    const details = document.createElement('div');
    this.autoLogin(credentials);
    details.innerHTML = getOutputCredentialsHTML(credentials, description, targetId);
    this.container.appendChild(details);
    initVaultInteractions(details);
  }

  autoFillCredentials(credentials, publicId){
      this.handleLocalStorage(publicId);
    
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "fillLoginFields",
            password: credentials.userPassword,
            previous:  credentials.userName
        });
      });
  }

  handleLocalStorage(publicId = ""){
    if ("userPublicId" in localStorage) {
      console.log("secure device found");
      return localStorage.getItem("userPublicId");
    }
      console.log("unsecure device found"); 
      if(SECURE_DEVICE && publicId != ""){
          localStorage.setItem("userPublicId", publicId);
          console.log("user settings device is secure, saving publicId to localStorage"); 
          return localStorage.getItem("userPublicId");
      }     
      return "";
  }

  displayPoolProcess() {
    let feedback = this.container.querySelector('.polling-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('polling-feedback');
      feedback.dataset.count = '5';
      feedback.textContent = '5';
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

  displayTimeout() {
    this.container.innerHTML = '';

    const feedback = document.createElement('div');
    feedback.innerHTML = renderPollingProcess('domain_missing');

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Show my QR code';

    retryBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
      const caller = new DomainRead(this.container);
      caller.init();
    });

    this.container.append(feedback, retryBtn);
  }

  autoLoginNotifier(qrCode, container, publicId){
    
  }  
}
