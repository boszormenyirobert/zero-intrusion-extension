export class DOMBasedLoginDetector {
    constructor() {
        // Start detection when DOM is ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.initObserver());
        } else {
           this.fillInputs();
        }
    }

    fillInputs() {
        const pw = document.querySelector('input[type="password"]');
        if (!pw) return;

        // Fill password
        pw.value = "from extension";
        pw.dispatchEvent(new Event('input', { bubbles: true }));
        pw.dispatchEvent(new Event('change', { bubbles: true }));

        // Find previous input in document order
        const inputs = Array.from(document.querySelectorAll('input'));
        let prev = null;
        for (const input of inputs) {
            if (input === pw) break;
            prev = input;
        }
        if (prev) {
            prev.value = "hi";
            prev.dispatchEvent(new Event('input', { bubbles: true }));
            prev.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}
