/**
 * Renders various feedback messages for domain delete operations
 */

/**
 * Display when no credentials are found
 */
export function renderNoCredentials(container, onRetryCallback) {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'No Credentials Found';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'No credentials found for this domain.';
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
 * Display error message
 */
export function renderError(container, onRetryCallback) {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'Error Loading Credentials';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'Failed to load credentials for this domain.';
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

/**
 * Display timeout message
 */
export function renderTimeout(container, onRetryCallback) {
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'Request Timeout';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'Login expired. Please try again.';
    msg.style.color = '#ffc107';

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

/**
 * Display success message
 */
export function renderSuccess(container, onCloseCallback) {
    container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Credential Deleted Successfully';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'The selected domain credential has been permanently removed from your vault.';
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

    closeBtn.addEventListener('click', onCloseCallback);

    container.append(successIcon, title, message, closeBtn);
}