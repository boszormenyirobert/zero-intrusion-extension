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

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/vault/delete/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/vault/delete/state`;  
    };

    async init() {
            const vaultInstance = new VaultRead(this.container, 'dd');
            await vaultInstance.init();
            const apps = await vaultInstance.getApplicationList();
            this.renderDropdown(apps);
    }

    renderDropdown(appList) {
        const select = document.createElement('select');
        select.style.padding = '8px';
        select.style.borderRadius = '4px';
        select.style.marginRight = '0px';
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

        const button = document.createElement('button');
        button.textContent = 'Delete';
        button.style.padding = '8px 12px';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            const selectedValue = select.value;
            if (selectedValue && select.selectedIndex !== 0) {
                console.log('Selected targetId:', selectedValue);
                this.generateDeleteQrConfirmation(selectedValue);
            } else {
                console.warn('No application selected');
            }
        });

        this.container.innerHTML = '';
        this.container.append(select, button);
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