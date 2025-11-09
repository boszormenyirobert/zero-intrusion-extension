/**
 * Renders polling process feedback for domain delete
 */

/**
 * Display polling process with countdown
 */
export function renderPollingProcess(container) {
    let feedback = container.querySelector('.polling-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('polling-feedback');
      feedback.dataset.count = '5';
      feedback.textContent = '5';
      feedback.style.color = '#fff';
      feedback.style.marginTop = '10px';
      feedback.style.textAlign = 'center';
      container.append(feedback);
    } else {
      let count = parseInt(feedback.dataset.count, 10);
      if (count > 1) {
        count--;
        feedback.dataset.count = count.toString();
        feedback.textContent = count.toString();
      }
    }
}