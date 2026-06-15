/**
 * ragService.js
 *
 * A client-side Retrieval-Augmented Generation (RAG) engine.
 *
 * Architecture:
 *   1. INGEST  — convert all student/system data into text "documents"
 *   2. CHUNK   — split long documents into overlapping chunks (~200 tokens)
 *   3. EMBED   — represent each chunk as a TF-IDF + keyword vector (no API needed)
 *   4. RETRIEVE — given a query, cosine-similarity-rank chunks and return top-K
 *   5. AUGMENT  — inject retrieved chunks into the Gemini prompt as grounded context
 *
 * No external embedding API is needed — we use a BM25-style sparse retrieval
 * that works entirely in the browser. This means zero cost and zero latency for
 * the retrieval step.
 */

// ── Text utilities ────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','for','on','with','at','by','from','as','into','through','during',
  'and','or','but','if','then','so','yet','nor','not','no','i','me','my','we','our',
  'you','your','he','she','it','its','they','them','their','this','that','these',
  'those','what','which','who','how','when','where','why','all','each','every',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

function termFreq(tokens) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  return tf;
}

// BM25 parameters
const K1 = 1.5, B = 0.75;

// ── Document types ────────────────────────────────────────────────────────────

/**
 * Each document has:
 *   id      — unique string
 *   title   — short label for citations
 *   text    — full content
 *   type    — 'student' | 'system' | 'track' | 'competition' | 'policy'
 *   meta    — arbitrary metadata (studentId, etc.)
 *   tokens  — tokenized text (filled during indexing)
 *   tf      — term frequencies (filled during indexing)
 */

// ── Knowledge base builder ────────────────────────────────────────────────────

export function buildKnowledgeBase(students = [], trackRecords = [], competitions = []) {
  const docs = [];

  // 1. System / domain knowledge
  docs.push(...SYSTEM_DOCS);

  // 2. Per-student profile documents
  for (const s of students) {
    docs.push({
      id: `student-${s.id}`,
      title: `${s.fullName} (${s.id})`,
      type: 'student',
      meta: { studentId: s.id },
      text: buildStudentDoc(s),
    });
  }

  // 3. Track-record documents (academic performance, certifications, etc.)
  for (const tr of trackRecords) {
    const student = students.find(s => s.id === tr.studentId);
    const name = student?.fullName || tr.studentId;
    docs.push({
      id: `track-${tr.studentId}`,
      title: `Academic record — ${name}`,
      type: 'track',
      meta: { studentId: tr.studentId },
      text: buildTrackDoc(tr, name),
    });
  }

  // 4. Competition documents
  for (const c of competitions) {
    const student = students.find(s => s.id === c.studentId);
    const name = student?.fullName || c.studentId;
    docs.push({
      id: `comp-${c.id || Math.random()}`,
      title: `Competition: ${c.title} — ${name}`,
      type: 'competition',
      meta: { studentId: c.studentId },
      text: buildCompDoc(c, name),
    });
  }

  // 5. Aggregate / analytics documents
  if (students.length > 0) {
    docs.push(buildAnalyticsDoc(students));
  }

  return indexDocuments(docs);
}

// ── Document builders ─────────────────────────────────────────────────────────

function buildStudentDoc(s) {
  const parts = [
    `Student profile: ${s.fullName}`,
    `Student ID: ${s.id}`,
    `Course: ${s.course}`,
    `Department: ${s.department}`,
    `GPA: ${s.gpa ?? 'Not recorded'}`,
    `Date of birth: ${s.dob}`,
    `Enrolled date: ${s.enrolledDate}`,
    `Email: ${s.email}`,
    `Phone: ${s.phone}`,
  ];
  if (s.yearOfStudy)     parts.push(`Year of study: Year ${s.yearOfStudy}`);
  if (s.courseDuration)  parts.push(`Course duration: ${s.courseDuration} years`);
  if (s.academicYear)    parts.push(`Academic year: ${s.academicYear}`);
  if (s.admissionNumber) parts.push(`Admission number: ${s.admissionNumber}`);
  return parts.join('\n');
}

function buildTrackDoc(tr, studentName) {
  const parts = [`Academic track record for ${studentName}:`];

  if (tr.semesters?.length) {
    parts.push('Semester results:');
    for (const sem of tr.semesters) {
      parts.push(
        `  ${sem.sem}: SGPA ${sem.gpa}/10, Credits ${sem.credits}` +
        (sem.attendance ? `, Attendance ${sem.attendance}%` : '') +
        (sem.grade ? `, Grade ${sem.grade}` : '') +
        (sem.status ? `, ${sem.status}` : '') +
        (sem.subjects?.length ? `, Subjects: ${sem.subjects.join(', ')}` : '')
      );
    }
  }

  if (tr.yearCgpas?.length) {
    parts.push('Year-wise CGPA:');
    for (const y of tr.yearCgpas) {
      parts.push(`  Year ${y.year} (${y.academicYear || ''}): CGPA ${y.cgpa}/10`);
    }
  }

  if (tr.attendance) {
    parts.push(`Attendance: ${tr.attendance.present || 0}/${tr.attendance.total || 0} (${tr.attendance.percent || 0}%)`);
  }

  if (tr.certifications?.length) {
    parts.push('Certifications:');
    for (const c of tr.certifications) {
      parts.push(`  ${c.name} by ${c.issuer} (${c.date})`);
    }
  }

  if (tr.projects?.length) {
    parts.push('Projects:');
    for (const p of tr.projects) {
      parts.push(`  ${p.title}${p.tech ? ` (${p.tech})` : ''}${p.grade ? ` — Grade ${p.grade}` : ''}`);
      if (p.description) parts.push(`    ${p.description}`);
    }
  }

  if (tr.internships?.length) {
    parts.push('Internships:');
    for (const i of tr.internships) {
      parts.push(`  ${i.role} at ${i.company} — ${i.durationMonths} months`);
      if (i.description) parts.push(`    ${i.description}`);
    }
  }

  if (tr.examResults?.length) {
    parts.push('Exam results:');
    for (const e of tr.examResults) {
      parts.push(`  ${e.subject} (${e.semester}, ${e.examType}): ${e.marksObtained}/${e.maxMarks} — ${e.status}${e.grade ? ` Grade ${e.grade}` : ''}`);
    }
  }

  if (tr.adminMarks) {
    const am = tr.adminMarks;
    if (am.overallGrade || am.overallStatus) {
      parts.push(`Admin assessment: Overall grade ${am.overallGrade || 'N/A'}, Status: ${am.overallStatus || 'N/A'}`);
    }
    if (am.remarks) parts.push(`Admin remarks: ${am.remarks}`);
  }

  return parts.join('\n');
}

function buildCompDoc(c, studentName) {
  const parts = [
    `Competition: ${c.title}`,
    `Student: ${studentName}`,
    `Category: ${c.category}`,
    `Organiser: ${c.organizer}`,
    `Date: ${c.date}`,
    `Position: ${c.position}`,
    `Prize: ${c.prize || 'None mentioned'}`,
    `Team: ${c.team}`,
  ];
  if (c.description) parts.push(`Description: ${c.description}`);
  return parts.join('\n');
}

function buildAnalyticsDoc(students) {
  const gpas = students.filter(s => s.gpa != null).map(s => s.gpa);
  const avgGpa = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : 'N/A';
  const topStudent = students.reduce((best, s) => (!best || (s.gpa ?? 0) > (best.gpa ?? 0)) ? s : best, null);

  const deptMap = {};
  for (const s of students) {
    deptMap[s.department] = (deptMap[s.department] || 0) + 1;
  }

  const courseMap = {};
  for (const s of students) {
    courseMap[s.course] = (courseMap[s.course] || 0) + 1;
  }

  return {
    id: 'analytics-aggregate',
    title: 'System analytics summary',
    type: 'analytics',
    meta: {},
    text: [
      `SMS Pro system analytics summary:`,
      `Total students: ${students.length}`,
      `Average GPA across all students: ${avgGpa}`,
      `Highest GPA student: ${topStudent?.fullName} (${topStudent?.id}) with GPA ${topStudent?.gpa}`,
      `Department breakdown: ${Object.entries(deptMap).map(([d, n]) => `${d}: ${n}`).join(', ')}`,
      `Course breakdown: ${Object.entries(courseMap).map(([c, n]) => `${c}: ${n}`).join(', ')}`,
      `GPA distribution: below 7: ${gpas.filter(g => g < 7).length}, 7-8: ${gpas.filter(g => g >= 7 && g < 8).length}, 8-9: ${gpas.filter(g => g >= 8 && g < 9).length}, 9+: ${gpas.filter(g => g >= 9).length}`,
    ].join('\n'),
  };
}

// ── Static system knowledge ───────────────────────────────────────────────────

const SYSTEM_DOCS = [
  {
    id: 'sys-grading',
    title: 'Grading system',
    type: 'policy',
    meta: {},
    text: `SMS Pro uses a 10-point CGPA/SGPA grading scale.
Grade A+ corresponds to SGPA/CGPA 9.0-10.0 — Outstanding performance.
Grade A corresponds to 8.0-8.9 — Excellent.
Grade B+ corresponds to 7.0-7.9 — Very good.
Grade B corresponds to 6.0-6.9 — Good.
Grade C corresponds to 5.0-5.9 — Average, needs improvement.
Grade F is below 5.0 — Fail, requires re-examination.
PASS status requires minimum SGPA of 5.0 in all subjects.
CGPA is the cumulative GPA across all years. SGPA is the semester GPA.
Students with attendance below 75% are not eligible to sit exams.`,
  },
  {
    id: 'sys-courses',
    title: 'Courses offered',
    type: 'policy',
    meta: {},
    text: `Courses available at this institution:
B.Tech CSE (Computer Science Engineering) — 4 years, 8 semesters
B.Tech ECE (Electronics and Communication Engineering) — 4 years, 8 semesters
M.Tech AI (Artificial Intelligence) — 2 years, 4 semesters
MBA (Master of Business Administration) — 2 years, 4 semesters
B.Sc Math (Bachelor of Science in Mathematics) — 3 years, 6 semesters
B.Sc Physics (Bachelor of Science in Physics) — 3 years, 6 semesters
B.Com (Bachelor of Commerce) — 3 years, 6 semesters
BCA (Bachelor of Computer Applications) — 3 years, 6 semesters
MCA (Master of Computer Applications) — 2 years, 4 semesters`,
  },
  {
    id: 'sys-studytips',
    title: 'Study strategies',
    type: 'policy',
    meta: {},
    text: `Effective study strategies for academic improvement:
Spaced repetition: review material at increasing intervals (1 day, 3 days, 1 week, 2 weeks).
Active recall: test yourself instead of re-reading — flashcards, practice problems.
Pomodoro technique: 25-minute focus blocks with 5-minute breaks.
Feynman technique: explain concepts in simple language to find gaps in understanding.
Cornell note-taking: divide notes into main notes, cues, and summary sections.
Mind mapping: visual diagrams to connect related concepts.
Past papers: solving previous exam papers is the most effective exam preparation.
Sleep: 7-8 hours is essential — memory consolidation happens during sleep.
Exercise: 30 minutes of exercise improves focus and cognitive performance.
To improve GPA: focus on subjects with the most credits, target C-grade subjects first for maximum GPA lift.`,
  },
  {
    id: 'sys-career-cs',
    title: 'Career paths — Computer Science',
    type: 'policy',
    meta: {},
    text: `Career paths for Computer Science and CSE students:
Software Engineering: requires strong DSA (Data Structures and Algorithms), system design skills. Companies: Google, Microsoft, Amazon, Flipkart, Infosys, TCS.
Machine Learning / AI: requires Python, mathematics (linear algebra, statistics), ML frameworks. Companies: DeepMind, OpenAI, research labs.
Web Development: requires React, Node.js, databases. Companies: startups, product companies.
Cloud & DevOps: requires AWS/GCP/Azure, Docker, Kubernetes. Companies: all tech companies.
Cybersecurity: requires networking, OS concepts, ethical hacking.
Competitive programming: improves problem-solving, valued by top tech companies.
For placements: maintain GPA above 7.0, build 2-3 strong projects, do at least one internship, practice DSA on LeetCode/Codeforces.
Top internship platforms: LinkedIn, Internshala, AngelList, company career pages.`,
  },
  {
    id: 'sys-career-mba',
    title: 'Career paths — MBA',
    type: 'policy',
    meta: {},
    text: `Career paths for MBA students:
Finance: investment banking, financial analysis, equity research. Requires CFA preparation.
Marketing: brand management, digital marketing, market research.
Human Resources: talent acquisition, organisational development.
Operations: supply chain management, logistics, project management.
Consulting: management consulting requires strong analytical and communication skills.
Entrepreneurship: starting a business — requires networking and mentorship.
For MBA students: case study preparation, group discussions, and interview skills are critical.
Key skills: Excel, PowerPoint, SQL for data analysis, communication, leadership.`,
  },
  {
    id: 'sys-competitions',
    title: 'Competition preparation',
    type: 'policy',
    meta: {},
    text: `Preparing for academic and technical competitions:
Hackathons: form a balanced team (developer, designer, presenter), choose a problem with real-world impact, build an MVP in 24-48 hours, prepare a strong demo.
Competitive coding: practice on LeetCode, Codeforces, HackerRank. Focus on arrays, graphs, DP, strings.
Business plan competitions: research the market thoroughly, create a viable financial model, address the problem-solution fit.
Research paper presentations: choose a novel topic, follow IEEE/ACM format, practice presenting in 10-minute slots.
Science exhibitions: hands-on prototype is more impressive than theory, relate to real-world problems.
General tips: start early, iterate on feedback, rehearse your pitch, know your domain deeply.`,
  },
  {
    id: 'sys-attendance',
    title: 'Attendance policy',
    type: 'policy',
    meta: {},
    text: `Attendance rules and policies:
Minimum attendance required: 75% in each subject to be eligible for exams.
Students below 75% attendance may be detained from appearing in semester exams.
Medical leave requires documentation submitted within 7 days.
Students between 65-75% may apply for condonation with valid medical/official reasons.
Attendance is tracked per subject, not just overall.
Consistently high attendance (90%+) positively impacts internal assessment marks.
Students should inform faculty in advance for planned absences.`,
  },
  {
    id: 'sys-sms-features',
    title: 'SMS Pro system features',
    type: 'policy',
    meta: {},
    text: `SMS Pro (Student Management System) features and capabilities:
Admin panel: manage all students, view analytics, add/edit/delete records.
Student portal: students can log in and view their own academic records.
Track records: semesters, SGPA, year CGPA, certifications, projects, internships, exam results.
Analytics: department-wise GPA distribution, enrollment trends, competition performance.
AI chatbot (EduBot): powered by Gemini AI and RAG for personalised academic guidance.
Competitions module: track all competition participations and results.
Messaging: real-time admin-student communication via Firebase.
MongoDB Atlas: cloud database for all records.
The system is built with React (frontend), Spring Boot (backend), MongoDB (database), Firebase (real-time features).`,
  },
];

// ── Indexing (BM25) ───────────────────────────────────────────────────────────

function indexDocuments(docs) {
  // Tokenize all docs
  for (const doc of docs) {
    doc.tokens = tokenize(doc.text);
    doc.tf = termFreq(doc.tokens);
  }

  // Compute IDF
  const df = {};
  for (const doc of docs) {
    for (const term of Object.keys(doc.tf)) {
      df[term] = (df[term] || 0) + 1;
    }
  }

  const N = docs.length;
  const idf = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((N - freq + 0.5) / (freq + 0.5) + 1);
  }

  const avgLen = docs.reduce((s, d) => s + d.tokens.length, 0) / N;

  return { docs, idf, avgLen, N };
}

// ── Retrieval ─────────────────────────────────────────────────────────────────

export function retrieve(kb, query, topK = 5, studentFilter = null) {
  if (!kb || !kb.docs.length) return [];

  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const scores = kb.docs.map(doc => {
    // Optional: filter to only this student's docs + system docs
    if (studentFilter) {
      const isSystem = !doc.meta.studentId;
      const isThisStudent = doc.meta.studentId === studentFilter;
      if (!isSystem && !isThisStudent) return { doc, score: -1 };
    }

    let score = 0;
    const docLen = doc.tokens.length;
    for (const term of qTokens) {
      const tf_d = doc.tf[term] || 0;
      if (!tf_d) continue;
      const idf_t = kb.idf[term] || 0;
      // BM25 formula
      const numerator = tf_d * (K1 + 1);
      const denominator = tf_d + K1 * (1 - B + B * (docLen / kb.avgLen));
      score += idf_t * (numerator / denominator);
    }

    // Boost exact title match
    if (doc.title.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
    }

    return { doc, score };
  });

  return scores
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(x => x.doc);
}

// ── Context builder for Gemini prompt ─────────────────────────────────────────

export function buildRAGContext(retrievedDocs) {
  if (!retrievedDocs.length) return '';
  const sections = retrievedDocs.map((doc, i) =>
    `[Source ${i + 1}: ${doc.title}]\n${doc.text}`
  );
  return sections.join('\n\n---\n\n');
}

export function buildRAGSystemPrompt(ragContext, studentContext) {
  return `You are EduBot, an intelligent academic assistant for SMS Pro (Student Management System).

You have access to the following retrieved knowledge base documents relevant to this query:

=== RETRIEVED CONTEXT ===
${ragContext}
=== END CONTEXT ===

${studentContext ? `Current student context: ${studentContext}` : ''}

Instructions:
- Answer using the retrieved context above as your PRIMARY source of truth.
- If the answer is directly in the context, cite which source it comes from (e.g., "According to your track record...").
- If the context doesn't contain enough information, supplement with your general knowledge but be clear about it.
- Be concise (3-5 sentences), friendly, and specific to the student's actual data when available.
- Use the student's real GPA, grades, and achievements in your response when relevant.
- Keep responses helpful and encouraging. Use emojis occasionally.
- Never make up student data that isn't in the context.`;
}

// ── Source metadata for citation display ──────────────────────────────────────

export function getSourceLabels(docs) {
  const typeEmoji = {
    student:     '👤',
    track:       '📊',
    competition: '🏆',
    analytics:   '📈',
    policy:      '📋',
  };
  return docs.map(doc => ({
    id: doc.id,
    label: `${typeEmoji[doc.type] || '📄'} ${doc.title}`,
    type: doc.type,
  }));
}
