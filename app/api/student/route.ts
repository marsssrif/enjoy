import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.PENS_API_BASE_URL || 'https://online.mis.pens.ac.id';
const API_KEY = process.env.PENS_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, nrp, nomor } = body;

    if (action === 'fetch-student') {
      const response = await fetch(`${API_BASE_URL}/API_PENS/v1/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          table: 'mahasiswa',
          data: ['*'],
          filter: { nrp: parseInt(nrp) || nrp },
        }),
      });

      const data = await response.json();

      if (data.status === 'sukses' && data.data.length > 0) {
        const student = data.data[0];
        // Add normalized properties
        student.nomor = student.NOMOR;
        student.nrp = student.NRP;
        student.nama = student.NAMA;
        student.prodi = student.PRODI || student.KELAS?.split('-')[0] || 'Unknown';
        return NextResponse.json({ success: true, data: student });
      }
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    if (action === 'fetch-nilai') {
      const response = await fetch(`${API_BASE_URL}/API_PENS/v1/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          table: 'vmy_nilai',
          data: ['*'],
          filter: { mahasiswa: parseInt(nomor) },
        }),
      });

      const data = await response.json();

      if (data.status === 'sukses') {
        return NextResponse.json({ success: true, data: data.data || [] });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    if (action === 'fetch-absensi') {
      const response = await fetch(`${API_BASE_URL}/API_PENS/v1/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          table: 'vmy_absensi_kuliah',
          data: ['*'],
          limit: 1000,
          filter: { nrp },
        }),
      });

      const data = await response.json();

      if (data.status === 'sukses') {
        return NextResponse.json({ success: true, data: data.data || [] });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    if (action === 'fetch-kelas') {
      const { kelasNomor } = body;
      const response = await fetch(`${API_BASE_URL}/API_PENS/v1/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          table: 'kelas',
          data: ['*'],
          filter: { NOMOR: kelasNomor },
        }),
      });

      const data = await response.json();

      if (data.status === 'sukses' && data.data.length > 0) {
        return NextResponse.json({ success: true, data: data.data[0] });
      }
      return NextResponse.json({ success: false, error: 'Kelas not found' }, { status: 404 });
    }

    if (action === 'fetch-mahasiswa-by-kelas') {
      const { kelasNomor } = body;
      const response = await fetch(`${API_BASE_URL}/API_PENS/v1/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          table: 'mahasiswa',
          data: ['*'],
          filter: { kelas: kelasNomor },
        }),
      });

      const data = await response.json();

      if (data.status === 'sukses') {
        const students = data.data || [];
        const normalizedStudents = students.map((student: any) => ({
          ...student,
          nomor: student.NOMOR,
          nrp: student.NRP,
          nama: student.NAMA,
          prodi: student.PRODI || 'Unknown',
        }));
        return NextResponse.json({ success: true, data: normalizedStudents });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
