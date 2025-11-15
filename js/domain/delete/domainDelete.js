import { DomainRead } from '../login/domainRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { DomainShared } from '../shared/domainShared.js';
import { renderCredentialsDropdown } from './renderCredentialsDropdown.js';
import { renderNoCredentials, renderError, renderTimeout, renderSuccess } from './renderDeleteFeedback.js';
import { renderPollingProcess } from './renderPollingFeedback.js';

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

      // Show polling feedback once before starting polling
      renderPollingProcess(this.container);

      // Poll for credentials using shared logic - no callback to avoid duplicates
      const credentials = await DomainShared.pollForCredentials(
        this.state,
        null, // no abort signal
        null  // no progress callback to prevent duplicate counters
      );
      
      if (credentials && credentials.length > 0) {
        renderCredentialsDropdown(this.container, credentials, (selectedCredential) => {
          this.generateDeleteQrConfirmation(selectedCredential);
        });
      } else {
        renderNoCredentials(this.container, () => this.init());
      }
    } catch (error) {
      console.error('Error loading domain credentials:', error);
      renderError(this.container, () => this.init());
    }
  }

  async generateDeleteQrConfirmation(selectedCredential) {
    const storage = await handleLocalStorage();
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
      renderTimeout(this.container, () => {
        this.container.innerHTML = '';
        const caller = new DomainDelete(this.container);
        caller.init();
      });
    } else {
      renderSuccess(this.container, () => {
        this.container.innerHTML = '';
        const caller = new DomainDelete(this.container);
        caller.init();
      });
    }   
  }

}
