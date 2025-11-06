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