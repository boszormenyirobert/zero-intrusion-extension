/**
 * Renders polling process feedback for vault read
 */

/**
 * Display polling process with countdown timer
 */
export function renderPollingProcess(container, type) {
    // Use a unique ID to prevent duplicates
    let feedback = container.querySelector('#vault-polling-feedback');
    if (!feedback) {
      // Create container for countdown and text
      feedback = document.createElement('div');
      feedback.id = 'vault-polling-feedback';
      feedback.style.textAlign = 'center';
      feedback.style.marginTop = '20px';
      feedback.style.border = 'none';
      feedback.style.background = 'transparent';
      feedback.style.padding = '0';
      
      // Create circular countdown
      const countdownCircle = document.createElement('div');
      // Use CSS class instead of inline styles
      countdownCircle.classList.add('countdown-circle');
      
      // Create text below
      const waitingText = document.createElement('div');
      waitingText.textContent = 'Waiting for authentication...';
      waitingText.style.color = '#fff';
      waitingText.style.fontStyle = 'italic';
      
      feedback.append(countdownCircle, waitingText);
      container.append(feedback);
      
      // Start countdown from 10 seconds
      let countdown = 10;
      countdownCircle.textContent = countdown;
      
      const countdownInterval = setInterval(() => {
        countdown--;
        countdownCircle.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          countdownCircle.textContent = '0';
          countdownCircle.style.backgroundColor = '#dc3545'; // Red when expired
        }
      }, 1000);
      
      // Store interval ID to clear it later if needed
      feedback.countdownInterval = countdownInterval;
    }
}