import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { useStudents, DEPARTMENTS, COURSES } from '../context/StudentContext';
import './Analytics.css';

const COLORS = ['#b44fff', '#00f5ff', '#ff2d78', '#ffe600', '#39ff14', '#ff6b35', '#a78bfa', '#f0abfc'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="tooltip-row" style={{ color: p.color || p.fill }}>
          <span>{p.name || 'Count'}</span>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, icon: Icon, children, delay = 0, fullWidth = false }) {
  return (
    <motion.div
      className={`chart-card glass-card ${fullWidth ? 'full-width' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
    >
      <div className="chart-card-header">
        <div className="chart-title-icon"><Icon /></div>
        <h3>{title}</h3>
      </div>
      <div className="chart-body">{children}</div>
    </motion.div>
  );
}

export default function Analytics() {
  const { students } = useStudents();

  const data = useMemo(() => {
    // Dept distribution
    const deptData = DEPARTMENTS.map(d => ({
      name: d.split(' ')[0],
      fullName: d,
      count: students.filter(s => s.department === d).length,
    })).filter(d => d.count > 0);

    // Course distribution
    const courseData = COURSES.map(c => ({
      name: c,
      count: students.filter(s => s.course === c).length,
    })).filter(c => c.count > 0);

    // GPA distribution
    const gpaRanges = [
      { name: '< 2.5', min: 0, max: 2.5 },
      { name: '2.5–3.0', min: 2.5, max: 3.0 },
      { name: '3.0–3.5', min: 3.0, max: 3.5 },
      { name: '3.5–3.8', min: 3.5, max: 3.8 },
      { name: '3.8–4.0', min: 3.8, max: 4.1 },
    ];
    const gpaData = gpaRanges.map(r => ({
      name: r.name,
      count: students.filter(s => s.gpa && s.gpa >= r.min && s.gpa < r.max).length,
    }));

    // Enrollment trend (mock monthly)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enrollData = months.map((m, i) => ({
      month: m,
      students: Math.floor(Math.random() * 15) + (i < 7 ? students.length / 12 : 0),
    }));
    // Use actual enrolled dates where available
    students.forEach(s => {
      if (s.enrolledDate) {
        const m = new Date(s.enrolledDate).getMonth();
        enrollData[m].students = (enrollData[m].students || 0) + 0.5;
      }
    });

    // Radar: dept strength
    const radarData = DEPARTMENTS.slice(0, 6).map(d => ({
      dept: d.split(' ')[0],
      students: students.filter(s => s.department === d).length,
      avgGpa: students.filter(s => s.department === d).reduce((a, s) => a + (s.gpa || 0), 0) /
        (students.filter(s => s.department === d).length || 1),
    }));

    return { deptData, courseData, gpaData, enrollData, radarData };
  }, [students]);

  const topStats = [
    { label: 'Total Students', value: students.length, color: '#b44fff' },
    { label: 'Avg GPA', value: students.length ? (students.reduce((a, s) => a + (s.gpa || 0), 0) / students.length).toFixed(2) : '0.00', color: '#39ff14' },
    { label: 'Active Depts', value: new Set(students.map(s => s.department)).size, color: '#00f5ff' },
    { label: 'Courses', value: new Set(students.map(s => s.course)).size, color: '#ff2d78' },
  ];

  return (
    <div className="analytics-page">
      <div className="orbs"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <div className="analytics-container">
        <motion.div
          className="analytics-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="analytics-title">
            <span className="title-gradient">Analytics</span> Dashboard
          </h1>
          <p className="analytics-sub">Real-time insights and visual reports</p>
        </motion.div>

        {/* Quick stats */}
        <div className="analytics-stats">
          {topStats.map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              className="a-stat-card"
              style={{ '--accent': color }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <div className="a-stat-value">{value}</div>
              <div className="a-stat-label">{label}</div>
              <div className="a-stat-glow" />
            </motion.div>
          ))}
        </div>

        {/* Charts grid */}
        <div className="charts-grid">
          <ChartCard title="Students by Department" icon={FiBarChart2} delay={0.1}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.deptData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9090b0" tick={{ fontSize: 12, fontFamily: 'Inter' }} />
                <YAxis stroke="#9090b0" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Course Distribution" icon={FiPieChart} delay={0.2}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.courseData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.courseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Enrollment Trend (2024)" icon={FiTrendingUp} delay={0.3} fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.enrollData}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b44fff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b44fff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#9090b0" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9090b0" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="students" stroke="#b44fff" strokeWidth={2} fill="url(#enrollGrad)" name="Students" dot={{ fill: '#b44fff', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="GPA Distribution" icon={FiBarChart2} delay={0.4}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.gpaData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9090b0" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9090b0" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.gpaData.map((_, i) => (
                    <Cell key={i} fill={i < 2 ? '#ff6b35' : i < 3 ? '#ffe600' : i < 4 ? '#00f5ff' : '#39ff14'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Department Radar" icon={FiPieChart} delay={0.5}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={data.radarData} cx="50%" cy="50%" outerRadius={100}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="dept" stroke="#9090b0" tick={{ fontSize: 12 }} />
                <Radar name="Students" dataKey="students" stroke="#b44fff" fill="#b44fff" fillOpacity={0.25} strokeWidth={2} />
                <Radar name="Avg GPA×5" dataKey="avgGpa" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ color: '#9090b0', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
