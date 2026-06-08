# Student Management System 🎓

A full-stack Student Management System with a next-gen interactive UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Java Spring Boot 3.2 |
| Database | MongoDB |
| Styling | Custom CSS (glassmorphism + neon) |

## Features

- **Dashboard** — animated hero, stat counters, dept breakdown, recent registrations, top performers
- **Student Directory** — grid/table view, search by name/ID/email, filter by course & department
- **Add/Edit Student** — 2-step form with floating labels and live preview card
- **Student Profile** — detailed view with GPA bar, edit/delete actions
- **Analytics** — Bar, Pie, Area, Radar charts powered by Recharts
- **Interactive UI** — particle network background, animated orbs, scroll reveals, neon glow, glassmorphism cards

## Quick Start

### Frontend

```bash
cd student-management
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend

> Prerequisites: Java 17+, Maven, MongoDB running on port 27017

```bash
cd student-management-backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students (supports `?search=`, `?course=`, `?department=`) |
| GET | `/api/students/:id` | Get student by ID |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/stats` | Get aggregate stats |

## Student Fields

Student ID · Full Name · Email · Phone · Course · Department · Date of Birth · GPA · Enrolled Date
