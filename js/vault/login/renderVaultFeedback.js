/**
 * Renders feedback messages for vault read operations
 */

/**
 * Display when vault is empty
 */
export function renderEmptyVault(container, mode, onRefreshCallback) {
    container.innerHTML = '';

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

    retryBtn.addEventListener('click', onRefreshCallback);

    container.append(title, msg, retryBtn);
}

/**
 * Display timeout message for vault read
 */
export function renderTimeout(container, mode, onRetryCallback) {
    container.innerHTML = '';

    const feedback = document.createElement('div');
    feedback.innerHTML = renderPollingProcess('vault_missing');
    
    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Show my QR code';
    retryBtn.style.padding = '8px 16px';
    retryBtn.style.backgroundColor = '#007bff';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.marginTop = '10px';

    retryBtn.addEventListener('click', onRetryCallback);

    container.append(feedback, retryBtn);
}

// Import renderPollingProcess for the timeout function
import { renderPollingProcess } from './../../rendering/renderPollingProcess.js';