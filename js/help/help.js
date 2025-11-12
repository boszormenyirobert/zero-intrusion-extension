import { setSecureDevice } from "../utils/handleLocalStorage.js";

export class Help {
  static activeController = null;

  constructor(view) {
    this.view = view;   
  }

  async init() {
    // Clear previous content
    this.view.innerHTML = '';
    // Append the actual element (not innerHTML)
    this.view.appendChild(this.getDescriptionHTML());
  }

  getDescriptionHTML() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div id="secureDeviceContainer" style="
        font-family: system-ui, sans-serif;
        color: #ffffff;
        background: #0d6efd;
        border: 1px solid #0a58ca;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        max-width: 400px;
      ">
        <h3 style="margin-top: 0; color: #ffffff; font-size: 1.2em;">Secure Device Identification</h3>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 8px 0 16px;">

        <div style="margin-bottom: 20px;">
          <p style="margin: 0 0 10px;">
            <strong>One-touch activation:</strong><br>
            If you trust this computer and want to enable one-touch confirmation, enter your email and check the box below.
          </p>

          <input id="userEmail" type="email" placeholder="Your email address" style="
            width: 100%;
            padding: 8px 10px;
            margin-bottom: 12px;
            border: none;
            border-radius: 8px;
            background: #ffffff;
            color: #0d6efd;
            font-size: 0.95em;
            outline: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">

          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input id="secureDeviceCheckbox" type="checkbox" style="
              width: 18px;
              height: 18px;
              accent-color: #ffffff;
              background: #ffffff;
              border-radius: 4px;
              cursor: pointer;
            ">
            <span>Trust this computer</span>
          </label>

          <button id="confirmSecureDevice" style="
            margin-top: 12px;
            padding: 8px 14px;
            background: #ffffff;
            color: #0d6efd;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
          ">
            Confirm
          </button>
        </div>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 12px 0 16px;">
        <p style="margin: 0;">
          <strong>Activation:</strong><br>
          The 'One Touch' feature availabe after the login process on trusted devices only.
        </p>
      </div>
    `;

    const root = container.firstElementChild;

    // Safe listeners on real DOM
    const confirmBtn = root.querySelector('#confirmSecureDevice');
    const checkbox = root.querySelector('#secureDeviceCheckbox');
    const emailInput = root.querySelector('#userEmail');

    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.background = '#e9ecef';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.background = '#ffffff';
    });

    confirmBtn.addEventListener('click', () => {
      const email = emailInput.value.trim();

      if (!checkbox.checked) {
        alert('Please check "Trust this computer" before confirming.');
        return;
      }

      if (!email) {
        alert('Please enter your email address.');
        return;
      }

      // ✅ Works now — bound to real element
      setSecureDevice(email);
    });

    return root; // return the DOM node, not a string
  }
}
