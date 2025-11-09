import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { renderApplications } from './renderApplications.js';
import { renderEmptyVault, renderTimeout } from './renderVaultFeedback.js';
import { renderPollingProcess as renderVaultPolling } from './renderVaultPolling.js';

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
            renderEmptyVault(this.container, this.mode, () => {
              const caller = new VaultRead(this.container, this.mode);
              caller.init();
            });
            this.stopPolling();
            return [];
          }
          
          if(this.mode === 'list'){
            renderApplications(this.container, data.applicationList);
          }
          this.state.applicationList = data.applicationList;
          // Stop polling completely
          this.stopPolling();
          return data.applicationList;
        } else {
          renderVaultPolling(this.container, 'vault');
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
  renderTimeout(this.container, this.mode, () => {
    const caller = new VaultRead(this.container, this.mode);
    caller.init();
  });
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

}