export function renderPollingProcess(type){
   if(type === 'domain' || type === 'vault'){   
   return `
      <p>Please scan the QR code with your mobile device to log in.</p>
      `
   };
   if(type === 'domain_missing'){   
   return `
      <p>Please note the following:</p>
      <ul>
      <li><strong>Access has expired</strong></li>
      <li><strong>QR code was not scanned</strong></li>
      <li><strong>Domain is not registered in advance</strong></li>
      </ul>
      <p>Please try again, or add the credentials for this domain to enable QR login.</p>
      `
   };
   if(type === 'vault_missing'){   
   return `
      <p>Please note the following:</p>
      <ul>
      <li><strong>Access has expired</strong></li>
      <li><strong>QR code was not scanned</strong></li>      
      </ul>
      <p>Please try again, or add the credentials for this domain to enable QR login.</p>
      `
   };   
}