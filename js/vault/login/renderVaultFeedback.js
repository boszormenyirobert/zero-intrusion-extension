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

    container.append(title, msg);
}

/**
 * Display timeout message for vault read
 */
export function renderTimeout(container, mode, onRetryCallback) {
    container.innerHTML = '';

    const feedback = document.createElement('div');
    feedback.innerHTML = renderPollingProcess('vault_missing');

    container.append(feedback);
}

// Import renderPollingProcess for the timeout function
import { renderPollingProcess } from './../../rendering/renderPollingProcess.js';