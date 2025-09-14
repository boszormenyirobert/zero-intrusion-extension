
console.log("Content script running!");


chrome.runtime.sendMessage({
    action: "fillLoginFields",
    password: "MySecret123",
    previous:  "asdf"
});
 

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "fillLoginFields") {        
        console.log(message); 
        chrome.runtime.sendMessage({
            action: message.action,
            password: message.password,
            previous:  message.previous
        });
    }
});