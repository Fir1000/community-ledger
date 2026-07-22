// จัดการ "ชุมชนที่กำลังใช้งานอยู่" (current community) ของผู้ใช้
// ผู้ใช้หนึ่งคนอาจอยู่หลายชุมชนได้ในอนาคต แต่ตอนนี้ MVP เลือกใช้ชุมชนแรกที่พบก่อน

const Community = {
  async getMyCommunities() {
    return await window.sb
      .from("community_members")
      .select("community_id, role, communities(id, name, invite_code)");
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
  // ถ้ายังไม่มีชุมชน -> ส่งไปหน้า onboarding, คืนค่า community_id ถ้ามีแล้ว
  async requireCommunity() {
    let currentId = this.getCurrentId();

    const { data, error } = await this.getMyCommunities();
    if (error || !data || data.length === 0) {
      window.location.href = "/app/onboarding.html";
      return null;
    }

    // ถ้า current_community_id ที่บันทึกไว้ไม่ตรงกับชุมชนที่เป็นสมาชิกอยู่จริง ให้ใช้อันแรกแทน
    const stillMember = data.some((m) => m.community_id === currentId);
    if (!stillMember) {
      currentId = data[0].community_id;
      this.setCurrentId(currentId);
    }

    return currentId;
  },
};
