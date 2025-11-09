/**
 * Renders feedback messages for domain write (registration) operations
 */

/**
 * Display timeout message for domain registration
 */
export function renderTimeout(container, onRetryCallback) {
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'Verification Timeout';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const feedback = document.createElement('p');
    feedback.textContent = 'Handy verification is missing.';
    feedback.style.color = '#ffc107';
    feedback.style.marginBottom = '15px';

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

    container.append(title, feedback, retryBtn);
}

/**
 * Display success message for domain registration
 */
export function renderSuccess(container, onCloseCallback = null) {
    container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Registration Successful';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'Your domain credentials have been successfully registered.';
    message.style.color = '#fff';
    message.style.textAlign = 'center';
    message.style.marginBottom = '20px';

    if (onCloseCallback) {
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
    } else {
        container.append(successIcon, title, message);
    }
}