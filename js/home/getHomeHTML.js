export async function getHomeHTML(onUserSelect) {
  const users = JSON.parse(localStorage.getItem("oneTouchUsers")) || [];
  const container = document.createElement("div");

  // Home content
  container.innerHTML = `
    <h3>We offer two services at the highest level of security.</h3>
    <hr>
    <p><strong>QR Authentication:</strong><br>
    Use your phone as an identification device instead of your email, and your fingerprint instead of a password for all your web applications.</p>
    <hr>
    <p><strong>PASSWORD management:</strong><br>
    Classic password management for all other software.</p>
  `;

  chrome.storage.session.get("currentUser").then(({ currentUser }) => {
    console.log("Current user from storage:", currentUser);
    console.log("Users array:", users);

    if (users.length > 1 && !currentUser) {
      const dropdownDiv = document.createElement("div");
      dropdownDiv.id = "user-select-container";
      dropdownDiv.style.background = "#222";
      dropdownDiv.style.padding = "15px";
      dropdownDiv.style.borderRadius = "8px";
      dropdownDiv.style.marginBottom = "20px";
      dropdownDiv.style.textAlign = "center";

      const label = document.createElement("label");
      label.textContent = "Válassz felhasználót:";
      label.style.display = "block";
      label.style.marginBottom = "10px";
      label.style.color = "#fff";
      dropdownDiv.appendChild(label);

      const select = document.createElement("select");
      select.id = "userSelect";
      select.style.width = "100%";
      select.style.padding = "10px";
      select.style.borderRadius = "4px";
      select.style.fontSize = "16px";

      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "— válassz —";
      select.appendChild(defaultOpt);

      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.email;
        opt.textContent = u.email;
        select.appendChild(opt);
      });

      select.addEventListener("change", (e) => {
        console.log("Dropdown value:", e.target.value);
        console.log("Users array:", users);
        const selectedUser = users.find((u) => u.email === e.target.value);
        console.log("Matched user:", selectedUser);
        if (selectedUser && typeof onUserSelect === "function") {
          console.log("Selected user:", selectedUser, "Removing dropdown...");
          onUserSelect(selectedUser);
          chrome.storage.session.set({ currentUser: selectedUser });
          // Remove dropdown from view after selection
          dropdownDiv.remove();
        }
      });

      dropdownDiv.appendChild(select);
      container.prepend(dropdownDiv);      
    } else if (users.length === 1 && !currentUser) {
      console.log("device is marked by one user");
      const selectedUser = users[0];
      if (selectedUser && typeof onUserSelect === "function") {
        onUserSelect(selectedUser);
        chrome.storage.session.set({ currentUser: selectedUser });
      }
          if (typeof onUserSelect === "function") {
      onUserSelect(currentUser);
    }
    } else if (currentUser) {
      console.log("current user is already set:", currentUser);
    }
    else {
      console.log("device is not marked as trusted or no users found");
      const selectedUser = { email: null, userPublicId: null };
      chrome.storage.session.set({ currentUser: selectedUser });
      if (typeof onUserSelect === "function") {
        onUserSelect(selectedUser);
      }
    }    
  });

  return container;
}
