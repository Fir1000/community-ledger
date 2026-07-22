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

  const { data: community } = await window.sb
    .from("communities")
    .select("name, invite_code")
    .eq("id", communityId)
    .single();

  window.CURRENT_COMMUNITY = community;

  const { data: membership } = await window.sb
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();

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
