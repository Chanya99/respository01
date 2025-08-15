import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, FileText, Users, Calendar, List, Database } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-secondary"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20"></div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-20"
          variants={itemVariants}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              className="flex justify-center mb-8"
              variants={iconVariants}
            >
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl md:rounded-3xl bg-white/80 backdrop-blur ring-1 ring-white/50 shadow-glow flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-28 h-28 md:w-36 md:h-36 object-contain" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
              variants={itemVariants}
            >
              ระบบรายงานผลการปฏิบัติหน้าที่
              <br />
              <span className="text-primary">ของอาจารย์เวร</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed"
              variants={itemVariants}
            >
              วิทยาลัยพยาบาลบรมราชชนนี อุดรธานี
            </motion.p>
            
            <motion.p 
              className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              ระบบบันทึกและรายงานการดูแลนักศึกษาในหอพัก พร้อมการติดตามสุขภาพและการดูแลความเรียบร้อย
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex gap-4 justify-center flex-wrap">
              <Button 
                onClick={() => navigate("/report")}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:shadow-glow hover:scale-105"
              >
                <FileText className="w-5 h-5 mr-2" />
                เริ่มใช้งานระบบ
              </Button>
              <Button 
                onClick={() => navigate("/reports")}
                size="lg"
                className="bg-white text-primary border border-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:shadow-glow hover:scale-105"
              >
                <List className="w-5 h-5 mr-2" />
                ดูรายงานทั้งหมด
              </Button>
            
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <motion.div 
        className="container mx-auto px-4 py-20"
        variants={itemVariants}
      >
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">คุณสมบัติ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            คุณสมบัติของระบบ
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ระบบครบครันสำหรับการบันทึกและรายงานการปฏิบัติหน้าที่อาจารย์เวร
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="backdrop-blur bg-white/40 dark:bg-white/10 border border-white/20 shadow-soft hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6 text-center">
                <motion.div 
                  className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4"
                  variants={iconVariants}
                >
                  <FileText className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-3">รายงานครบครัน</h3>
                <p className="text-muted-foreground">
                  บันทึกข้อมูลนักศึกษา การดูแลสุขภาพ และความเรียบร้อยของหอพัก
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="backdrop-blur bg-white/40 dark:bg-white/10 border border-white/20 shadow-soft hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6 text-center">
                <motion.div 
                  className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4"
                  variants={iconVariants}
                >
                  <Users className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-3">จัดการนักศึกษา</h3>
                <p className="text-muted-foreground">
                  ติดตามจำนวนนักศึกษา การเข้า-ออกหอพัก และการดูแลสุขภาพ
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="backdrop-blur bg-white/40 dark:bg-white/10 border border-white/20 shadow-soft hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6 text-center">
                <motion.div 
                  className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4"
                  variants={iconVariants}
                >
                  <Calendar className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-3">บันทึกอัตโนมัติ</h3>
                <p className="text-muted-foreground">
                  เชื่อมต่อ ฐานข้อมูล online เพื่อบันทึกข้อมูลอย่างปลอดภัยและถาวร
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        className="relative bg-gradient-primary py-20 overflow-hidden"
        variants={itemVariants}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6"
            variants={itemVariants}
          >
            พร้อมเริ่มต้นใช้งานแล้วหรือยัง?
          </motion.h2>
          <motion.p 
            className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            เริ่มบันทึกรายงานการปฏิบัติหน้าที่อาจารย์เวรได้ทันที
          </motion.p>
          <motion.div variants={itemVariants} className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate("/report")}
              size="lg"
              variant="secondary"
              className="bg-white/90 text-foreground hover:bg-white px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:scale-105 backdrop-blur"
            >
              <FileText className="w-5 h-5 mr-2" />
              เข้าสู่ระบบบันทึกเวรสุขภาพ
            </Button>
            <Button 
              onClick={() => navigate("/reports")}
              size="lg"
              className="bg-white text-primary border border-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:scale-105 backdrop-blur"
            >
              <List className="w-5 h-5 mr-2" />
              ดูรายงานทั้งหมด
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
