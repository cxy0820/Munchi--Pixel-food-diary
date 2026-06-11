const statusEl = document.getElementById("status");

const deleteDb = (name) =>
  new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

const reset = async () => {
  await deleteDb("siplog-db");
  localStorage.removeItem("siplog-settings");
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  statusEl.textContent = "Done. Opening a fresh Munchi...";
  window.setTimeout(() => {
    window.location.replace("/app/today");
  }, 800);
};

reset().catch(() => {
  statusEl.textContent = "Could not finish the reset. Close other Munchi tabs and refresh this page.";
});
