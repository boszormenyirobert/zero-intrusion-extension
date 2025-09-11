export function getCurrentTabHost() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) {
        document.getElementById('currentDomain').innerText = 'No active tab';
        return reject('No active tab');
      }

      try {
        const url = new URL(tabs[0].url);
        console.log('Detected URL:', url.href);
        resolve(url.hostname);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function detectDomainChanges(){
  chrome.tabs.onActivated.addListener(() => getCurrentTabHost());
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) getCurrentTabHost();
  });
}


