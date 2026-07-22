// ลงทะเบียน Service Worker + จัดการปุ่ม "ติดตั้งแอป" (Android/Desktop Chrome)
// iOS Safari ไม่รองรับ beforeinstallprompt ต้องกด "แชร์ > เพิ่มไปยังหน้าจอโฮม" เอง

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.querySelectorAll("[data-install-app]").forEach((el) => {
    el.style.display = "inline-block";
  });
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  document.querySelectorAll("[data-install-app]").forEach((el) => {
    el.style.display = "none";
  });
});

document.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-install-app]");
  if (!target || !deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});
