import { SECURE_DEVICE } from './../config.js';

  export function Original_handleLocalStorage(publicId = ""){
    if ("userPublicId" in localStorage) {
      console.log("secure device found");
      return localStorage.getItem("userPublicId");
    }
      console.log("unsecure device found"); 
      if(SECURE_DEVICE && publicId != ""){
          localStorage.setItem("userPublicId", publicId);
          console.log("user settings device is secure, saving publicId to localStorage"); 
          return localStorage.getItem("userPublicId");
      }     
      return "";
  }

    export function handleLocalStorage(publicId = "") {
      chrome.storage.session.get("currentUser", res => res.currentUser ? res.currentUser.userPublicId : "");
    }
    
  export function setSecureDevice(emails, userPublicId = "") {
    // Ensure emails is always an array
    if (!Array.isArray(emails)) emails = [];
    // Sanitize emails array
    const filteredEmails = emails.filter(email => email !== "");
    // Overwrite the user list with the current input values
    const newUsers = filteredEmails.map(email => ({
      email,
      userPublicId: ''
    }));
    localStorage.setItem('oneTouchUsers', JSON.stringify(newUsers));
    // Return the new user list
    return newUsers;
  }

export function  setPublicId(email, userPublicId="") {
  if (!email) {
    console.error("❌ Email is required");
    return;
  }

  // Load existing users from localStorage
  const oneTouchUsers = JSON.parse(localStorage.getItem('oneTouchUsers')) || [];

  // Check if email already exists
  let existingUser = oneTouchUsers.find(user => user.email === email);

  // user does not marked devie as trusted
  if (!existingUser) {
    console.log('🔄 Updated existing secure device entry for:', email);
    return false;
  }
  else {
    existingUser.userPublicId = userPublicId;
    console.log('🔄 Updated existing secure device entry for:', email);
  }

  // Save updated list back to localStorage
  localStorage.setItem('oneTouchUsers', JSON.stringify(oneTouchUsers));

  // Return the secure device object
  return existingUser;
}

function removeEmptyEmailFromOneTouchUsers() {
  const oneTouchUsers = JSON.parse(localStorage.getItem('oneTouchUsers')) || [];
  const filteredUsers = oneTouchUsers.filter(user => user.email !== "");
  localStorage.setItem('oneTouchUsers', JSON.stringify(filteredUsers));
}