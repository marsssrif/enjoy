# 🎓 PENS Wrapped 2025

Platform web interaktif untuk mahasiswa **Politeknik Elektronika Negeri Surabaya (PENS)** yang menampilkan ringkasan akademik tahun 2025 dalam format visual menarik seperti Spotify Wrapped.

---

## 📋 Daftar Isi

- [Overview](#-overview)
- [Fitur Utama](#-fitur-utama)
- [Teknologi Stack](#-teknologi-stack)
- [Arsitektur](#-arsitektur)
- [Backend API](#-backend-api)
- [Frontend Components](#-frontend-components)
- [Instalasi](#-instalasi)
- [Penggunaan](#-penggunaan)
- [Dokumentasi Tambahan](#-dokumentasi-tambahan)

---

## 🌟 Overview

**PENS Wrapped** adalah aplikasi web yang mengintegrasikan data akademik mahasiswa PENS dari sistem informasi kampus (MIS PENS) dan menampilkannya dalam bentuk visual yang menarik dan interaktif. Mahasiswa dapat:

- 🔍 Mencari profil mahasiswa berdasarkan NRP
- 📊 Melihat statistik akademik lengkap
- 🎨 Membuat "Wrapped" visual tahun 2025
- 🤖 Generate AI Persona berdasarkan performa akademik
- 🏆 Melihat ranking juara kelas
- 📱 Share wrapped ke Instagram & WhatsApp
- 💾 Download wrapped sebagai gambar

---

## ✨ Fitur Utama

### 1. 🔍 **Student Search & Profile**
- Pencarian mahasiswa berdasarkan NRP (Nomor Registrasi Pokok)
- Tampilan profil lengkap:
  - Data pribadi (nama, kelas, prodi, angkatan)
  - Informasi keluarga (ayah, ibu)
  - Data kelahiran (tempat, tanggal lahir)
  - Status mahasiswa (aktif/cuti/keluar)

### 2. 📊 **Academic Statistics Dashboard**
- **Current GPA**: IPK semester terakhir dengan visualisasi bintang
- **Attendance Rate**: Persentase kehadiran kuliah
- **Performance Trends**: Grafik tren GPA per semester
- **Grade Distribution**: Distribusi nilai (A, B, C, dst)
- **Semester Overview**: Detail nilai per semester
- **Subject Details**: List matakuliah dengan nilai dan SKS

### 3. 🎨 **2025 Wrapped Story**
Tampilan visual menarik dalam format story Instagram yang menampilkan:
- **Slide 1 - Hero**: Intro dengan nama & prodi mahasiswa
- **Slide 2 - Stats**: Current GPA, attendance, total semester
- **Slide 3 - Best Semester**: Semester dengan GPA tertinggi
- **Slide 4 - Grade Streaks**: Nilai yang paling sering muncul
- **Slide 5 - AI Persona**: Karakter AI berdasarkan performa (generative AI)

### 4. 🤖 **AI Persona Generator**
- Menggunakan Google Gemini AI untuk generate persona mahasiswa
- Analisis berdasarkan:
  - GPA (tinggi/rendah)
  - Attendance rate
  - Grade trends
  - Best semester performance
- Output: Karakter unik dengan deskripsi personality

### 5. 🏆 **Class Leaderboard (Juara Kelas)**
- Ranking mahasiswa se-kelas berdasarkan IPK
- Tampilan leaderboard dari peringkat 1 hingga terakhir
- Informasi detail setiap mahasiswa:
  - Rank/peringkat
  - Nama lengkap
  - NRP
  - GPA (dengan desimal 2 digit)
  - Badge untuk Top 3 (🥇🥈🥉)
- Filter otomatis berdasarkan kelas mahasiswa yang sedang dilihat
- **Optimized API Call**: Hanya 1 request untuk load semua data kelas

### 6. 📱 **Share & Download Features**
- **Save Image**: Download wrapped sebagai PNG (3x resolution)
- **Instagram Share**: Capture wrapped + auto open Instagram untuk story
- **WhatsApp Share**: Capture wrapped + auto open WhatsApp untuk status
- File naming: `Wrapped-[Nama]-2025.png`

---

## 🛠 Teknologi Stack

### **Frontend**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React (500+ icons)
- **Image Capture**: html-to-image v1.11.13

### **Backend**
- **Runtime**: Next.js API Routes (Serverless)
- **HTTP Client**: Axios v1.13.2
- **External API**: PENS MIS API (online.mis.pens.ac.id)

### **AI Integration**
- **Provider**: Google Gemini AI (Generative AI)
- **Model**: gemini-1.5-flash
- **Use Case**: Persona generation based on academic data

### **Development Tools**
- **Package Manager**: npm / pnpm
- **Linter**: ESLint 9
- **Type Checking**: TypeScript
- **CSS Framework**: PostCSS + Tailwind

---

## 🏗 Arsitektur

### **Project Structure**
```
pens-wrapp/
├── app/
│   ├── page.tsx              # Main page component (client-side)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       └── student/
│           └── route.ts      # API routes for student data
├── lib/
│   ├── api.ts                # API client & interfaces
│   └── utils.ts              # Utility functions (GPA calc, stats)
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind CSS config
├── FITUR_REQUESAPI.md       # API request documentation
├── FITUR_SHARE.md           # Share feature documentation
├── PERBAIKAN_BUG.md         # Bug fixes documentation
└── README.md                 # This file
```

### **Data Flow**
```
User Input (NRP) 
    ↓
Frontend (page.tsx)
    ↓
API Route (/api/student)
    ↓
External MIS PENS API
    ↓
Data Processing (utils.ts)
    ↓
UI Rendering (React Components)
```

---

## 🔌 Backend API

### **API Routes** (`/app/api/student/route.ts`)

#### **Endpoints**

1. **`fetch-student`** - Get student data by NRP
   ```typescript
   POST /api/student
   Body: { action: 'fetch-student', nrp: '3125600067' }
   Response: { success: true, data: StudentData }
   ```

2. **`fetch-nilai`** - Get student grades (nilai)
   ```typescript
   POST /api/student
   Body: { action: 'fetch-nilai', nomor: '27559' }
   Response: { success: true, data: NilaiData[] }
   ```

3. **`fetch-absensi`** - Get student attendance
   ```typescript
   POST /api/student
   Body: { action: 'fetch-absensi', nrp: '3125600067' }
   Response: { success: true, data: AbsensiData[] }
   ```

4. **`fetch-kelas`** - Get class information
   ```typescript
   POST /api/student
   Body: { action: 'fetch-kelas', kelasNomor: '267' }
   Response: { success: true, data: KelasData }
   ```

5. **`fetch-mahasiswa-by-kelas`** - Get all students in a class
   ```typescript
   POST /api/student
   Body: { action: 'fetch-mahasiswa-by-kelas', kelasNomor: '267' }
   Response: { success: true, data: StudentData[] }
   ```

### **External API Integration**

**Base URL**: `https://online.mis.pens.ac.id/API_PENS/v1/read`

**Authentication**: API Key (x-api-key header)

**Request Format**:
```json
{
  "table": "mahasiswa",
  "data": ["*"],
  "filter": { "nrp": "3125600067" }
}
```

**Tables Used**:
- `mahasiswa` - Student master data
- `vmy_nilai` - Student grades
- `vmy_absensi_kuliah` - Student attendance
- `kelas` - Class information

---

## 🎨 Frontend Components

### **Main Component** (`app/page.tsx`)

#### **State Management**
- `searchQuery`: NRP input dari user
- `selectedStudent`: Data mahasiswa yang dipilih
- `studentStats`: Statistik akademik yang diproses
- `showProfile`: Toggle modal profile
- `showStoryMode`: Toggle wrapped view
- `aiPersona`: AI-generated persona
- `classLeaderboard`: Data ranking kelas
- `showLeaderboard`: Toggle leaderboard modal

#### **Key Functions**

1. **`handleSearch()`**
   - Validasi NRP (10 digit)
   - Fetch student data
   - Fetch nilai & absensi
   - Process statistics
   - Show profile modal

2. **`handleGeneratePersona()`**
   - Call Gemini AI API
   - Analyze GPA, attendance, trends
   - Generate unique character persona

3. **`handleLoadClassLeaderboard()`**
   - Get student's class (KELAS field)
   - Fetch all students in class (1 API call)
   - Calculate GPA for each student
   - Sort by GPA descending
   - Display leaderboard

4. **`handleDownload()`**
   - Capture wrapped using html-to-image
   - Convert to PNG (3x scale)
   - Auto download file

5. **`handleShareInstagram()` / `handleShareWhatsApp()`**
   - Capture wrapped image
   - Copy to clipboard (Instagram)
   - Download + open app (WhatsApp)

#### **Sub-Components**

- **`ProfileModal`**: Student profile popup
- **`StoryWrapped`**: Wrapped story view (5 slides)
- **`LeaderboardModal`**: Class ranking list
- **`SearchBar`**: NRP input field
- **`StatsCard`**: Reusable card for statistics

### **Utility Functions** (`lib/utils.ts`)

1. **`processStudentStats()`**
   - Calculate current GPA
   - Calculate attendance rate
   - Process semester stats
   - Find value streaks
   - Determine best semester

2. **`calculateGPAForSemester()`**
   - Filter nilai by semester & year
   - Convert grades to grade points
   - Calculate weighted average
   - Return GPA with precision 2

3. **`getLatestSemester()`**
   - Find latest valid semester (1 or 2)
   - Exclude remedial semesters (3+)

4. **`calculateAttendanceRate()`**
   - Count total attendance records
   - Calculate percentage
   - Handle edge cases

---

## 📦 Instalasi

### **Prerequisites**
- Node.js 18+ atau 20+
- npm / pnpm / yarn

### **Setup**

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd pens-wrapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   pnpm install
   ```

3. **Setup environment variables** ⚠️ **REQUIRED**
   ```bash
   # Copy template
   cp .env.example .env.local
   
   # Edit .env.local dan isi dengan API keys yang valid
   # Lihat ENV_VARIABLES.md untuk dokumentasi lengkap
   ```
   
   **Environment variables yang diperlukan**:
   - `PENS_API_KEY`: API key untuk PENS MIS (hubungi admin)
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Gemini AI key ([Get it here](https://makersuite.google.com/app/apikey))
   
   📖 **Dokumentasi lengkap**: [ENV_VARIABLES.md](./ENV_VARIABLES.md)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

### **Build for Production**
```bash
npm run build
npm start
```

---

## 🚀 Penggunaan

### **Untuk User (Mahasiswa)**

1. **Buka aplikasi** di browser
2. **Masukkan NRP** (10 digit) di search bar
3. **Klik Search** atau tekan Enter
4. **Lihat Profile** mahasiswa yang muncul
5. **Klik "Check your 2025 Wrapped"** untuk melihat wrapped
6. **Navigate** antar slide dengan tombol arrow
7. **Generate AI Persona** dengan klik tombol Sparkles (✨)
8. **Share/Download**:
   - Klik "SAVE IMAGE" untuk download
   - Klik "INSTA" untuk share ke Instagram Story
   - Klik "WHATSAPP" untuk share ke WhatsApp
9. **Lihat Juara Kelas** dengan klik tombol "Lihat Juara Kelas" di profile

### **Tips**
- Pastikan koneksi internet stabil (untuk API calls)
- Gunakan browser modern (Chrome, Firefox, Edge, Safari)
- Enable popup untuk share features
- Allow clipboard access untuk Instagram share

---

## 📚 Dokumentasi Tambahan

### **File Dokumentasi**

1. **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** 🔐
   - **Setup environment variables (REQUIRED)**
   - Konfigurasi API keys
   - Security best practices
   - Troubleshooting guide

2. **[FITUR_REQUESAPI.md](./FITUR_REQUESAPI.md)**
   - Dokumentasi lengkap API requests
   - Contoh request & response
   - Update v2: Juara Kelas feature

3. **[FITUR_SHARE.md](./FITUR_SHARE.md)**
   - Dokumentasi share & download features
   - UI/UX details
   - Technical implementation

3. **[PERBAIKAN_BUG.md](./PERBAIKAN_BUG.md)**
   - Bug fixes untuk share features
   - Infinite loop fixes
   - Props passing issues

---

## 🔧 Development Notes

### **Key Design Decisions**

1. **Why Next.js App Router?**
   - Server-side API routes untuk proxy PENS API
   - Client-side rendering untuk interaktivitas
   - File-based routing
   - TypeScript support out-of-the-box

2. **Why Single-Page Application?**
   - Semua fitur dalam satu page untuk UX seamless
   - State management lebih mudah
   - Faster navigation (no page reload)

3. **Why Tailwind CSS?**
   - Utility-first approach
   - Responsive design built-in
   - Custom gradients & animations
   - Smaller CSS bundle

4. **Why html-to-image?**
   - Pure JavaScript (no external dependencies)
   - Support modern browsers
   - High-quality PNG export
   - Custom scaling (3x for retina)

### **Performance Optimizations**

1. **Efficient API Calls**
   - Batch requests dengan Promise.all
   - Cache student data in state
   - Debounce search input
   - Single API call untuk class leaderboard

2. **Image Optimization**
   - Lazy load components
   - 3x scale only on export
   - Compress captured images

3. **Code Splitting**
   - Dynamic imports untuk heavy components
   - Tree-shaking unused code

---

## 🐛 Known Issues & Limitations

1. **CORS**: External API harus diakses via proxy (API routes)
2. **Rate Limiting**: Terlalu banyak request bisa di-block API
3. **Browser Compatibility**: html-to-image butuh modern browser
4. **Mobile**: Best experience di desktop (wrapped view optimized untuk mobile portrait)

---

## 📝 License

This project is developed for **PENS (Politeknik Elektronika Negeri Surabaya)** internal use.

---

## 👨‍💻 Contributors

- **Developer**: [Your Name]
- **Institution**: Politeknik Elektronika Negeri Surabaya (PENS)
- **Year**: 2025

---

## 📧 Support

Untuk pertanyaan atau issue, silakan hubungi:
- **Email**: [admin@jokowi.studio]
- **GitHub Issues**: [github:luiii24/pens-wrapp]/issues

---

**create by lui for ONly PENS Students**
