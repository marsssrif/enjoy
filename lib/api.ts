import axios from 'axios';

const API_BASE_URL = process.env.PENS_API_BASE_URL || 'https://online.mis.pens.ac.id';
const API_KEY = process.env.PENS_API_KEY || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
});

// Interface untuk response API
export interface StudentData {
  NOMOR: string;
  NRP: string;
  NAMA: string;
  KELAS: string;
  TMPLAHIR: string;
  TGLLAHIR: string;
  JENIS_KELAMIN: string;
  AGAMA: string;
  AYAH: string;
  IBU: string;
  STATUS: string;
  PRODI?: string;
  ALAMAT?: string;
  KOTA?: string;
  PROVINSI?: string;
  TELEPON?: string;
  EMAIL?: string;
  
  // Normalized properties for UI
  nomor?: string;
  nrp?: string;
  nama?: string;
  prodi?: string;
}

export interface NilaiData {
  MAHASISWA: string;
  NRP: string;
  NAMA: string;
  KODE: string;
  MATAKULIAH: string;
  SKS: string;
  TAHUN: string;
  SEMESTER: string;
  MATAKULIAH_JENIS: string;
  NH: string | null;
}

export interface AbsensiData {
  NOMOR_KULIAH: string;
  MAHASISWA: string;
  NRP: string;
  NAMA: string;
  KODE: string;
  MATAKULIAH: string;
  JAM: string;
  TAHUN: string;
  SEMESTER: string;
  TANGGAL: string;
  MINGGU: string;
  STATUS: string;
  PROSEN_KEHADIRAN: string | null;
  NOMOR_ABSENSI: string;
}

export interface KelasData {
  NOMOR: string;
  PROGRAM: string;
  JURUSAN: string;
  KELAS: string;
  PARAREL: string;
  KODE: string;
  KODE_KELAS_ABSEN: string;
}

export interface ClassLeaderboardStudent extends StudentData {
  gpa?: number;
  attendance?: number;
  rank?: number;
}

// API Functions
export const fetchStudentByNRP = async (nrp: string): Promise<StudentData | null> => {
  try {
    const response = await apiClient.post('/API_PENS/v1/read', {
      table: 'mahasiswa',
      data: ['*'],
      filter: { nrp: parseInt(nrp) || nrp },
    });

    if (response.data.status === 'sukses' && response.data.data.length > 0) {
      const student = response.data.data[0];
      // Add normalized properties
      student.nomor = student.NOMOR;
      student.nrp = student.NRP;
      student.nama = student.NAMA;
      student.prodi = student.PRODI || student.KELAS?.split('-')[0] || 'Unknown';
      return student;
    }
    return null;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
};

export const fetchNilaiByMahasiswa = async (nomorMahasiswa: string): Promise<NilaiData[]> => {
  try {
    const response = await apiClient.post('/API_PENS/v1/read', {
      table: 'vmy_nilai',
      data: ['*'],
      filter: { mahasiswa: parseInt(nomorMahasiswa) },
    });

    if (response.data.status === 'sukses') {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching nilai:', error);
    return [];
  }
};

export const fetchAbsensiByNRP = async (nrp: string): Promise<AbsensiData[]> => {
  try {
    const response = await apiClient.post('/API_PENS/v1/read', {
      table: 'vmy_absensi_kuliah',
      data: ['*'],
      limit: 1000,
      filter: { nrp },
    });

    if (response.data.status === 'sukses') {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching absensi:', error);
    return [];
  }
};

export const fetchKelasInfo = async (nomorKelas: string): Promise<KelasData | null> => {
  try {
    const response = await apiClient.post('/API_PENS/v1/read', {
      table: 'kelas',
      data: ['*'],
      filter: { NOMOR: nomorKelas },
    });

    if (response.data.status === 'sukses' && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching kelas info:', error);
    return null;
  }
};

export const fetchMahasiswaByKelas = async (kelasNomor: number): Promise<StudentData[]> => {
  try {
    const response = await apiClient.post('/API_PENS/v1/read', {
      table: 'mahasiswa',
      data: ['*'],
      filter: { kelas: kelasNomor },
    });

    if (response.data.status === 'sukses') {
      const students = response.data.data || [];
      return students.map((student: StudentData) => ({
        ...student,
        nomor: student.NOMOR,
        nrp: student.NRP,
        nama: student.NAMA,
        prodi: student.PRODI || student.KELAS?.split('-')[0] || 'Unknown',
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching mahasiswa by kelas:', error);
    return [];
  }
};
