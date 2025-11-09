/**
 * Renders a dropdown for credential selection in domain delete
 */
export function renderCredentialsDropdown(container, credentials, onDeleteCallback) {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'Delete Domain Credential';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const select = document.createElement('select');
    select.style.padding = '8px';
    select.style.borderRadius = '4px';
    select.style.marginBottom = '10px';
    select.style.width = '100%';

    const placeholder = document.createElement('option');
    placeholder.textContent = 'Select credential to delete';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    credentials.forEach((credData, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${credData.creds.userName} - ${credData.item.description || 'No description'}`;
      option.title = credData.item.description;
      select.appendChild(option);
    });

    const warning = document.createElement('p');
    warning.textContent = 'This will permanently delete the selected credential. This action cannot be undone.';
    warning.style.color = '#ffc107';
    warning.style.marginBottom = '15px';
    warning.style.fontSize = '14px';

    const button = document.createElement('button');
    button.textContent = 'Delete Selected Credential';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#dc3545';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';

    button.addEventListener('click', () => {
      const selectedIndex = parseInt(select.value);
      if (!isNaN(selectedIndex) && selectedIndex >= 0) {
        const selectedCredential = credentials[selectedIndex];
        console.log('Selected credential for deletion:', selectedCredential);
        onDeleteCallback(selectedCredential);
      } else {
        console.warn('No credential selected');
        alert('Please select a credential to delete.');
      }
    });

    container.append(title, select, warning, button);
}