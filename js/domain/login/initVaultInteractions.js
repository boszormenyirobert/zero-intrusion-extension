export function initVaultInteractions(container) {
  container.querySelectorAll('.container-vault').forEach(box => {
    const textSpan = box.querySelector('.text-content');
    const eyeIcon = box.querySelector('.eye-icon');
    const copyIcon = box.querySelector('.copy-icon');

    if (!textSpan || !eyeIcon || !copyIcon) return;

    let hidden = true;
    const getFullText = () => box.getAttribute('data-value') || '';

    const hideText = () => {
      textSpan.textContent = '•'.repeat(getFullText().length);
      hidden = true;
    };

    const showText = () => {
      textSpan.textContent = getFullText();
      hidden = false;
    };

    eyeIcon.addEventListener('click', () => {
      hidden ? showText() : hideText();
    });

    copyIcon.addEventListener('click', () => {
      navigator.clipboard.writeText(getFullText()).then(() => {
        let done = box.querySelector('.done');
        if (!done) {
          done = document.createElement('div');
          done.className = 'done';
          done.textContent = 'Done';
          Object.assign(done.style, {
            position: 'absolute',
            top: '5px',
            right: '10px',
            background: '#28a745',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
          });
          box.style.position = 'relative';
          box.appendChild(done);
        }
        done.style.display = 'block';
        setTimeout(() => {
          done.style.display = 'none';
        }, 2000);
      });
    });

    hideText();
  });
}
