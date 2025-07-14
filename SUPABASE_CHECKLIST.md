# ✅ Checklist การตรวจสอบ Supabase Database

## 🔍 การตรวจสอบเบื้องต้น

### 1. Environment Variables
- [ ] สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจค
- [ ] ตั้งค่า `VITE_SUPABASE_URL` (Project URL)
- [ ] ตั้งค่า `VITE_SUPABASE_ANON_KEY` (Anon Public Key)
- [ ] รีสตาร์ท development server หลังตั้งค่า

### 2. Supabase Project Setup
- [ ] สร้างโปรเจคใหม่ที่ [supabase.com](https://supabase.com)
- [ ] เลือก region ที่เหมาะสม (แนะนำ: Southeast Asia)
- [ ] ไปที่ Settings → API เพื่อดู URL และ Key

### 3. Database Schema
- [ ] ไปที่ SQL Editor ใน Supabase Dashboard
- [ ] รัน SQL script จากไฟล์ `supabase-schema.sql`
- [ ] ตรวจสอบว่าสร้างตาราง 3 ตาราง:
  - `duty_reports`
  - `student_data`
  - `health_records`

### 4. Row Level Security (RLS)
- [ ] ตรวจสอบว่า RLS เปิดใช้งานในทุกตาราง
- [ ] ตรวจสอบ policies ที่สร้างไว้:
  - Allow public read access
  - Allow public insert access
  - Allow public update access
  - Allow public delete access

## 🧪 การทดสอบการทำงาน

### 1. ทดสอบผ่านหน้าเว็บ
- [ ] ไปที่ `http://localhost:5173/test`
- [ ] กดปุ่ม "ตรวจสอบ Environment Variables"
- [ ] กดปุ่ม "เริ่มการทดสอบ"
- [ ] ตรวจสอบผลลัพธ์ว่าสำเร็จหรือไม่

### 2. ทดสอบการบันทึกข้อมูล
- [ ] ไปที่หน้า "เริ่มใช้งานระบบ"
- [ ] กรอกข้อมูลในฟอร์ม
- [ ] กดปุ่ม "บันทึกข้อมูล"
- [ ] ตรวจสอบ console logs
- [ ] ตรวจสอบข้อมูลใน Supabase Dashboard

### 3. ทดสอบการดูรายงาน
- [ ] ไปที่หน้า "ดูรายงาน"
- [ ] ตรวจสอบว่ารายงานที่บันทึกแสดงขึ้นมา
- [ ] ทดสอบการค้นหา
- [ ] ทดสอบการดูรายละเอียด

## 🔧 การแก้ไขปัญหา

### ปัญหา: Environment Variables ไม่ครบ
```
❌ VITE_SUPABASE_URL: ไม่มีค่า
❌ VITE_SUPABASE_ANON_KEY: ไม่มีค่า
```
**วิธีแก้:**
1. สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจค
2. เพิ่ม:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
3. รีสตาร์ท development server

### ปัญหา: ตารางยังไม่ได้สร้าง
```
❌ ตารางที่ขาดหายไป: duty_reports, student_data, health_records
```
**วิธีแก้:**
1. ไปที่ Supabase Dashboard → SQL Editor
2. คัดลอกเนื้อหาจาก `supabase-schema.sql`
3. รัน SQL script
4. ตรวจสอบใน Table Editor

### ปัญหา: RLS Policies ไม่ถูกต้อง
```
❌ ข้อผิดพลาด: new row violates row-level security policy
```
**วิธีแก้:**
1. ไปที่ Authentication → Policies
2. ตรวจสอบ policies ของแต่ละตาราง
3. สร้าง policies ใหม่ถ้าจำเป็น:
```sql
CREATE POLICY "Allow public access" ON table_name FOR ALL USING (true);
```

### ปัญหา: API Key ไม่ถูกต้อง
```
❌ ข้อผิดพลาด: Invalid API key
```
**วิธีแก้:**
1. ไปที่ Settings → API
2. คัดลอก Project URL และ anon public key ใหม่
3. อัปเดตไฟล์ `.env`
4. รีสตาร์ท development server

## 📊 การตรวจสอบข้อมูล

### ใน Supabase Dashboard
1. **Table Editor** → ตรวจสอบข้อมูลในตาราง
2. **Logs** → ดู API calls และ errors
3. **API** → ทดสอบ queries

### ใน Browser Console
1. เปิด Developer Tools (F12)
2. ไปที่ Console tab
3. ดู logs ระหว่างการบันทึกข้อมูล

## ✅ สัญญาณที่แสดงว่าระบบทำงานปกติ

1. **หน้าทดสอบ** แสดง:
   - ✅ Environment Variables: พร้อมใช้งาน
   - ✅ การเชื่อมต่อสำเร็จ
   - ✅ โครงสร้างตารางครบถ้วน
   - ✅ การบันทึกข้อมูลทดสอบสำเร็จ

2. **การบันทึกข้อมูล** แสดง:
   - 📝 บันทึกข้อมูลรายงานหลัก...
   - ✅ บันทึกข้อมูลรายงานสำเร็จ
   - 👥 บันทึกข้อมูลนักศึกษา...
   - ✅ บันทึกข้อมูลนักศึกษาสำเร็จ
   - 🏥 บันทึกข้อมูลสุขภาพ...
   - ✅ บันทึกข้อมูลสุขภาพสำเร็จ
   - 🎉 บันทึกข้อมูลทั้งหมดสำเร็จ!

3. **หน้ารายงาน** แสดง:
   - รายงานที่บันทึกไว้แสดงขึ้นมา
   - สามารถค้นหาได้
   - สามารถดูรายละเอียดได้

## 🚀 เมื่อระบบพร้อมใช้งาน

หลังจากผ่านการตรวจสอบทั้งหมดแล้ว:
1. ลบปุ่ม "ทดสอบฐานข้อมูล" ออกจากหน้า Index (ถ้าต้องการ)
2. ลบ route `/test` ออกจาก App.tsx (ถ้าต้องการ)
3. ลบไฟล์ `src/pages/SupabaseTest.tsx` และ `src/lib/supabase-test.ts` (ถ้าต้องการ)
4. ลบ console.log statements ออกจาก ReportForm.tsx (ถ้าต้องการ)

ระบบพร้อมใช้งานใน production! 🎉 