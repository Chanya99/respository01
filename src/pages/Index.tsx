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
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-20"
          variants={itemVariants}
        >
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              className="flex justify-center mb-8"
              variants={iconVariants}
            >
              <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow">
                <Heart className="w-12 h-12 text-primary-foreground" />
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
                เริ่มใช้งานระบบ
              </Button>
              <Button 
                onClick={() => navigate("/reports")}
                size="lg"
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:shadow-glow hover:scale-105"
              >
                <List className="w-5 h-5 mr-2" />
                ดูรายงาน
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            คุณสมบัติของระบบ
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ระบบครบครันสำหรับการบันทึกและรายงานการปฏิบัติหน้าที่อาจารย์เวร
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div variants={cardVariants} whileHover="hover">
            <Card className="bg-gradient-secondary shadow-soft hover:shadow-elegant transition-all duration-300">
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
            <Card className="bg-gradient-secondary shadow-soft hover:shadow-elegant transition-all duration-300">
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
            <Card className="bg-gradient-secondary shadow-soft hover:shadow-elegant transition-all duration-300">
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
        className="bg-gradient-primary py-20"
        variants={itemVariants}
      >
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
              className="bg-background text-foreground hover:bg-background/90 px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:scale-105"
            >
              เข้าสู่ระบบบันทึกเวรสุขภาพ
            </Button>
            <Button 
              onClick={() => navigate("/reports")}
              size="lg"
              variant="outline"
              className="border-2 border-background text-background hover:bg-background hover:text-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:scale-105"
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
