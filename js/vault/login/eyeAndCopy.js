    export function eyeAndCopy(details){
        details.querySelectorAll('.container-vault').forEach(container => {
        const textSpan = container.querySelector('.text-content');
        const eyeIcon = container.querySelector('.eye-icon');
        const copyIcon = container.querySelector('.copy-icon');
        if (!textSpan || !eyeIcon || !copyIcon) return;

        let hidden = true;
        const getFullText = () => container.getAttribute('data-value') || '';

        const hideText = () => {
            textSpan.textContent = '•'.repeat(getFullText().length);
            hidden = true;
        };

        const showText = () => {
            textSpan.textContent = getFullText();
            hidden = false;
        };

        eyeIcon.addEventListener('click', () => (hidden ? showText() : hideText()));
        copyIcon.addEventListener('click', () => {
            navigator.clipboard.writeText(getFullText()).then(() => {
            let doneDiv = container.querySelector('.done');
            if (!doneDiv) {
                doneDiv = document.createElement('div');
                doneDiv.className = 'done';
                doneDiv.textContent = 'Done';
                Object.assign(doneDiv.style, {
                position: 'absolute',
                top: '5px',
                right: '10px',
                background: '#28a745',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem'
                });
                container.style.position = 'relative';
                container.appendChild(doneDiv);
            }
            doneDiv.style.display = 'block';
            setTimeout(() => (doneDiv.style.display = 'none'), 2000);
            });
        });

        hideText();
        });
    }