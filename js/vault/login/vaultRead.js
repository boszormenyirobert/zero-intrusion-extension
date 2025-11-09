import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { getOutputCredentialsHTML } from './getOutputCredentialsHTML.js';
import { eyeAndCopy } from './eyeAndCopy.js';
import { renderPollingProcess } from './../../rendering/renderPollingProcess.js';

export class VaultRead {
  static activeController = null;

  URL_IDENTITY = null;
  URL_POLL = null;
  pollController = null;

  constructor(container, mode = 'list') {
    this.container = container;
    this.mode = mode; // list or dd
    this.state = {
      requestIdentifier: null,
      hmac: null,
      domain: null,
      processId: null,
      applicationList: null
    };

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/vault/read/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/vault/read/state`;    
  }

  async getApplicationList(){
    return this.state.applicationList;
  }

  async init() {
    await this.renderApplicationList();
  }

  async checkDomainChangeAndRestartIfNeeded() {
    const newDomain = await getCurrentTabHost().catch(() => null);
    if (
      this.state.requestIdentifier &&
      this.state.iv &&
      newDomain &&
      this.state.domain !== newDomain
    ) {
      console.warn('Domain changed. Restarting login...');
    }
  }

  async renderApplicationList() {
    const storage = handleLocalStorage();
    let payload = { type: 'applications', source: 'extension' };
    
    // Only add userPublicId if it exists and is not empty
    if (storage && storage.trim() !== "") {
      console.log("Adding userPublicId to vault payload:", storage);
      payload.userPublicId = storage;
    } else {
      console.log("No valid userPublicId found for vault, sending payload without it");
    }

    const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, JSON.stringify(payload));

    qrRenderer(requestIdentifier.qrCode, this.container);

    this.state = {
      requestIdentifier,
      hmac:  `HMAC ${requestIdentifier['xExtensionAuthTwo']}`,
      processId: requestIdentifier['applicationProcessId']
    };

    return await this.pollGetApplicationList(requestIdentifier);
  }

async pollGetApplicationList(requestIdentifier) {
  if (VaultRead.activeController) {
    VaultRead.activeController.abort();
  }

  this.pollController = new AbortController();
  VaultRead.activeController = this.pollController;
  const signal = this.pollController.signal;

  const interval = 1800;
  const maxTries = 8;
  
  for (let attempt = 0; attempt < maxTries; attempt++) {
    // Check if polling was aborted before each attempt
    if (signal.aborted) {
      console.warn('Polling was aborted, stopping loop');
      return;
    }

    try {
      const res = await fetch(this.URL_POLL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Auth': this.state['hmac']
        },
        body: JSON.stringify({
          processId: this.state['processId'],
          iv: requestIdentifier.iv,
          type: 'extension'
        }),
        signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.applicationList) {
          // Check if applicationList is empty
          if (data.applicationList.length === 0) {
            this.displayEmptyVault();
            this.stopPolling();
            return [];
          }
          
          if(this.mode === 'list'){
            this.renderApplications(data.applicationList);
          }
          this.state.applicationList = data.applicationList;
          // Stop polling completely
          this.stopPolling();
          return data.applicationList;
        } else {
          this.displayPoolProcess('vault');
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

    // Check again before waiting to avoid unnecessary delay
    if (signal.aborted) {
      console.warn('Polling was aborted during iteration, stopping');
      return;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.warn('Polling timed out - no credentials received. New QR generated');
  this.displayTimeout();
  this.stopPolling();
}

  stopPolling() {
    if (this.pollController) {
      this.pollController.abort();
      this.pollController = null;
    }
    if (VaultRead.activeController === this.pollController) {
      VaultRead.activeController = null;
    }
    console.log('Vault polling stopped');
  }

  renderApplications(appList) {
    this.container.innerHTML = '';

    const title = document.createElement('h2');
    title.style.display = 'none';
    title.style.color = '#fff';
    this.container.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.textContent = '🔙 Back to list';
    Object.assign(backBtn.style, {
      display: 'none',
      marginBottom: '10px',
      padding: '5px 10px',
      backgroundColor: '#fff',
      color: '#000',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => {
      Array.from(this.container.children).forEach(child => {
        if (child.id && child.id.startsWith('application_')) child.style.display = 'block';
      });
      title.style.display = 'none';
      backBtn.style.display = 'none';
      this.container.style.overflowY = 'visible';
    });

    this.container.appendChild(backBtn);

    appList.forEach((app, i) => {
      const credentials = JSON.parse(app.userCredential);
      const wrapper = this.createApplicationWrapper(app, credentials, i);
      this.container.appendChild(wrapper);
    });
  }

  createApplicationWrapper(application, credentials, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'container-vault';
    wrapper.id = `application_${index}`;
    wrapper.style.cssText = `
        margin: 0;
        padding: 10px;
        background-color: ${index % 2 === 0 ? '#004c99' : '#0073e6'};
      `;

    const name = document.createElement('p');
    Object.assign(name.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: '1',
      margin: '0',
      fontWeight: 'bold',
      height: '20px',
      cursor: 'pointer',
      color: 'rgba(244, 244, 244, 0.957)'
    });
    name.title = 'Show credentials';
    name.textContent = application.application;

    const lockIcon = this.createIcon('eye-icon', '🛡️');
    name.appendChild(lockIcon);

    const details = this.createDetails(credentials, application.description);
    details.style.display = 'none';

    
    name.addEventListener('click', () => {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      this.singleApplication(isHidden, wrapper.id, application);
    });
 
    wrapper.appendChild(name);
    wrapper.appendChild(details);
    eyeAndCopy(details);

    return wrapper;
  }

  createIcon(className, iconText) {
    const icon = document.createElement('span');
    icon.className = `icon ${className}`;
    icon.style.color = '#fff';
    icon.textContent = iconText;
    return icon;
  }

  createDetails(credentials, description) {
    const details = document.createElement('div');
    details.className = 'web-credentials';
    details.innerHTML = getOutputCredentialsHTML(credentials, description);
    
    eyeAndCopy(details);

    return details;
  }

  singleApplication(showDetails, clickedApplicationId, application) {
    const collectionContainer = this.container;
    const item = document.querySelector(`#${clickedApplicationId} > p`);
    const title = collectionContainer.querySelector('h2');

    if (showDetails) {
      const oldIcon = item.querySelector('.eye-icon');
      if (oldIcon) oldIcon.remove();

      const mouseIcon = this.createIcon('mouse-icon', '↩️');
      mouseIcon.style.fontSize ='18px';
      Object.assign(mouseIcon.style, { marginLeft: 'auto', position: 'relative' });
      item.appendChild(mouseIcon);

      Array.from(collectionContainer.children).forEach(child => {
        if (child.id && child.id !== clickedApplicationId) child.style.display = 'none';
      });

      title.style.display = 'block';
      title.textContent = application.application;

      collectionContainer.style.overflowY = 'hidden';
    } else {
      const mouseIcon = item.querySelector('.mouse-icon');
      if (mouseIcon) mouseIcon.remove();

      if (!item.querySelector('.eye-icon')) {
        const lockIcon = this.createIcon('eye-icon', '🛡️');
        item.appendChild(lockIcon);
      }

      Array.from(collectionContainer.children).forEach(child => {
        if (child.id && child.id.startsWith('application_')) child.style.display = 'block';
      });

      title.style.display = 'none';
      collectionContainer.style.overflowY = 'visible';
    }
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
  
  displayEmptyVault() {
    this.container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'No Applications Found';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'Your vault is empty. No applications have been saved yet.';
    msg.style.color = '#ffc107';
    msg.style.marginBottom = '15px';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Refresh';
    retryBtn.style.padding = '8px 16px';
    retryBtn.style.backgroundColor = '#007bff';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.marginRight = '10px';

    retryBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
      const caller = new VaultRead(this.container, this.mode);
      caller.init();
    });

    this.container.append(title, msg, retryBtn);
  }

  displayTimeout() {
      this.container.innerHTML = '';
  
      const feedback = document.createElement('div');
      feedback.innerHTML = renderPollingProcess('vault_missing');
      
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Show my QR code';
  
      retryBtn.addEventListener('click', () => {
        this.container.innerHTML = '';
        const caller = new VaultRead(this.container);
        caller.init();
      });
  
      this.container.append(feedback, retryBtn);
  }
  
}
