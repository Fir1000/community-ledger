// ฟังก์ชันเกี่ยวกับ Authentication (สมัคร/ล็อกอิน/ล็อกเอาต์/guard)

const Auth = {
  async signUp(email, password, fullName) {
    return await window.sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
  },

  async signIn(email, password) {
    return await window.sb.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    await window.sb.auth.signOut();
    localStorage.removeItem("current_community_id");
    window.location.href = "/app/login.html";
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await window.sb.auth.getUser();
    return user;
  },

  // เรียกที่หัวไฟล์ทุกหน้าใน /app เพื่อกันคนไม่ล็อกอินเข้าถึงหน้า
  // คืนค่า user ถ้าล็อกอินแล้ว, redirect ไป login.html และคืนค่า null ถ้ายังไม่ล็อกอิน
  async requireAuth() {
    const {
      data: { session },
    } = await window.sb.auth.getSession();

    if (!session) {
      window.location.href = "/app/login.html";
      return null;
    }
    return session.user;
  },
};
