  export function displaySuccess(container){
    container.innerHTML = '';
    
    const successIcon = document.createElement('div');
    successIcon.textContent = '✅';
    successIcon.style.fontSize = '48px';
    successIcon.style.textAlign = 'center';
    successIcon.style.marginBottom = '15px';

    const title = document.createElement('h3');
    title.textContent = 'Application Deleted Successfully';
    title.style.color = '#28a745';
    title.style.textAlign = 'center';
    title.style.marginBottom = '15px';

    const message = document.createElement('p');
    message.textContent = 'The selected application has been permanently removed from your vault.';
    message.style.color = '#fff';
    message.style.textAlign = 'center';
    message.style.marginBottom = '20px';

    container.append(successIcon, title, message);
}