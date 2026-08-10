# บัญชี (Community Ledger)

เว็บแอปบันทึกรายรับ-รายจ่ายสำหรับชุมชน ทำงานผ่านเบราว์เซอร์ รองรับมือถือ (Responsive/PWA)

## เทคโนโลยี
- HTML5 + CSS3 + JavaScript (Vanilla, Alpine.js สำหรับ interactivity)
- Supabase (Database + Auth + Storage)
- Vercel (Deploy)

## โครงสร้างโปรเจกต์
```
index.html      หน้า Landing Page (public)
app/            หน้าแอปหลัก (ต้องล็อกอิน)
css/            สไตล์ชีต
js/             โค้ด JavaScript (config, supabase client, auth, db, helpers)
assets/icons/   ไอคอนสำหรับ PWA
sql/            SQL schema สำหรับ Supabase
manifest.json   PWA manifest
sw.js           Service worker (PWA)
```

## การพัฒนา
เปิด `index.html` ผ่าน Live Server (VS Code extension) หรือรันคำสั่ง:
```
npx serve .
```

## สถานะการพัฒนา
ดูความคืบหน้าตาม Step ในบทสนทนาพัฒนาโปรเจกต์
