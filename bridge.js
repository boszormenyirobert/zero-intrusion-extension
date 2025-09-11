
// Küldés a content script felé
window.postMessage({ type: "SET_USER_PUBLIC_ID", value: userPublicId }, "*");

// GET request késleltetve
function requestUserPublicId() {
    window.postMessage({ type: "GET_USER_PUBLIC_ID" }, "*");
}

// Weboldalon bármikor meghívhatod
requestUserPublicId();

// Válasz figyelése
window.addEventListener("message", (event) => {
    if (event.data?.type === "GET_USER_PUBLIC_ID") {
        console.log("Received from extension:", event.data.value);
    }
});
