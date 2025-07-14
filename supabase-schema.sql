-- Create duty_reports table
CREATE TABLE duty_reports (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  date DATE NOT NULL,
  teacher_name TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  replacing_teacher TEXT,
  dormitory TEXT,
  cleanliness_good TEXT,
  cleanliness_need_improvement TEXT,
  student_behavior TEXT,
  teacher_signature TEXT,
  teacher_position TEXT,
  deputy_director_signature TEXT,
  director_signature TEXT
);

-- Create student_data table
CREATE TABLE student_data (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES duty_reports(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  female_count INTEGER DEFAULT 0,
  male_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  female_sign_out INTEGER DEFAULT 0,
  male_sign_out INTEGER DEFAULT 0,
  female_not_staying_out INTEGER DEFAULT 0,
  male_not_staying_out INTEGER DEFAULT 0,
  female_remaining INTEGER DEFAULT 0,
  male_remaining INTEGER DEFAULT 0
);

-- Create health_records table
CREATE TABLE health_records (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT REFERENCES duty_reports(id) ON DELETE CASCADE,
  name TEXT,
  year TEXT,
  symptoms TEXT,
  treatment TEXT,
  result TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE duty_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your security requirements)
CREATE POLICY "Allow public read access" ON duty_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON duty_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON duty_reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON duty_reports FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON student_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON student_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON student_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON student_data FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON health_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON health_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON health_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON health_records FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_duty_reports_date ON duty_reports(date);
CREATE INDEX idx_duty_reports_teacher_name ON duty_reports(teacher_name);
CREATE INDEX idx_student_data_report_id ON student_data(report_id);
CREATE INDEX idx_health_records_report_id ON health_records(report_id);
CREATE INDEX idx_health_records_name ON health_records(name); 