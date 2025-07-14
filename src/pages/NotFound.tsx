import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

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

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-secondary"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-center max-w-md mx-auto p-8">
        <motion.div 
          className="mb-8"
          variants={iconVariants}
        >
          <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center mx-auto shadow-glow">
            <AlertTriangle className="w-12 h-12 text-primary-foreground" />
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-6xl font-bold text-primary mb-4"
          variants={itemVariants}
        >
          404
        </motion.h1>
        
        <motion.h2 
          className="text-2xl font-semibold text-foreground mb-4"
          variants={itemVariants}
        >
          หน้าไม่พบ
        </motion.h2>
        
        <motion.p 
          className="text-lg text-muted-foreground mb-8"
          variants={itemVariants}
        >
          หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Button 
            onClick={() => navigate("/")}
            size="lg"
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-elegant transition-all duration-300 hover:shadow-glow hover:scale-105"
          >
            <Home className="w-5 h-5 mr-2" />
            กลับหน้าหลัก
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound;
