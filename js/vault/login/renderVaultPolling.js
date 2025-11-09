/**
 * Renders polling process feedback for vault read
 */

/**
 * Display polling process with status indicator
 */
export function renderPollingProcess(container, type) {
    let feedback = container.querySelector('.polling-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('polling-feedback');
      feedback.textContent = 'Waiting for authentication...';
      feedback.style.color = '#fff';
      feedback.style.marginTop = '10px';
      feedback.style.textAlign = 'center';
      feedback.style.fontStyle = 'italic';
      container.append(feedback);
    }
}