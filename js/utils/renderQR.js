  export function qrRenderer(qrCode, container) {
    container.innerHTML='';
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,' + qrCode;

      const qrContainer = document.createElement('div');
      qrContainer.innerHTML = '';
      qrContainer.appendChild(img);
      
    container.appendChild(qrContainer);
  }