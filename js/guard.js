// รวม auth guard + community guard สำหรับทุกหน้าใน /app (ยกเว้น login.html, onboarding.html)
// เมื่อพร้อมแล้วจะ set window.CURRENT_USER / window.CURRENT_COMMUNITY_ID
// และยิง event "app:ready" ให้หน้าที่ต้องโหลดข้อมูล (transactions ฯลฯ) ทำงานต่อ

(async function () {
  const user = await Auth.requireAuth();
  if (!user) return;

  const communityId = await Community.requireCommunity();
  if (!communityId) return;

  window.CURRENT_USER = user;
  window.CURRENT_COMMUNITY_ID = communityId;

  // requireCommunity() ดึง role + ชื่อ/รหัสเชิญของชุมชนมาแล้ว ใช้ต่อได้เลยไม่ต้อง query ซ้ำ
  const membership = Community.currentMembership;
  const community = membership?.communities || null;

  window.CURRENT_COMMUNITY = community;

  window.CURRENT_USER_ROLE = membership?.role || "member";
  window.IS_ADMIN = window.CURRENT_USER_ROLE === "admin";

  document.querySelectorAll("[data-community-name]").forEach((el) => {
    el.textContent = community?.name || "";
  });

  document.querySelectorAll("[data-logout]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.signOut();
    });
  });

  document.dispatchEvent(
    new CustomEvent("app:ready", {
      detail: { user, communityId, community, role: window.CURRENT_USER_ROLE },
    })
  );
})();
