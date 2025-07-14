# การตั้งค่า Supabase สำหรับระบบรายงานผลการปฏิบัติหน้าที่

## ขั้นตอนการตั้งค่า

### 1. สร้างโปรเจค Supabase

1. ไปที่ [supabase.com](https://supabase.com)
2. สร้างบัญชีใหม่หรือเข้าสู่ระบบ
3. สร้างโปรเจคใหม่
4. เลือก region ที่เหมาะสม (แนะนำ: Southeast Asia - Singapore)

### 2. ตั้งค่าฐานข้อมูล

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คัดลอกเนื้อหาจากไฟล์ `supabase-schema.sql`
3. วางและรัน SQL script เพื่อสร้างตาราง

### 3. ตั้งค่า Environment Variables

1. ไปที่ **Settings > API** ใน Supabase Dashboard
2. คัดลอก **Project URL** และ **anon public key**
3. สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจค:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. ตรวจสอบการตั้งค่า

1. รันคำสั่ง `npm run dev` เพื่อเริ่มต้นเซิร์ฟเวอร์
2. ทดสอบการบันทึกข้อมูลในฟอร์ม
3. ตรวจสอบข้อมูลใน Supabase Dashboard > Table Editor

## โครงสร้างฐานข้อมูล

### ตาราง `duty_reports`
- เก็บข้อมูลหลักของรายงานการปฏิบัติหน้าที่
- มี foreign key ไปยังตารางอื่นๆ

### ตาราง `student_data`
- เก็บข้อมูลจำนวนนักศึกษาแยกตามชั้นปี
- เชื่อมโยงกับ `duty_reports` ผ่าน `report_id`

### ตาราง `health_records`
- เก็บข้อมูลการดูแลสุขภาพนักศึกษา
- เชื่อมโยงกับ `duty_reports` ผ่าน `report_id`

## ความปลอดภัย

- ใช้ Row Level Security (RLS) เพื่อควบคุมการเข้าถึง
- ปัจจุบันตั้งค่าให้เข้าถึงได้สาธารณะ (public)
- สามารถปรับแต่ง policies ตามความต้องการ

## การใช้งาน

1. กรอกข้อมูลในฟอร์มรายงาน
2. กดปุ่ม "บันทึกข้อมูล"
3. ข้อมูลจะถูกบันทึกลงใน Supabase
4. สามารถดูข้อมูลได้ใน Supabase Dashboard

## การแก้ไขปัญหา

### ข้อผิดพลาด "Missing Supabase environment variables"
- ตรวจสอบไฟล์ `.env` ว่ามี URL และ Key ครบถ้วน
- ตรวจสอบชื่อตัวแปรว่าถูกต้อง

### ข้อผิดพลาดการเชื่อมต่อฐานข้อมูล
- ตรวจสอบ Project URL และ API Key
- ตรวจสอบการตั้งค่า RLS policies
- ตรวจสอบการสร้างตารางในฐานข้อมูล 