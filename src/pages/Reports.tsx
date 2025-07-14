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
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DutyReport, StudentData, HealthRecord } from "@/lib/supabase";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
      
      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "with_health") return matchesSearch && (report.health_count || 0) > 0;
      if (filterStatus === "this_month") {
        const thisMonth = new Date().getMonth();
        return matchesSearch && new Date(report.date).getMonth() === thisMonth;
      }
      return matchesSearch;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">กำลังโหลดข้อมูล...</p>
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

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">นักศึกษาทั้งหมด</p>
                  <p className="text-2xl font-bold">{stats.total_students}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
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
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="date">เรียงตามวันที่</option>
                <option value="teacher">เรียงตามชื่ออาจารย์</option>
                <option value="students">เรียงตามจำนวนนักศึกษา</option>
                <option value="health">เรียงตามปัญหาสุขภาพ</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedReports.map((report, index) => (
              <motion.div
                key={report.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                exit="hidden"
                onClick={() => setSelectedReport(report)}
              >
                <Card className="cursor-pointer shadow-elegant hover:shadow-glow transition-all duration-300 border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {formatDate(report.date)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          สร้างเมื่อ {new Date(report.created_at || '').toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(report)} className="ml-2">
                        {report.health_count && report.health_count > 0 ? (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {report.health_count && report.health_count > 0 ? 'มีปัญหาสุขภาพ' : 'ปกติ'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Teacher Info */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold text-sm">{report.teacher_name}</p>
                          <p className="text-xs text-muted-foreground">{report.teacher_position}</p>
                        </div>
                      </div>

                      {/* Time and Location */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium">{formatTime(report.start_time)}</p>
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

                                             {/* Stats */}
                       <div className="space-y-3">
                         <div className="text-center p-3 bg-blue-50 rounded-lg">
                           <p className="text-xl font-bold text-blue-600">{report.total_students || 0}</p>
                           <p className="text-xs text-blue-600">นักศึกษาทั้งหมด</p>
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div className="text-center p-2 bg-green-50 rounded-lg">
                             <p className="text-sm font-bold text-green-600">{report.health_count || 0}</p>
                             <p className="text-xs text-green-600">ปัญหาสุขภาพ</p>
                           </div>
                           <div className="text-center p-2 bg-orange-50 rounded-lg">
                             <p className="text-sm font-bold text-orange-600">{report.student_count || 0}</p>
                             <p className="text-xs text-orange-600">รายการข้อมูล</p>
                           </div>
                         </div>
                       </div>

                      {/* Quick Actions */}
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
                      </div>
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedReport(null)}
                      className="text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
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
                        <div className="space-y-4">
                          {selectedReport.student_data.map((data, index) => (
                            <Card key={index} className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <h4 className="text-lg font-semibold text-primary">ชั้นปีที่ {data.year}</h4>
                                  <Badge variant="outline" className="text-base px-3 py-1">
                                    รวม {data.total_count} คน
                                  </Badge>
                                </div>
                                
                                {/* จำนวนนักศึกษาที่พักอาศัย */}
                                <div>
                                  <h5 className="font-semibold text-sm text-muted-foreground mb-3">
                                    จำนวนนักศึกษาที่พักอาศัยอยู่ในหอพัก
                                  </h5>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                      <p className="text-2xl font-bold text-blue-600">{data.female_count}</p>
                                      <p className="text-sm font-medium text-blue-600">หญิง</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                      <p className="text-2xl font-bold text-green-600">{data.male_count}</p>
                                      <p className="text-sm font-medium text-green-600">ชาย</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* จำนวนนักศึกษาที่เซ็นออกหอพัก */}
                                <div>
                                  <h5 className="font-semibold text-sm text-muted-foreground mb-3">
                                    จำนวนนักศึกษาที่เซ็นออกหอพัก
                                  </h5>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                      <p className="text-2xl font-bold text-orange-600">{data.female_sign_out}</p>
                                      <p className="text-sm font-medium text-orange-600">หญิง</p>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                      <p className="text-2xl font-bold text-yellow-600">{data.male_sign_out}</p>
                                      <p className="text-sm font-medium text-yellow-600">ชาย</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* จำนวนนักศึกษาที่พักค้างคืน */}
                                <div>
                                  <h5 className="font-semibold text-sm text-muted-foreground mb-3">
                                    จำนวนนักศึกษาที่พักค้างคืน
                                  </h5>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                      <p className="text-2xl font-bold text-purple-600">{data.female_remaining}</p>
                                      <p className="text-sm font-medium text-purple-600">หญิง</p>
                                    </div>
                                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                                      <p className="text-2xl font-bold text-indigo-600">{data.male_remaining}</p>
                                      <p className="text-sm font-medium text-indigo-600">ชาย</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* สรุปข้อมูล */}
                                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">รวมออกนอก</p>
                                    <p className="text-lg font-bold text-red-600">
                                      {data.female_sign_out + data.male_sign_out} คน
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">รวมค้างคืน</p>
                                    <p className="text-lg font-bold text-green-600">
                                      {data.female_remaining + data.male_remaining} คน
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">รวมทั้งหมด</p>
                                    <p className="text-lg font-bold text-blue-600">
                                      {data.total_count} คน
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
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

                    {/* Signatures */}
                    {(selectedReport.teacher_signature || selectedReport.deputy_director_signature || selectedReport.director_signature) && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">ลายเซ็น</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {selectedReport.teacher_signature && (
                            <div className="text-center">
                              <Label className="text-sm text-muted-foreground">อาจารย์เวร</Label>
                              <p className="text-sm font-medium">{selectedReport.teacher_signature}</p>
                            </div>
                          )}
                          
                          {selectedReport.deputy_director_signature && (
                            <div className="text-center">
                              <Label className="text-sm text-muted-foreground">รองผู้อำนวยการ</Label>
                              <p className="text-sm font-medium">{selectedReport.deputy_director_signature}</p>
                            </div>
                          )}
                          
                          {selectedReport.director_signature && (
                            <div className="text-center">
                              <Label className="text-sm text-muted-foreground">ผู้อำนวยการ</Label>
                              <p className="text-sm font-medium">{selectedReport.director_signature}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintPDF(selectedReport)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        พิมพ์/ส่งออก PDF
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(null);
                          navigate("/report", { state: { report: selectedReport } });
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        แก้ไขข้อมูล
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReport(null)}
                      >
                        ปิด
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* PDF Template (hidden) */}
      <div id="pdf-template" style={{ position: 'absolute', left: '-9999px', top: 0, width: 794, background: 'white', color: 'black', padding: 24 }}>
        {/* ตัวอย่างฟอร์มราชการ (ตาราง, ข้อความ, ฯลฯ) */}
        {/* สามารถปรับแต่ง layout เพิ่มเติมได้ */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>
          วิทยาลัยพยาบาลบรมราชชนนี อุดรธานี
        </div>
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          วันที่ {selectedReport?.date || ''}
        </div>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
          เรื่อง รายงานสรุปผลการปฏิบัติหน้าที่อาจารย์เวร
        </div>
        <div style={{ marginBottom: 8 }}>
          ชื่อผู้รายงาน: {selectedReport?.teacher_name || ''} &nbsp;&nbsp; ตำแหน่ง: {selectedReport?.teacher_position || ''}
        </div>
        <div style={{ marginBottom: 8 }}>
          เวลาเวร: {selectedReport?.start_time || ''} - {selectedReport?.end_time || ''} &nbsp;&nbsp; หอพัก: {selectedReport?.dormitory || ''}
        </div>
        {/* ตารางข้อมูลนักศึกษา */}
        <div style={{ margin: '16px 0' }}>
          <table border={1} cellPadding={4} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th rowSpan={2}>ชั้นปี</th>
                <th colSpan={2}>พักในหอ</th>
                <th colSpan={2}>เซ็นออก</th>
                <th colSpan={2}>พักค้างคืน</th>
                <th rowSpan={2}>รวม</th>
              </tr>
              <tr style={{ background: '#eee' }}>
                <th>หญิง</th><th>ชาย</th>
                <th>หญิง</th><th>ชาย</th>
                <th>หญิง</th><th>ชาย</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport?.student_data?.map((data, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center' }}>{data.year}</td>
                  <td style={{ textAlign: 'center' }}>{data.female_count}</td>
                  <td style={{ textAlign: 'center' }}>{data.male_count}</td>
                  <td style={{ textAlign: 'center' }}>{data.female_sign_out}</td>
                  <td style={{ textAlign: 'center' }}>{data.male_sign_out}</td>
                  <td style={{ textAlign: 'center' }}>{data.female_remaining}</td>
                  <td style={{ textAlign: 'center' }}>{data.male_remaining}</td>
                  <td style={{ textAlign: 'center' }}>{data.total_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ตารางสุขภาพ */}
        <div style={{ margin: '16px 0' }}>
          <table border={1} cellPadding={4} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>ชื่อ-สกุล</th>
                <th>ชั้นปี</th>
                <th>อาการ</th>
                <th>การรักษา</th>
                <th>ผลลัพธ์</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport?.health_records?.length > 0 ? selectedReport.health_records.map((rec, idx) => (
                <tr key={idx}>
                  <td>{rec.name}</td>
                  <td>{rec.year}</td>
                  <td>{rec.symptoms}</td>
                  <td>{rec.treatment}</td>
                  <td>{rec.result}</td>
                </tr>
              )) : <tr><td colSpan={5} style={{ textAlign: 'center' }}>-</td></tr>}
            </tbody>
          </table>
        </div>
        {/* หมายเหตุ/ลายเซ็น */}
        <div style={{ margin: '16px 0', fontSize: 12 }}>
          <div>หมายเหตุเพิ่มเติม: {selectedReport?.student_behavior || '-'} </div>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            (ลงชื่อ) ............................................. อาจารย์เวร
          </div>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            (ลงชื่อ) ............................................. รองผู้อำนวยการ
          </div>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            (ลงชื่อ) ............................................. ผู้อำนวยการ
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function handlePrintPDF(report: any) {
  const pdfElement = document.getElementById('pdf-template');
  if (!pdfElement) return;
  html2canvas(pdfElement, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Fit image to A4
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('duty-report.pdf');
  });
}

export default Reports; 