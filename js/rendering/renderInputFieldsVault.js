export function renderInputFieldsVault(){
   return `
      <h3>Register Application</h3>
      <input id="application_name" type="text" placeholder="Application name" />
      <input id="application_username" placeholder="Username" />
      <input id="application_password" type="password" placeholder="Password" />
      <textarea id="application_description" type="text" placeholder="Description" ></textarea>
      <button id="startRegistration">Start</button>`
};
