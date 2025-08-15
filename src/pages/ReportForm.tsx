import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Save } from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DutyReport, StudentData as SupabaseStudentData, HealthRecord as SupabaseHealthRecord } from "@/lib/supabase";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect } from "react";

interface StudentData {
  year: string;
  femaleCount: number;
  maleCount: number;
  totalCount: number;
  femaleSignOut: number;
  maleSignOut: number;
  femaleEmergencyStay: number;
  maleEmergencyStay: number;
  femaleNotStayingOut: number;
  maleNotStayingOut: number;
  femaleRemaining: number;
  maleRemaining: number;
}

interface HealthRecord {
  id: number;
  name: string;
  year: string;
  symptoms: string;
  treatment: string;
  result: string;
}

const ReportForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  
  // Form data state
  const [reportData, setReportData] = useState({
    date: new Date().toISOString().split('T')[0],
    teacherName: "",
    startTime: "",
    endTime: "",
    replacingTeacher: "",
    dormitory: "",
    cleanlinessGood: "",
    cleanlinessNeedImprovement: "",
    studentBehavior: "",
    teacherSignature: "",
    teacherPosition: "",
    deputyDirectorSignature: "",
    directorSignature: ""
  });

  const [studentData, setStudentData] = useState<StudentData[]>([
    { year: "1", femaleCount: 0, maleCount: 0, totalCount: 0, femaleSignOut: 0, maleSignOut: 0, femaleEmergencyStay: 0, maleEmergencyStay: 0, femaleNotStayingOut: 0, maleNotStayingOut: 0, femaleRemaining: 0, maleRemaining: 0 },
    { year: "2", femaleCount: 0, maleCount: 0, totalCount: 0, femaleSignOut: 0, maleSignOut: 0, femaleEmergencyStay: 0, maleEmergencyStay: 0, femaleNotStayingOut: 0, maleNotStayingOut: 0, femaleRemaining: 0, maleRemaining: 0 },
    { year: "3", femaleCount: 0, maleCount: 0, totalCount: 0, femaleSignOut: 0, maleSignOut: 0, femaleEmergencyStay: 0, maleEmergencyStay: 0, femaleNotStayingOut: 0, maleNotStayingOut: 0, femaleRemaining: 0, maleRemaining: 0 },
    { year: "4", femaleCount: 0, maleCount: 0, totalCount: 0, femaleSignOut: 0, maleSignOut: 0, femaleEmergencyStay: 0, maleEmergencyStay: 0, femaleNotStayingOut: 0, maleNotStayingOut: 0, femaleRemaining: 0, maleRemaining: 0 }
  ]);

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([
    { id: 1, name: "", year: "", symptoms: "", treatment: "", result: "" }
  ]);

  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const DEFAULT_POSITION = 'อาจารย์ผู้ดูแลหอ';
  const [dormitoryOther, setDormitoryOther] = useState("");
  const DORMITORY_OPTIONS = ['หอพักชมจันทร์', 'หอพักพุทธรักษา', 'หอราชาวดี', 'อื่น ๆ'];
  const [selectedDormOption, setSelectedDormOption] = useState<string>("");

  useEffect(() => {
    // ดึงชื่ออาจารย์เวรที่เคยกรอก (distinct)
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from('duty_reports')
        .select('teacher_name')
        .neq('teacher_name', '')
        .order('teacher_name', { ascending: true });
      if (!error && data) {
        const names = Array.from(new Set(data.map((d: any) => d.teacher_name)));
        setTeacherOptions(names);
      }
    };
    fetchTeachers();

    // ตรวจสอบว่ามีข้อมูลรายงานที่ส่งมาจากหน้า Reports หรือไม่
    if (location.state?.report) {
      const report = location.state.report;
      setIsEditing(true);
      setEditingReportId(report.id);
      
      // เติมข้อมูลรายงานหลัก
      setReportData({
        date: report.date,
        teacherName: report.teacher_name || "",
        startTime: report.start_time || "",
        endTime: report.end_time || "",
        replacingTeacher: report.replacing_teacher || "",
        dormitory: report.dormitory || "",
        cleanlinessGood: report.cleanliness_good || "",
        cleanlinessNeedImprovement: report.cleanliness_need_improvement || "",
        studentBehavior: report.student_behavior || "",
        teacherSignature: report.teacher_signature || "",
        teacherPosition: report.teacher_position || "",
        deputyDirectorSignature: report.deputy_director_signature || "",
        directorSignature: report.director_signature || ""
      });

      // จัดการค่า 'หอพัก' กรณีมีค่าที่ไม่อยู่ในรายการ ให้เลือกเป็น "อื่น ๆ" และใส่ค่าเดิมในช่องกรอก
      const dorm = (report.dormitory || '').trim();
      if (dorm) {
        if (DORMITORY_OPTIONS.includes(dorm)) {
          setSelectedDormOption(dorm);
          if (dorm !== 'อื่น ๆ') setDormitoryOther("");
        } else {
          setSelectedDormOption('อื่น ๆ');
          setDormitoryOther(dorm);
        }
      } else {
        setSelectedDormOption("");
        setDormitoryOther("");
      }

      // เติมข้อมูลนักศึกษา
      if (report.student_data && report.student_data.length > 0) {
        const toNum = (v: any) => Number(v ?? 0) || 0;
        const formattedStudentData = report.student_data.map((data: any) => {
          const femaleCount = toNum(data.female_count);
          const maleCount = toNum(data.male_count);
          const totalCount = femaleCount + maleCount; // recompute
          const femaleSignOut = toNum(data.female_sign_out);
          const maleSignOut = toNum(data.male_sign_out);
          const femaleEmergencyStay = toNum(data.female_emergency_stay);
          const maleEmergencyStay = toNum(data.male_emergency_stay);
          const femaleNotStayingOut = toNum(data.female_not_staying_out);
          const maleNotStayingOut = toNum(data.male_not_staying_out);
          const femaleRemaining = femaleCount - femaleSignOut - femaleEmergencyStay - femaleNotStayingOut; // recompute
          const maleRemaining = maleCount - maleSignOut - maleEmergencyStay - maleNotStayingOut; // recompute
          return {
            year: String(data.year ?? ''),
            femaleCount,
            maleCount,
            totalCount,
            femaleSignOut,
            maleSignOut,
            femaleEmergencyStay,
            maleEmergencyStay,
            femaleNotStayingOut,
            maleNotStayingOut,
            femaleRemaining,
            maleRemaining,
          };
        });
        setStudentData(formattedStudentData);
      }

      // เติมข้อมูลสุขภาพ
      if (report.health_records && report.health_records.length > 0) {
        const formattedHealthRecords = report.health_records.map((record: any, index: number) => ({
          id: index + 1,
          name: record.name || "",
          year: record.year || "",
          symptoms: record.symptoms || "",
          treatment: record.treatment || "",
          result: record.result || ""
        }));
        setHealthRecords(formattedHealthRecords);
      }
    }
  }, [location.state]);

  const updateStudentData = (index: number, field: keyof StudentData, value: number) => {
    const newData = [...studentData];
    const prevRow = { ...newData[index] };
    const prevValue = (newData[index] as any)[field];
    (newData[index] as any)[field] = value;

    // Per-gender guards: each female/male field cannot exceed its gender count,
    // and the sum of female-only or male-only category fields cannot exceed its gender count
    const femaleCount = newData[index].femaleCount || 0;
    const maleCount = newData[index].maleCount || 0;

    const femaleFields: (keyof StudentData)[] = ['femaleSignOut', 'femaleEmergencyStay', 'femaleNotStayingOut'];
    const maleFields: (keyof StudentData)[] = ['maleSignOut', 'maleEmergencyStay', 'maleNotStayingOut'];

    const isFemaleField = femaleFields.includes(field);
    const isMaleField = maleFields.includes(field);

    if (isFemaleField) {
      // individual field bound
      if (((newData[index] as any)[field] || 0) > femaleCount) {
        Swal.fire({
          icon: 'error',
          title: 'ใส่จำนวนไม่ถูกต้อง',
          text: 'จำนวนที่กรอก (หญิง) เกินกว่าจำนวนนักศึกษาหญิงในแถวนั้น',
          confirmButtonColor: '#ec4899'
        });
        (newData[index] as any)[field] = prevValue;
      }
      // female category sum bound
      const femaleSum =
        (newData[index].femaleSignOut || 0) +
        (newData[index].femaleEmergencyStay || 0) +
        (newData[index].femaleNotStayingOut || 0);
      if (femaleSum > femaleCount) {
        Swal.fire({
          icon: 'error',
          title: 'ใส่จำนวนไม่ถูกต้อง',
          text: 'ผลรวมช่อง (หญิง) เกินกว่าจำนวนนักศึกษาหญิงในแถวนั้น',
          confirmButtonColor: '#ec4899'
        });
        (newData[index] as any)[field] = prevValue;
      }
    }

    if (isMaleField) {
      // individual field bound
      if (((newData[index] as any)[field] || 0) > maleCount) {
        Swal.fire({
          icon: 'error',
          title: 'ใส่จำนวนไม่ถูกต้อง',
          text: 'จำนวนที่กรอก (ชาย) เกินกว่าจำนวนนักศึกษาชายในแถวนั้น',
          confirmButtonColor: '#ec4899'
        });
        (newData[index] as any)[field] = prevValue;
      }
      // male category sum bound
      const maleSum =
        (newData[index].maleSignOut || 0) +
        (newData[index].maleEmergencyStay || 0) +
        (newData[index].maleNotStayingOut || 0);
      if (maleSum > maleCount) {
        Swal.fire({
          icon: 'error',
          title: 'ใส่จำนวนไม่ถูกต้อง',
          text: 'ผลรวมช่อง (ชาย) เกินกว่าจำนวนนักศึกษาชายในแถวนั้น',
          confirmButtonColor: '#ec4899'
        });
        (newData[index] as any)[field] = prevValue;
      }
    }

    // Auto calculate totals and remaining
    if (field === 'femaleCount' || field === 'maleCount') {
      newData[index].totalCount = newData[index].femaleCount + newData[index].maleCount;
    }
    if (
      field === 'femaleCount' || field === 'maleCount' ||
      field === 'femaleSignOut' || field === 'maleSignOut' ||
      field === 'femaleEmergencyStay' || field === 'maleEmergencyStay' ||
      field === 'femaleNotStayingOut' || field === 'maleNotStayingOut'
    ) {
      newData[index].femaleRemaining =
        newData[index].femaleCount -
        newData[index].femaleSignOut -
        newData[index].femaleEmergencyStay -
        newData[index].femaleNotStayingOut;
      newData[index].maleRemaining =
        newData[index].maleCount -
        newData[index].maleSignOut -
        newData[index].maleEmergencyStay -
        newData[index].maleNotStayingOut;
    }

    // Validate: Sum of category columns must not exceed totalCount
    const isCategoryField = (
      field === 'femaleSignOut' || field === 'maleSignOut' ||
      field === 'femaleEmergencyStay' || field === 'maleEmergencyStay' ||
      field === 'femaleNotStayingOut' || field === 'maleNotStayingOut'
    );
    if (isCategoryField) {
      const total = newData[index].totalCount;
      const catSum =
        (newData[index].femaleSignOut || 0) +
        (newData[index].maleSignOut || 0) +
        (newData[index].femaleEmergencyStay || 0) +
        (newData[index].maleEmergencyStay || 0) +
        (newData[index].femaleNotStayingOut || 0) +
        (newData[index].maleNotStayingOut || 0);
      if (total <= 0) {
        // Require entering female/male counts first
        Swal.fire({
          icon: 'warning',
          title: `แถวชั้นปี ${newData[index].year}: โปรดกรอกจำนวนนักศึกษาหญิงและชายก่อน`,
          text: 'กรุณาใส่จำนวนหญิง/ชาย ให้รวมกันมากกว่า 0 ก่อนกรอกคอลัมน์ด้านขวา',
          confirmButtonColor: '#ec4899'
        });
        // revert
        (newData[index] as any)[field] = prevValue;
      } else if (catSum > total) {
        const detail = `หญิง:${newData[index].femaleSignOut + newData[index].femaleEmergencyStay + newData[index].femaleNotStayingOut} ` +
                       `ชาย:${newData[index].maleSignOut + newData[index].maleEmergencyStay + newData[index].maleNotStayingOut} ` +
                       `(รวม:${catSum}) > ทั้งหมด:${total}`;
        Swal.fire({
          icon: 'error',
          title: `แถวชั้นปี ${newData[index].year}: ใส่จำนวนไม่ถูกต้อง` ,
          text: `ผลรวมของช่องด้านขวาเกินจำนวนนักศึกษาทั้งหมดของแถวนั้น\n${detail}`,
          confirmButtonColor: '#ec4899'
        });
        // revert
        (newData[index] as any)[field] = prevValue;
        // Recompute remaining after revert
        newData[index].femaleRemaining =
          newData[index].femaleCount -
          newData[index].femaleSignOut -
          newData[index].femaleEmergencyStay -
          newData[index].femaleNotStayingOut;
        newData[index].maleRemaining =
          newData[index].maleCount -
          newData[index].maleSignOut -
          newData[index].maleEmergencyStay -
          newData[index].maleNotStayingOut;
      }
    }

    setStudentData(newData);
  };

  const addHealthRecord = () => {
    const newId = Math.max(...healthRecords.map(r => r.id)) + 1;
    setHealthRecords([...healthRecords, { id: newId, name: "", year: "", symptoms: "", treatment: "", result: "" }]);
  };

  const updateHealthRecord = (id: number, field: keyof HealthRecord, value: string) => {
    setHealthRecords(prev => prev.map(record => 
      record.id === id ? { ...record, [field]: value } : record
    ));
  };

  const removeHealthRecord = (id: number) => {
    if (healthRecords.length > 1) {
      setHealthRecords(prev => prev.filter(record => record.id !== id));
    }
  };

  const filteredHealthRecords = healthRecords.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.year.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!reportData.teacherName || !reportData.date) {
        throw new Error('กรุณากรอกชื่ออาจารย์เวรและวันที่ให้ครบถ้วน');
      }

      // Normalize student rows to numbers and recompute derived fields
      const norm = studentData.map((r) => {
        const femaleCount = Number(r.femaleCount || 0);
        const maleCount = Number(r.maleCount || 0);
        const totalCount = femaleCount + maleCount;
        const femaleSignOut = Number(r.femaleSignOut || 0);
        const maleSignOut = Number(r.maleSignOut || 0);
        const femaleEmergencyStay = Number(r.femaleEmergencyStay || 0);
        const maleEmergencyStay = Number(r.maleEmergencyStay || 0);
        const femaleNotStayingOut = Number(r.femaleNotStayingOut || 0);
        const maleNotStayingOut = Number(r.maleNotStayingOut || 0);
        const femaleRemaining = femaleCount - femaleSignOut - femaleEmergencyStay - femaleNotStayingOut;
        const maleRemaining = maleCount - maleSignOut - maleEmergencyStay - maleNotStayingOut;
        return {
          year: r.year,
          femaleCount,
          maleCount,
          totalCount,
          femaleSignOut,
          maleSignOut,
          femaleEmergencyStay,
          maleEmergencyStay,
          femaleNotStayingOut,
          maleNotStayingOut,
          femaleRemaining,
          maleRemaining,
        } as StudentData;
      });

      // Validate student rows: require female/male first and categories sum must equal total
      for (let i = 0; i < norm.length; i++) {
        const r = norm[i];
        const total = (r.femaleCount || 0) + (r.maleCount || 0);
        const catSum =
          (r.femaleSignOut || 0) +
          (r.maleSignOut || 0) +
          (r.femaleEmergencyStay || 0) +
          (r.maleEmergencyStay || 0) +
          (r.femaleNotStayingOut || 0) +
          (r.maleNotStayingOut || 0);
        if (total <= 0) {
          throw new Error(`แถวชั้นปี ${r.year}: โปรดกรอกจำนวนนักศึกษาหญิงและชายก่อน`);
        }
        const femaleSum =
          (r.femaleSignOut || 0) +
          (r.femaleEmergencyStay || 0) +
          (r.femaleNotStayingOut || 0);
        const maleSum =
          (r.maleSignOut || 0) +
          (r.maleEmergencyStay || 0) +
          (r.maleNotStayingOut || 0);
        if (femaleSum > (r.femaleCount || 0)) {
          throw new Error(`แถวชั้นปี ${r.year}: ผลรวมช่อง (หญิง) เกินจำนวนนักศึกษาหญิงทั้งหมด`);
        }
        if (maleSum > (r.maleCount || 0)) {
          throw new Error(`แถวชั้นปี ${r.year}: ผลรวมช่อง (ชาย) เกินจำนวนนักศึกษาชายทั้งหมด`);
        }
        if ((r.femaleSignOut || 0) > (r.femaleCount || 0)) {
          throw new Error(`แถวชั้นปี ${r.year}: จำนวนนักศึกษาที่เซ็นออก (หญิง) เกินกว่าจำนวนนักศึกษาหญิงทั้งหมด`);
        }
        if ((r.maleSignOut || 0) > (r.maleCount || 0)) {
          throw new Error(`แถวชั้นปี ${r.year}: จำนวนนักศึกษาที่เซ็นออก (ชาย) เกินกว่าจำนวนนักศึกษาชายทั้งหมด`);
        }
        if (catSum > total) {
          throw new Error(`แถวชั้นปี ${r.year}: ผลรวมช่องด้านขวา (${catSum}) เกินจำนวนนักศึกษาทั้งหมด (${total})`);
        }
        if (catSum !== total) {
          throw new Error(`แถวชั้นปี ${r.year}: ผลรวมช่องด้านขวา (${catSum}) ต้องเท่ากับจำนวนนักศึกษาทั้งหมด (${total})`);
        }
      }

      // Check Supabase connection first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('❌ ไม่พบการตั้งค่า Supabase\nกรุณาสร้างไฟล์ .env.local และตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY\nดูคำแนะนำใน SUPABASE_SETUP.md');
      }

      if (supabaseUrl === 'your_supabase_project_url' || supabaseKey === 'your_supabase_anon_key') {
        throw new Error('❌ กรุณาเปลี่ยนค่า Supabase URL และ Key ให้เป็นค่าจริง\nไม่ใช่ค่า placeholder');
      }

      Swal.fire({
        title: isEditing ? 'กำลังอัปเดตข้อมูล...' : 'กำลังบันทึกข้อมูล...',
        text: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      console.log('🔍 เริ่มบันทึกข้อมูลลง Supabase...');
      console.log('🌐 Supabase URL:', supabaseUrl);
      console.log('🔑 Supabase Key:', supabaseKey ? '✅ มีค่า' : '❌ ไม่มีค่า');
      console.log('📊 ข้อมูลรายงาน:', reportData);
      console.log('👥 ข้อมูลนักศึกษา:', studentData);
      console.log('🏥 ข้อมูลสุขภาพ:', healthRecords);

      let reportId: string;

      if (isEditing && editingReportId) {
        // อัปเดตข้อมูลรายงานที่มีอยู่
        console.log('📝 อัปเดตข้อมูลรายงานหลัก...');
        const { data: reportResult, error: reportError } = await supabase
          .from('duty_reports')
          .update({
            date: reportData.date,
            teacher_name: reportData.teacherName,
            start_time: (reportData.startTime || '').trim() || '18.00',
            end_time: (reportData.endTime || '').trim() || '06.00',
            replacing_teacher: (reportData.replacingTeacher || '').trim() || '',
            dormitory: reportData.dormitory,
            cleanliness_good: reportData.cleanlinessGood,
            cleanliness_need_improvement: reportData.cleanlinessNeedImprovement,
            student_behavior: reportData.studentBehavior,
            teacher_signature: reportData.teacherSignature,
            teacher_position: (reportData.teacherPosition || '').trim() || DEFAULT_POSITION,
            deputy_director_signature: reportData.deputyDirectorSignature,
            director_signature: reportData.directorSignature
          })
          .eq('id', editingReportId)
          .select()
          .single();

        if (reportError) {
          console.error('❌ ข้อผิดพลาดในการอัปเดตรายงาน:', reportError);
          throw new Error(`เกิดข้อผิดพลาดในการอัปเดตรายงาน: ${reportError.message}`);
        }

        reportId = editingReportId;
        console.log('✅ อัปเดตข้อมูลรายงานสำเร็จ, ID:', reportId);

        // ลบข้อมูลเก่า
        await supabase.from('student_data').delete().eq('report_id', reportId);
        await supabase.from('health_records').delete().eq('report_id', reportId);
      } else {
        // เพิ่มข้อมูลรายงานใหม่
        console.log('📝 บันทึกข้อมูลรายงานหลัก...');
        const { data: reportResult, error: reportError } = await supabase
          .from('duty_reports')
          .insert({
            date: reportData.date,
            teacher_name: reportData.teacherName,
            start_time: (reportData.startTime || '').trim() || '18.00',
            end_time: (reportData.endTime || '').trim() || '06.00',
            replacing_teacher: (reportData.replacingTeacher || '').trim() || '',
            dormitory: reportData.dormitory,
            cleanliness_good: reportData.cleanlinessGood,
            cleanliness_need_improvement: reportData.cleanlinessNeedImprovement,
            student_behavior: reportData.studentBehavior,
            teacher_signature: reportData.teacherSignature,
            teacher_position: (reportData.teacherPosition || '').trim() || DEFAULT_POSITION,
            deputy_director_signature: reportData.deputyDirectorSignature,
            director_signature: reportData.directorSignature
          })
          .select()
          .single();

        if (reportError) {
          console.error('❌ ข้อผิดพลาดในการบันทึกรายงาน:', reportError);
          throw new Error(`เกิดข้อผิดพลาดในการบันทึกรายงาน: ${reportError.message}`);
        }

        reportId = reportResult.id;
        console.log('✅ บันทึกข้อมูลรายงานสำเร็จ, ID:', reportId);
      }

            // Insert student data
      console.log('👥 บันทึกข้อมูลนักศึกษา...');
      const studentDataToInsert = norm.map(data => ({
        report_id: reportId,
        year: data.year,
        female_count: data.femaleCount,
        male_count: data.maleCount,
        total_count: data.totalCount,
        female_sign_out: data.femaleSignOut,
        male_sign_out: data.maleSignOut,
        female_emergency_stay: data.femaleEmergencyStay,
        male_emergency_stay: data.maleEmergencyStay,
        female_not_staying_out: data.femaleNotStayingOut,
        male_not_staying_out: data.maleNotStayingOut,
        female_remaining: data.femaleRemaining,
        male_remaining: data.maleRemaining
      }));

      const { error: studentError } = await supabase
        .from('student_data')
        .insert(studentDataToInsert);

      if (studentError) {
        console.error('❌ ข้อผิดพลาดในการบันทึกข้อมูลนักศึกษา:', studentError);
        throw new Error(`เกิดข้อผิดพลาดในการบันทึกข้อมูลนักศึกษา: ${studentError.message}`);
      }
      
      console.log('✅ บันทึกข้อมูลนักศึกษาสำเร็จ');

      // Insert health records (filter out empty records)
      const validHealthRecords = healthRecords.filter(record => 
        record.name.trim() || record.symptoms.trim() || record.treatment.trim() || record.result.trim()
      );

      if (validHealthRecords.length > 0) {
        console.log('🏥 บันทึกข้อมูลสุขภาพ...');
        const healthDataToInsert = validHealthRecords.map(record => ({
          report_id: reportId,
          name: record.name,
          year: record.year,
          symptoms: record.symptoms,
          treatment: record.treatment,
          result: record.result
        }));

        const { error: healthError } = await supabase
          .from('health_records')
          .insert(healthDataToInsert);
        
        if (healthError) {
          console.error('❌ ข้อผิดพลาดในการบันทึกข้อมูลสุขภาพ:', healthError);
          throw new Error(`เกิดข้อผิดพลาดในการบันทึกข้อมูลสุขภาพ: ${healthError.message}`);
        }
        
        console.log('✅ บันทึกข้อมูลสุขภาพสำเร็จ');
      } else {
        console.log('ℹ️ ไม่มีข้อมูลสุขภาพที่ต้องบันทึก');
      }

      console.log('🎉 บันทึกข้อมูลทั้งหมดสำเร็จ!');
      
          Swal.fire({
            icon: 'success',
        title: isEditing ? 'อัปเดตสำเร็จ!' : 'บันทึกสำเร็จ!',
        text: isEditing ? 'ข้อมูลได้ถูกอัปเดตเรียบร้อยแล้ว' : 'ข้อมูลได้ถูกบันทึกลงในฐานข้อมูลเรียบร้อยแล้ว',
            confirmButtonColor: '#ec4899'
      }).then(() => {
        // หลังจากบันทึกสำเร็จ ให้กลับไปหน้า Reports
        navigate('/reports');
      });

    } catch (error) {
      console.error('Save error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#ec4899'
      });
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-secondary p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-6"
          variants={itemVariants}
        >
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Button>
          <Button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
          </Button>
        </motion.div>

        {/* Report Header */}
        <motion.div variants={cardVariants}>
        <Card className="mb-6 shadow-elegant">
          <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-center text-2xl font-bold text-blue-500">
              วิทยาลัยพยาบาลบรมราชชนนี อุดรธานี
            </CardTitle>
              <p className="text-center text-lg text-blue-500">
                {isEditing ? 'แก้ไขรายงานสรุปผลการปฏิบัติหน้าที่ของอาจารย์เวร' : 'รายงานสรุปผลการปฏิบัติหน้าที่ของอาจารย์เวร'}
              </p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">วันที่</Label>
                <Input
                  id="date"
                  type="date"
                  value={reportData.date}
                  onChange={(e) => setReportData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="teacherPosition">ตำแหน่ง</Label>
                <Input
                  id="teacherPosition"
                  placeholder="ไม่กรอกจะใช้: อาจารย์ผู้ดูแลหอ"
                  value={reportData.teacherPosition}
                  onChange={(e) => setReportData(prev => ({ ...prev, teacherPosition: e.target.value }))}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!v) setReportData(prev => ({ ...prev, teacherPosition: DEFAULT_POSITION }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="teacherName">ชื่ออาจารย์เวร</Label>
                  <Select
                    value={reportData.teacherName}
                    onValueChange={(value) => setReportData(prev => ({ ...prev, teacherName: value }))}
                  >
                    <SelectTrigger id="teacherName">
                      <SelectValue placeholder="เลือกหรือพิมพ์ชื่ออาจารย์เวร" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherOptions.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Input
                    className="mt-2"
                    placeholder="หรือพิมพ์ชื่อใหม่..."
                  value={reportData.teacherName}
                  onChange={(e) => setReportData(prev => ({ ...prev, teacherName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="startTime">เวลาเริ่มเวร</Label>
                <Input
                  id="startTime"
                  placeholder="เช่น 18.00"
                  value={reportData.startTime}
                  onChange={(e) => setReportData(prev => ({ ...prev, startTime: e.target.value }))}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    setReportData(prev => ({ ...prev, startTime: v || '18.00' }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="endTime">เวลาสิ้นสุดเวร</Label>
                <Input
                  id="endTime"
                  placeholder="เช่น 06.00"
                  value={reportData.endTime}
                  onChange={(e) => setReportData(prev => ({ ...prev, endTime: e.target.value }))}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    setReportData(prev => ({ ...prev, endTime: v || '06.00' }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="replacingTeacher">แทนอาจารย์</Label>
                <Input
                  id="replacingTeacher"
                  placeholder="ถ้าไม่มี ให้เว้นว่าง"
                  value={reportData.replacingTeacher}
                  onChange={(e) => setReportData(prev => ({ ...prev, replacingTeacher: e.target.value }))}
                  onBlur={(e) => setReportData(prev => ({ ...prev, replacingTeacher: e.target.value.trim() }))}
                />
              </div>
              <div>
                <Label htmlFor="dormitory">หอพัก</Label>
                  <Select
                    value={selectedDormOption}
                    onValueChange={(value) => {
                      setSelectedDormOption(value);
                      if (value === 'อื่น ๆ') {
                        setReportData(prev => ({ ...prev, dormitory: (dormitoryOther || '').trim() }));
                      } else {
                        setReportData(prev => ({ ...prev, dormitory: value }));
                        setDormitoryOther("");
                      }
                    }}
                  >
                    <SelectTrigger id="dormitory">
                      <SelectValue placeholder="เลือกหอพัก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="หอพักชมจันทร์">หอพักชมจันทร์</SelectItem>
                      <SelectItem value="หอพักพุทธรักษา">หอพักพุทธรักษา</SelectItem>
                      <SelectItem value="หอราชาวดี">หอราชาวดี</SelectItem>
                      <SelectItem value="อื่น ๆ">อื่น ๆ</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedDormOption === "อื่น ๆ" && (
                <Input
                      className="mt-2"
                      placeholder="กรอกชื่อหอพัก..."
                      value={dormitoryOther}
                      onChange={(e) => {
                        setDormitoryOther(e.target.value);
                        setReportData(prev => ({ ...prev, dormitory: e.target.value }));
                      }}
                />
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Student Count Table */}
        <motion.div variants={cardVariants}>
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <CardTitle>1. รายงานจำนวนนักศึกษาที่พักอาศัยอยู่ในหอพักของวิทยาลัย</CardTitle>
          </CardHeader>
          <CardContent>
                          <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ border: '2px solid #000000', borderCollapse: 'collapse' }}>
                {/* Table Header - Perfect Match to Image */}
                <thead>
                  {/* First Header Row - Main headers with rowSpan=3 */}
                  <tr style={{ backgroundColor: '#e5e7eb' }}>
                    <th rowSpan={3} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>ชั้นปีที่/รุ่นที่</th>
                    <th rowSpan={3} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>จำนวนนักศึกษาหญิง</th>
                    <th rowSpan={3} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>จำนวนนักศึกษาชาย</th>
                    <th rowSpan={3} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>จำนวนนักศึกษาทั้งหมด</th>
                    <th colSpan={6} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>จำนวนนักศึกษาที่เซ็นออกหอพัก</th>
                    <th rowSpan={3} className="p-2 text-center" style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>รวมจำนวนนักศึกษาคงเหลือในหอพัก</th>
                  </tr>
                  {/* Second Header Row - Sub-categories with colSpan=2 */}
                  <tr style={{ backgroundColor: '#d1d5db' }}>
                    <th colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>พักค้างคืน</th>
                    <th colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>พักค้างคืนกรณีฉุกเฉิน</th>
                    <th colSpan={2} className="p-2 text-center" style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>ไม่พักค้างคืน</th>
                  </tr>
                  {/* Third Header Row - Individual gender columns */}
                  <tr style={{ backgroundColor: '#9ca3af' }}>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>หญิง</th>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>ชาย</th>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>หญิง</th>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>ชาย</th>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>หญิง</th>
                    <th className="p-2 text-center" style={{ backgroundColor: '#9ca3af', fontWeight: 'bold', border: '1px solid #000000', verticalAlign: 'middle', fontSize: '14px', padding: '8px', textAlign: 'center' }}>ชาย</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#ffffff' }}>
                  {studentData.map((data, index) => (
                      <motion.tr 
                        key={index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                      >
                      <td className="p-2 text-center font-medium" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px', fontSize: '14px' }}>{data.year}</td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          value={data.femaleCount || ''}
                          onChange={(e) => updateStudentData(index, 'femaleCount', parseInt(e.target.value) || 0)}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          value={data.maleCount || ''}
                          onChange={(e) => updateStudentData(index, 'maleCount', parseInt(e.target.value) || 0)}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                        {data.totalCount}
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.femaleCount}
                          value={data.femaleSignOut || ''}
                          onChange={(e) => updateStudentData(index, 'femaleSignOut', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.maleCount}
                          value={data.maleSignOut || ''}
                          onChange={(e) => updateStudentData(index, 'maleSignOut', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.femaleCount}
                          value={data.femaleEmergencyStay || ''}
                          onChange={(e) => updateStudentData(index, 'femaleEmergencyStay', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.maleCount}
                          value={data.maleEmergencyStay || ''}
                          onChange={(e) => updateStudentData(index, 'maleEmergencyStay', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.femaleCount}
                          value={data.femaleNotStayingOut || ''}
                          onChange={(e) => updateStudentData(index, 'femaleNotStayingOut', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2" style={{ border: '1px solid #000000', backgroundColor: '#ffffff', padding: '8px' }}>
                        <Input
                          type="number"
                          min="0"
                          max={data.maleCount}
                          value={data.maleNotStayingOut || ''}
                          onChange={(e) => updateStudentData(index, 'maleNotStayingOut', parseInt(e.target.value) || 0)}
                          disabled={data.totalCount <= 0}
                          className="text-center"
                          style={{ border: 'none', background: 'transparent', textAlign: 'center', width: '100%', fontSize: '14px' }}
                        />
                      </td>
                      <td className="p-2 text-center font-bold" style={{ border: '1px solid #000000', backgroundColor: '#d1d5db', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                        {Number(data.femaleNotStayingOut || 0) + Number(data.maleNotStayingOut || 0)}
                      </td>
                      </motion.tr>
                  ))}
                  {/* Total Row */}
                    <motion.tr 
                      className="bg-secondary font-bold"
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      style={{ backgroundColor: '#e5e7eb' }}
                    >
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>รวม</td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.femaleCount || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.maleCount || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.totalCount || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.femaleSignOut || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.maleSignOut || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.femaleEmergencyStay || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.maleEmergencyStay || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.femaleNotStayingOut || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.maleNotStayingOut || 0), 0)}
                    </td>
                    <td className="p-2 text-center" style={{ border: '1px solid #000000', backgroundColor: '#e5e7eb', fontWeight: 'bold', padding: '8px', fontSize: '14px' }}>
                      {studentData.reduce((sum, data) => sum + Number(data.femaleNotStayingOut || 0) + Number(data.maleNotStayingOut || 0), 0)}
                    </td>
                    </motion.tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Health Records */}
        <motion.div variants={cardVariants}>
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              2. รายงานการดูแลสุขภาพนักศึกษา
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาชื่อนักศึกษา..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={addHealthRecord} size="sm">
                  เพิ่มรายการ
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-secondary">
                    <th className="border border-border p-2">ลำดับ</th>
                    <th className="border border-border p-2">ชื่อ-สกุล</th>
                    <th className="border border-border p-2">ชั้นปีที่/รุ่น</th>
                    <th className="border border-border p-2">อาการ</th>
                    <th className="border border-border p-2">การรักษาที่ได้รับ</th>
                    <th className="border border-border p-2">ผลการรักษา</th>
                    <th className="border border-border p-2">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                  {filteredHealthRecords.map((record, index) => (
                        <motion.tr 
                          key={record.id}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                      <td className="border border-border p-2 text-center">{index + 1}</td>
                      <td className="border border-border p-2">
                        <Input
                          placeholder="ชื่อ-สกุล"
                          value={record.name}
                          onChange={(e) => updateHealthRecord(record.id, 'name', e.target.value)}
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          placeholder="ชั้นปี/รุ่น"
                          value={record.year}
                          onChange={(e) => updateHealthRecord(record.id, 'year', e.target.value)}
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          placeholder="อาการ"
                          value={record.symptoms}
                          onChange={(e) => updateHealthRecord(record.id, 'symptoms', e.target.value)}
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          placeholder="การรักษา"
                          value={record.treatment}
                          onChange={(e) => updateHealthRecord(record.id, 'treatment', e.target.value)}
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          placeholder="ผลการรักษา"
                          value={record.result}
                          onChange={(e) => updateHealthRecord(record.id, 'result', e.target.value)}
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeHealthRecord(record.id)}
                          disabled={healthRecords.length === 1}
                        >
                          ลบ
                        </Button>
                      </td>
                        </motion.tr>
                  ))}
                    </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Cleanliness Report */}
        <motion.div variants={cardVariants}>
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <CardTitle>3. รายงานสุ่มตรวจความสะอาดเรียบร้อยของหอพัก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cleanlinessGood">3.1 ตรวจพบความสะอาดเรียบร้อยระดับ (ดี, ดีมาก)</Label>
              <Textarea
                id="cleanlinessGood"
                placeholder="กรุณาระบุรายละเอียดความสะอาดที่ระดับดี..."
                value={reportData.cleanlinessGood}
                onChange={(e) => setReportData(prev => ({ ...prev, cleanlinessGood: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="cleanlinessNeedImprovement">3.2 ตรวจพบความสะอาดในระดับต้องปรับปรุงในแต่ละหอพัก</Label>
              <Textarea
                id="cleanlinessNeedImprovement"
                placeholder="กรุณาระบุรายละเอียดที่ต้องปรับปรุง..."
                value={reportData.cleanlinessNeedImprovement}
                onChange={(e) => setReportData(prev => ({ ...prev, cleanlinessNeedImprovement: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Student Behavior Report */}
        <motion.div variants={cardVariants}>
        <Card className="mb-6 shadow-elegant">
          <CardHeader>
            <CardTitle>4. รายงานพฤติกรรมของนักศึกษา</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="กรุณาระบุรายละเอียดพฤติกรรมของนักศึกษา..."
              value={reportData.studentBehavior}
              onChange={(e) => setReportData(prev => ({ ...prev, studentBehavior: e.target.value }))}
              rows={4}
            />
          </CardContent>
        </Card>
        </motion.div>

        

        {/* Save Button */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <Button 
            onClick={handleSave}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 shadow-glow text-blue-600"
          >
            <Save className="w-5 h-5 mr-2" />
            {isEditing ? 'อัปเดตรายงาน' : 'บันทึกรายงาน'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReportForm;