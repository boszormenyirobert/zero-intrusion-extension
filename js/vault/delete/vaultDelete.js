import { VaultRead } from '../login/vaultRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';
import { renderDropdown } from './renderApplicationDropdown.js';
import { displayNoCredentials, displayError } from './renderVaultErrorFeedback.js';
import { displayTimeout } from './renderVaultTimeout.js';

export class VaultDelete {

  URL_IDENTITY = null;
  URL_POLL = null;

  constructor(container) {
    this.container = container;
    this.state = {
      requestIdentifier: null,
      hmac: null,
      processId: null
    };

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/vault/delete/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/vault/delete/state`;  
  }

    async init() {
        try {
            const vaultInstance = new VaultRead(this.container, 'dd');
            await vaultInstance.init();
            const apps = await vaultInstance.getApplicationList();
            if (apps && apps.length > 0) {
                renderDropdown(this.container, apps, (targetId) => {
                    this.generateDeleteQrConfirmation(targetId);
                });
            } else {
                displayNoCredentials(this.container, () => this.init());
            }
        } catch (error) {
            console.error('Error initializing vault delete:', error);
            displayError(this.container, () => this.init());
        }
    }

    async generateDeleteQrConfirmation(targetId){
        const storage = handleLocalStorage();

        const payload = JSON.stringify({ 
          type: 'delete-applications', 
          source: 'extension', 
          targetId: targetId, 
          userPublicId: storage 
        });
        const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, payload);

        qrRenderer(requestIdentifier.qrCode, this.container);
        let response = await pollRegistrationState(
            requestIdentifier, 
            this.URL_POLL,
            this.container,
            'removeProcessId'
        );        
            if(response === false){
                displayTimeout(this.container, () => {
                    const caller = new VaultDelete(this.container);
                    caller.init();
                });
            } else {
                this.displaySuccess();
            }   
    }

  displaySuccess(){
    this.container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Application Deleted Successfully';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'The selected application has been permanently removed from your vault.';
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
      this.container.innerHTML = '';
      const caller = new VaultDelete(this.container);
      caller.init();
    });

    this.container.append(successIcon, title, message, closeBtn);
  }

}