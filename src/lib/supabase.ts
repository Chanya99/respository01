import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface DutyReport {
  id?: number
  created_at?: string
  date: string
  teacher_name: string
  start_time: string
  end_time: string
  replacing_teacher: string
  dormitory: string
  cleanliness_good: string
  cleanliness_need_improvement: string
  student_behavior: string
  teacher_signature: string
  teacher_position: string
  deputy_director_signature: string
  director_signature: string
}

export interface StudentData {
  id?: number
  report_id: number
  year: string
  female_count: number
  male_count: number
  total_count: number
  female_sign_out: number
  male_sign_out: number
  female_not_staying_out: number
  male_not_staying_out: number
  female_remaining: number
  male_remaining: number
}

export interface HealthRecord {
  id?: number
  report_id: number
  name: string
  year: string
  symptoms: string
  treatment: string
  result: string
} 