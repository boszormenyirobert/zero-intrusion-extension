/**
 * Renders the application list for vault read
 */

// Import dependencies for credential display
import { getOutputCredentialsHTML } from './getOutputCredentialsHTML.js';
import { eyeAndCopy } from './eyeAndCopy.js';

/**
 * Renders the main applications list view
 */
export function renderApplications(container, appList) {
    container.innerHTML = '';

    const title = document.createElement('h2');
    title.style.display = 'none';
    title.style.color = '#fff';
    container.appendChild(title);

    const backBtn = document.createElement('button');
    backBtn.textContent = '🔙 Back to list';
    Object.assign(backBtn.style, {
      display: 'none',
      marginBottom: '10px',
      padding: '5px 10px',
      backgroundColor: '#fff',
      color: '#000',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    backBtn.addEventListener('click', () => {
      Array.from(container.children).forEach(child => {
        if (child.id && child.id.startsWith('application_')) child.style.display = 'block';
      });
      title.style.display = 'none';
      backBtn.style.display = 'none';
      container.style.overflowY = 'visible';
    });

    container.appendChild(backBtn);

    appList.forEach((app, i) => {
      const credentials = JSON.parse(app.userCredential);
      const wrapper = createApplicationWrapper(app, credentials, i, title, backBtn, container);
      container.appendChild(wrapper);
    });
}

/**
 * Creates a single application wrapper element
 */
function createApplicationWrapper(application, credentials, index, title, backBtn, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'container-vault';
    wrapper.id = `application_${index}`;
    wrapper.style.cssText = `
        margin: 0;
        padding: 10px;
        background-color: ${index % 2 === 0 ? '#004c99' : '#0073e6'};
      `;

    const name = document.createElement('p');
    Object.assign(name.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: '1',
      margin: '0',
      fontWeight: 'bold',
      height: '20px',
      cursor: 'pointer',
      color: 'rgba(244, 244, 244, 0.957)'
    });
    name.title = 'Show credentials';
    name.textContent = application.application;

    const lockIcon = createIcon('eye-icon', '🛡️');
    name.appendChild(lockIcon);

    const details = createDetails(credentials, application.description);
    details.style.display = 'none';

    
    name.addEventListener('click', () => {
      const isHidden = details.style.display === 'none';
      details.style.display = isHidden ? 'block' : 'none';
      singleApplication(isHidden, wrapper.id, application, container, title, backBtn);
    });
 
    wrapper.appendChild(name);
    wrapper.appendChild(details);
    eyeAndCopy(details);

    return wrapper;
}

/**
 * Creates an icon element
 */
function createIcon(className, iconText) {
    const icon = document.createElement('span');
    icon.className = `icon ${className}`;
    icon.style.color = '#fff';
    icon.textContent = iconText;
    return icon;
}

/**
 * Creates the details element for credentials
 */
function createDetails(credentials, description) {
    const details = document.createElement('div');
    details.className = 'web-credentials';
    details.innerHTML = getOutputCredentialsHTML(credentials, description);
    
    eyeAndCopy(details);

    return details;
}

/**
 * Handles single application display mode
 */
function singleApplication(showDetails, clickedApplicationId, application, container, title, backBtn) {
    const item = document.querySelector(`#${clickedApplicationId} > p`);

    if (showDetails) {
      const oldIcon = item.querySelector('.eye-icon');
      if (oldIcon) oldIcon.remove();

      const mouseIcon = createIcon('mouse-icon', '↩️');
      mouseIcon.style.fontSize ='18px';
      Object.assign(mouseIcon.style, { marginLeft: 'auto', position: 'relative' });
      item.appendChild(mouseIcon);

      Array.from(container.children).forEach(child => {
        if (child.id && child.id !== clickedApplicationId) child.style.display = 'none';
      });

      title.style.display = 'block';
      title.textContent = application.application;

      container.style.overflowY = 'hidden';
    } else {
      const mouseIcon = item.querySelector('.mouse-icon');
      if (mouseIcon) mouseIcon.remove();

      if (!item.querySelector('.eye-icon')) {
        const lockIcon = createIcon('eye-icon', '🛡️');
        item.appendChild(lockIcon);
      }

      Array.from(container.children).forEach(child => {
        if (child.id && child.id.startsWith('application_')) child.style.display = 'block';
      });

      title.style.display = 'none';
      container.style.overflowY = 'visible';
    }
}