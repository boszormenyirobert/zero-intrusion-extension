export function renderInputFieldsDomain(){
   return `
      <h3>Register Domain</h3>
      <input id="username" placeholder="Username" />
      <input id="password" type="password" placeholder="Password" />
      <textarea id="description" type="text" placeholder="Description"></textarea>    
      <label><input type="checkbox" /> Update existing</label>
      <button id="startRegistration">Start</button>
      <div id="qrContainer"></div>`
};