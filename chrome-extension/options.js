
const endpoint = document.getElementById("endpoint");
const token = document.getElementById("token");
const status = document.getElementById("status");

chrome.storage.local.get(
  { endpoint: "", token: "" },
  (data) => {
    endpoint.value = data.endpoint || "";
    token.value = data.token || "";
  }
);

document.getElementById("save").addEventListener("click", async () => {
  const value = endpoint.value.trim().replace(/\/+$/, "");
  const tokenValue = token.value.trim();

  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(value)) {
    status.textContent = "❌ Enter the /exec Apps Script Web App URL.";
    return;
  }

  await chrome.storage.local.set({
    endpoint: value,
    token: tokenValue
  });

  status.textContent = "✅ Settings saved.";
});
