import { NilaiData, AbsensiData } from './api';

// Mapping untuk nilai ke bobot
const NILAI_BOBOT: { [key: string]: number } = {
  'A': 4.0,
  'A-': 3.75,
  'AB': 3.5,
  'B+': 3.25,
  'B': 3.0,
  'BC': 2.5,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0,
};

// Interface untuk struktur nilai yang diproses
export interface ProcessedNilai {
  semester: string;
  tahun: string;
  matakuliah: string;
  kode: string;
  sks: number;
  nilai: string;
  bobot: number;
}

export interface SemesterStats {
  semester: string;
  tahun: string;
  gpa: number;
  nilaiList: ProcessedNilai[];
  highest?: string;
  highestCount?: number;
}

export interface StudentStats {
  currentSemester: string;
  currentYear: string;
  currentGPA: number;
  attendance: number;
  nilaiData: ProcessedNilai[];
  semesterStats: SemesterStats[];
  valueStreaks: { grade: string; count: number }[];
  totalSemesters: number;
}

// Get latest semester (ganjil/genap) from latest year
// SEMESTER hanya bisa 1 (Ganjil) atau 2 (Genap)
// Ignore semester 3+ (remedial/semester antara untuk mengulang matkul)
export const getLatestSemester = (nilaiList: NilaiData[]): { semester: string; tahun: string } => {
  if (nilaiList.length === 0) return { semester: '1', tahun: new Date().getFullYear().toString() };
  
  // Filter hanya semester 1 dan 2 (exclude remedial semester 3+)
  const validData = nilaiList.filter(n => {
    const sem = parseInt(n.SEMESTER || '0');
    return sem === 1 || sem === 2;
  });
  
  if (validData.length === 0) return { semester: '1', tahun: new Date().getFullYear().toString() };
  
  // Get latest year from valid data
  const tahunList = validData.map(n => parseInt(n.TAHUN || '0'));
  const latestTahun = Math.max(...tahunList).toString();
  
  // Filter by latest year, then get the highest semester (prefer 2/Genap over 1/Ganjil)
  const dataInLatestYear = validData.filter(n => n.TAHUN === latestTahun);
  const semesters = dataInLatestYear.map(n => parseInt(n.SEMESTER || '1'));
  const latestSemester = Math.max(...semesters).toString();
  
  return { semester: latestSemester, tahun: latestTahun };
};

// Calculate GPA untuk semester ganjil/genap spesifik dan tahun
// HANYA untuk semester 1 (Ganjil) atau 2 (Genap), bukan semester remedial 3+
export const calculateGPAForSemester = (
  nilaiList: NilaiData[],
  semester: string,
  tahun: string
): { gpa: number; nilaiList: ProcessedNilai[] } => {
  // Validate semester hanya 1 atau 2
  const semNum = parseInt(semester);
  if (semNum !== 1 && semNum !== 2) {
    return { gpa: 0, nilaiList: [] }; // Reject semester remedial
  }
  
  // Filter berdasarkan tahun dan semester ganjil/genap (1 atau 2)
  const filtered = nilaiList.filter(n => 
    n.SEMESTER === semester && n.TAHUN === tahun
  );

  // Process nilai yang valid (NH tidak null/kosong, dan bukan tipe 9)
  const processedList: ProcessedNilai[] = filtered
    .filter(n => n.NH && n.NH.trim() !== '' && n.MATAKULIAH_JENIS !== '9')
    .map(n => ({
      semester: n.SEMESTER,
      tahun: n.TAHUN,
      matakuliah: n.MATAKULIAH,
      kode: n.KODE,
      sks: parseInt(n.SKS || '0'),
      nilai: n.NH || '',
      bobot: NILAI_BOBOT[n.NH || ''] || 0,
    }));

  // Calculate GPA = (total sks × bobot) / total sks
  const totalSKS = processedList.reduce((sum, item) => sum + item.sks, 0);
  const totalBobot = processedList.reduce((sum, item) => sum + (item.sks * item.bobot), 0);
  const gpa = totalSKS > 0 ? Number((totalBobot / totalSKS).toFixed(2)) : 0;

  return { gpa, nilaiList: processedList };
};

// Calculate attendance percentage per subject, then average untuk semester ganjil/genap
// HANYA untuk semester 1 (Ganjil) atau 2 (Genap), bukan semester remedial 3+
export const calculateAttendance = (absensiList: AbsensiData[], semester: string, tahun: string): number => {
  // Validate semester hanya 1 atau 2
  const semNum = parseInt(semester);
  if (semNum !== 1 && semNum !== 2) {
    return 0; // Reject semester remedial
  }
  
  // Filter by semester ganjil/genap dan tahun terbaru
  const filtered = absensiList.filter(a => a.SEMESTER === semester && a.TAHUN === tahun);
  
  // Group by NOMOR_KULIAH (unique subject code)
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.NOMOR_KULIAH]) {
      acc[item.NOMOR_KULIAH] = [];
    }
    acc[item.NOMOR_KULIAH].push(item);
    return acc;
  }, {} as { [key: string]: AbsensiData[] });

  // Calculate attendance per subject
  const attendancePerSubject: number[] = [];
  
  Object.values(grouped).forEach(subjectRecords => {
    const hadir = subjectRecords.filter(r => r.STATUS === 'H').length;
    const total = subjectRecords.length;
    if (total > 0) {
      const percentage = Math.round((hadir / total) * 100);
      attendancePerSubject.push(percentage);
    }
  });

  // Return average attendance
  if (attendancePerSubject.length === 0) return 0;
  const avg = Math.round(
    attendancePerSubject.reduce((a, b) => a + b, 0) / attendancePerSubject.length
  );
  
  return avg;
};

// Get value streaks untuk semester terbaru
export const getValueStreaks = (nilaiList: ProcessedNilai[]): { grade: string; count: number }[] => {
  const valueCounts: { [key: string]: number } = {};
  
  nilaiList.forEach(item => {
    valueCounts[item.nilai] = (valueCounts[item.nilai] || 0) + 1;
  });

  return Object.entries(valueCounts)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      // Sort by bobot descending, then by count descending
      const bobtA = NILAI_BOBOT[a.grade] || 0;
      const bobtB = NILAI_BOBOT[b.grade] || 0;
      if (bobtA !== bobtB) return bobtB - bobtA;
      return b.count - a.count;
    });
};

// Main function untuk process semua data student
export const processStudentStats = (
  studentData: any,
  nilaiData: NilaiData[],
  absensiData: AbsensiData[]
): StudentStats => {
  // Get latest semester dan tahun (SEMESTER: 1 = Ganjil, 2 = Genap)
  const { semester, tahun } = getLatestSemester(nilaiData);

  // Calculate GPA untuk semester ganjil/genap terbaru dengan tahun terbaru
  const { gpa, nilaiList } = calculateGPAForSemester(nilaiData, semester, tahun);
  
  // Calculate attendance untuk semester ganjil/genap terbaru dengan tahun terbaru
  const attendance = calculateAttendance(absensiData, semester, tahun);
  
  // Get value streaks dari nilai-nilai di semester terbaru
  const valueStreaks = getValueStreaks(nilaiList);
  
  // Get total years (count berapa tahun akademik)
  // Filter only valid semesters (1 dan 2, exclude remedial 3+) sebelum hitung unique tahun
  const validData = nilaiData.filter(n => {
    const sem = parseInt(n.SEMESTER || '0');
    return sem === 1 || sem === 2;
  });
  const uniqueYears = new Set(validData.map(n => n.TAHUN)).size;

  // Format semester display (1 = Ganjil, 2 = Genap)
  const semesterDisplay = semester === '1' ? 'Ganjil' : 'Genap';

  return {
    currentSemester: semesterDisplay, // "Ganjil" or "Genap"
    currentYear: tahun,
    currentGPA: gpa,
    attendance,
    nilaiData: nilaiList,
    semesterStats: [],
    valueStreaks,
    totalSemesters: uniqueYears, // Count tahun akademik, bukan semester
  };
};
