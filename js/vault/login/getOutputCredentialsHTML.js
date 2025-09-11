export function getOutputCredentialsHTML(credentials, description = "", targetId = "") {
    return `
      <div class="container-vault" id="uName" data-hidden="true" data-value="${credentials.userName}">
          <span class="text-content">••••••••••••••••••••••••••••••••••••</span>
          <div class="icon">
            <span class="icon eye-icon" title="Show/Hide">&#128065;</span>
            <span class="icon copy-icon" title="Copy">&#128203;</span>
          </div>
      </div>
      <div class="container-vault" id="uPsw" data-hidden="true" data-value="${credentials.userPassword}">
          <span class="text-content">••••••••••••••••••••••••••••••••••••</span>
          <div class="icon">
            <span class="icon eye-icon" title="Show/Hide">&#128065;</span>
            <span class="icon copy-icon" title="Copy">&#128203;</span>
          </div>
      </div>
       <div class="container-vault box-large" id="uDesc" data-hidden="true" data-value="${description}">
          <span class="text-content">••••••••••••••••••••••••••••••••••••</span>
          <div class="icon">
            <span class="icon eye-icon" title="Show/Hide">&#128065;</span>
            <span class="icon copy-icon" title="Copy">&#128203;</span>
          </div>
      </div>
      <p>TargetId: ${targetId}</p>
    `;
}