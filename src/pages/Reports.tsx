import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  User, 
  Building, 
  Clock, 
  Users, 
  Heart, 
  FileText, 
  Filter,
  Download,
  Eye,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Pencil,
  Printer,
  Trash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DutyReport, StudentData, HealthRecord } from "@/lib/supabase";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportWithDetails extends DutyReport {
  student_count?: number;
  health_count?: number;
  student_data?: StudentData[];
  health_records?: HealthRecord[];
  total_students?: number;
  total_health_issues?: number;
}

interface ReportStats {
  total_reports: number;
  total_students: number;
  total_health_issues: number;
  this_month_reports: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    total_reports: 0,
    total_students: 0,
    total_health_issues: 0,
    this_month_reports: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [selectedDate, setSelectedDate] = useState<string>("");// YYYY-MM-DD
  const [compactView, setCompactView] = useState<boolean>(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch main reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('duty_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        throw new Error(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${reportsError.message}`);
      }

      // Fetch additional data for each report
      const reportsWithDetails = await Promise.all(
        reportsData.map(async (report) => {
          // Get student data
          const { data: studentData } = await supabase
            .from('student_data')
            .select('*')
            .eq('report_id', report.id);

          // Get health records
          const { data: healthRecords } = await supabase
            .from('health_records')
            .select('*')
            .eq('report_id', report.id);

          const totalStudents = studentData?.reduce((sum, data) => sum + data.total_count, 0) || 0;
          const totalHealthIssues = healthRecords?.length || 0;

          return {
            ...report,
            student_count: studentData?.length || 0,
            health_count: healthRecords?.length || 0,
            student_data: studentData || [],
            health_records: healthRecords || [],
            total_students: totalStudents,
            total_health_issues: totalHealthIssues
          };
        })
      );

      setReports(reportsWithDetails);

      // Calculate stats
      const totalReports = reportsWithDetails.length;
      const totalStudents = reportsWithDetails.reduce((sum, report) => sum + (report.total_students || 0), 0);
      const totalHealthIssues = reportsWithDetails.reduce((sum, report) => sum + (report.total_health_issues || 0), 0);
      
      const thisMonth = new Date().getMonth();
      const thisMonthReports = reportsWithDetails.filter(report => 
        new Date(report.date).getMonth() === thisMonth
      ).length;

      setStats({
        total_reports: totalReports,
        total_students: totalStudents,
        total_health_issues: totalHealthIssues,
        this_month_reports: thisMonthReports
      });

    } catch (error) {
      console.error('Fetch error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลได้',
        confirmButtonColor: '#ec4899'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedReports = reports
    .filter(report => {
      const matchesSearch = 
        report.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.date.includes(searchTerm) ||
        report.dormitory?.toLowerCase().includes(searchTerm.toLowerCase());

      // Format as YYYY-MM-DD in local time to avoid timezone shifts
      const d = new Date(report.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const reportDateStr = `${y}-${m}-${day}`;
      const matchesDate = !selectedDate || reportDateStr === selectedDate;
      
      if (filterStatus === "all") return matchesSearch && matchesDate;
      if (filterStatus === "with_health") return matchesSearch && matchesDate && (report.health_count || 0) > 0;
      if (filterStatus === "this_month") {
        const thisMonth = new Date().getMonth();
        return matchesSearch && matchesDate && new Date(report.date).getMonth() === thisMonth;
      }
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "teacher":
          return a.teacher_name.localeCompare(b.teacher_name);
        case "students":
          return (b.total_students || 0) - (a.total_students || 0);
        case "health":
          return (b.health_count || 0) - (a.health_count || 0);
        default:
          return 0;
      }
    });

  // Limit and grid classes for compact view
  const displayedReports = compactView
    ? filteredAndSortedReports.slice(0, 31)
    : filteredAndSortedReports;

  const gridClasses = compactView
    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3"
    : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.replace(':', '.');
  };

  // For compact card stylized date (วัน เดือน ปี พ.ศ.)
  const formatDateParts = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleString('th-TH', { month: 'long' });
    const year = d.getFullYear() + 543; // Buddhist Era
    return { day, month, year };
  };

  const getStatusColor = (report: ReportWithDetails) => {
    if (report.health_count && report.health_count > 0) return "destructive";
    if (report.total_students && report.total_students > 100) return "secondary";
    return "default";
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
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2
      }
    }
  };

  const handleDeleteReport = async (report: ReportWithDetails) => {
    try {
      // loop until user cancels or passes the challenge
      // each failure regenerates a new code
      while (true) {
        const confirmCode = Math.floor(100000 + Math.random() * 900000).toString();
        const { value, isDismissed } = await Swal.fire({
          icon: 'warning',
          title: 'ยืนยันการลบรายงาน',
          html: `<div class="text-left">\n<p class="mb-2">การลบไม่สามารถย้อนกลับได้</p>\n<p class="mb-2">เพื่อยืนยัน โปรดพิมพ์รหัสต่อไปนี้:</p>\n<p class="font-mono text-lg font-bold">${confirmCode}</p></div>`,
          input: 'text',
          inputPlaceholder: 'พิมพ์รหัสให้ตรงกับด้านบน',
          showCancelButton: true,
          confirmButtonText: 'ยืนยันการลบ',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280',
          reverseButtons: true,
          allowOutsideClick: false
        });
        if (isDismissed) return; // user cancelled
        if ((value || '').trim() !== confirmCode) {
          await Swal.fire({
            icon: 'error',
            title: 'รหัสยืนยันไม่ถูกต้อง',
            text: 'ระบบจะสุ่มรหัสใหม่ โปรดลองอีกครั้ง',
            confirmButtonColor: '#ec4899'
          });
          continue; // regenerate and ask again
        }
        break; // correct code
      }

      // Delete main report; ON DELETE CASCADE will remove related rows
      const { error } = await supabase
        .from('duty_reports')
        .delete()
        .eq('id', report.id);
      if (error) throw new Error(error.message);

      // Close modal if it's open for this report
      setSelectedReport((prev) => (prev?.id === report.id ? null : prev));

      await Swal.fire({
        icon: 'success',
        title: 'ลบรายงานสำเร็จ',
        text: 'รายงานถูกลบออกจากระบบแล้ว',
        confirmButtonColor: '#10b981'
      });
      fetchReports();
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: error instanceof Error ? error.message : 'ไม่สามารถลบรายงานได้',
        confirmButtonColor: '#ec4899'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto" style={{ width: 220 }}>
            {/* Animated blue border */}
            <div className="absolute inset-0 rounded-2xl p-[3px] overflow-hidden">
              <div className="absolute inset-0 animate-spin rounded-2xl" style={{ background: 'conic-gradient(#60a5fa, #3b82f6, #93c5fd, #60a5fa)' }}></div>
              <div className="absolute inset-[3px] rounded-2xl bg-white"></div>
            </div>
            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden">
              <img src="/20.png" alt="โลโก้" className="block w-full h-auto" />
            </div>
          </div>
          <div>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-secondary p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลัก
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">รายงานการปฏิบัติหน้าที่</h1>
              <p className="text-muted-foreground">จัดการและดูรายงานการปฏิบัติหน้าที่ทั้งหมด</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchReports}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
            <Button 
              onClick={() => navigate("/report")}
              className="bg-gradient-primary hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              สร้างรายงานใหม่
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          variants={itemVariants}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">รายงานทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.total_reports}</p>
                </div>
                <FileText className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">ปัญหาสุขภาพ</p>
                  <p className="text-2xl font-bold">{stats.total_health_issues}</p>
                </div>
                <Heart className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">รายงานเดือนนี้</p>
                  <p className="text-2xl font-bold">{stats.this_month_reports}</p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="mb-6 space-y-4"
          variants={itemVariants}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาตามชื่ออาจารย์, วันที่, หรือหอพัก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full lg:w-64">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="with_health">มีปัญหาสุขภาพ</option>
                <option value="this_month">เดือนนี้</option>
              </select>
              <label className="flex items-center gap-2 text-sm px-3 py-2 border border-input rounded-md bg-background">
                <input
                  type="checkbox"
                  checked={compactView}
                  onChange={(e) => setCompactView(e.target.checked)}
                />
                มุมมองแบบเดือน (สูงสุด 31 รายการ)
              </label>
            </div>
          </div>
        </motion.div>

        {/* Reports Grid */}
        <div className={gridClasses}>
          <AnimatePresence>
            {displayedReports.map((report, index) => (
              <motion.div
                key={report.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                exit="hidden"
                onClick={() => setSelectedReport(report)}
              >
                <Card className={`cursor-pointer transition-all duration-300 border-l-4 border-l-primary ${compactView ? 'rounded-xl shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/20 bg-white/90 backdrop-blur' : 'shadow-elegant hover:shadow-glow'}`}>
                  <CardHeader className={compactView ? "pb-2 pt-3" : "pb-3"}>
                    {compactView ? (
                      <div className="space-y-2">
                        {/* Top action row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-emerald-600 hover:text-emerald-700"
                              title="พิมพ์/ส่งออก PDF"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintPDF(report);
                              }}
                            >
                              <Printer className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-amber-600 hover:text-amber-700"
                              title="แก้ไขรายงาน"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/report", { state: { report } });
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-rose-600 hover:text-rose-700"
                              title="ลบรายงาน"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDeleteReport(report);
                              }}
                            >
                              <Trash className="w-3 h-3" />
                            </Button>
                          </div>
                          <Badge variant={getStatusColor(report)} className="ml-1">
                            {report.health_count && report.health_count > 0 ? (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {report.health_count && report.health_count > 0 ? 'มีปัญหาสุขภาพ' : 'ปกติ'}
                          </Badge>
                        </div>
                        {/* Date row: day - month - year */}
                        {(() => {
                          const { day, month, year } = formatDateParts(report.date);
                          return (
                            <div className="flex items-baseline justify-between text-foreground">
                              <span className="text-2xl font-bold leading-none">{day}</span>
                              <span className="text-base font-semibold">{month}</span>
                              <span className="text-xl font-bold leading-none">{year}</span>
                            </div>
                          );
                        })()}
                        {/* Teacher */}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {report.teacher_name}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {formatDate(report.date)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            สร้างเมื่อ {new Date(report.created_at || '').toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(report)} className="ml-1">
                          {report.health_count && report.health_count > 0 ? (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {report.health_count && report.health_count > 0 ? 'มีปัญหาสุขภาพ' : 'ปกติ'}
                        </Badge>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Teacher Info */}
                      {!compactView && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <User className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold text-sm">{report.teacher_name}</p>
                            <p className="text-xs text-muted-foreground">{report.teacher_position}</p>
                          </div>
                        </div>
                      )}

                      {/* Time and Location */}
                      {compactView ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                            <Clock className="w-3 h-3" />
                            {formatTime(report.start_time)} - {formatTime(report.end_time)}
                          </span>
                          {report.dormitory && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                              <Building className="w-3 h-3" />
                              {report.dormitory}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="font-medium">{formatTime(report.start_time)} - {formatTime(report.end_time)}</p>
                              <p className="text-xs text-muted-foreground">ถึง {formatTime(report.end_time)}</p>
                            </div>
                          </div>
                          {report.dormitory && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <div className="text-sm">
                                <p className="font-medium">{report.dormitory}</p>
                                <p className="text-xs text-muted-foreground">หอพัก</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      {compactView ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-2 rounded-md bg-blue-50">
                            <p className="text-base font-bold text-blue-600 leading-none text-left pl-1">{report.total_students || 0}</p>
                            <p className="text-[10px] text-blue-600 mt-1 text-left pl-1">นศ.ทั้งหมด</p>
                          </div>
                          <div className="p-2 rounded-md bg-green-50">
                            <p className="text-sm font-bold text-green-600 leading-none text-left pl-1">{report.health_count || 0}</p>
                            <p className="text-[10px] text-green-600 mt-1 text-left pl-1">สุขภาพ</p>
                          </div>
                          <div className="p-2 rounded-md bg-orange-50">
                            <p className="text-sm font-bold text-orange-600 leading-none text-left pl-1">{report.student_count || 0}</p>
                            <p className="text-[10px] text-orange-600 mt-1 text-left pl-1">รายการ</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-xl font-bold text-blue-600">{report.total_students || 0}</p>
                            <p className="text-xs text-blue-600">นศ.ทั้งหมด</p>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-bold text-green-600">{report.health_count || 0}</p>
                            <p className="text-xs text-green-600">สุขภาพ</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-sm font-bold text-orange-600">{report.student_count || 0}</p>
                            <p className="text-xs text-orange-600">รายการ</p>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {!compactView && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            ดูรายละเอียด
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDeleteReport(report);
                            }}
                          >
                            <Trash className="w-3 h-3 mr-1" />
                            ลบรายงาน
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAndSortedReports.length === 0 && (
          <motion.div 
            className="text-center py-12"
            variants={itemVariants}
          >
            <div className="max-w-md mx-auto">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'ไม่พบรายงานที่ตรงกับการค้นหา' : 'ยังไม่มีรายงานที่บันทึกไว้'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง' : 'เริ่มต้นด้วยการสร้างรายงานแรกของคุณ'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate("/report")}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างรายงานแรก
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Report Detail Modal */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
              >
                <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg sticky top-0 z-10">
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl">รายละเอียดรายงาน</h2>
                      <p className="text-sm opacity-90 mt-1">{formatDate(selectedReport.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintPDF(selectedReport)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-500/30"
                      >
                        <Printer className="w-4 h-4 mr-1 text-white" />
                        พิมพ์/ส่งออก PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(null);
                          navigate("/report", { state: { report: selectedReport } });
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30"
                      >
                        <Pencil className="w-4 h-4 mr-1 text-white" />
                        แก้ไขข้อมูล
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (selectedReport) await handleDeleteReport(selectedReport);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/30"
                      >
                        <Trash className="w-4 h-4 mr-1 text-white" />
                        ลบรายงาน
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedReport(null)}
                        className="text-primary-foreground hover:bg-primary-foreground/20"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="font-semibold text-sm text-muted-foreground">อาจารย์เวร</Label>
                          <p className="text-lg font-medium">{selectedReport.teacher_name}</p>
                          {selectedReport.teacher_position && (
                            <p className="text-sm text-muted-foreground">{selectedReport.teacher_position}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="font-semibold text-sm text-muted-foreground">เวลาเวร</Label>
                          <p className="text-lg">{formatTime(selectedReport.start_time)} - {formatTime(selectedReport.end_time)}</p>
                        </div>
                        
                        {selectedReport.dormitory && (
                          <div>
                            <Label className="font-semibold text-sm text-muted-foreground">หอพัก</Label>
                            <p className="text-lg">{selectedReport.dormitory}</p>
                          </div>
                        )}
                        
                        {selectedReport.replacing_teacher && (
                          <div>
                            <Label className="font-semibold text-sm text-muted-foreground">แทนอาจารย์</Label>
                            <p className="text-lg">{selectedReport.replacing_teacher}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{selectedReport.total_students || 0}</p>
                          <p className="text-sm text-blue-600">นักศึกษาทั้งหมด</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-xl font-bold text-green-600">{selectedReport.health_count || 0}</p>
                            <p className="text-xs text-green-600">ปัญหาสุขภาพ</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <p className="text-xl font-bold text-orange-600">{selectedReport.student_count || 0}</p>
                            <p className="text-xs text-orange-600">รายการข้อมูล</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Student Data */}
                    {selectedReport.student_data && selectedReport.student_data.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          รายงานจำนวนนักศึกษาที่พักอาศัยอยู่ในหอพักของวิทยาลัย
                        </h3>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="min-w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr className="text-left">
                                <th className="px-4 py-3 font-semibold">ชั้นปี</th>
                                <th className="px-4 py-3 font-semibold">พักอาศัย (หญิง)</th>
                                <th className="px-4 py-3 font-semibold">พักอาศัย (ชาย)</th>
                                <th className="px-4 py-3 font-semibold">พักอาศัย (รวม)</th>
                                <th className="px-4 py-3 font-semibold">เซ็นออก (หญิง)</th>
                                <th className="px-4 py-3 font-semibold">เซ็นออก (ชาย)</th>
                                <th className="px-4 py-3 font-semibold">เซ็นออก (รวม)</th>
                                <th className="px-4 py-3 font-semibold">ค้างคืน (หญิง)</th>
                                <th className="px-4 py-3 font-semibold">ค้างคืน (ชาย)</th>
                                <th className="px-4 py-3 font-semibold">ค้างคืน (รวม)</th>
                                <th className="px-4 py-3 font-semibold">รวมทั้งหมด</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedReport.student_data.map((data, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-4 py-3 font-medium">ชั้นปีที่ {data.year}</td>
                                  <td className="px-4 py-3 text-blue-600">{data.female_count}</td>
                                  <td className="px-4 py-3 text-green-600">{data.male_count}</td>
                                  <td className="px-4 py-3 font-semibold">{data.female_count + data.male_count}</td>
                                  <td className="px-4 py-3 text-orange-600">{data.female_sign_out}</td>
                                  <td className="px-4 py-3 text-yellow-600">{data.male_sign_out}</td>
                                  <td className="px-4 py-3 font-semibold">{data.female_sign_out + data.male_sign_out}</td>
                                  <td className="px-4 py-3 text-purple-600">{data.female_remaining}</td>
                                  <td className="px-4 py-3 text-indigo-600">{data.male_remaining}</td>
                                  <td className="px-4 py-3 font-semibold">{data.female_remaining + data.male_remaining}</td>
                                  <td className="px-4 py-3 font-bold text-primary">{data.total_count}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-muted/30 font-semibold">
                                <td className="px-4 py-3">รวม</td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_count, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.male_count, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_count + d.male_count, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_sign_out, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.male_sign_out, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_sign_out + d.male_sign_out, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_remaining, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.male_remaining, 0)}
                                </td>
                                <td className="px-4 py-3">
                                  {selectedReport.student_data.reduce((s, d) => s + d.female_remaining + d.male_remaining, 0)}
                                </td>
                                <td className="px-4 py-3 text-primary">
                                  {selectedReport.student_data.reduce((s, d) => s + d.total_count, 0)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Health Records */}
                    {selectedReport.health_records && selectedReport.health_records.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          บันทึกสุขภาพ
                        </h3>
                        <div className="space-y-4">
                          {selectedReport.health_records.map((record, index) => (
                            <Card key={index} className="p-4 border-l-4 border-l-red-500">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">{record.name}</p>
                                    <p className="text-sm text-muted-foreground">ชั้นปีที่ {record.year}</p>
                                  </div>
                                  <Badge variant="destructive">ปัญหาสุขภาพ</Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm text-muted-foreground">อาการ</Label>
                                    <p className="text-sm">{record.symptoms}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">การรักษา</Label>
                                    <p className="text-sm">{record.treatment}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">ผลลัพธ์</Label>
                                    <p className="text-sm">{record.result}</p>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {(selectedReport.cleanliness_good || selectedReport.cleanliness_need_improvement || selectedReport.student_behavior) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">หมายเหตุเพิ่มเติม</h3>
                        <div className="space-y-4">
                          {selectedReport.cleanliness_good && (
                            <div>
                              <Label className="text-sm text-muted-foreground">ความสะอาดระดับดี</Label>
                              <p className="text-sm bg-green-50 p-3 rounded-lg">{selectedReport.cleanliness_good}</p>
                            </div>
                          )}
                          
                          {selectedReport.cleanliness_need_improvement && (
                            <div>
                              <Label className="text-sm text-muted-foreground">ความสะอาดที่ต้องปรับปรุง</Label>
                              <p className="text-sm bg-yellow-50 p-3 rounded-lg">{selectedReport.cleanliness_need_improvement}</p>
                            </div>
                          )}
                          
                          {selectedReport.student_behavior && (
                            <div>
                              <Label className="text-sm text-muted-foreground">พฤติกรรมนักศึกษา</Label>
                              <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedReport.student_behavior}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                    {/* Action Buttons moved to header */}
                  </div>
                </CardContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Embed Thai font (Sarabun) into jsPDF
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

// Normalize Thai strings to fix tone mark positioning issues
const th = (s: string): string => {
  const input = (s || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  return input.normalize('NFC');
};

// Create canvas with Thai text using web fonts for better rendering
const createThaiTextCanvas = (text: string, fontSize: number, fontWeight: string = 'normal', color: string = '#000000', deviceScale: number = 2): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set font with fallback chain including system Thai fonts
  const fontFamily = fontWeight === 'bold' ? 'Sarabun-Bold, "Sarabun", "TH Sarabun New", "Leelawadee UI", "Tahoma", sans-serif' : 
                     'Sarabun-Regular, "Sarabun", "TH Sarabun New", "Leelawadee UI", "Tahoma", sans-serif';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  
  // Measure text to size canvas appropriately
  // Measure at logical pixel space
  const metrics = ctx.measureText(text);
  const padding = 4; // logical px
  const logicalWidth = Math.ceil(metrics.width) + padding * 2;
  const logicalHeight = Math.ceil(fontSize * 1.4) + padding * 2;

  // Increase pixel density for sharper rendering when embedded into PDF
  const scale = Math.max(1, deviceScale);
  canvas.width = Math.ceil(logicalWidth * scale);
  canvas.height = Math.ceil(logicalHeight * scale);
  (canvas as any).__scale = scale;

  // Re-apply styles after resizing and scale the context
  ctx.scale(scale, scale);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';

  // Draw text at logical coordinates
  ctx.fillText(text, 2, 2);
  
  return canvas;
};

// Convert canvas to base64 image data
const canvasToDataURL = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png');
};

// Convert a high-DPI canvas back to physical mm using stored scale
const getCanvasSizeMm = (canvas: HTMLCanvasElement): { widthMm: number; heightMm: number } => {
  const mmPerPx = 0.264583; // 96 DPI approx
  const scale = (canvas as any).__scale || 1;
  return {
    widthMm: (canvas.width / scale) * mmPerPx,
    heightMm: (canvas.height / scale) * mmPerPx,
  };
};

// Create a multi-line paragraph canvas with wrapping for better readability
const createThaiParagraphCanvas = (
  text: string,
  fontSize: number,
  maxWidthMm: number,
  fontWeight: string = 'normal',
  color: string = '#000000',
  lineHeightFactor: number = 1.5,
  deviceScale: number = 2,
  align: 'left' | 'center' = 'left'
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const fontFamily = fontWeight === 'bold'
    ? 'Sarabun-Bold, "Sarabun", "TH Sarabun New", "Leelawadee UI", "Tahoma", sans-serif'
    : 'Sarabun-Regular, "Sarabun", "TH Sarabun New", "Leelawadee UI", "Tahoma", sans-serif';

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  const mmToPx = (mm: number) => mm * 3.7795275591; // ~96 DPI
  const maxWidthPx = mmToPx(maxWidthMm);

  const safe = th(text || '');

  // Support explicit new lines first
  const paragraphs = safe.split(/\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const hasSpace = para.includes(' ');
    const tokens = hasSpace ? para.split(/\s+/) : [...para];
    let current = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const trial = current ? (hasSpace ? `${current} ${token}` : `${current}${token}`) : token;
      const w = ctx.measureText(trial).width;
      if (w <= maxWidthPx || current === '') {
        current = trial;
      } else {
        lines.push(current);
        current = token;
      }
    }
    if (current) lines.push(current);
  }

  const padding = 4;
  const height = Math.ceil(lines.length * fontSize * lineHeightFactor) + padding * 2;
  const width = Math.ceil(Math.min(
    Math.max(...lines.map(l => ctx.measureText(l).width), 0) + padding * 2,
    maxWidthPx + padding * 2
  ));

  // Apply high-DPI backing store
  const scale = Math.max(1, deviceScale);
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  (canvas as any).__scale = scale;

  // Re-apply styles after resize and scale the context
  ctx.scale(scale, scale);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';

  lines.forEach((line, idx) => {
    const lineWidth = ctx.measureText(line).width;
    const contentWidth = width - padding * 2;
    const x = align === 'center' ? padding + (contentWidth - lineWidth) / 2 : padding;
    ctx.fillText(line, x, padding + idx * fontSize * lineHeightFactor);
  });

  return canvas;
};

const handlePrintPDF = async (report: ReportWithDetails) => {
  try {
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.id = 'pdf-loading';
    loadingElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9999;
      text-align: center;
    `;
    loadingElement.innerHTML = `
      <div style="margin-bottom: 10px;">📄</div>
      <div>กำลังสร้าง PDF...</div>
    `;
    document.body.appendChild(loadingElement);

    // Create PDF
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4' 
    });

    // Use standard fonts for PDF structure, Thai text will be rendered as images
    pdf.setFont('helvetica', 'normal');

    // Header - render Thai text as image (will place after logo to avoid overlap)
    const headerCanvas = createThaiTextCanvas(th('วิทยาลัยพยาบาลบรมราชชนนี อุดรธานี'), 16, 'normal', '#2563eb');
    const headerImg = canvasToDataURL(headerCanvas);
    const headerWidth = headerCanvas.width * 0.264583; // Convert px to mm
    const headerHeight = headerCanvas.height * 0.264583;

    const dateText = report.date ? new Date(report.date).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
    }) : '....................................';
    const dateCanvas = createThaiTextCanvas(th(`วันที่ ${dateText}`), 12);
    const dateImg = canvasToDataURL(dateCanvas);
    const { widthMm: dateWidth, heightMm: dateHeight } = getCanvasSizeMm(dateCanvas);
    // draw date after header image; place just above subject
    // actual Y will be set after contentStartY is known, see below

    // Header emblem/image centered at top (draw before text)
    let contentStartY = 47; // fallback if image missing
    let topAfterLogoY = 20; // will become bottom Y of the logo
    try {
      const headerResp = await fetch('/20.png');
      if (headerResp.ok) {
        const headerBlob = await headerResp.blob();
        const headerBitmap = await createImageBitmap(headerBlob);
        const headerCanvasEl = document.createElement('canvas');
        headerCanvasEl.width = headerBitmap.width;
        headerCanvasEl.height = headerBitmap.height;
        const hctx = headerCanvasEl.getContext('2d')!;
        hctx.drawImage(headerBitmap, 0, 0);
        const headerDataUrl = headerCanvasEl.toDataURL('image/png');
        const targetWmm = 35; // formal but compact
        const aspect = headerBitmap.height / headerBitmap.width;
        const targetHmm = targetWmm * aspect;
        const xCenter = 105 - targetWmm / 2; // page center (A4 width ~210mm)
        const yTop = 14; // top margin
        pdf.addImage(headerDataUrl, 'PNG', xCenter, yTop, targetWmm, targetHmm);
        topAfterLogoY = yTop + targetHmm;
        contentStartY = Math.max(contentStartY, topAfterLogoY + 6);
      }
    } catch {}

    // College name: place below the logo
    const collegeNameY = topAfterLogoY + 1;
    pdf.addImage(headerImg, 'PNG', 105 - headerWidth/2, collegeNameY, headerWidth, headerHeight);
    contentStartY = Math.max(contentStartY, collegeNameY + headerHeight + 4);

    // Date line centered below college name, above subject
    const dateY = contentStartY;
    pdf.addImage(dateImg, 'PNG', 105 - dateWidth/2, dateY, dateWidth, dateHeight);
    contentStartY = dateY + dateHeight + 6;

    // Subject below header area
    const subjectCanvas = createThaiTextCanvas(th('เรื่อง รายงานสรุปผลการปฏิบัติหน้าที่ของอาจารย์เวร'), 15, 'bold');
    const subjectImg = canvasToDataURL(subjectCanvas);
    const { widthMm: subjectWidth, heightMm: subjectHeight } = getCanvasSizeMm(subjectCanvas);
    pdf.addImage(subjectImg, 'PNG', 20, contentStartY, subjectWidth, subjectHeight);
    let yCursor = contentStartY + subjectHeight + 5;

    // Greeting
    const greetingCanvas = createThaiTextCanvas(th('เรียน ผู้อำนวยการวิทยาลัยพยาบาลบรมราชชนนี อุดรธานี'), 13);
    const greetingImg = canvasToDataURL(greetingCanvas);
    const { widthMm: greetingWidth, heightMm: greetingHeight } = getCanvasSizeMm(greetingCanvas);
    pdf.addImage(greetingImg, 'PNG', 20, yCursor, greetingWidth, greetingHeight);
    yCursor += greetingHeight + 4;

    // Intro paragraph
    const introText = th(`ข้าพเจ้า ${report.teacher_name || '.....................................'} อาจารย์เวรในวันที่ ${report.date ? new Date(report.date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '.....................................'} เวลา 18.00 น. ถึง 6.00 น.`);
    const introCanvas = createThaiParagraphCanvas(introText, 12, 170, 'normal', '#000000', 1.5);
    const introImg = canvasToDataURL(introCanvas);
    const introSize = getCanvasSizeMm(introCanvas);
    const introWidth = Math.min(introSize.widthMm, 170);
    const introHeight = introSize.heightMm;
    pdf.addImage(introImg, 'PNG', 20, yCursor, introWidth, introHeight);
    yCursor += introHeight + 4;

    // Teacher line (show only when replacing_teacher is provided)
    const replacingTeacher = (report.replacing_teacher || '').trim();
    if (replacingTeacher) {
      const teacherInfo = `แทนอาจารย์ ${replacingTeacher}`;
      const teacherCanvas = createThaiTextCanvas(th(teacherInfo), 12);
      const teacherImg = canvasToDataURL(teacherCanvas);
      const { widthMm: teacherWidth, heightMm: teacherHeight } = getCanvasSizeMm(teacherCanvas);
      pdf.addImage(teacherImg, 'PNG', 20, yCursor, teacherWidth, teacherHeight);
      yCursor += teacherHeight + 4;
    }

    // Dormitory line
    const dormitoryInfo = `หอพัก ${report.dormitory || 'ชมจันทร์ หอพักพุทธรักษา หอราชาวดี'} ขอรายงานเหตุการณ์ในเวร ดังนี้`;
    const dormCanvas = createThaiParagraphCanvas(th(dormitoryInfo), 12, 170, 'normal', '#000000', 1.5);
    const dormImg = canvasToDataURL(dormCanvas);
    const dormSize = getCanvasSizeMm(dormCanvas);
    const dormWidth = Math.min(dormSize.widthMm, 170);
    const dormHeight = dormSize.heightMm;
    pdf.addImage(dormImg, 'PNG', 20, yCursor, dormWidth, dormHeight);
    const preSectionY = yCursor + dormHeight + 6;

    // Section 1: Student Count Table (AutoTable)
    const section1Canvas = createThaiTextCanvas(th('1.รายงานจำนวนนักศึกษาที่พักอาศัยอยู่ในหอพักของวิทยาลัย'), 15, 'bold');
    const section1Img = canvasToDataURL(section1Canvas);
    const { widthMm: section1Width, heightMm: section1Height } = getCanvasSizeMm(section1Canvas);
    const section1TitleY = Math.max(95, preSectionY);
    pdf.addImage(section1Img, 'PNG', 20, section1TitleY, section1Width, section1Height);

    const studentRows = (report.student_data && report.student_data.length > 0)
      ? report.student_data.map((d) => ([
          d.year,
          d.female_count,
          d.male_count,
          d.total_count,
          d.female_sign_out || 0,
          d.male_sign_out || 0,
          d.female_emergency_stay || 0,
          d.male_emergency_stay || 0,
          d.female_not_staying_out || 0,
          d.male_not_staying_out || 0,
          (d.female_sign_out || 0) + (d.male_sign_out || 0) + (d.female_emergency_stay || 0) + (d.male_emergency_stay || 0) + (d.female_not_staying_out || 0) + (d.male_not_staying_out || 0),
        ]))
      : [
          ['1/34', 165, 15, 180, 0, 0, 0, 0, 26, 4, 30],
          ['2/...33', 155, 9, 164, 0, 0, 0, 0, 24, 5, 29],
          ['..../....', '', '', '', '', '', '', '', '', '', ''],
          ['..../....', '', '', '', '', '', '', '', '', '', ''],
        ];

    const totals = report.student_data && report.student_data.length > 0 ? {
      female: report.student_data.reduce((s, d) => s + d.female_count, 0),
      male: report.student_data.reduce((s, d) => s + d.male_count, 0),
      total: report.student_data.reduce((s, d) => s + d.total_count, 0),
      sOutF: report.student_data.reduce((s, d) => s + (d.female_sign_out || 0), 0),
      sOutM: report.student_data.reduce((s, d) => s + (d.male_sign_out || 0), 0),
      emF: report.student_data.reduce((s, d) => s + (d.female_emergency_stay || 0), 0),
      emM: report.student_data.reduce((s, d) => s + (d.male_emergency_stay || 0), 0),
      notF: report.student_data.reduce((s, d) => s + (d.female_not_staying_out || 0), 0),
      notM: report.student_data.reduce((s, d) => s + (d.male_not_staying_out || 0), 0),
    } : { female: 320, male: 24, total: 344, sOutF: 0, sOutM: 0, emF: 0, emM: 0, notF: 50, notM: 9 };

    const totalRemain = totals.sOutF + totals.sOutM + totals.emF + totals.emM + totals.notF + totals.notM;

    // Build head with rowSpan/colSpan to mimic the sample
    autoTable(pdf, {
      startY: Math.max(section1TitleY + section1Height + 4, 112),
      margin: { left: 6, right: 6 },
      head: [
        [
          { content: th('ชั้นปีที่/รุ่นที่'), rowSpan: 3, styles: { halign: 'center', valign: 'middle' }},
          { content: th('นักศึกษาหญิง'), rowSpan: 3, styles: { halign: 'center', valign: 'middle' }},
          { content: th('นักศึกษาชาย'), rowSpan: 3, styles: { halign: 'center', valign: 'middle' }},
          { content: th('นักศึกษาทั้งหมด'), rowSpan: 3, styles: { halign: 'center', valign: 'middle' }},
          { content: th('จำนวนนักศึกษาที่เซ็นออกหอพัก'), colSpan: 6, styles: { halign: 'center', valign: 'middle' } },
          { content: th('รวมจำนวนนักศึกษา \n คงเหลือในหอพัก'), rowSpan: 3, styles: { halign: 'center', valign: 'middle' }},
        ],
        [
          { content: th('พักค้างคืน'), colSpan: 2 },
          { content: th('พักค้างคืนกรณีฉุกเฉิน'), colSpan: 2 },
          { content: th('ไม่พักค้างคืน'), colSpan: 2 },
        ],
        [
          { content: th('หญิง') }, { content: th('ชาย') },
          { content: th('หญิง') }, { content: th('ชาย') },
          { content: th('หญิง') }, { content: th('ชาย') },
        ],
      ],
      body: [
        ...studentRows,
        ['รวม', totals.female, totals.male, totals.total, totals.sOutF, totals.sOutM, totals.emF, totals.emM, totals.notF, totals.notM, totalRemain],
      ],
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 3, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      headStyles: { font: 'helvetica', fontSize: 10, fillColor: [245, 247, 250], textColor: [0, 0, 0], lineWidth: 0.3 },
      bodyStyles: { lineWidth: 0.2 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      theme: 'grid',
      tableWidth: 'auto',
      columnStyles: {
        // Year/Batch
        0: { cellWidth: 26 },
        // Increase widths of the three highlighted count columns
        1: { cellWidth: 18 }, // จำนวนนักศึกษาหญิง
        2: { cellWidth: 18 }, // จำนวนนักศึกษาชาย
        3: { cellWidth: 22 }, // จำนวนนักศึกษาทั้งหมด
        // Reduce widths for the 6 subcolumns under "จำนวนนักศึกษาที่เซ็นออกหอพัก"
        4: { cellWidth: 13 }, 5: { cellWidth: 13 }, // พักค้างคืน หญิง/ชาย
        6: { cellWidth: 15 }, 7: { cellWidth: 15 }, // ฉุกเฉิน หญิง/ชาย
        8: { cellWidth: 15 }, 9: { cellWidth: 15 }, // ไม่พักค้างคืน หญิง/ชาย
        // Total remaining
        10: { cellWidth: 24 },
      },
      didParseCell: (data: any) => {
        // Head: suppress text (we draw images later)
        if (data.section === 'head') {
          data.cell.text = '';
          data.cell.styles.valign = 'middle';
          data.cell.styles.halign = 'center';
          return;
        }
        // Body: if Thai present, suppress Helvetica text; else normalize to th()
        if (data.section === 'body') {
          const raw = data.cell && data.cell.raw;
          const text = raw == null ? '' : String(raw);
          if (/[\u0E00-\u0E7F]/.test(text)) {
            data.cell.text = '';
          } else if (data && data.cell) {
            if (Array.isArray(data.cell.text)) {
              data.cell.text = data.cell.text.map((t: string) => th(t));
            } else if (typeof data.cell.text === 'string') {
              data.cell.text = th(data.cell.text);
            }
          }
        }
      },
      didDrawCell: (data: any) => {
        if (data.section === 'head') {
          const raw = data.cell && data.cell.raw;
          let text = '';
          if (raw && typeof raw === 'object' && 'content' in raw) {
            text = String((raw as any).content || '');
          } else if (raw != null) {
            text = String(raw);
          }
          text = th(text);
          if (text) {
            // Use paragraph canvas so explicit \n breaks render and text wraps to cell width
            const canvas = createThaiParagraphCanvas(text, 9, Math.max(4, data.cell.width - 2), 'bold', '#000000', 1.25, 2, 'center');
            const img = canvasToDataURL(canvas);
            const mm = getCanvasSizeMm(canvas);
            const mmW = Math.min(mm.widthMm, data.cell.width - 1.5);
            const mmH = Math.min(mm.heightMm, data.cell.height - 1.5);
            const x = data.cell.x + (data.cell.width - mmW) / 2;
            const y = data.cell.y + (data.cell.height - mmH) / 2;
            (data.doc as jsPDF).addImage(img, 'PNG', x, y, mmW, mmH);
          }
        }
        // Body: draw Thai for any column that contains Thai characters (including column 0)
        if (data.section === 'body') {
          const raw = data.cell && data.cell.raw;
          const text = th(String(raw ?? ''));
          if (/[\u0E00-\u0E7F]/.test(text)) {
            const canvas = createThaiTextCanvas(text, 9, 'normal', '#000000', 1.5);
            const img = canvasToDataURL(canvas);
            const { widthMm, heightMm } = getCanvasSizeMm(canvas);
            const w = Math.min(widthMm, Math.max(2, data.cell.width - 2.5));
            const h = Math.min(heightMm, Math.max(2, data.cell.height - 2.5));
            // Center the totals label "รวม" in column 0; otherwise left-pad slightly
            const isTotalLabel = data.column.dataKey === 0 && /รวม/.test(text);
            const x = isTotalLabel ? (data.cell.x + (data.cell.width - w) / 2) : (data.cell.x + 1.25);
            const y = data.cell.y + (data.cell.height - h) / 2;
            (data.doc as jsPDF).addImage(img, 'PNG', x, y, w, h);
          }
        }
      },
    });

    let yPos = (pdf as any).lastAutoTable.finalY + 8;

    // Section 2: Health Report (AutoTable)
    const section2Canvas = createThaiTextCanvas(th('2.รายงานภาวะสุขภาพของนักศึกษา'), 15, 'bold');
    const section2Img = canvasToDataURL(section2Canvas);
    const { widthMm: section2Width, heightMm: section2Height } = getCanvasSizeMm(section2Canvas);
    pdf.addImage(section2Img, 'PNG', 20, yPos, section2Width, section2Height);
    yPos += section2Height + 2;

    if (!report.health_records || report.health_records.length === 0) {
      const noHealthCanvas = createThaiTextCanvas(th('2.1 ไม่มีนักศึกษาป่วย'), 13);
      const noHealthImg = canvasToDataURL(noHealthCanvas);
      const { widthMm: noHealthWidth, heightMm: noHealthHeight } = getCanvasSizeMm(noHealthCanvas);
      pdf.addImage(noHealthImg, 'PNG', 20, yPos + 6, noHealthWidth, noHealthHeight);
      yPos += 16;
    } else {
      const healthRows = report.health_records.map((r, idx) => [
        idx + 1,
        th(String(r.name || '')),
        th(String(r.year || '')),
        th(String(r.symptoms || '')),
        th(String(r.treatment || '')),
        th(String(r.result || '')),
      ]);

      autoTable(pdf, {
        startY: yPos + 2,
        margin: { left: 6, right: 6 },
        head: [[
          th('ลำดับ'),
          th('ชื่อ-สกุล'),
          th('ชั้นปี'),
          th('อาการ'),
          th('การรักษา/คำแนะนำ'),
          th('ผลการรักษา/การติดตาม'),
        ]],
        body: healthRows,
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, halign: 'center', valign: 'middle', overflow: 'linebreak' },
        headStyles: { font: 'helvetica', fontSize: 9.5, fillColor: [245, 247, 250], textColor: [0, 0, 0], lineWidth: 0.3 },
        bodyStyles: { font: 'helvetica', lineWidth: 0.2, halign: 'left' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        theme: 'grid',
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 },
          5: { cellWidth: 40 },
        },
        didParseCell: (data: any) => {
          // Always render Thai as images in head
          if (data.section === 'head') {
            data.cell.text = '';
            data.cell.styles.valign = 'middle';
            data.cell.styles.halign = 'center';
          }
          // For body: only suppress when Thai present; keep ASCII with AutoTable for maximum sharpness
          if (data.section === 'body' && data.column.dataKey !== 0) {
            const raw = data.cell && data.cell.raw;
            const text = raw == null ? '' : String(raw);
            if (/[\u0E00-\u0E7F]/.test(text)) {
              data.cell.text = '';
            }
          }
        },
        didDrawCell: (data: any) => {
          const doc = data.doc as jsPDF;
          // Head cells: draw Thai via paragraph image (support explicit \n and wrap)
          if (data.section === 'head') {
            const raw = data.cell && data.cell.raw;
            let text = '';
            if (raw != null) {
              text = typeof raw === 'object' && 'content' in raw ? String((raw as any).content || '') : String(raw);
            }
            text = th(text);
            if (text) {
              const canvas = createThaiParagraphCanvas(text, 9, Math.max(4, data.cell.width - 2), 'bold', '#000000', 1.25, 2, 'center');
              const img = canvasToDataURL(canvas);
              const mm = getCanvasSizeMm(canvas);
              const mmW = Math.min(mm.widthMm, data.cell.width - 1.5);
              const mmH = Math.min(mm.heightMm, data.cell.height - 1.5);
              const x = data.cell.x + (data.cell.width - mmW) / 2;
              const y = data.cell.y + (data.cell.height - mmH) / 2;
              doc.addImage(img, 'PNG', x, y, mmW, mmH);
            }
          }
          // Body: draw Thai for columns 1..5; ASCII stays as text for maximum crispness
          if (data.section === 'body' && data.column.dataKey !== 0) {
            const raw = data.cell && data.cell.raw;
            const rawStr = String(raw ?? '');
            if (/[\u0E00-\u0E7F]/.test(rawStr)) {
              const text = th(rawStr);
              const canvas = createThaiTextCanvas(text, 9, 'normal', '#000000', 2);
              const img = canvasToDataURL(canvas);
              const { widthMm, heightMm } = getCanvasSizeMm(canvas);
              const w = Math.min(widthMm, data.cell.width - 1.5);
              const h = Math.min(heightMm, data.cell.height - 1.5);
              const x = data.cell.x + 0.75; // small left padding
              const y = data.cell.y + (data.cell.height - h) / 2;
              doc.addImage(img, 'PNG', x, y, w, h);
            }
          }
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 6;
    }

    // Section 3: Cleanliness Report
    yPos += 15;
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }
    
    const section3Canvas = createThaiTextCanvas(th('3.รายงานสุ่มตรวจความสะอาดเรียบร้อยของหอพัก'), 15, 'bold');
    const section3Img = canvasToDataURL(section3Canvas);
    const { widthMm: section3Width, heightMm: section3Height } = getCanvasSizeMm(section3Canvas);
    pdf.addImage(section3Img, 'PNG', 20, yPos, section3Width, section3Height);

    yPos += section3Height + 6;
    const cleanCanvas = createThaiTextCanvas(th('3.1 ตรวจพบความสะอาดเรียบร้อยระดับ (ดี,ดีมาก)'), 13);
    const cleanImg = canvasToDataURL(cleanCanvas);
    const { widthMm: cleanWidth, heightMm: cleanHeight } = getCanvasSizeMm(cleanCanvas);
    pdf.addImage(cleanImg, 'PNG', 20, yPos, cleanWidth, cleanHeight);
    
    yPos += 7;
    const cleanGoodCanvas = createThaiParagraphCanvas(th(report.cleanliness_good || ''), 12, 170, 'normal', '#000000', 1.6);
    const cleanGoodImg = canvasToDataURL(cleanGoodCanvas);
    const cleanGoodSize = getCanvasSizeMm(cleanGoodCanvas);
    const cleanGoodWidth = Math.min(cleanGoodSize.widthMm, 170);
    const cleanGoodHeight = cleanGoodSize.heightMm;
    pdf.addImage(cleanGoodImg, 'PNG', 20, yPos, cleanGoodWidth, cleanGoodHeight);

    yPos += 10;
    const cleanImproveTitleCanvas = createThaiTextCanvas(th('3.2 ตรวจพบความสะอาดในระดับต้องปรับปรุงในแต่ละหอพัก ดังนี้'), 13);
    const cleanImproveTitleImg = canvasToDataURL(cleanImproveTitleCanvas);
    const { widthMm: cleanImproveTitleWidth, heightMm: cleanImproveTitleHeight } = getCanvasSizeMm(cleanImproveTitleCanvas);
    pdf.addImage(cleanImproveTitleImg, 'PNG', 20, yPos, cleanImproveTitleWidth, cleanImproveTitleHeight);
    
    yPos += 7;
    const cleanImproveCanvas = createThaiParagraphCanvas(th(report.cleanliness_need_improvement || ''), 12, 170, 'normal', '#000000', 1.6);
    const cleanImproveImg = canvasToDataURL(cleanImproveCanvas);
    const cleanImproveSize = getCanvasSizeMm(cleanImproveCanvas);
    const cleanImproveWidth = Math.min(cleanImproveSize.widthMm, 170);
    const cleanImproveHeight = cleanImproveSize.heightMm;
    pdf.addImage(cleanImproveImg, 'PNG', 20, yPos, cleanImproveWidth, cleanImproveHeight);

    // Section 4: Student Behavior
    yPos += 15;
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }
    
    const section4Canvas = createThaiTextCanvas(th('4.รายงานพฤติกรรมของนักศึกษา'), 15, 'bold');
    const section4Img = canvasToDataURL(section4Canvas);
    const { widthMm: section4Width, heightMm: section4Height } = getCanvasSizeMm(section4Canvas);
    pdf.addImage(section4Img, 'PNG', 20, yPos, section4Width, section4Height);
    
    yPos += section4Height + 6;
    const behaviorCanvas = createThaiParagraphCanvas(th(report.student_behavior || ''), 12, 170, 'normal', '#000000', 1.6);
    const behaviorImg = canvasToDataURL(behaviorCanvas);
    const behaviorSize = getCanvasSizeMm(behaviorCanvas);
    const behaviorWidth = Math.min(behaviorSize.widthMm, 170);
    const behaviorHeight = behaviorSize.heightMm;
    pdf.addImage(behaviorImg, 'PNG', 20, yPos, behaviorWidth, behaviorHeight);

    // Signatures
    yPos += 25;
    if (yPos > 250) {
      pdf.addPage();
      yPos = 20;
    }

    const closingCanvas = createThaiTextCanvas(th('จึงเรียนมาเพื่อโปรดทราบ'), 12);
    const closingImg = canvasToDataURL(closingCanvas);
    const { widthMm: closingWidth, heightMm: closingHeight } = getCanvasSizeMm(closingCanvas);
    // Left-align closing text per request
    pdf.addImage(closingImg, 'PNG', 20, yPos, closingWidth, closingHeight);

    // Layout constants
    const leftCenter = 40; // center of left signature column
    const rightCenter = 150; // center of right signature column

    // Left: Teacher signature block (dotted lines + name + position + role)
    let sigY = yPos + 12;
    const dots = '........................................';
    const dotCanvasL1 = createThaiTextCanvas(dots, 12);
    const dotImgL1 = canvasToDataURL(dotCanvasL1);
    const { widthMm: dotW1, heightMm: dotH1 } = getCanvasSizeMm(dotCanvasL1);
    pdf.addImage(dotImgL1, 'PNG', leftCenter - dotW1/2, sigY, dotW1, dotH1);

    sigY += 6;
    const tNameCanvas = createThaiTextCanvas(th(`(${report.teacher_name || ''})`), 12);
    const tNameImg = canvasToDataURL(tNameCanvas);
    const { widthMm: tNameW, heightMm: tNameH } = getCanvasSizeMm(tNameCanvas);
    pdf.addImage(tNameImg, 'PNG', leftCenter - tNameW/2, sigY, tNameW, tNameH);

    sigY += 7;
    const tPosCanvas = createThaiTextCanvas(th(`ตำแหน่ง ${report.teacher_position || '........................................'}`), 12);
    const tPosImg = canvasToDataURL(tPosCanvas);
    const { widthMm: tPosW, heightMm: tPosH } = getCanvasSizeMm(tPosCanvas);
    pdf.addImage(tPosImg, 'PNG', leftCenter - tPosW/2, sigY, tPosW, tPosH);

    sigY += 8;
    const tRoleCanvas = createThaiTextCanvas(th('อาจารย์เวร'), 13, 'bold');
    const tRoleImg = canvasToDataURL(tRoleCanvas);
    const { widthMm: tRoleW, heightMm: tRoleH } = getCanvasSizeMm(tRoleCanvas);
    pdf.addImage(tRoleImg, 'PNG', leftCenter - tRoleW/2, sigY, tRoleW, tRoleH);

    // Right: Three signature blocks (Head of Student Affairs, Deputy, Director)
    // Block 1: Head of Student Affairs
    let rY = yPos + 6;
    const dotCanvasR1 = createThaiTextCanvas(dots, 12);
    const dotImgR1 = canvasToDataURL(dotCanvasR1);
    const { widthMm: dotRW1, heightMm: dotRH1 } = getCanvasSizeMm(dotCanvasR1);
    pdf.addImage(dotImgR1, 'PNG', rightCenter - dotRW1/2, rY, dotRW1, dotRH1);

    rY += 6;
    const headNameCanvas = createThaiTextCanvas(th('(นางวิไลพร พลสุขนิน)'), 12);
    const headNameImg = canvasToDataURL(headNameCanvas);
    const { widthMm: headNameW, heightMm: headNameH } = getCanvasSizeMm(headNameCanvas);
    pdf.addImage(headNameImg, 'PNG', rightCenter - headNameW/2, rY, headNameW, headNameH);

    rY += 7;
    const headTitleCanvas = createThaiTextCanvas(th('หัวหน้ากิจการนักศึกษา'), 12);
    const headTitleImg = canvasToDataURL(headTitleCanvas);
    const { widthMm: headTitleW, heightMm: headTitleH } = getCanvasSizeMm(headTitleCanvas);
    pdf.addImage(headTitleImg, 'PNG', rightCenter - headTitleW/2, rY, headTitleW, headTitleH);

    // Block 2: Deputy Director of Student Affairs
    rY += 18;
    const dotCanvasR2 = createThaiTextCanvas(dots, 12);
    const dotImgR2 = canvasToDataURL(dotCanvasR2);
    const { widthMm: dotRW2, heightMm: dotRH2 } = getCanvasSizeMm(dotCanvasR2);
    pdf.addImage(dotImgR2, 'PNG', rightCenter - dotRW2/2, rY, dotRW2, dotRH2);

    rY += 6;
    const depNameCanvas = createThaiTextCanvas(th('(ผศ.ดร.รัตติกร เมืองนาง)'), 12);
    const depNameImg = canvasToDataURL(depNameCanvas);
    const { widthMm: depNameW, heightMm: depNameH } = getCanvasSizeMm(depNameCanvas);
    pdf.addImage(depNameImg, 'PNG', rightCenter - depNameW/2, rY, depNameW, depNameH);

    rY += 7;
    const depTitleCanvas = createThaiTextCanvas(th('รองผู้อำนวยการด้านกิจการนักศึกษา'), 12);
    const depTitleImg = canvasToDataURL(depTitleCanvas);
    const { widthMm: depTitleW, heightMm: depTitleH } = getCanvasSizeMm(depTitleCanvas);
    pdf.addImage(depTitleImg, 'PNG', rightCenter - depTitleW/2, rY, depTitleW, depTitleH);

    // Block 3: Director
    rY += 18;
    const dotCanvasR3 = createThaiTextCanvas(dots, 12);
    const dotImgR3 = canvasToDataURL(dotCanvasR3);
    const { widthMm: dotRW3, heightMm: dotRH3 } = getCanvasSizeMm(dotCanvasR3);
    pdf.addImage(dotImgR3, 'PNG', rightCenter - dotRW3/2, rY, dotRW3, dotRH3);

    rY += 6;
    const dirNameCanvas = createThaiTextCanvas(th('(ผศ.ดร.ยุพาภรณ์ ติรไพรวงศ์)'), 12);
    const dirNameImg = canvasToDataURL(dirNameCanvas);
    const { widthMm: dirNameW, heightMm: dirNameH } = getCanvasSizeMm(dirNameCanvas);
    pdf.addImage(dirNameImg, 'PNG', rightCenter - dirNameW/2, rY, dirNameW, dirNameH);

    // Generate filename
    const date = new Date(report.date).toLocaleDateString('th-TH').replace(/\//g, '-');
    const teacherName = report.teacher_name.replace(/[^a-zA-Zก-๙\s]/g, '');
    const fileName = `รายงานการปฏิบัติหน้าที่_${date}_${teacherName}.pdf`;
    
    // Save PDF
    pdf.save(fileName);
    
    // Remove loading indicator
    document.body.removeChild(loadingElement);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Remove loading indicator if exists
    const loadingElement = document.getElementById('pdf-loading');
    if (loadingElement) {
      document.body.removeChild(loadingElement);
    }
    
    // Show error message
    const errorElement = document.createElement('div');
    errorElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorElement.textContent = 'เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง';
    document.body.appendChild(errorElement);
    
    // Auto remove error message
    setTimeout(() => {
      if (document.body.contains(errorElement)) {
        document.body.removeChild(errorElement);
      }
    }, 5000);
  }
};

export default Reports; 