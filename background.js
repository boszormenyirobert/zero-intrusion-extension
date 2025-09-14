chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch(console.error);
});

  function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Background script: injects code into page context
chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg.action === "fillLoginFields" && sender.tab?.id) {
        const tabId = sender.tab.id;

        // Only pass serializable strings
        const passwordVal = String(msg.password);
        const previousVal = String(msg.previous);

        console.log(msg);

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (passwordVal, previousVal) => {
                class DOMBasedLoginDetector {
                    constructor(passwordVal, previousVal) {
                        this.passwordVal = passwordVal;
                        this.previousVal = previousVal;
                        this.fillInputs();
                        this.observeMutations();
                    }
                    setNativeValue(el, value) {
                        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
                        setter.call(el, value);
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    fillInputs(root = document) {
                        const passwordFields = root.querySelectorAll('input[type="password"]');
                        passwordFields.forEach(pw => {
                            this.setNativeValue(pw, this.passwordVal);
                            const allInputs = Array.from(document.querySelectorAll('input'));
                            let prev = null;
                            for (const input of allInputs) {
                                if (input === pw) break;
                                prev = input;
                            }
                            if (prev) this.setNativeValue(prev, this.previousVal);
                        });
                    }
                    observeMutations() {
                        const observer = new MutationObserver(() => this.fillInputs());
                        observer.observe(document.body, { childList: true, subtree: true });
                    }
                }

                new DOMBasedLoginDetector(passwordVal, previousVal);
            },
            args: [passwordVal, previousVal]
        });
    }
});