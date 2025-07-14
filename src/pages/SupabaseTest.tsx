import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Database } from "lucide-react";
import { motion } from "framer-motion";
import { testSupabaseConnection, checkEnvironmentVariables } from "@/lib/supabase-test";
import Swal from "sweetalert2";

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

const SupabaseTest = () => {
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [envCheck, setEnvCheck] = useState<any>(null);

  const runEnvironmentCheck = () => {
    const result = checkEnvironmentVariables();
    setEnvCheck(result);
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'การทดสอบสำเร็จ!',
          text: result.message,
          confirmButtonColor: '#ec4899'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'การทดสอบล้มเหลว',
          text: result.error,
          confirmButtonColor: '#ec4899'
        });
      }
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ',
        details: 'เกิดข้อผิดพลาดในการทดสอบ'
      };
      setTestResult(errorResult);
      
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด!',
        text: errorResult.error,
        confirmButtonColor: '#ec4899'
      });
    } finally {
      setIsLoading(false);
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

  return (
    <motion.div 
      className="min-h-screen bg-gradient-secondary p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl mx-auto">
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
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">ทดสอบการเชื่อมต่อ Supabase</h1>
          </div>
        </motion.div>

        {/* Environment Variables Check */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ตรวจสอบ Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ตรวจสอบว่าตั้งค่า environment variables สำหรับ Supabase ครบถ้วนหรือไม่
                </p>
                
                {envCheck && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {envCheck.hasUrl ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span>VITE_SUPABASE_URL: {envCheck.hasUrl ? '✅ มีค่า' : '❌ ไม่มีค่า'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {envCheck.hasKey ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span>VITE_SUPABASE_ANON_KEY: {envCheck.hasKey ? '✅ มีค่า' : '❌ ไม่มีค่า'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {envCheck.isComplete ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        สถานะ: {envCheck.isComplete ? 'พร้อมใช้งาน' : 'ต้องตั้งค่าเพิ่มเติม'}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={runEnvironmentCheck}
                  variant="outline"
                  className="w-full"
                >
                  ตรวจสอบ Environment Variables
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connection Test */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                ทดสอบการเชื่อมต่อฐานข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  ทดสอบการเชื่อมต่อกับ Supabase และตรวจสอบโครงสร้างตาราง
                </p>
                
                <Button 
                  onClick={runConnectionTest}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังทดสอบ...
                    </div>
                  ) : (
                    'เริ่มการทดสอบ'
                  )}
                </Button>
                
                {testResult && (
                  <div className={`p-4 rounded-lg border ${
                    testResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <h4 className="font-semibold">
                          {testResult.success ? 'การทดสอบสำเร็จ' : 'การทดสอบล้มเหลว'}
                        </h4>
                        {testResult.message && (
                          <p className="text-sm">{testResult.message}</p>
                        )}
                        {testResult.error && (
                          <p className="text-sm text-red-600">{testResult.error}</p>
                        )}
                        {testResult.details && (
                          <p className="text-xs text-muted-foreground">{testResult.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>คำแนะนำการแก้ไขปัญหา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">1. Environment Variables ไม่ครบ</h4>
                  <p className="text-muted-foreground">
                    สร้างไฟล์ <code className="bg-muted px-1 rounded">.env</code> ในโฟลเดอร์โปรเจค และเพิ่ม:
                  </p>
                  <pre className="bg-muted p-2 rounded mt-1 text-xs">
{`VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">2. ตารางยังไม่ได้สร้าง</h4>
                  <p className="text-muted-foreground">
                    ไปที่ Supabase Dashboard → SQL Editor → รัน script จากไฟล์ <code className="bg-muted px-1 rounded">supabase-schema.sql</code>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">3. RLS Policies</h4>
                  <p className="text-muted-foreground">
                    ตรวจสอบว่าได้เปิดใช้งาน Row Level Security และสร้าง policies สำหรับตารางทั้งหมด
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">4. API Keys</h4>
                  <p className="text-muted-foreground">
                    ตรวจสอบ Project URL และ anon key ใน Settings → API ของ Supabase Dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SupabaseTest; 