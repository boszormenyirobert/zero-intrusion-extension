
console.log("Content script running!");

chrome.runtime.onMessage.addListener((message) => {
    console.log("Content script received message:", message);
    if (message.action === "fillLoginFields") {        
        console.log("Processing fillLoginFields:", message); 
        chrome.runtime.sendMessage({
            action: message.action,
            password: message.password,
            previous:  message.previous
        });
    }
});