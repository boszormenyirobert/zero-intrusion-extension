/**
 * Renders application dropdown for vault delete
 */
export function renderApplicationDropdown(container, appList, onDeleteCallback) {
    container.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'Delete Vault Application';
    title.style.color = '#fff';
    title.style.marginBottom = '15px';

    const select = document.createElement('select');
    select.style.padding = '8px';
    select.style.borderRadius = '4px';
    select.style.marginBottom = '10px';
    select.style.width = '100%';

    const placeholder = document.createElement('option');
    placeholder.textContent = 'Select application to delete';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    appList.forEach(app => {
        const option = document.createElement('option');
        option.value = app.targetId;
        option.textContent = app.application;
        option.title = app.description;
        select.appendChild(option);
    });

    const warning = document.createElement('p');
    warning.textContent = 'This will permanently delete the selected application. This action cannot be undone.';
    warning.style.color = '#ffc107';
    warning.style.marginBottom = '15px';
    warning.style.fontSize = '14px';

    const button = document.createElement('button');
    button.textContent = 'Delete Selected Application';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#dc3545';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';

    button.addEventListener('click', () => {
        const selectedValue = select.value;
        if (selectedValue && select.selectedIndex !== 0) {
            console.log('Selected targetId:', selectedValue);
            onDeleteCallback(selectedValue);
        } else {
            console.warn('No application selected');
            alert('Please select an application to delete.');
        }
    });

    container.append(title, select, warning, button);
}