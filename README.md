VisionCheck: AI-Powered Attendance System

A professional, full-stack facial recognition attendance application built to bridge the gap between intermediate-level Machine Learning and modern Web Development.

Overview
This project automates the attendance process using real-time face detection and recognition. By combining a fluid React frontend with a robust Supabase backend, it provides a seamless experience for both administrators and users.

Tech Stack
Frontend: React.js, Tailwind CSS, Framer Motion
Backend: Supabase (Postgres, Auth, Real-time)
ML/AI: Face Recognition Model / Google Antigravity
Deployment: Vercel & GitHub

Key Features
Real-Time Detection: High-speed facial analysis and identification.
Live Sync: Instant attendance logging with Supabase real-time subscriptions.
Fluid UI: Elegant transitions and responsive layouts using Framer Motion.
Secure Auth: Protected dashboard access for administrators.

Getting Started
Installation Steps:

1.  Clone the repo.
2.  Install dependencies via npm install.
3.  Set up Environment Variables (Supabase URL and Anon Key).
4.  Run the app via npm start.

How It Works

1.  The Vision Layer: The webcam captures frames which are processed by the ML model to extract facial embeddings.
2.  The Logic Layer: These embeddings are compared against stored profiles in the database.
3.  The Data Layer: Upon a match, Supabase triggers an insert into the attendance table, which reflects instantly on the dashboard.

Future Scope
Integration with deep learning models for mask detection.
Exporting attendance reports to CSV/PDF.
