# 🔐 Environment Variables Configuration

Dokumentasi lengkap untuk konfigurasi environment variables pada PENS Wrapped.

---

## 📋 File Environment Variables

Project ini menggunakan beberapa file environment variables:

### 1. **`.env.local`** (File Aktif - **JANGAN DI-COMMIT**)
File ini berisi API keys dan credentials yang sebenarnya. File ini sudah di-ignore oleh Git dan **TIDAK AKAN** masuk ke repository.

### 2. **`.env.example`** (Template)
File template yang menunjukkan environment variables apa saja yang diperlukan tanpa menampilkan nilai sebenarnya. File ini **AMAN** untuk di-commit ke repository.

---

## 🔑 Environment Variables yang Digunakan

### **PENS API Configuration**

#### `PENS_API_BASE_URL`
- **Deskripsi**: URL base untuk PENS MIS API
- **Default**: `https://online.mis.pens.ac.id`
- **Digunakan di**: 
  - `app/api/student/route.ts`
  - `lib/api.ts`
- **Required**: ✅ Ya
- **Type**: Server-side only

#### `PENS_API_KEY`
- **Deskripsi**: API Key untuk autentikasi ke PENS MIS API
- **Format**: `PENS-[random-string]`
- **Digunakan di**: 
  - `app/api/student/route.ts` (header `x-api-key`)
  - `lib/api.ts` (header `x-api-key`)
- **Required**: ✅ Ya
- **Type**: Server-side only
- **Cara Mendapatkan**: Hubungi administrator PENS MIS

---

### **Google Gemini AI Configuration**

#### `NEXT_PUBLIC_GEMINI_API_KEY`
- **Deskripsi**: API Key untuk Google Gemini AI (fitur AI Persona)
- **Digunakan di**: `app/page.tsx` (client-side)
- **Required**: ✅ Ya (untuk fitur AI Persona)
- **Type**: Client-side (prefix `NEXT_PUBLIC_`)
- **Cara Mendapatkan**: 
  1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Login dengan Google Account
  3. Click "Create API Key"
  4. Copy API key yang dihasilkan

#### `GEMINI_MODEL`
- **Deskripsi**: Model Gemini yang digunakan
- **Default**: `gemini-2.5-flash-preview-09-2025`
- **Digunakan di**: `app/page.tsx`
- **Required**: ❌ Opsional (akan fallback ke default)
- **Type**: Client-side
- **Pilihan Model**:
  - `gemini-2.5-flash-preview-09-2025` (Recommended - Fast & Free)
  - `gemini-1.5-flash` (Stable)
  - `gemini-1.5-pro` (More accurate, slower)

---

## 🚀 Setup Instructions

### **Step 1: Copy Template**
```bash
cp .env.example .env.local
```

### **Step 2: Edit .env.local**
Buka file `.env.local` dan isi dengan nilai yang sebenarnya:

```env
# PENS API Configuration
PENS_API_BASE_URL=https://online.mis.pens.ac.id
PENS_API_KEY=PENS-4uT673rV5mCgdttu3Fgyv.3tgnDyNIwe4cTR2k2M.9TbOVNpXeGCi

# Google Gemini AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy... # Paste your Gemini API key here
GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
```

### **Step 3: Restart Development Server**
Setelah mengubah environment variables, **HARUS restart** development server:

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## 🔒 Security Best Practices

### ✅ DO's
- ✅ **Gunakan `.env.local`** untuk development
- ✅ **Commit `.env.example`** ke repository
- ✅ **Rotate API keys** secara berkala
- ✅ **Gunakan prefix `NEXT_PUBLIC_`** untuk client-side variables
- ✅ **Validasi environment variables** saat aplikasi start

### ❌ DON'Ts
- ❌ **JANGAN commit `.env.local`** atau `.env`
- ❌ **JANGAN hardcode API keys** di source code
- ❌ **JANGAN share API keys** di chat/email
- ❌ **JANGAN gunakan `NEXT_PUBLIC_`** untuk sensitive data
- ❌ **JANGAN expose server-side env vars** ke client

---

## 🌍 Environment-Specific Files

Next.js mendukung beberapa file environment untuk berbagai environment:

| File | Environment | Priority | Git |
|------|-------------|----------|-----|
| `.env` | All | 4 (lowest) | ❌ No |
| `.env.local` | All (override) | 3 | ❌ No |
| `.env.development` | Development only | 2 | ❌ No |
| `.env.production` | Production only | 1 (highest) | ❌ No |
| `.env.example` | Template | N/A | ✅ Yes |

### **Load Order (Priority)**
```
.env.production.local
.env.production
.env.local
.env
```

---

## 🐛 Troubleshooting

### **Problem 1: Environment Variable Tidak Terbaca**

**Gejala**: 
```
Error: API_KEY is undefined
```

**Solusi**:
1. Pastikan file `.env.local` ada di root directory
2. Restart development server
3. Cek syntax di `.env.local` (no quotes, no semicolon)
4. Untuk client-side, harus pakai prefix `NEXT_PUBLIC_`

---

### **Problem 2: Gemini API Error**

**Gejala**:
```
Gemini Error: API Error
```

**Solusi**:
1. Pastikan `NEXT_PUBLIC_GEMINI_API_KEY` sudah diisi
2. Cek API key valid di [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Pastikan API key tidak expired
4. Cek billing/quota di Google Cloud Console

---

### **Problem 3: PENS API Tidak Response**

**Gejala**:
```
Failed to fetch student data
```

**Solusi**:
1. Cek `PENS_API_BASE_URL` correct
2. Cek `PENS_API_KEY` valid
3. Cek network connection
4. Cek CORS policy (harus pakai API route, bukan direct fetch dari client)

---

## 📝 Code Usage Examples

### **Server-side (API Routes)**
```typescript
// app/api/student/route.ts
const API_KEY = process.env.PENS_API_KEY || '';
const API_BASE_URL = process.env.PENS_API_BASE_URL || '';

// Tidak perlu NEXT_PUBLIC_ prefix karena server-side
```

### **Client-side (React Components)**
```typescript
// app/page.tsx
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// HARUS pakai NEXT_PUBLIC_ prefix untuk accessible di browser
```

### **Validasi Environment Variables**
```typescript
// Tambahkan di awal file untuk validasi
if (!process.env.PENS_API_KEY) {
  throw new Error('PENS_API_KEY is required');
}
```

---

## 🚢 Production Deployment

### **Vercel**
1. Go to Project Settings → Environment Variables
2. Add each variable:
   - `PENS_API_BASE_URL`
   - `PENS_API_KEY`
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `GEMINI_MODEL`
3. Redeploy

### **Other Platforms**
```bash
# Set environment variables via CLI or dashboard
export PENS_API_KEY="your-key"
export NEXT_PUBLIC_GEMINI_API_KEY="your-key"

# Build
npm run build
npm start
```

---

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [PENS MIS API Documentation](FITUR_REQUESAPI.md)

---

## ⚠️ Important Notes

1. **Never commit sensitive keys** to Git
2. **Always use `.env.local`** for local development
3. **Rotate keys regularly** for security
4. **Use different keys** for dev/staging/production
5. **Monitor API usage** to avoid quota limits

---

**Last Updated**: December 25, 2024
