import { DomainShared } from '../shared/domainShared.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { handleLocalStorage } from '../../utils/handleLocalStorage.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { BASE_API_URL } from '../../config.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { pollRegistrationState } from '../../utils/pollRegistration.js';

export class DomainEdit {
  
  constructor(container) {
    this.container = container;
    this.state = {
      requestIdentifier: null,
      hmac: null,
      domain: null,
      processId: null
    };
    
    // URLs same as domainWrite
    this.URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/shared/registration/qr-identity`;
    this.URL_POLL = `${BASE_API_URL}/api/credential-hub/shared/registration/state`;
    this.payloadInputs = null; // Store payload like domainWrite
  }

  async init() {
    await this.loadDomainCredentials();
  }

  async loadDomainCredentials() {
    try {
      // Use shared initialization logic
      this.state = await DomainShared.initializeDomainRequest();

      // Check if user has publicId and fill it if available
      const userPublicId = handleLocalStorage();
      console.log('User publicId from local storage:', userPublicId);

      // Display QR code using shared utility
      DomainShared.displayQRCode(
        this.state.requestIdentifier.qrCode, 
        this.container, 
        'Loading Domain Credentials for Edit...'
      );

      // Poll for credentials using shared logic
      const credentials = await DomainShared.pollForCredentials(
        this.state,
        null, // no abort signal
        null  // no progress callback to prevent duplicate counters
      );
      
      if (credentials && credentials.length > 0) {
        this.renderCredentialsDropdown(credentials);
      } else {
        console.log('No credentials found for editing');
        this.container.innerHTML = '<h3>No credentials found to edit</h3>';
      }
    } catch (error) {
      console.error('Error loading domain credentials:', error);
      this.container.innerHTML = '<h3>Error loading credentials</h3>';
    }
  }

  renderCredentialsDropdown(availableCredentials) {
    this.container.innerHTML = '<h3>Select Credential to Edit</h3>';

    const dropdown = document.createElement('select');
    dropdown.style.width = '100%';
    dropdown.style.padding = '8px';
    dropdown.style.marginBottom = '10px';
    dropdown.style.fontSize = '14px';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a credential to edit...';
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
        console.log('Selected credential for edit:', {
          userName: selected.creds.userName,
          description: selected.item.description,
          targetId: selected.item.targetId,
          publicId: selected.item.publicId,
          fullCredential: selected.creds
        });
        
        // Show edit form with selected credential data
        this.renderEditForm(selected);
      }
    });

    this.container.appendChild(dropdown);
  }

  renderEditForm(selectedCredential) {
    // Clear container and add title
    this.container.innerHTML = '<h3>Edit Credential</h3>';

    // Create form container
    const form = document.createElement('div');
    form.style.marginTop = '20px';

    // Username field
    const userNameLabel = document.createElement('label');
    userNameLabel.textContent = 'Username:';
    userNameLabel.style.display = 'block';
    userNameLabel.style.marginBottom = '5px';
    userNameLabel.style.color = '#fff';

    const userNameInput = document.createElement('input');
    userNameInput.type = 'text';
    userNameInput.value = selectedCredential.creds.userName || '';
    userNameInput.style.width = '100%';
    userNameInput.style.padding = '8px';
    userNameInput.style.marginBottom = '15px';
    userNameInput.style.fontSize = '14px';

    // Password field
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password:';
    passwordLabel.style.display = 'block';
    passwordLabel.style.marginBottom = '5px';
    passwordLabel.style.color = '#fff';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.value = selectedCredential.creds.userPassword || '';
    passwordInput.style.width = '100%';
    passwordInput.style.padding = '8px';
    passwordInput.style.marginBottom = '15px';
    passwordInput.style.fontSize = '14px';

    // Description field
    const descriptionLabel = document.createElement('label');
    descriptionLabel.textContent = 'Description:';
    descriptionLabel.style.display = 'block';
    descriptionLabel.style.marginBottom = '5px';
    descriptionLabel.style.color = '#fff';

    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = selectedCredential.item.description || '';
    descriptionInput.style.width = '100%';
    descriptionInput.style.padding = '8px';
    descriptionInput.style.marginBottom = '15px';
    descriptionInput.style.fontSize = '14px';

    // Hidden field for targetId (readonly)
    const targetIdLabel = document.createElement('label');
    targetIdLabel.textContent = 'Target ID:';
    targetIdLabel.style.display = 'block';
    targetIdLabel.style.marginBottom = '5px';
    targetIdLabel.style.color = '#fff';

    const targetIdInput = document.createElement('input');
    targetIdInput.type = 'text';
    targetIdInput.value = selectedCredential.item.targetId || '';
    targetIdInput.readOnly = true;
    targetIdInput.style.width = '100%';
    targetIdInput.style.padding = '8px';
    targetIdInput.style.marginBottom = '15px';
    targetIdInput.style.fontSize = '14px';
    targetIdInput.style.backgroundColor = '#f5f5f5';
    targetIdInput.style.color = '#666';

    // Append all elements to form
    form.append(
      userNameLabel, userNameInput,
      passwordLabel, passwordInput, 
      descriptionLabel, descriptionInput,
      targetIdLabel, targetIdInput
    );

    // Add save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.style.padding = '10px 20px';
    saveButton.style.backgroundColor = '#007bff';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.marginTop = '10px';
    saveButton.style.fontSize = '14px';

    saveButton.addEventListener('click', async () => {
      const updatedCredential = {
        userName: userNameInput.value.trim(),
        userPassword: passwordInput.value.trim(),
        description: descriptionInput.value.trim(),
        targetId: targetIdInput.value.trim()
      };
      
      console.log('Saving updated credential:', updatedCredential);
      await this.saveCredentialUpdate(updatedCredential);
    });

    form.appendChild(saveButton);
    this.container.appendChild(form);
  }

  async saveCredentialUpdate(updatedCredential) {
    try {
      const domain = await getCurrentTabHost();
      const storage = handleLocalStorage() ?? "";

      // Create payload like domainWrite
      this.payloadInputs = JSON.stringify({
        domain,
        userName: updatedCredential.userName,
        userPassword: updatedCredential.userPassword,
        description: updatedCredential.description,
        type: 'registration-domain',
        source: 'extension',
        isNew: 'update',
        userPublicId: storage,
        targetId: updatedCredential.targetId
      });

     
      // Send to server like domainWrite
      await this.startUpdateRegistration();
      
    } catch (error) {
      console.error('Error saving credential update:', error);
    }
  }

  async startUpdateRegistration() {
    try {
      // Get QR code from server
      const requestIdentifier = await fetchIdentifier(this.URL_IDENTITY, this.payloadInputs);

      // Show QR code
      qrRenderer(requestIdentifier['qrCode'], this.container);
      
      // Poll for registration completion
      let response = await pollRegistrationState(
        requestIdentifier, 
        this.URL_POLL, 
        this.container, 
        'registrationProcessId'
      );

      if (response === false) {
        // Timeout occurred
        console.log('Update registration timed out');
        this.renderUpdateTimeout();
      } else {
        // Success
        console.log('Update registration successful');
        this.renderUpdateSuccess();
      }
      
    } catch (error) {
      console.error('Error during update registration:', error);
    }
  }

  renderUpdateTimeout() {
    this.container.innerHTML = `
      <h3 style="color: #fff;">Update Timeout</h3>
      <p style="color: #ffc107;">The update operation timed out. Please try again.</p>
      <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Try Again
      </button>
    `;
  }

  renderUpdateSuccess() {
    this.container.innerHTML = `
      <h3 style="color: #fff;">Update Successful</h3>
      <p style="color: #28a745;">Your credential has been updated successfully!</p>
      <button onclick="location.reload()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Done
      </button>
    `;
  }

}
