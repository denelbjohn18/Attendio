-- Enable the vector extension for face embeddings
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE Students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    enrollment_no TEXT UNIQUE NOT NULL,
    face_embedding vector(128),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE Subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name TEXT NOT NULL,
    batch_code TEXT NOT NULL
);

CREATE TABLE Attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES Students(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late')),
    subject_id UUID REFERENCES Subjects(id) ON DELETE CASCADE,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date, subject_id)
);

-- Note: Ensure to set up Row Level Security (RLS) policies in Supabase if needed, 
-- or disable RLS for testing purposes.
