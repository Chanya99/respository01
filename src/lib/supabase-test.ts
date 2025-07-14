import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 กำลังทดสอบการเชื่อมต่อ Supabase...')
    
    // Test 1: ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase
      .from('duty_reports')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ ข้อผิดพลาดในการเชื่อมต่อ:', error)
      return {
        success: false,
        error: error.message,
        details: 'ไม่สามารถเชื่อมต่อกับตาราง duty_reports ได้'
      }
    }
    
    console.log('✅ การเชื่อมต่อสำเร็จ')
    
    // Test 2: ตรวจสอบโครงสร้างตาราง
    const tables = ['duty_reports', 'student_data', 'health_records']
    const tableChecks = await Promise.all(
      tables.map(async (tableName) => {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        return {
          table: tableName,
          exists: !error,
          error: error?.message
        }
      })
    )
    
    const missingTables = tableChecks.filter(check => !check.exists)
    
    if (missingTables.length > 0) {
      console.error('❌ ตารางที่ขาดหายไป:', missingTables)
      return {
        success: false,
        error: 'ตารางบางตารางยังไม่ได้สร้าง',
        details: missingTables.map(t => `${t.table}: ${t.error}`).join(', ')
      }
    }
    
    console.log('✅ โครงสร้างตารางครบถ้วน')
    
    // Test 3: ทดสอบการบันทึกข้อมูล (test record)
    const testReport = {
      date: '2024-01-01',
      teacher_name: 'TEST_CONNECTION',
      start_time: '18:00',
      end_time: '06:00',
      replacing_teacher: '',
      dormitory: 'TEST',
      cleanliness_good: '',
      cleanliness_need_improvement: '',
      student_behavior: '',
      teacher_signature: '',
      teacher_position: '',
      deputy_director_signature: '',
      director_signature: ''
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('duty_reports')
      .insert(testReport)
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ ข้อผิดพลาดในการบันทึกข้อมูลทดสอบ:', insertError)
      return {
        success: false,
        error: insertError.message,
        details: 'ไม่สามารถบันทึกข้อมูลทดสอบได้'
      }
    }
    
    console.log('✅ การบันทึกข้อมูลทดสอบสำเร็จ')
    
    // ลบข้อมูลทดสอบ
    if (insertData?.id) {
      await supabase
        .from('duty_reports')
        .delete()
        .eq('id', insertData.id)
      
      console.log('✅ ลบข้อมูลทดสอบเรียบร้อย')
    }
    
    return {
      success: true,
      message: 'การเชื่อมต่อและทดสอบสำเร็จ',
      details: 'สามารถบันทึกและดึงข้อมูลได้ปกติ'
    }
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาดทั่วไป:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      details: 'เกิดข้อผิดพลาดในการทดสอบ'
    }
  }
}

// ฟังก์ชันตรวจสอบ environment variables
export const checkEnvironmentVariables = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('🔍 ตรวจสอบ Environment Variables...')
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ มีค่า' : '❌ ไม่มีค่า')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ มีค่า' : '❌ ไม่มีค่า')
  
  return {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    isComplete: !!supabaseUrl && !!supabaseAnonKey
  }
} 