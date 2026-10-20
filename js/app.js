// Helper ทั่วไปที่ใช้ร่วมกันหลายหน้า

const AppUtils = {
  formatCurrency(amount) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  },

  formatDate(dateStr) {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  },

  // สวิตช์ "แสดงไอคอน" ในหน้าหมวดหมู่ (เก็บในเครื่องนี้) ปิดแล้วซ่อน emoji ของทุกหมวดทั่วทั้งแอป
  showCategoryIcons() {
    try {
      return localStorage.getItem("show_category_icons") !== "0";
    } catch {
      return true;
    }
  },

  setShowCategoryIcons(show) {
    try {
      localStorage.setItem("show_category_icons", show ? "1" : "0");
    } catch {}
  },

  // ชื่อหมวดหมู่สำหรับแสดงผล (มี/ไม่มี emoji ตามสวิตช์)
  categoryLabel(category) {
    if (!category) return "ไม่ระบุหมวดหมู่";
    return category.icon && this.showCategoryIcons() ? category.icon + " " + category.name : category.name;
  },
};
