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
};
