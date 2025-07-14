# ระบบรายงานผลการปฏิบัติหน้าที่ของอาจารย์เวร

ระบบบันทึกและรายงานการดูแลนักศึกษาในหอพัก พร้อมการติดตามสุขภาพและการดูแลความเรียบร้อย สำหรับวิทยาลัยพยาบาลบรมราชชนนี อุดรธานี

## ✨ คุณสมบัติหลัก

- 📝 **บันทึกรายงานครบครัน** - ข้อมูลนักศึกษา การดูแลสุขภาพ และความเรียบร้อย
- 👥 **จัดการข้อมูลนักศึกษา** - ติดตามจำนวน การเข้า-ออกหอพัก
- 🏥 **บันทึกข้อมูลสุขภาพ** - การดูแลสุขภาพนักศึกษา
- 🎨 **UI สวยงาม** - ใช้ Tailwind CSS และ Framer Motion
- 📱 **รองรับทุกอุปกรณ์** - Responsive design
- 🔄 **Real-time Database** - เชื่อมต่อ Supabase
- 📊 **ดูรายงานย้อนหลัง** - ระบบค้นหาและแสดงรายงาน

## 🚀 การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd duty-report-pastel-pink-main
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Supabase
1. สร้างโปรเจคที่ [supabase.com](https://supabase.com)
2. รัน SQL script จากไฟล์ `supabase-schema.sql`
3. สร้างไฟล์ `.env`:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. รันโปรเจค
```bash
npm run dev
```

## 📁 โครงสร้างโปรเจค

```
src/
├── components/     # UI components (shadcn/ui)
├── pages/         # หน้าต่างๆ
│   ├── Index.tsx      # หน้าหลัก
│   ├── ReportForm.tsx # ฟอร์มบันทึกรายงาน
│   ├── Reports.tsx    # หน้ารายงานทั้งหมด
│   └── NotFound.tsx   # หน้า 404
├── lib/           # Utilities และ Supabase config
└── hooks/         # Custom React hooks
```

## 🎯 การใช้งาน

### หน้าหลัก
- แสดงข้อมูลทั่วไปของระบบ
- ปุ่มเข้าสู่ฟอร์มบันทึกและดูรายงาน

### ฟอร์มบันทึกรายงาน
1. **ข้อมูลพื้นฐาน** - วันที่, ชื่ออาจารย์, เวลา, หอพัก
2. **ข้อมูลนักศึกษา** - จำนวนแยกตามชั้นปีและเพศ
3. **ข้อมูลสุขภาพ** - การดูแลสุขภาพนักศึกษา
4. **รายงานความสะอาด** - ระดับความสะอาดของหอพัก
5. **ลายเซ็น** - ผู้รับผิดชอบต่างๆ

### หน้ารายงาน
- แสดงรายงานทั้งหมดที่บันทึกไว้
- ค้นหาตามชื่ออาจารย์, วันที่, หรือหอพัก
- ดูรายละเอียดแต่ละรายงาน

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Routing**: React Router
- **Icons**: Lucide React

## 📊 โครงสร้างฐานข้อมูล

### ตาราง `duty_reports`
- ข้อมูลหลักของรายงานการปฏิบัติหน้าที่
- วันที่, ชื่ออาจารย์, เวลา, หอพัก, ลายเซ็น

### ตาราง `student_data`
- ข้อมูลจำนวนนักศึกษาแยกตามชั้นปี
- เชื่อมโยงกับ `duty_reports` ผ่าน `report_id`

### ตาราง `health_records`
- ข้อมูลการดูแลสุขภาพนักศึกษา
- เชื่อมโยงกับ `duty_reports` ผ่าน `report_id`

## 🎨 การปรับแต่ง

### สีและธีม
- แก้ไข `tailwind.config.ts` สำหรับสีหลัก
- ปรับแต่ง gradient ใน `src/index.css`

### ฟอร์ม
- เพิ่มฟิลด์ใหม่ใน `ReportForm.tsx`
- อัปเดต interface และ Supabase schema

### อนิเมชัน
- ปรับแต่ง Framer Motion variants
- เพิ่ม transition effects

## 🚀 การ Deploy

### Vercel (แนะนำ)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# อัปโหลดโฟลเดอร์ dist
```

## 📝 การพัฒนา

### Scripts ที่มี
- `npm run dev` - Development server
- `npm run build` - Build สำหรับ production
- `npm run preview` - Preview production build
- `npm run lint` - ตรวจสอบ code

### การเพิ่มฟีเจอร์ใหม่
1. สร้าง component ใหม่ใน `src/components/`
2. เพิ่ม route ใน `src/App.tsx`
3. อัปเดต database schema ถ้าจำเป็น
4. ทดสอบการทำงาน

## 🔒 ความปลอดภัย

- ใช้ Row Level Security (RLS) ใน Supabase
- Environment variables สำหรับ sensitive data
- Input validation ในฟอร์ม

## 📞 การสนับสนุน

หากมีปัญหาหรือคำถาม สามารถ:
1. ตรวจสอบไฟล์ `SUPABASE_SETUP.md`
2. ดู error logs ใน browser console
3. ตรวจสอบ Supabase Dashboard

## 📄 License

MIT License - ใช้งานได้อย่างอิสระ
