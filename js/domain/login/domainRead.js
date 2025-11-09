import { BASE_API_URL, SECURE_DEVICE } from '../../config.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { initVaultInteractions } from './initVaultInteractions.js';
import { getOutputCredentialsHTML } from '../../vault/login/getOutputCredentialsHTML.js';
import { renderPollingProcess } from './../../rendering/renderPollingProcess.js';
import { DomainShared } from '../shared/domainShared.js';

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
    try {
      this.state = await DomainShared.initializeDomainRequest();
      
      if(this.checkIsPublicIdExist()){
          this.autoLoginNotifier(this.state.requestIdentifier.qrCode, this.container, this.checkIsPublicIdExist());
      } 
      
      qrRenderer(this.state.requestIdentifier.qrCode, this.container);
    } catch (error) {
      console.error('Error initializing domain request:', error);
      return;
    }
  }

  checkIsPublicIdExist(){
      return DomainShared.checkIsPublicIdExist();
  }

async pollLoginState() {
  if (DomainRead.activeController) {
    DomainRead.activeController.abort();
  }

  this.pollController = new AbortController();
  DomainRead.activeController = this.pollController;
  const signal = this.pollController.signal;

  try {
    const availableCredentials = await DomainShared.pollForCredentials(
      this.state, 
      signal, 
      () => this.displayPoolProcess()
    );

    if (signal.aborted) {
      return;
    }

    if (!availableCredentials) {
      // Timeout occurred
      this.displayTimeout();
      this.stopPolling();
      return;
    }

    if (availableCredentials.length === 0) {
      this.displayPoolProcess();
    } else if (availableCredentials.length === 1) {
      // Single credential - auto-fill directly
      const { creds, item } = availableCredentials[0];
      console.log('Single credential found:', creds);
      this.autoFillCredentials(creds, item.publicId);
      this.displayCredentials(creds, item.description, item.targetId);
      // Stop polling completely
      this.stopPolling();
      return;
    } else {
      // Multiple credentials - show dropdown
      this.displayCredentialsDropdown(availableCredentials);
      // Stop polling completely
      this.stopPolling();
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Polling aborted');
      return;
    }
    console.error('Polling error:', error);
    this.displayTimeout();
    this.stopPolling();
  }
}

  stopPolling() {
    if (this.pollController) {
      this.pollController.abort();
      this.pollController = null;
    }
    if (DomainRead.activeController === this.pollController) {
      DomainRead.activeController = null;
    }
    console.log('Polling stopped');
  }

  autoLogin(credential){
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("start autoLogin");
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
              action: "fillLoginFields",
              password: credential.userPassword,
              previous:  credential.userName
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to content script:", chrome.runtime.lastError.message);
              // Try to inject content script if it's not available
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
              }).then(() => {
                // Retry sending message after injection
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "fillLoginFields",
                  password: credential.userPassword,
                  previous: credential.userName
                });
              }).catch(err => {
                console.error("Failed to inject content script:", err);
              });
            } else {
              console.log("Message sent successfully:", response);
            }
          });
        } else {
          console.error("No active tab found");
        }
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

  displayCredentialsDropdown(availableCredentials) {
    this.container.innerHTML = '<h3>Multiple Accounts Found</h3>';

    const dropdown = document.createElement('select');
    dropdown.style.width = '100%';
    dropdown.style.padding = '8px';
    dropdown.style.marginBottom = '10px';
    dropdown.style.fontSize = '14px';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an account...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    dropdown.appendChild(defaultOption);

    // Add options for each credential
    availableCredentials.forEach((credentialData, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${credentialData.creds.userName} - ${credentialData.item.description}`;
      dropdown.appendChild(option);
    });

    // Add event listener for selection
    dropdown.addEventListener('change', (event) => {
      const selectedIndex = parseInt(event.target.value);
      if (selectedIndex >= 0) {
        const selected = availableCredentials[selectedIndex];
        console.log('Selected credential:', selected.creds);
        this.autoFillCredentials(selected.creds, selected.item.publicId);
        this.displayCredentials(selected.creds, selected.item.description, selected.item.targetId);
      }
    });

    this.container.appendChild(dropdown);
  }

  autoFillCredentials(credentials, publicId){
      handleLocalStorage(publicId);
    
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
              action: "fillLoginFields",
              password: credentials.userPassword,
              previous:  credentials.userName
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to content script:", chrome.runtime.lastError.message);
              // Try to inject content script if it's not available
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content.js']
              }).then(() => {
                // Retry sending message after injection
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "fillLoginFields",
                  password: credentials.userPassword,
                  previous: credentials.userName
                });
              }).catch(err => {
                console.error("Failed to inject content script:", err);
              });
            } else {
              console.log("AutoFill message sent successfully:", response);
            }
          });
        } else {
          console.error("No active tab found for autofill");
        }
      });
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
