/**
 * Feedback functions for vault delete error states
 */

/**
 * Display when no applications are found
 */
export function displayNoCredentials(container, onRetryCallback) {
    container.innerHTML = '';
    
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

    retryBtn.addEventListener('click', onRetryCallback);

    container.append(title, msg, retryBtn);
}

/**
 * Display when there's an error loading applications
 */
export function displayError(container, onRetryCallback) {
    container.innerHTML = '';
    
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

    retryBtn.addEventListener('click', onRetryCallback);

    container.append(title, msg, retryBtn);
}