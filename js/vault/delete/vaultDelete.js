import { VaultRead } from '../login/vaultRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from './../../utils/pollRegistration.js';

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
        const vaultInstance = new VaultRead(this.container, 'dd');
        await vaultInstance.init();
        const apps = await vaultInstance.getApplicationList();
        if (apps && apps.length > 0) {
            this.renderDropdown(apps);
        } else {
            this.displayNoCredentials();
        }
    }

    renderDropdown(appList) {
        this.container.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = 'Delete Vault Application';
        title.style.color = '#fff';
        title.style.marginBottom = '15px';

        const select = document.createElement('select');
        select.style.padding = '8px';
        select.style.borderRadius = '4px';
        select.style.marginBottom = '10px';
        select.style.width = '100%';

        const placeholder = document.createElement('option');
        placeholder.textContent = 'Select application to delete';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        appList.forEach(app => {
            const option = document.createElement('option');
            option.value = app.targetId;
            option.textContent = app.application;
            option.title = app.description;
            select.appendChild(option);
        });

        const warning = document.createElement('p');
        warning.textContent = 'This will permanently delete the selected application. This action cannot be undone.';
        warning.style.color = '#ffc107';
        warning.style.marginBottom = '15px';
        warning.style.fontSize = '14px';

        const button = document.createElement('button');
        button.textContent = 'Delete Selected Application';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#dc3545';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.width = '100%';

        button.addEventListener('click', () => {
            const selectedValue = select.value;
            if (selectedValue && select.selectedIndex !== 0) {
                console.log('Selected targetId:', selectedValue);
                this.generateDeleteQrConfirmation(selectedValue);
            } else {
                console.warn('No application selected');
                alert('Please select an application to delete.');
            }
        });

        this.container.append(title, select, warning, button);
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
                this.displayTimeout();
            } else {
                this.displaySuccess();
            }   
    }

    displayNoCredentials() {
        this.container.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = 'No Applications Found';
        title.style.color = '#fff';
        title.style.marginBottom = '15px';

        const msg = document.createElement('p');
        msg.textContent = 'No applications found in vault.';
        msg.style.color = '#ffc107';

        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Refresh';
        retryBtn.style.padding = '8px 16px';
        retryBtn.style.backgroundColor = '#007bff';
        retryBtn.style.color = 'white';
        retryBtn.style.border = 'none';
        retryBtn.style.borderRadius = '4px';
        retryBtn.style.cursor = 'pointer';
        retryBtn.style.marginTop = '10px';

        retryBtn.addEventListener('click', () => {
            this.init();
        });

        this.container.append(title, msg, retryBtn);
    }

    displayError() {
        this.container.innerHTML = '';
        
        const title = document.createElement('h3');
        title.textContent = 'Error Loading Applications';
        title.style.color = '#fff';
        title.style.marginBottom = '15px';

        const msg = document.createElement('p');
        msg.textContent = 'Failed to load applications from vault.';
        msg.style.color = '#dc3545';

        const retryBtn = document.createElement('button');
        retryBtn.textContent = 'Retry';
        retryBtn.style.padding = '8px 16px';
        retryBtn.style.backgroundColor = '#007bff';
        retryBtn.style.color = 'white';
        retryBtn.style.border = 'none';
        retryBtn.style.borderRadius = '4px';
        retryBtn.style.cursor = 'pointer';
        retryBtn.style.marginTop = '10px';

        retryBtn.addEventListener('click', () => {
            this.init();
        });

        this.container.append(title, msg, retryBtn);
    }

  displayTimeout() {
    this.container.innerHTML = '';

    const msg = document.createElement('p');
    msg.textContent = 'Login expired. Please try again.';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';

    retryBtn.addEventListener('click', () => {
      this.container.innerHTML = '';
      const caller = new VaultDelete(this.container);
      caller.init();
    });

    this.container.append(msg, retryBtn);
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