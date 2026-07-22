// สร้าง Supabase client ตัวเดียวใช้ร่วมกันทั้งแอป
// ต้องโหลด <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// และ config.js ก่อนไฟล์นี้เสมอ
const { createClient } = supabase;

window.sb = createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);
