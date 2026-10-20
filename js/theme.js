// ธีมสว่าง/มืด: โหลดใน <head> ของทุกหน้าแบบไม่ defer เพื่อใส่ data-theme ก่อนหน้าแสดงผล (กันจอกระพริบขาว)
// ค่าที่เลือกเก็บใน localStorage ของเครื่องนี้ ("light" | "dark")

const AppTheme = {
  get() {
    try {
      return localStorage.getItem("theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  },

  isDark() {
    return this.get() === "dark";
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#18211d" : "#2f7d5f");
    if (typeof Chart !== "undefined") {
      Chart.defaults.color = theme === "dark" ? "#9aa7a0" : "#666";
      Chart.defaults.borderColor = this.gridColor();
    }
  },

  set(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    this.apply(theme);
  },

  // สีเส้นตารางของกราฟ
  gridColor() {
    return this.isDark() ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  },

  // สีเส้น 0 ตรงกลางกราฟความถี่
  axisColor() {
    return this.isDark() ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
  },
};

AppTheme.apply(AppTheme.get());
// Chart.js โหลดแบบ defer จะพร้อมก่อน DOMContentLoaded ตั้งค่าสีกราฟตามธีมอีกรอบ
document.addEventListener("DOMContentLoaded", () => AppTheme.apply(AppTheme.get()));
