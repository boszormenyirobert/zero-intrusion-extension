import { VaultRead } from '../login/vaultRead.js';
import { BASE_API_URL } from '../../config.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from '../../utils/pollRegistration.js';

export class VaultEdit {

  URL_IDENTITY = null;
  URL_POLL = null;
  data = {
    'application': null,
    'userName': null,
    'userPassword': null,
    'description': null,
    'targetId': null
  };

  constructor(container) {
    this.container = container;

    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/vault/edit/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/vault/edit/state`;  
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
    placeholder.textContent = 'Select application to edit';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    appList.forEach(app => {
        const option = document.createElement('option');
        option.value = JSON.stringify(app);
        option.textContent = app.application;
        option.title = app.description;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        const selectedApp = JSON.parse(select.value);
        this.renderEditForm(selectedApp);
    });

    this.container.innerHTML = '';
    this.container.appendChild(select);
}

    renderEditForm(app) {
        this.container.innerHTML = '';

        const form = document.createElement('form');
        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.gap = '10px';

        const createInput = (labelText, value, id, type = 'text') => {
            const label = document.createElement('label');
            label.textContent = labelText;

            const input = document.createElement('input');
            input.type = type;
            input.value = value;
            input.id = id;
            input.style.padding = '8px';
            input.style.borderRadius = '4px';
            input.style.border = '1px solid #ccc';
            input.style.width = '100%';

            const wrapper = document.createElement('div');
            wrapper.append(label, input);
            return wrapper;
        };

        const userCred = JSON.parse(app.userCredential || '{}');

        const appInput = createInput('Application Name', app.application, 'app-name');
        const userInput = createInput('User Name', userCred.userName || '', 'app-username');
        const passInput = createInput('User Password', userCred.userPassword || '', 'app-password');
        const descInput = createInput('Description', app.description, 'app-desc');
        const idInput = createInput('', app.targetId, 'app-id', 'hidden');

        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.textContent = 'Submit';
        submitBtn.style.padding = '10px';
        submitBtn.style.borderRadius = '4px';
        submitBtn.style.backgroundColor = '#0055b9';
        submitBtn.style.color = '#fff';
        submitBtn.style.cursor = 'pointer';

        submitBtn.addEventListener('click', () => {
            const application = document.getElementById('app-name').value;
            const userName = document.getElementById('app-username').value;
            const userPassword = document.getElementById('app-password').value;
            const description = document.getElementById('app-desc').value;
            const targetId = document.getElementById('app-id').value;

            this.data.application = application;
            this.data.userName = userName;
            this.data.userPassword = userPassword;
            this.data.description = description;
            this.data.targetId = targetId;

             this.generateEditQrConfirmation();
        });

        form.append(appInput, userInput, passInput, descInput, idInput, submitBtn);
        this.container.appendChild(form);       
    }



    async generateEditQrConfirmation(){
        const storage = await handleLocalStorage();

        const payload = JSON.stringify({ 
            type: 'update-applications', 
            source: 'extension', 
            application:this.data.application,
            userName:this.data.userName,
            userPassword:this.data.userPassword,
            description:this.data.description,
            targetId:this.data.targetId,
            userPublicId: storage
        });
        const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, payload);

        qrRenderer(requestIdentifier.qrCode, this.container);
        let response = await pollRegistrationState(
            requestIdentifier, 
            this.URL_POLL,
            this.container,
            'registrationProcessId'
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
    this.container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Application Updated Successfully';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'Your application credentials have been successfully updated in the vault.';
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
    });

    this.container.append(successIcon, title, message, closeBtn);
  }

}