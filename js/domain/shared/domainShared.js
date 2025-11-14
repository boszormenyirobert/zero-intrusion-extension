import { BASE_API_URL } from '../../config.js';
import { qrRenderer } from '../../utils/renderQR.js';
import { getCurrentTabHost } from '../../utils/tabChanges.js';
import { fetchIdentifier } from '../../utils/fetchIdentifier.js';
import { handleLocalStorage, setPublicId } from '../../utils/handleLocalStorage.js';

/**
 * Shared utilities for domain credential operations
 */
export class DomainShared {
  
  static URL_IDENTITY = `${BASE_API_URL}/api/credential-hub/domain/read/qr-identity`;
  static URL_POLL = `${BASE_API_URL}/api/credential-hub/domain/read/state`;

  /**
   * Initialize domain credential request and get requestIdentifier
   * @returns {Object} Object containing domain, requestIdentifier, hmac, processId
   */
  static async initializeDomainRequest() {
    const domain = await getCurrentTabHost();
    const storage = handleLocalStorage();
    let payload = {};

    if(storage){
        console.log(handleLocalStorage());
        payload = { domain, userPublicId: await handleLocalStorage() }
    } else {
        payload = { domain, userPublicId: "" };
    }

    const requestIdentifier = await fetchIdentifier(
      DomainShared.URL_IDENTITY,
      JSON.stringify(payload)
    );

    if (!requestIdentifier?.domainProcessId) {
      console.error('domainProcessId not found.');
      throw new Error('domainProcessId not found');
    }

    return {
      domain,
      requestIdentifier,
      hmac: `HMAC ${requestIdentifier['xExtensionAuthTwo']}`,
      processId: requestIdentifier['domainProcessId']
    };
  }

  /**
   * Poll for domain credentials with common logic
   * @param {Object} state - The state object containing domain, requestIdentifier, hmac, processId
   * @param {AbortSignal} signal - Optional abort signal for cancelling polling
   * @param {Function} progressCallback - Optional callback for polling progress updates
   * @returns {Array} Array of available credentials
   */
  static async pollForCredentials(state, signal = null, progressCallback = null) {
    const interval = 1800;
    const maxTries = 8;
    const { domain, requestIdentifier, hmac } = state;

    console.log('Polling state:', state);

    for (let attempt = 0; attempt < maxTries; attempt++) {
      // Check if polling was aborted before each attempt
      if (signal && signal.aborted) {
        console.warn('Polling was aborted, stopping loop');
        return null;
      }

      try {
        const res = await fetch(DomainShared.URL_POLL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Extension-Auth': state.hmac
          },
          body: JSON.stringify({
            domain: state.domain,
            processId: state.processId,
            iv: requestIdentifier.iv,
            type: 'extension'
          }),
          ...(signal && { signal })
        });

        const data = await res.json();
        
        const oneTouchUsers = JSON.parse(localStorage.getItem('oneTouchUsers')) || [];
        for (let i = 0; i < oneTouchUsers.length; i++) {
          if (data?.email && oneTouchUsers[i].email === data.email) {
          oneTouchUsers[i].userPublicId = data.publicId;        
          }
        }
        localStorage.setItem('oneTouchUsers', JSON.stringify(oneTouchUsers));
        
        if (data.success) {   
          const availableCredentials = [];
          
          // Handle new response format with domainList array
          if (data.domainList && Array.isArray(data.domainList)) {
            data.domainList.forEach((item, index) => {
              if (data.process_check) { // Check process_check at root level
                const creds = typeof item.credential === 'string'
                  ? JSON.parse(item.credential)
                  : item.credential;
                availableCredentials.push({
                  key: index.toString(),
                  item: {
                    credential: item.credential,
                    description: item.description,
                    targetId: item.targetId,
                    publicId: data.publicId || null, // publicId might be at root level
                    process_check: data.process_check
                  },
                  creds: creds
                });
              }
            });
          } else {
            // Fallback to old format with numbered keys
            Object.keys(data).forEach((key) => {
                if (!isNaN(key)) { 
                  const item = data[key];
                  if(item.process_check) {
                    const creds = typeof item.credential === 'string'
                      ? JSON.parse(item.credential)
                      : item.credential;
                    availableCredentials.push({
                      key: key,
                      item: item,
                      creds: creds
                    });
                  }
                }
            });
          }

          // If credentials found, return them
          if (availableCredentials.length > 0) {
            return availableCredentials;
          } else {
            // If no credentials, notify progress and continue looping
            if (progressCallback) {
              progressCallback();
            }
          }
        } else {
          console.log('No success in response, continuing polling...');
          if (progressCallback) {
            progressCallback();
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          console.warn('Polling aborted');
          return null;
        }
        console.error('Polling error:', e);
      }

      // Check again before waiting to avoid unnecessary delay
      if (signal && signal.aborted) {
        console.warn('Polling was aborted during iteration, stopping');
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.warn('Polling timed out');
    return null; // Timeout
  }

  /**
   * Display QR code for domain authentication
   * @param {string} qrCode - The QR code data
   * @param {HTMLElement} container - Container element to render into
   * @param {string} title - Optional title text
   */
  static displayQRCode(qrCode, container, title = 'Loading Domain Credentials...') {
    container.innerHTML = '';
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.color = '#fff';
    titleElement.style.marginBottom = '15px';
    container.appendChild(titleElement);
    
    qrRenderer(qrCode, container);
  }

  /**
   * Check if user has a stored public ID
   * @returns {boolean} True if public ID exists
   */
  static checkIsPublicIdExist() {
    return handleLocalStorage() ? true : false;
  }
}