// ─── Per-student rich records (keyed by student ID) ───────────────────────────

export const TRACK_RECORDS = {
  STU001: {
    semesters: [
      { sem: 'Sem 1', gpa: 8.6, credits: 22, subjects: ['Math I', 'Physics', 'C Programming', 'English', 'ES Lab'], attendance: 91 },
      { sem: 'Sem 2', gpa: 8.9, credits: 24, subjects: ['Math II', 'Chemistry', 'DS', 'Digital Circuits', 'Workshop'], attendance: 88 },
      { sem: 'Sem 3', gpa: 9.1, credits: 24, subjects: ['DBMS', 'OS', 'COA', 'Discrete Math', 'OOP'], attendance: 93 },
      { sem: 'Sem 4', gpa: 9.2, credits: 26, subjects: ['CN', 'AI', 'SE', 'Elective I', 'Mini Project'], attendance: 95 },
    ],
    attendance: { total: 240, present: 221, percent: 92 },
    assignments: { total: 48, submitted: 46, onTime: 44 },
    projects: [
      { title: 'Smart Attendance System', tech: 'Python, OpenCV', grade: 'A+', year: 2024 },
      { title: 'E-Commerce Platform', tech: 'React, Node.js', grade: 'A', year: 2025 },
    ],
    certifications: [
      { name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-08', badge: '☁️' },
      { name: 'Python for Data Science', issuer: 'Coursera', date: '2024-03', badge: '🐍' },
      { name: 'React Developer', issuer: 'Meta', date: '2025-01', badge: '⚛️' },
    ],
  },
  STU002: {
    semesters: [
      { sem: 'Sem 1', gpa: 7.8, credits: 22, subjects: ['Math I', 'Physics', 'C Programming', 'English', 'ES Lab'], attendance: 85 },
      { sem: 'Sem 2', gpa: 8.1, credits: 24, subjects: ['Math II', 'Signals', 'Circuit Theory', 'Digital Circuits', 'Workshop'], attendance: 82 },
      { sem: 'Sem 3', gpa: 8.4, credits: 24, subjects: ['EMT', 'Analog Circuits', 'Control Systems', 'DSP', 'VLSI'], attendance: 87 },
      { sem: 'Sem 4', gpa: 8.4, credits: 26, subjects: ['Microprocessors', 'Communication', 'Elective I', 'Mini Project', 'Seminar'], attendance: 89 },
    ],
    attendance: { total: 240, present: 203, percent: 85 },
    assignments: { total: 48, submitted: 42, onTime: 38 },
    projects: [
      { title: 'IoT Home Automation', tech: 'Arduino, ESP32', grade: 'A', year: 2024 },
      { title: 'VLSI Design of ALU', tech: 'Verilog, Xilinx', grade: 'A+', year: 2025 },
    ],
    certifications: [
      { name: 'NPTEL Electronics', issuer: 'NPTEL', date: '2024-06', badge: '🔌' },
      { name: 'IoT Fundamentals', issuer: 'Cisco', date: '2024-11', badge: '📡' },
    ],
  },
  STU003: {
    semesters: [
      { sem: 'Sem 1', gpa: 8.2, credits: 20, subjects: ['Management Principles', 'Accounting', 'Business Math', 'Communication', 'IT Basics'], attendance: 90 },
      { sem: 'Sem 2', gpa: 8.5, credits: 20, subjects: ['Marketing', 'HR Management', 'Finance', 'Business Law', 'Statistics'], attendance: 92 },
      { sem: 'Sem 3', gpa: 8.7, credits: 22, subjects: ['Operations', 'Strategy', 'Entrepreneurship', 'Elective', 'Case Studies'], attendance: 94 },
      { sem: 'Sem 4', gpa: 8.7, credits: 22, subjects: ['Research Methods', 'Business Analytics', 'Capstone Project', 'Internship'], attendance: 88 },
    ],
    attendance: { total: 200, present: 184, percent: 92 },
    assignments: { total: 40, submitted: 39, onTime: 37 },
    projects: [
      { title: 'Market Entry Strategy — EV Sector', tech: 'Research, Presentation', grade: 'A+', year: 2024 },
      { title: 'HR Analytics Dashboard', tech: 'Excel, Power BI', grade: 'A', year: 2025 },
    ],
    certifications: [
      { name: 'Google Analytics', issuer: 'Google', date: '2024-05', badge: '📊' },
      { name: 'PMP Foundation', issuer: 'PMI', date: '2025-01', badge: '📋' },
    ],
  },
  STU004: {
    semesters: [
      { sem: 'Sem 1', gpa: 7.0, credits: 22, subjects: ['Calculus', 'Linear Algebra', 'Discrete Math', 'Statistics', 'Programming'], attendance: 80 },
      { sem: 'Sem 2', gpa: 7.2, credits: 22, subjects: ['Analysis', 'Abstract Algebra', 'Probability', 'Numerical Methods', 'Lab'], attendance: 78 },
      { sem: 'Sem 3', gpa: 7.5, credits: 24, subjects: ['Topology', 'Complex Analysis', 'Graph Theory', 'Elective', 'Seminar'], attendance: 83 },
      { sem: 'Sem 4', gpa: 7.5, credits: 24, subjects: ['Research Project', 'Advanced Stats', 'Operations Research', 'Elective'], attendance: 85 },
    ],
    attendance: { total: 220, present: 181, percent: 82 },
    assignments: { total: 44, submitted: 40, onTime: 36 },
    projects: [
      { title: 'Graph Coloring Algorithms', tech: 'Python, NetworkX', grade: 'B+', year: 2024 },
      { title: 'Statistical Analysis of Climate Data', tech: 'R, ggplot2', grade: 'A', year: 2025 },
    ],
    certifications: [
      { name: 'SAS Statistical Analysis', issuer: 'SAS', date: '2024-09', badge: '📉' },
    ],
  },
  STU005: {
    semesters: [
      { sem: 'Sem 1', gpa: 9.4, credits: 22, subjects: ['Math I', 'Physics', 'C Programming', 'English', 'ES Lab'], attendance: 97 },
      { sem: 'Sem 2', gpa: 9.6, credits: 24, subjects: ['Math II', 'Chemistry', 'DS', 'Digital Circuits', 'Workshop'], attendance: 98 },
      { sem: 'Sem 3', gpa: 9.8, credits: 24, subjects: ['DBMS', 'OS', 'COA', 'Discrete Math', 'OOP'], attendance: 99 },
      { sem: 'Sem 4', gpa: 9.8, credits: 26, subjects: ['ML', 'CN', 'SE', 'Elective I', 'Capstone Project'], attendance: 100 },
    ],
    attendance: { total: 240, present: 238, percent: 99 },
    assignments: { total: 48, submitted: 48, onTime: 48 },
    projects: [
      { title: 'AI Chatbot for Education', tech: 'Python, GPT API', grade: 'A+', year: 2024 },
      { title: 'Blockchain Voting System', tech: 'Solidity, React', grade: 'A+', year: 2025 },
      { title: 'Real-time Object Detection', tech: 'YOLO, TensorFlow', grade: 'A+', year: 2025 },
    ],
    certifications: [
      { name: 'Google Cloud Professional', issuer: 'Google', date: '2024-04', badge: '☁️' },
      { name: 'TensorFlow Developer', issuer: 'Google', date: '2024-08', badge: '🤖' },
      { name: 'GitHub Actions CI/CD', issuer: 'GitHub', date: '2025-02', badge: '🔧' },
      { name: 'Kubernetes Associate', issuer: 'CNCF', date: '2025-03', badge: '⚙️' },
    ],
  },
  STU006: {
    semesters: [
      { sem: 'Sem 1', gpa: 7.9, credits: 22, subjects: ['Math I', 'Physics', 'C Programming', 'English', 'ES Lab'], attendance: 86 },
      { sem: 'Sem 2', gpa: 8.0, credits: 24, subjects: ['Math II', 'Linear Algebra', 'DS', 'AI Basics', 'Workshop'], attendance: 84 },
      { sem: 'Sem 3', gpa: 8.1, credits: 24, subjects: ['ML', 'DL', 'NLP', 'Computer Vision', 'Research Methods'], attendance: 88 },
      { sem: 'Sem 4', gpa: 8.1, credits: 26, subjects: ['Advanced ML', 'Reinforcement Learning', 'Thesis', 'Seminar'], attendance: 87 },
    ],
    attendance: { total: 240, present: 206, percent: 86 },
    assignments: { total: 48, submitted: 44, onTime: 41 },
    projects: [
      { title: 'Sentiment Analysis — Social Media', tech: 'BERT, HuggingFace', grade: 'A', year: 2024 },
      { title: 'Autonomous Driving Simulation', tech: 'CARLA, PyTorch', grade: 'A+', year: 2025 },
    ],
    certifications: [
      { name: 'Deep Learning Specialization', issuer: 'Coursera', date: '2024-07', badge: '🧠' },
      { name: 'NLP with Python', issuer: 'Udemy', date: '2024-12', badge: '💬' },
    ],
  },
  STU007: {
    semesters: [
      { sem: 'Sem 1', gpa: 6.8, credits: 22, subjects: ['Math I', 'Classical Mechanics', 'Lab I', 'English', 'Programming'], attendance: 79 },
      { sem: 'Sem 2', gpa: 7.0, credits: 22, subjects: ['Electrodynamics', 'Optics', 'Thermodynamics', 'Lab II', 'Stats'], attendance: 80 },
      { sem: 'Sem 3', gpa: 7.2, credits: 24, subjects: ['Quantum Mechanics', 'Nuclear Physics', 'Solid State', 'Lab III', 'Elective'], attendance: 82 },
      { sem: 'Sem 4', gpa: 7.2, credits: 24, subjects: ['Astrophysics', 'Particle Physics', 'Research Project', 'Seminar'], attendance: 83 },
    ],
    attendance: { total: 220, present: 178, percent: 81 },
    assignments: { total: 44, submitted: 38, onTime: 34 },
    projects: [
      { title: 'Quantum Computing Intro — Simulation', tech: 'Qiskit, Python', grade: 'B+', year: 2024 },
      { title: 'Solar System Simulation', tech: 'MATLAB, Python', grade: 'A', year: 2025 },
    ],
    certifications: [
      { name: 'Quantum Computing Foundations', issuer: 'IBM', date: '2025-01', badge: '⚛️' },
    ],
  },
  STU008: {
    semesters: [
      { sem: 'Sem 1', gpa: 6.4, credits: 20, subjects: ['Management Principles', 'Accounting', 'Business Math', 'Communication', 'IT Basics'], attendance: 75 },
      { sem: 'Sem 2', gpa: 6.6, credits: 20, subjects: ['Marketing', 'HR Management', 'Finance', 'Business Law', 'Statistics'], attendance: 77 },
      { sem: 'Sem 3', gpa: 6.8, credits: 22, subjects: ['Operations', 'Strategy', 'Entrepreneurship', 'Elective', 'Case Studies'], attendance: 79 },
      { sem: 'Sem 4', gpa: 6.8, credits: 22, subjects: ['Research Methods', 'Business Analytics', 'Capstone Project', 'Internship'], attendance: 80 },
    ],
    attendance: { total: 200, present: 153, percent: 77 },
    assignments: { total: 40, submitted: 34, onTime: 29 },
    projects: [
      { title: 'Supply Chain Optimization', tech: 'Excel, Tableau', grade: 'B', year: 2024 },
      { title: 'Digital Marketing Campaign', tech: 'Google Ads, Analytics', grade: 'B+', year: 2025 },
    ],
    certifications: [
      { name: 'HubSpot Marketing', issuer: 'HubSpot', date: '2024-10', badge: '📣' },
    ],
  },
};

export const COMPETITION_RECORDS = {
  STU001: [
    { title: 'National Hackathon 2024', category: 'Hackathon', position: '🥇 1st Place', organizer: 'HackerEarth', date: '2024-09-14', prize: '₹50,000', team: 'CodeStorm', description: 'Built an AI-powered disaster relief coordination app in 36 hours.' },
    { title: 'CodeChef Long Challenge', category: 'Competitive Coding', position: '🏆 Top 100', organizer: 'CodeChef', date: '2024-11-01', prize: 'Certificate', team: 'Solo', description: 'Ranked 87th globally out of 12,000+ participants.' },
    { title: 'Inter-College Tech Quiz', category: 'Quiz', position: '🥈 2nd Place', organizer: 'IIT Bombay', date: '2025-01-20', prize: '₹10,000', team: 'Team Alpha', description: 'Technical quiz covering CS fundamentals, AI, and emerging tech.' },
    { title: 'Smart India Hackathon', category: 'Hackathon', position: '🎖️ Finalist', organizer: 'AICTE', date: '2025-03-10', prize: 'Certificate', team: 'InnovateTech', description: 'Developed a blockchain-based document verification system.' },
    { title: 'ACM ICPC Regionals', category: 'Competitive Coding', position: '🥉 3rd Place', organizer: 'ACM', date: '2025-04-05', prize: '₹15,000', team: 'ByteBusters', description: 'Solved 8/12 problems in competitive programming contest.' },
  ],
  STU002: [
    { title: 'Robocon 2024', category: 'Robotics', position: '🥇 1st Place', organizer: 'DD Robocon', date: '2024-08-20', prize: '₹1,00,000', team: 'MechWarriors', description: 'Designed and built autonomous robots for precision tasks.' },
    { title: 'Circuit Design Challenge', category: 'Technical', position: '🥈 2nd Place', organizer: 'IEEE', date: '2024-12-05', prize: '₹20,000', team: 'CircuitBros', description: 'Optimized power-efficient circuit for IoT applications.' },
    { title: 'Electronics Innovation Award', category: 'Innovation', position: '🏅 Special Award', organizer: 'TechFest IIT-B', date: '2025-01-15', prize: '₹25,000', team: 'Solo', description: 'Awarded for innovative use of FPGA in real-time audio processing.' },
  ],
  STU003: [
    { title: 'National B-Plan Competition', category: 'Business', position: '🥇 1st Place', organizer: 'IIM Ahmedabad', date: '2024-10-18', prize: '₹75,000', team: 'VentureX', description: 'Pitched a sustainable agri-tech startup to a panel of top VCs.' },
    { title: 'Marketing Strategy Olympiad', category: 'Marketing', position: '🥈 2nd Place', organizer: 'XLRI', date: '2025-02-11', prize: '₹20,000', team: 'BrandBuilders', description: 'Developed go-to-market strategy for a D2C health brand.' },
    { title: 'Case Study Competition — Finance', category: 'Finance', position: '🥉 3rd Place', organizer: 'ISB Hyderabad', date: '2025-04-02', prize: '₹10,000', team: 'FinanceFirst', description: 'Analysed and presented M&A valuation case study.' },
  ],
  STU004: [
    { title: 'Mathematics Olympiad', category: 'Academic', position: '🥉 3rd Place', organizer: 'NBHM', date: '2024-11-30', prize: 'Medal', team: 'Solo', description: 'National-level olympiad covering real analysis and number theory.' },
    { title: 'Statistics Poster Competition', category: 'Research', position: '🏅 Best Poster', organizer: 'ISI Kolkata', date: '2025-03-22', prize: 'Certificate + ₹5,000', team: 'Solo', description: 'Presented probabilistic model for epidemic spread.' },
  ],
  STU005: [
    { title: 'Google Hackathon 2024', category: 'Hackathon', position: '🥇 Winner', organizer: 'Google India', date: '2024-07-22', prize: '₹2,00,000', team: 'NeuralNinjas', description: 'Built Gemini-powered accessibility tool for visually impaired students.' },
    { title: 'ICPC World Finals Qualifier', category: 'Competitive Coding', position: '🏆 Qualified', organizer: 'ACM ICPC', date: '2024-10-10', prize: 'Scholarship', team: 'Team Prime', description: 'One of only 15 teams from India to qualify for World Finals.' },
    { title: 'Microsoft Imagine Cup', category: 'Innovation', position: '🥈 Runner Up', organizer: 'Microsoft', date: '2025-01-08', prize: '₹50,000', team: 'CogniCode', description: 'AI-driven mental health monitoring wearable app.' },
    { title: 'TCS Codevita Season 12', category: 'Competitive Coding', position: '🥇 Rank 1 (India)', organizer: 'TCS', date: '2025-02-28', prize: 'PPO + ₹1,00,000', team: 'Solo', description: 'Topped the national leaderboard with perfect score in 5 rounds.' },
    { title: 'IEEE Student Paper Award', category: 'Research', position: '🏅 Best Paper', organizer: 'IEEE', date: '2025-04-12', prize: '₹30,000', team: 'Solo', description: 'Research paper on transformer architecture optimization accepted.' },
  ],
  STU006: [
    { title: 'AI/ML Hackathon — Flipkart', category: 'Hackathon', position: '🥈 Runner Up', organizer: 'Flipkart', date: '2024-09-05', prize: '₹40,000', team: 'DeepMind INC', description: 'Built real-time product recommendation engine with 93% accuracy.' },
    { title: 'DataHack Summit', category: 'Data Science', position: '🥉 3rd Place', organizer: 'Analytics Vidhya', date: '2024-12-14', prize: '₹15,000', team: 'Solo', description: 'Time-series forecasting challenge on energy consumption data.' },
  ],
  STU007: [
    { title: 'INSPIRE Science Award', category: 'Science', position: '🏅 Selected', organizer: 'DST India', date: '2024-08-08', prize: 'Scholarship', team: 'Solo', description: 'Selected for DST INSPIRE scholarship for outstanding science aptitude.' },
    { title: 'Physics Bowl International', category: 'Academic', position: '🥈 2nd (Regional)', organizer: 'AAPT', date: '2025-03-15', prize: 'Certificate', team: 'Solo', description: 'High-school and undergrad physics rapid-fire competition.' },
  ],
  STU008: [
    { title: 'Youth Entrepreneur Award', category: 'Business', position: '🥉 3rd Place', organizer: 'CII Young India', date: '2024-11-11', prize: '₹8,000', team: 'Solo', description: 'Pitched a micro-lending platform for rural women entrepreneurs.' },
  ],
};

export const ACHIEVEMENTS = {
  STU001: ['🏆 Hackathon Champion 2024', '⭐ Department Topper Sem 4', '📜 Dean\'s List 2024-25', '🤝 Student Council VP'],
  STU002: ['🤖 Robocon Champion 2024', '⚡ Best ECE Project Award', '📜 IEEE Student Member'],
  STU003: ['💼 B-Plan Winner IIM-A 2024', '🌟 MBA Batch Topper', '📜 Case Study Excellence Award'],
  STU004: ['🔢 Mathematics Olympiad Medalist', '📊 Best Research Poster ISI', '📖 Departmental Scholarship'],
  STU005: ['🏆 Google Hackathon Winner', '💻 ICPC World Finals Qualifier', '⭐ University Gold Medalist', '🎓 Academic Excellence Award', '📜 3 IEEE Publications'],
  STU006: ['🤖 AI Hackathon Runner-Up', '🧠 Deep Learning Expert Certified', '📚 Research Publication — IJCAI'],
  STU007: ['🔬 DST INSPIRE Scholar', '⚛️ Quantum Computing Certified', '🌌 Physics Bowl Silver Medalist'],
  STU008: ['💡 Youth Entrepreneur Finalist', '📣 HubSpot Certified Marketer'],
};
