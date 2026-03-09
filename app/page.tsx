"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { processStudentStats, StudentStats } from '@/lib/utils';

// Type definitions
interface StudentData {
  nomor?: string;
  nrp?: string;
  nama?: string;
  prodi?: string;
  NOMOR?: string;
  NRP?: string;
  NAMA?: string;
  PRODI?: string;
  KELAS?: string;
  TMPLAHIR?: string;
  TGLLAHIR?: string;
  JENIS_KELAMIN?: string;
  AGAMA?: string;
  AYAH?: string;
  IBU?: string;
  STATUS?: string;
  ALAMAT?: string;
  KOTA?: string;
  PROVINSI?: string;
  TELEPON?: string;
  EMAIL?: string;
} 

interface StoryWrappedProps {
  student: StudentData;
  stats: StudentStats;
  onClose: () => void;
  handleGeneratePersona: () => void;
  isAiPersonaLoading: boolean;
  aiPersona: { archetype: string; quote: string } | null;
}

interface RankBadgeProps {
  type: string;
  rank: number;
  total: number;
} 
import {
  Search, 
  User, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Eye, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Activity,
  Award,
  TrendingUp,
  Clock,
  Trophy,
  Medal,
  Crown,
  Star,
  Share2,
  Camera,
  Sparkles,
  Zap,
  Download,
  Loader2,
  ArrowLeft,
  Quote,
  CheckCircle,
  Hash,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';

// --- KONFIGURASI GEMINI API ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const getStudentName = (student?: StudentData | null) =>
  student?.nama || student?.NAMA || "Student";

const getStudentNrp = (student?: StudentData | null) =>
  student?.nrp || student?.NRP || "-";

const getStudentProdi = (student?: StudentData | null) =>
  student?.prodi || student?.PRODI || "-";

const getStudentStatus = (student?: StudentData | null) =>
  student?.STATUS || "Unknown";

const getStudentNomor = (student?: StudentData | null) =>
  student?.nomor || student?.NOMOR || "";

export default function App() {
  const [displayedData, setDisplayedData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [studentRanks, setStudentRanks] = useState<any>(null);
  const [showStoryMode, setShowStoryMode] = useState(false);
  
  // State untuk Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [classLeaderboard, setClassLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  
  // State untuk AI Features
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiPersona, setAiPersona] = useState<any>(null);
  const [isAiPersonaLoading, setIsAiPersonaLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
    // html-to-image is already imported, no need to load separately

  // Reset AI state when student changes
  useEffect(() => {
    setAiAnalysis(null);
    setAiPersona(null);
  }, [selectedStudent]);

  // --- GEMINI API HELPERS ---
  const callGemini = async (prompt: string) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  };

  // 1. Fitur Analisis Akademik AI
  const handleGenerateAnalysis = async () => {
    if (!selectedStudent) return;
    setIsAiAnalyzing(true);
    
    const prompt = `
      Bertindaklah sebagai dosen pembimbing akademik yang bijak.
      Analisis data mahasiswa berikut ini: ${JSON.stringify(selectedStudent)}.
      Berikan output JSON dengan format:
      {
        "kekuatan": "Satu kalimat tentang sisi positif akademik/absensi dia",
        "area_perbaikan": "Satu kalimat tentang apa yang perlu ditingkatkan",
        "saran_konkret": "Satu saran tindakan yang spesifik dan memotivasi"
      }
      Gunakan Bahasa Indonesia yang profesional namun ramah.
    `;

    const result = await callGemini(prompt);
    setAiAnalysis(result);
    setIsAiAnalyzing(false);
  };

  // 2. Fitur AI Persona untuk Wrapped
  const handleGeneratePersona = async () => {
    if (!selectedStudent || !studentStats) return;
    setIsAiPersonaLoading(true);

    const prompt = `
      Based on this student data:
      - Nama: ${getStudentName(selectedStudent)}
      - GPA: ${studentStats.currentGPA.toFixed(2)}
      - Attendance: ${studentStats.attendance.toFixed(0)}%
      - Semester: ${studentStats.currentSemester}
      - Value Streaks: ${JSON.stringify(studentStats.valueStreaks.slice(0, 3))}
      
      Generate a creative, cool, RPG-style or Cyberpunk-style 'archetype' title (max 4 words) 
      and a short witty quote (max 15 words) that matches their academic stats and performance.
      Output JSON format: { "archetype": "string", "quote": "string" }
    `;

    const result = await callGemini(prompt);
    if (result) setAiPersona(result);
    setIsAiPersonaLoading(false);
  };

  // FUNGSI PENCARIAN & RANKING
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setDisplayedData([]);
    setSelectedStudent(null);
    setStudentStats(null);
    
    try {
      const nrp = searchQuery.trim();
      
      // Fetch student data from API route
      const studentRes = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-student', nrp }),
      });
      
      if (!studentRes.ok) {
        alert('Mahasiswa tidak ditemukan. Periksa NRP Anda.');
        setLoading(false);
        return;
      }
      
      const studentResult = await studentRes.json();
      if (!studentResult.success) {
        alert('Mahasiswa tidak ditemukan. Periksa NRP Anda.');
        setLoading(false);
        return;
      }
      
      const studentData = studentResult.data;
      
      // Fetch grades data
      const nilaiRes = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-nilai', nomor: getStudentNomor(studentData) }),
      });
      const nilaiResult = await nilaiRes.json();
      const nilaiData = nilaiResult.data || [];
      
      // Fetch attendance data
      const absensiRes = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-absensi', nrp }),
      });
      const absensiResult = await absensiRes.json();
      const absensiData = absensiResult.data || [];
      
      // Process statistics
      const stats = processStudentStats(studentData, nilaiData, absensiData);
      
      setSelectedStudent(studentData);
      setStudentStats(stats);
      setDisplayedData([studentData]);
      
    } catch (error) {
      console.error("Error searching student:", error);
      alert("Gagal mencari data mahasiswa. Silakan periksa NRP dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setDisplayedData([]);
    setHasSearched(false);
  };

  const calculateRanks = (student: StudentData) => {
    // With real API data, we don't calculate campus/prodi/class rankings
    // Instead, we'll use the StudentStats data
    if (studentStats) {
      setSelectedStudent(student);
      setShowStoryMode(true);
    }
  };

  const handleLoadClassLeaderboard = async () => {
    if (!selectedStudent) return;
    
    setIsLoadingLeaderboard(true);
    try {
      // Step 1: Get student info to find their KELAS number
      const currentNrp = selectedStudent.nrp || selectedStudent.NRP || '';
      
      const studentRes = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fetch-student',
          nrp: currentNrp
        }),
      });
      
      const studentResult = await studentRes.json();
      
      if (!studentResult.success || !studentResult.data) {
        alert('Gagal memuat data mahasiswa');
        setIsLoadingLeaderboard(false);
        return;
      }
      
      const kelasNomor = studentResult.data.KELAS;
      
      if (!kelasNomor) {
        alert('Data kelas tidak ditemukan');
        setIsLoadingLeaderboard(false);
        return;
      }
      
      console.log(`Mengambil data mahasiswa kelas: ${kelasNomor}`);
      
      // Step 2: Get all students in the same class with ONE request
      const kelasRes = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fetch-mahasiswa-by-kelas',
          kelasNomor: kelasNomor
        }),
      });
      
      const kelasResult = await kelasRes.json();
      
      if (!kelasResult.success || !kelasResult.data || kelasResult.data.length === 0) {
        alert('Tidak ada mahasiswa ditemukan dalam kelas ini');
        setIsLoadingLeaderboard(false);
        return;
      }
      
      const foundStudents = kelasResult.data;
      console.log(`Total mahasiswa di kelas: ${foundStudents.length}`);
      
      // Step 3: Fetch grades untuk setiap mahasiswa
      const leaderboardData = await Promise.all(
        foundStudents.map(async (student: StudentData) => {
          try {
            const nilaiRes = await fetch('/api/student', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'fetch-nilai', nomor: student.NOMOR }),
            });
            const nilaiResult = await nilaiRes.json();
            const nilaiData = nilaiResult.data || [];
            
            // Calculate GPA from nilai data
            const stats = processStudentStats(student, nilaiData, []);
            
            return {
              ...student,
              gpa: stats.currentGPA,
              currentSemester: stats.currentSemester,
              totalSemesters: stats.totalSemesters,
            };
          } catch (error) {
            console.error(`Error fetching data for student ${student.NOMOR}:`, error);
            return { ...student, gpa: 0 };
          }
        })
      );
      
      // Sort by GPA descending
      const sortedLeaderboard = leaderboardData
        .sort((a, b) => (b.gpa || 0) - (a.gpa || 0))
        .map((student, index) => ({
          ...student,
          rank: index + 1,
        }));
      
      setClassLeaderboard(sortedLeaderboard);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      alert('Gagal memuat leaderboard kelas');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // --- STORY / WRAPPED COMPONENT ---
  const StoryWrapped = ({ student, stats, onClose, handleGeneratePersona, isAiPersonaLoading, aiPersona }: StoryWrappedProps) => {
    const storyRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!student || !stats) return null;

    let bgGradient = "from-[#2E1065] via-[#4C1D95] to-[#0F172A]";
    let accentColor = "text-cyan-400";
    let borderColor = "border-cyan-400";
    
    const gpa = stats.currentGPA;
    if (gpa < 3.0) {
      bgGradient = "from-slate-900 via-zinc-800 to-black"; 
      accentColor = "text-rose-400";
      borderColor = "border-rose-400";
    } else if (gpa >= 3.8) {
      bgGradient = "from-[#451a03] via-[#78350f] to-black"; 
      accentColor = "text-yellow-400";
      borderColor = "border-yellow-400";
    }

    const displayArchetype = aiPersona?.archetype || "Loading Persona...";
    const displayQuote = aiPersona?.quote || "Calculating your academic destiny...";

    const handleDownload = async () => {
      if (!storyRef.current) return;

      setIsDownloading(true);
      try {
        const dataUrl = await htmlToImage.toPng(storyRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          cacheBust: true
        });
        
        const link = document.createElement('a');
        link.download = `Wrapped-${getStudentName(student).replace(/\s+/g, '-')}-${stats.currentYear}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) { 
        console.error("Gagal download:", error); 
        alert("Gagal menyimpan gambar. Coba lagi.");
      } finally { 
        setIsDownloading(false); 
      }
    };

    // Fungsi untuk share ke Instagram Story
    const handleShareInstagram = async () => {
      if (!storyRef.current) return;

      setIsDownloading(true);
      try {
        const dataUrl = await htmlToImage.toPng(storyRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          cacheBust: true
        });

        // Download image first
        const link = document.createElement('a');
        link.download = `Wrapped-${getStudentName(student).replace(/\s+/g, '-')}-${stats.currentYear}.png`;
        link.href = dataUrl;
        link.click();

        // Open Instagram
        setTimeout(() => {
          const text = `Check out my ${stats.currentYear} Wrapped! 🎓✨ #Wrapped${stats.currentYear} #StudentLife`;
          const instagramUrl = `https://www.instagram.com/`;
          window.open(instagramUrl, '_blank');
          
          alert('✨ Gambar berhasil diunduh! Buka Instagram Story dan pilih gambar dari galeri Anda.\n\nCaption saran:\n' + text);
        }, 500);
      } catch (error) {
        console.error("Gagal share ke Instagram:", error);
        alert("Gagal share ke Instagram. Silakan download dan upload manual.");
      } finally {
        setIsDownloading(false);
      }
    };

    // Fungsi untuk share ke WhatsApp
    const handleShareWhatsApp = async () => {
      if (!storyRef.current) return;

      setIsDownloading(true);
      try {
        const dataUrl = await htmlToImage.toPng(storyRef.current, {
          quality: 1.0,
          pixelRatio: 3,
          cacheBust: true
        });

        // Download image first
        const link = document.createElement('a');
        link.download = `Wrapped-${getStudentName(student).replace(/\s+/g, '-')}-${stats.currentYear}.png`;
        link.href = dataUrl;
        link.click();

        // Open WhatsApp
        setTimeout(() => {
          const text = `Check out my ${stats.currentYear} Wrapped! 🎓✨ #Wrapped${stats.currentYear}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
          window.open(whatsappUrl, '_blank');
        }, 500);
      } catch (error) {
        console.error("Gagal share ke WhatsApp:", error);
        alert("Gagal share ke WhatsApp. Silakan download dan upload manual.");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-0 md:p-4 animate-in zoom-in-95 duration-300">
        {/* Tombol Back & Close */}
        <button data-html2canvas-ignore="true" onClick={onClose} className="absolute top-6 left-6 z-50 p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md border border-white/20 transition-all group" title="Kembali ke Detail">
          <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
        </button>
        
        {/* Main Content Area */}
        <div ref={storyRef} className={`relative w-full h-full md:w-[420px] md:h-[780px] md:rounded-[2rem] overflow-hidden flex flex-col bg-gradient-to-b ${bgGradient} text-white shadow-2xl font-sans`}>
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}></div>
          
          <div className="absolute -top-10 -left-10 opacity-10 rotate-12"><GraduationCap className="w-64 h-64 text-white" /></div>
          <div className="absolute top-[30%] -right-12 opacity-10 -rotate-12"><BookOpen className="w-48 h-48 text-white" /></div>
          <div className="absolute bottom-20 left-10 opacity-20 rotate-45 animate-pulse"><Star className={`w-24 h-24 ${accentColor}`} /></div>
          <div className="absolute top-20 right-10 opacity-20 -rotate-12"><Zap className={`w-16 h-16 ${accentColor}`} /></div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col p-8 relative z-10">
            <div className="mt-8 flex justify-center">
              <div className="bg-white text-black px-4 py-2 text-xl font-black italic tracking-tighter -rotate-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] border-2 border-transparent">
                #WRAPPED {stats.currentYear}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center relative">
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed ${borderColor} rounded-full animate-[spin_10s_linear_infinite] opacity-50`}></div>
               <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-30`}></div>
               <div className="w-40 h-40 rounded-full border-4 border-white shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden bg-white/10 backdrop-blur-xl flex items-center justify-center relative z-20">
                  <span className="text-8xl font-black text-white drop-shadow-lg">
  {getStudentName(student).charAt(0).toUpperCase()}
</span>
               </div>
               <div className="absolute -bottom-4 bg-black text-white px-3 py-1 rounded-full border border-white/20 text-xs font-bold tracking-widest z-30 uppercase shadow-lg">
                  {stats.currentSemester}
               </div>
            </div>

            <div className="mt-10 text-center space-y-4">
               <h2 className="text-4xl font-black leading-none uppercase drop-shadow-xl tracking-tight">
                 {getStudentName(student).split(" ").map((word, i) => (
  <span key={i} className="block">{word}</span>
))}
               </h2>
               
               <div className="relative mx-4 mt-4 group">
                 <div className={`absolute inset-0 bg-gradient-to-r ${borderColor.replace('border-', 'from-')} to-purple-500 rounded-xl blur opacity-40 transition-opacity`}></div>
                 <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl transform -skew-x-3 transition-transform duration-300">
                    <div className="flex items-center justify-center gap-2 mb-2 opacity-80">
                      <Sparkles className="w-4 h-4 text-white" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em]">AI Archetype</span>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {isAiPersonaLoading ? (
                        <div className="flex justify-center py-2"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>
                    ) : (
                        <>
                            <div className={`text-2xl font-serif italic font-bold ${accentColor} mb-2`}>"{displayArchetype}"</div>
                            <div className="text-xs text-white/70 italic font-mono px-4">"{displayQuote}"</div>
                        </>
                    )}
                 </div>
               </div>
            </div>

            <div className="mt-auto mb-8 grid grid-cols-2 gap-4">
               <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center rotate-2">
                  <span className="text-xs font-bold uppercase text-white/60 mb-1">GPA Score</span>
                  <div className={`text-4xl font-black ${accentColor}`}>{stats.currentGPA.toFixed(2)}</div>
               </div>
               <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center -rotate-2">
                  <span className="text-xs font-bold uppercase text-white/60 mb-1">Attendance</span>
                  <div className="text-4xl font-black text-emerald-400">{stats.attendance.toFixed(0)}%</div>
               </div>
            </div>

            <div className="mb-20 flex justify-center">
               <div className="bg-white text-black px-6 py-2 rounded-full font-black text-lg flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  <Hash className="w-5 h-5 opacity-50" />
                  {stats.currentSemester.toUpperCase()}
               </div>
            </div>

             <div className="text-center text-[10px] text-white/30 tracking-[0.5em] uppercase pb-4">
                Powered by Gemini AI
             </div>
          </div>
        </div>

        {/* Share Button Container - Outside storyRef */}
        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center gap-2 md:gap-3 z-50 px-2" data-html2canvas-ignore="true">
          <button 
            onClick={handleGeneratePersona}
            disabled={isAiPersonaLoading}
            className="bg-white/20 backdrop-blur-md p-2.5 md:p-3 rounded-full text-white hover:bg-white/30 transition-all border border-white/20 hover:scale-105"
            title="Regenerate AI Persona"
          >
            <Sparkles className={`w-4 md:w-5 h-4 md:h-5 ${isAiPersonaLoading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 md:gap-2 bg-white text-black px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black hover:scale-110 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.4)] disabled:opacity-50 tracking-wider disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <><Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" /> SAVING...</> 
            ) : (
              <><Camera className="w-3.5 md:w-4 h-3.5 md:h-4" /> SAVE</>
            )}
          </button>

          <button 
            onClick={handleShareInstagram}
            disabled={isDownloading}
            className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black hover:scale-110 transition-transform shadow-[0_0_25px_rgba(236,72,153,0.4)] disabled:opacity-50 tracking-wider disabled:cursor-not-allowed"
            title="Share to Instagram Story"
          >
            {isDownloading ? (
              <><Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" /></> 
            ) : (
              <><Share2 className="w-3.5 md:w-4 h-3.5 md:h-4" /> <span className="hidden md:inline">INSTA</span><span className="md:hidden">IG</span></>
            )}
          </button>

          <button 
            onClick={handleShareWhatsApp}
            disabled={isDownloading}
            className="flex items-center gap-1.5 md:gap-2 bg-green-500 hover:bg-green-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-[10px] md:text-xs font-black hover:scale-110 transition-transform shadow-[0_0_25px_rgba(34,197,94,0.4)] disabled:opacity-50 tracking-wider disabled:cursor-not-allowed"
            title="Share to WhatsApp Status"
          >
            {isDownloading ? (
              <><Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 animate-spin" /></> 
            ) : (
              <><Share2 className="w-3.5 md:w-4 h-3.5 md:h-4" /> <span className="hidden md:inline">WHATSAPP</span><span className="md:hidden">WA</span></>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Helper Badge
  const RankBadge = ({ type, rank, total }: RankBadgeProps) => {
    if (rank > 10) return null;
    let colorClass = "bg-blue-100 text-blue-700 border-blue-200";
    let icon = <Award className="w-4 h-4" />;
    let label = "";

    if (rank === 1) { colorClass = "bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm"; icon = <Crown className="w-4 h-4 text-yellow-600" />; } 
    else if (rank === 2) { colorClass = "bg-slate-200 text-slate-700 border-slate-300"; icon = <Medal className="w-4 h-4 text-slate-500" />; } 
    else if (rank === 3) { colorClass = "bg-orange-100 text-orange-800 border-orange-200"; icon = <Medal className="w-4 h-4 text-orange-600" />; } 
    else { icon = <Trophy className="w-4 h-4 text-blue-500" />; }

    if (type === 'campus') label = "Se-Kampus";
    if (type === 'prodi') label = "Se-Prodi";
    if (type === 'class') label = "Se-Angkatan";

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClass} text-xs font-bold`}>
        {icon}
        <div className="flex flex-col leading-tight">
          <span>Top #{rank} {label}</span>
          <span className="text-[10px] opacity-75 font-normal">dari {total} mahasiswa</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8 relative">
      {/* Tombol Panah Kembali di Dashboard dihapus */}

      {showStoryMode && selectedStudent && studentStats && (
        <StoryWrapped 
          student={selectedStudent} 
          stats={studentStats}
          onClose={() => setShowStoryMode(false)}
          handleGeneratePersona={handleGeneratePersona}
          isAiPersonaLoading={isAiPersonaLoading}
          aiPersona={aiPersona}
        />
      )}

      {selectedStudent && !showStoryMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-800 p-8 text-white">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center flex-1">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-md border border-white/40 shadow-lg">
                    {getStudentName(selectedStudent).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">{getStudentName(selectedStudent)}</h2>
                    <p className="text-blue-100 flex items-center gap-2 mt-1">
                      <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono font-semibold">{getStudentNrp(selectedStudent)}</span>
                      <span className="text-sm opacity-90">{getStudentProdi(selectedStudent)}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"><X className="w-6 h-6" /></button>
              </div>
              {studentStats && (
                <div className="bg-white/15 rounded-xl p-4 flex flex-wrap gap-3 items-center backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-100"><Star className="w-4 h-4 text-yellow-300" /> Top Grades:</div>
                  {studentStats.valueStreaks.slice(0, 4).map((streak, idx) => (
                    <span key={idx} className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/30 backdrop-blur-sm">
                      {streak.grade} <span className="opacity-70">×{streak.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* TOMBOL WRAPPED FEATURE */}
              <div onClick={() => setShowStoryMode(true)} className="w-full relative overflow-hidden rounded-2xl p-0.5 group cursor-pointer hover:scale-105 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white rounded-2xl p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                   <div className="flex flex-col gap-1">
                    <span className="font-bold text-xl text-slate-900 flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-600 animate-pulse" /> Your {studentStats?.currentYear} Wrapped</span>
                    <span className="text-sm text-slate-600">View your <strong>AI-Generated Persona</strong> & share it!</span>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-lg"><Zap className="w-6 h-6 fill-purple-600" /></div>
                </div>
              </div>

              {/* TOMBOL LEADERBOARD ANGKATAN */}
              <div onClick={handleLoadClassLeaderboard} className={`w-full relative overflow-hidden rounded-2xl p-0.5 group cursor-pointer hover:scale-105 transition-transform ${isLoadingLeaderboard ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className={`relative bg-white rounded-2xl p-6 flex items-center justify-between hover:bg-slate-50 transition-colors ${isLoadingLeaderboard ? 'opacity-50 cursor-not-allowed' : ''}`}>
                   <div className="flex flex-col gap-1">
                    <span className="font-bold text-xl text-slate-900 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-600" /> Class Rankings</span>
                    <span className="text-sm text-slate-600">See how you rank among <strong>classmates by GPA</strong></span>
                  </div>
                  {isLoadingLeaderboard ? (
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-lg"><Crown className="w-6 h-6" /></div>
                  )}
                </div>
              </div>

              {/* FITUR BARU: ANALISIS AI */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-blue-600" /> AI Academic Analysis</h3>
                  {!aiAnalysis && !isAiAnalyzing && (
                    <button onClick={handleGenerateAnalysis} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95">
                      <Sparkles className="w-4 h-4" /> Generate Insight
                    </button>
                  )}
                </div>

                {isAiAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <span className="text-base font-medium">Analyzing your academic data...</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-3 animate-in fade-in duration-500">
                    <div className="flex gap-4 bg-green-50 p-4 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5 flex-none" />
                      <div>
                        <div className="text-xs font-bold text-green-800 uppercase mb-1 tracking-wide">Strength</div>
                        <div className="text-sm text-green-900 leading-relaxed font-medium">{aiAnalysis.kekuatan}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 bg-orange-50 p-4 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
                      <TrendingUp className="w-6 h-6 text-orange-600 shrink-0 mt-0.5 flex-none" />
                      <div>
                        <div className="text-xs font-bold text-orange-800 uppercase mb-1 tracking-wide">Area for Improvement</div>
                        <div className="text-sm text-orange-900 leading-relaxed font-medium">{aiAnalysis.area_perbaikan}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 bg-blue-50 p-4 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                      <Lightbulb className="w-6 h-6 text-blue-600 shrink-0 mt-0.5 flex-none" />
                      <div>
                        <div className="text-xs font-bold text-blue-800 uppercase mb-1 tracking-wide">Recommendation</div>
                        <div className="text-sm text-blue-900 leading-relaxed font-medium">{aiAnalysis.saran_konkret}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-300">
                    Click "Generate Insight" to see AI-powered analysis of your academic performance.
                  </div>
                )}
              </div>

              {/* Stats Cards (Updated) */}
              {studentStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200 text-center relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                    <div className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">Current GPA</div>
                    <div className="text-3xl font-bold text-blue-700">{studentStats.currentGPA.toFixed(2)}</div>
                    {studentStats.currentGPA > 3.8 && <div className="absolute top-2 right-2 p-1 animate-pulse"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /></div>}
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200 text-center shadow-sm hover:shadow-md transition-all">
                    <div className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">Attendance</div>
                    <div className="text-3xl font-bold text-green-700">{studentStats.attendance.toFixed(0)}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 text-center shadow-sm hover:shadow-md transition-all">
                    <div className="text-slate-600 text-xs uppercase font-bold mb-2 tracking-wide">Current Semester</div>
                    <div className="text-3xl font-bold text-slate-800">{studentStats.currentSemester}</div>
                  </div>
                </div>
              )}
              {/* Informasi Pribadi */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1"><User className="w-5 h-5 text-blue-600" /> Personal Information</h3>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-sm">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-wide">Place & Date of Birth</div>
                      <div className="text-slate-800 font-medium">
                        {selectedStudent.TMPLAHIR || '-'} <span className="text-slate-500">{selectedStudent.TGLLAHIR || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-wide">Gender</div>
                      <div className="text-slate-800 font-medium">{selectedStudent.JENIS_KELAMIN || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-500 text-xs uppercase font-bold mb-1 tracking-wide">Religion</div>
                      <div className="text-slate-800 font-medium">{selectedStudent.AGAMA || '-'}</div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-4">
                    <div className="text-slate-500 text-xs uppercase font-bold mb-3 tracking-wide pl-1">Family Information</div>
                    <div className="space-y-3 ml-1">
                      <div className="flex items-start gap-3">
                        <span className="text-slate-500 font-semibold min-w-[50px]">Father:</span>
                        <span className="text-slate-800 font-medium">{selectedStudent.AYAH || '-'}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-slate-500 font-semibold min-w-[50px]">Mother:</span>
                        <span className="text-slate-800 font-medium">{selectedStudent.IBU || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Sections */}
              {studentStats && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1"><Activity className="w-5 h-5 text-blue-600" /> Grade Distribution</h3>
                    <div className="flex flex-wrap gap-2.5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      {studentStats.valueStreaks.length > 0 ? studentStats.valueStreaks.slice(0, 10).map((streak, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 hover:shadow-sm transition-shadow">
                          <span className="font-bold">{streak.grade}</span> <span className="opacity-75">×{streak.count}</span>
                        </span>
                      )) : <span className="text-slate-400 text-sm italic">No grade data available</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1"><Award className="w-5 h-5 text-blue-600" /> Academic Timeline</h3>
                    <div className="space-y-3 text-sm text-slate-700 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Total Semesters:</span>
                        <span className="font-bold text-lg text-slate-900">{studentStats.totalSemesters}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Current Year:</span>
                        <span className="font-bold text-lg text-slate-900">{studentStats.currentYear}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Current Semester:</span>
                        <span className="font-bold text-lg text-slate-900">{studentStats.currentSemester}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 flex justify-end gap-3">
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95 shadow-sm">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100">
        {/* Modern Hero Header */}
        <div className="relative overflow-hidden bg-black">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative px-4 md:px-8 py-16 md:py-24">
            <div className="max-w-6xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
                <GraduationCap className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-white">Student Data System</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                Academic Intelligence Platform
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Discover comprehensive student profiles, AI-powered insights, and performance analytics in one intelligent system.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {/* Search Section */}
          <div className="mb-12 -mt-8 relative z-10">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 backdrop-blur-xl">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-6 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-16 pr-4 py-4 bg-transparent rounded-xl focus:outline-none text-gray-900 placeholder-gray-400 text-lg font-medium" 
                  placeholder="Search by Student ID (NRP)..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
                <div className="flex gap-3 pr-2">
                  {hasSearched && (
                    <button 
                      type="button" 
                      onClick={handleReset} 
                      className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all font-semibold"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>
            </div>
          </div>

        {/* Results Section */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 animate-pulse hover:shadow-lg transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"></div>
                    <div className="space-y-3 flex-1">
                      <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-24 bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
                <Search className="w-20 h-20 text-blue-300" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Start Searching</h3>
              <p className="text-gray-600 max-w-lg text-center text-lg">Enter a student ID above to view academic records, grades, attendance, and AI-powered analysis.</p>
            </div>
          ) : displayedData.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex bg-red-50 p-6 rounded-full mb-6 border border-red-200">
                <X className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Student Not Found</h3>
              <p className="text-gray-600 text-lg">Try searching with a different student ID or check the spelling.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {displayedData.map((mhs) => (
                <div key={getStudentNrp(mhs) || Math.random()} className="group bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-400 transition-all duration-300 flex flex-col h-full">
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-md border border-white/30 shadow-lg">
                      {getStudentName(mhs).charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-md border ${
                        getStudentStatus(mhs) === 'Aktif'
                          ? 'bg-green-500/20 text-green-100 border-green-300/50'
                          : getStudentStatus(mhs) === 'Cuti'
                          ? 'bg-yellow-500/20 text-yellow-100 border-yellow-300/50'
                          : 'bg-red-500/20 text-red-100 border-red-300/50'
                      }`}
                    >
                      {getStudentStatus(mhs)}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl mb-1">{getStudentName(mhs).substring(0, 20)}</h3>
                  <p className="text-white/80 font-mono text-sm">{getStudentNrp(mhs)}</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-700">
                        <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{getStudentProdi(mhs)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium">Class {mhs.KELAS || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-center">
                      <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Status</span>
                      <span className="text-lg font-bold text-gray-900">-</span>
                    </div>
                    <button 
                      onClick={() => calculateRanks(mhs)} 
                      className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                      <Eye className="w-4 h-4" /> 
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LEADERBOARD MODAL */}
      {showLeaderboard && classLeaderboard.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-3"><Trophy className="w-8 h-8" /> Class Rankings</h2>
                  <p className="text-orange-100 text-base mt-2">
                    Ranking by GPA • {selectedStudent && `${getStudentProdi(selectedStudent)} Program`} • {classLeaderboard.length} Students
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowLeaderboard(false);
                    setClassLeaderboard([]);
                  }} 
                  className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="p-8 overflow-y-auto space-y-3 flex-1 bg-gradient-to-b from-slate-50 to-white">
              {classLeaderboard.map((student, index) => {
                let medalIcon = null;
                let medalColor = '';
                let rankBgColor = '';
                
                if (student.rank === 1) {
                  medalIcon = <Crown className="w-6 h-6" />;
                  medalColor = 'text-yellow-500';
                  rankBgColor = 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50';
                } else if (student.rank === 2) {
                  medalIcon = <Medal className="w-6 h-6" />;
                  medalColor = 'text-slate-400';
                  rankBgColor = 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-md';
                } else if (student.rank === 3) {
                  medalIcon = <Medal className="w-6 h-6" />;
                  medalColor = 'text-orange-600';
                  rankBgColor = 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-md';
                } else {
                  rankBgColor = 'bg-gradient-to-br from-blue-100 to-blue-200';
                }

                const isCurrentStudent = getStudentNrp(selectedStudent) === getStudentNrp(student);

                return (
                  <div 
                    key={student.NOMOR} 
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-5 ${
                      isCurrentStudent 
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-16 h-16 rounded-full ${rankBgColor} flex items-center justify-center font-bold text-white text-xl shadow-sm flex-none`}>
                      # {student.rank}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-lg">{getStudentName(student)}</h3>
                        {medalIcon && <span className={`${medalColor}`}>{medalIcon}</span>}
                        {isCurrentStudent && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">YOU</span>}
                      </div>
                      <p className="text-xs text-slate-500 font-mono">{getStudentNrp(student)}</p>
                    </div>

                    {/* GPA */}
                    <div className="text-right flex-none">
                      <div className="text-3xl font-bold text-amber-600">{(student.gpa || 0).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 font-semibold">GPA</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Back Button */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200 p-6">
              <button
                onClick={() => {
                  setShowLeaderboard(false);
                  setClassLeaderboard([]);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg font-bold transition-all active:scale-95 shadow-lg text-base"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}