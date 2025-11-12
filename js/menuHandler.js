import { getHomeHTML } from './home/getHomeHTML.js';
import { DomainRead }  from './domain/login/domainRead.js';
import { DomainWrite } from './domain/bind/domainWrite.js';
import { DomainEdit }  from './domain/edit/domainEdit.js';
import { DomainDelete } from './domain/delete/domainDelete.js';
import { VaultRead } from './vault/login/vaultRead.js';
import { VaultWrite } from './vault/bind/vaultWrite.js';
import { VaultEdit } from './vault/edit/vaultEdit.js';
import { VaultDelete } from './vault/delete/vaultDelete.js';
import { Help } from './help/help.js';

export class MenuHandler {
  constructor(view) {
    this.view = view;
  }

  init() {
    document.getElementById('homeBtn').onclick = () => this.showHome();
    document.getElementById('vaultBtn').onclick = () => this.showVault();
    document.getElementById('helpBtn').onclick = () => this.showHelp();
    document.getElementById('webBtn').onclick = () => this.showWeb();

    this.showHome();
  }

  clearView() {
    this.view.innerHTML = '';

    if (DomainRead.activeController) {
      DomainRead.activeController.abort();
      DomainRead.activeController = null;
    }    

    if (VaultRead.activeController) {
      VaultRead.activeController.abort();
      VaultRead.activeController = null;
    }
  }

  showHome() {
    this.clearView();
    this.view.innerHTML = getHomeHTML();
  }

  showHelp() {
      this.clearView();
      const caller = new Help(this.view);
      caller.init();
  }

  showWeb() {
    this.clearView();
    const domainRead = document.createElement('button');
    domainRead.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Login</span>
          <span style="font-size: 0.85em; color: #d1cece;">Get the current website credentials</span>
        </div>
        <div class="svg_read"></div>
      </div>
    `;
    const domainWrite = document.createElement('button');
    domainWrite.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>New credential</span>
          <span style="font-size: 0.85em; color: #d1cece;">Register credential to this website</span>
        </div>
        <div class="svg_write"></div>
      </div>
    `;
    const domainEdit = document.createElement('button');
    domainEdit.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Edit credential</span>
          <span style="font-size: 0.85em; color: #d1cece;">Adjust credential to this website</span>
        </div>
        <div class="svg_write"></div>
      </div>
    `;    
    const domainDelete = document.createElement('button');
    domainDelete.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Delete</span>
          <span style="font-size: 0.85em; color: #d1cece;">Remove the credentials to the current website</span>
        </div>
        <div class="svg_trash"></div>
      </div>
    `;

    domainRead.onclick = () => {
      this.clearView();
      const caller = new DomainRead(this.view);
      caller.init();
    };

    domainWrite.onclick = () => {
      this.clearView();
      const caller =new DomainWrite(this.view);
      caller.init();
    };

    domainEdit.onclick = () => {
      this.clearView();
      const caller = new DomainEdit(this.view);
      caller.init();
    };    

    domainDelete.onclick = () => {
      this.clearView();
      const caller =new DomainDelete(this.view);
      caller.init();
    };   

    this.view.append(domainRead, domainWrite, domainEdit,domainDelete);
  }

  showVault() {
    this.clearView();

    const vaultRead = document.createElement('button');
    vaultRead.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Vault credentials</span>
          <span style="font-size: 0.85em; color: #d1cece;">Access to applications credentials</span>
        </div>
        <div class="svg_read"></div>
      </div>
    `;
    const vaultWrite = document.createElement('button');
    vaultWrite.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Add/Update</span>
          <span style="font-size: 0.85em; color: #d1cece;">Register application credentials</span>
        </div>
        <div class="svg_write"></div>
      </div>
    `;
    const vaultEdit = document.createElement('button');
    vaultEdit.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Edit/Modify</span>
          <span style="font-size: 0.85em; color: #d1cece;">Application credentials</span>
        </div>
        <div class="svg_trash"></div>
      </div>
    `;    
    const vaultDelete = document.createElement('button');
    vaultDelete.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; width:100%;">
        <div style="display:flex; flex-direction:column; align-items:flex-start;">
          <span>Delete</span>
          <span style="font-size: 0.85em; color: #d1cece;">Delete application credentials</span>
        </div>
        <div class="svg_trash"></div>
      </div>
    `;

    vaultRead.onclick = () => {
      this.clearView();
      const caller = new VaultRead(this.view);
      caller.init();
    };

    vaultWrite.onclick = () => {
      this.clearView();
      const caller =new VaultWrite(this.view);
      caller.init();
    };
    vaultEdit.onclick = () => {
      this.clearView();
      const caller = new VaultEdit(this.view);  
      caller.init();          
    };    
    vaultDelete.onclick = () => {
      this.clearView();
      const caller = new VaultDelete(this.view);  
      caller.init();          
    };    

    this.view.append(vaultRead, vaultWrite, vaultEdit, vaultDelete);
  }  
}
