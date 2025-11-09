/**
 * Timeout feedback for vault delete
 */

/**
 * Display timeout message when QR scan expires
 */
export function displayTimeout(container, onRetryCallback) {
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'Request Timeout';
    title.style.color = '#ffc107';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const msg = document.createElement('p');
    msg.textContent = 'Login expired. Please try again.';
    msg.style.color = '#fff';
    msg.style.textAlign = 'center';
    msg.style.marginBottom = '20px';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Retry';
    retryBtn.style.padding = '10px 20px';
    retryBtn.style.backgroundColor = '#007bff';
    retryBtn.style.color = 'white';
    retryBtn.style.border = 'none';
    retryBtn.style.borderRadius = '4px';
    retryBtn.style.cursor = 'pointer';
    retryBtn.style.display = 'block';
    retryBtn.style.margin = '0 auto';

    retryBtn.addEventListener('click', onRetryCallback);

    container.append(title, msg, retryBtn);
}