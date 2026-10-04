// ฟังก์ชัน CRUD กลางสำหรับคุยกับ Supabase (transactions, categories, members)

const DB = {
  // --- Transactions ---
  async listTransactions({
    communityId,
    startDate,
    endDate,
    categoryId,
    type,
    search,
    limit,
  } = {}) {
    let query = window.sb
      .from("transactions")
      .select("*, categories(id, name, icon, color, type)")
      .eq("community_id", communityId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("transaction_date", startDate);
    if (endDate) query = query.lte("transaction_date", endDate);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (type) query = query.eq("type", type);
    if (search) query = query.ilike("note", `%${search}%`);
    if (limit) query = query.limit(limit);

    return await query;
  },

  async createTransaction(data) {
    return await window.sb
      .from("transactions")
      .insert({
        community_id: window.CURRENT_COMMUNITY_ID,
        user_id: window.CURRENT_USER.id,
        ...data,
      })
      .select()
      .single();
  },

  async updateTransaction(id, data) {
    return await window.sb
      .from("transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();
  },

  async deleteTransaction(id) {
    return await window.sb.from("transactions").delete().eq("id", id);
  },

  async uploadReceipt(file, transactionId) {
    const path = `${window.CURRENT_COMMUNITY_ID}/${transactionId}-${Date.now()}-${file.name}`;
    const { error } = await window.sb.storage
      .from("receipts")
      .upload(path, file);
    if (error) return { error };
    return { data: { path } };
  },

  // bucket เป็น private ต้องขอ signed URL ใหม่ทุกครั้งที่จะแสดงรูป (หมดอายุใน 1 ชม.)
  async getReceiptSignedUrl(path) {
    return await window.sb.storage.from("receipts").createSignedUrl(path, 3600);
  },

  // --- Categories ---
  async listCategories(communityId) {
    return await window.sb
      .from("categories")
      .select("*")
      .or(`community_id.is.null,community_id.eq.${communityId}`)
      .order("type")
      .order("name");
  },

  async createCategory(data) {
    return await window.sb
      .from("categories")
      .insert({
        community_id: window.CURRENT_COMMUNITY_ID,
        created_by: window.CURRENT_USER.id,
        ...data,
      })
      .select()
      .single();
  },

  async updateCategory(id, data) {
    return await window.sb
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();
  },

  async deleteCategory(id) {
    return await window.sb.from("categories").delete().eq("id", id);
  },

  // --- Community members ---
  async listMembers(communityId) {
    return await window.sb
      .from("community_members")
      .select("id, role, joined_at, user_id, profiles(id, full_name, avatar_url)")
      .eq("community_id", communityId)
      .order("joined_at");
  },

  async updateMemberRole(memberId, role) {
    return await window.sb
      .from("community_members")
      .update({ role })
      .eq("id", memberId);
  },

  async removeMember(memberId) {
    return await window.sb.from("community_members").delete().eq("id", memberId);
  },

  // --- Personal finance profile ("เกี่ยวกับตัวเอง") ---
  async getMyFinanceProfile() {
    return await window.sb
      .from("personal_finance_profiles")
      .select("*")
      .eq("user_id", window.CURRENT_USER.id)
      .maybeSingle();
  },

  async upsertMyFinanceProfile(data) {
    return await window.sb
      .from("personal_finance_profiles")
      .upsert({ user_id: window.CURRENT_USER.id, ...data }, { onConflict: "user_id" })
      .select()
      .single();
  },
};
