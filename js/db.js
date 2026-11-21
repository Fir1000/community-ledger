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
    columns = "*, categories(id, name, icon, color, type)",
  } = {}) {
    let query = window.sb
      .from("transactions")
      .select(columns)
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

  // ล้างรายการของบัญชี: ถ้าส่ง startDate/endDate จะลบเฉพาะช่วงนั้น ไม่ส่งคือลบทั้งหมด
  // ลบรูปใบเสร็จที่ผูกอยู่ด้วย (best-effort: ถ้าลบรูปไม่สำเร็จ รายการก็ยังถูกลบ)
  async resetTransactions({ communityId, startDate, endDate } = {}) {
    const applyRange = (q) => {
      q = q.eq("community_id", communityId);
      if (startDate) q = q.gte("transaction_date", startDate);
      if (endDate) q = q.lte("transaction_date", endDate);
      return q;
    };

    const { data: rows, error: listError } = await applyRange(
      window.sb.from("transactions").select("receipt_path")
    );
    if (listError) return { error: listError };

    const { error, count } = await applyRange(
      window.sb.from("transactions").delete({ count: "exact" })
    );
    if (error) return { error };

    const paths = (rows || []).map((r) => r.receipt_path).filter(Boolean);
    for (let i = 0; i < paths.length; i += 100) {
      await window.sb.storage.from("receipts").remove(paths.slice(i, i + 100));
    }

    return { data: { count: count ?? rows.length } };
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
      .select("*, profiles(id, full_name, avatar_url)")
      .eq("community_id", communityId)
      .order("joined_at");
  },

  async updateMemberRole(memberId, role) {
    return await window.sb
      .from("community_members")
      .update({ role })
      .eq("id", memberId);
  },

  async updateMemberEditPermission(memberId, canEdit) {
    return await window.sb
      .from("community_members")
      .update({ can_edit_transactions: canEdit })
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
