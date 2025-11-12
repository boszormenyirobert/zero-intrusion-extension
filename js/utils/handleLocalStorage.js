  import { SECURE_DEVICE } from './../config.js';

  export function handleLocalStorage(publicId = ""){
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

  export function  setSecureDevice(email, userPublicId="") {
  if (!email) {
    console.error("❌ Email is required");
    return;
  }

  // Load existing users from localStorage
  const oneTouchUsers = JSON.parse(localStorage.getItem('oneTouchUsers')) || [];

  // Check if email already exists
  let existingUser = oneTouchUsers.find(user => user.email === email);

  // If not found, add a new one
  if (!existingUser) {
    existingUser = {
      email,
      userPublicId: ''
    };
    oneTouchUsers.push(existingUser);
    console.log('🆕 Added new secure device entry for:', email);
  } else {
    existingUser.userPublicId = userPublicId;
    console.log('🔄 Updated existing secure device entry for:', email);
  }

  // Save updated list back to localStorage
  localStorage.setItem('oneTouchUsers', JSON.stringify(oneTouchUsers));

  // Return the secure device object
  return existingUser;
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