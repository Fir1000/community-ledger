// จัดการ "บัญชีที่กำลังใช้งานอยู่" (current community) ของผู้ใช้
// ผู้ใช้หนึ่งคนอาจอยู่หลายบัญชีได้ในอนาคต แต่ตอนนี้ MVP เลือกใช้บัญชีแรกที่พบก่อน

const Community = {
  // แถวสมาชิกภาพของผู้ใช้คนนี้เท่านั้น (RLS ให้เห็นสมาชิกทุกคนในบัญชีเดียวกัน จึงต้องกรอง user_id เอง)
  async getMyCommunities() {
    const {
      data: { session },
    } = await window.sb.auth.getSession();
    return await window.sb
      .from("community_members")
      .select("*, communities(*)")
      .eq("user_id", session?.user?.id);
  },

  getCurrentId() {
    return localStorage.getItem("current_community_id");
  },

  setCurrentId(id) {
    localStorage.setItem("current_community_id", id);
  },

  async create(name) {
    return await window.sb.rpc("create_community", { p_name: name });
  },

  async joinByCode(code) {
    return await window.sb.rpc("join_community_by_code", {
      p_invite_code: code,
    });
  },

  async rename(communityId, name) {
    return await window.sb
      .from("communities")
      .update({ name })
      .eq("id", communityId)
      .select()
      .single();
  },

  async regenerateInviteCode(communityId) {
    const newCode = Math.random().toString(36).slice(2, 10);
    return await window.sb
      .from("communities")
      .update({ invite_code: newCode })
      .eq("id", communityId)
      .select()
      .single();
  },

  // เรียกในทุกหน้า /app หลัง requireAuth() สำเร็จ
  // ถ้ายังไม่มีบัญชี -> ส่งไปหน้า onboarding, คืนค่า community_id ถ้ามีแล้ว
  async requireCommunity() {
    let currentId = this.getCurrentId();

    const { data, error } = await this.getMyCommunities();
    if (error || !data || data.length === 0) {
      window.location.href = "/app/onboarding.html";
      return null;
    }

    // ถ้า current_community_id ที่บันทึกไว้ไม่ตรงกับบัญชีที่เป็นสมาชิกอยู่จริง ให้ใช้อันแรกแทน
    let membership = data.find((m) => m.community_id === currentId);
    if (!membership) {
      membership = data[0];
      currentId = membership.community_id;
      this.setCurrentId(currentId);
    }

    // เก็บ role + ข้อมูลบัญชีไว้ให้ guard.js ใช้ต่อ ไม่ต้อง query ซ้ำ
    this.currentMembership = membership;
    return currentId;
  },
};
