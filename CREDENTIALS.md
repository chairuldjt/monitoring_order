# 🔐 Monitoring Order - Technical Credentials

Dokumen ini berisi referensi kredensial internal dan panduan koneksi untuk lingkungan produksi OrderTrack.

## 📡 SIMRS API Credentials
- **Base URL**: `http://103.148.235.37:5010`
- **Username**: `nugrohochairul`
- **Password**: `12345`
- **Auth Method**: Authentikasi menggunakan `POST /secure/auth_validate_login` untuk mendapatkan JWT, kemudian dikirimkan melalui header `access-token`.

## 🗄️ Database Connection (Local Server)
- **Host**: `127.0.0.1`
- **User**: `root`
- **Password**: (empty)
- **Database**: `monitoring_order_db`

### Key Tables Overview:
- `users`: Data autentikasi dan role pengguna dashboard.
- `ai_assistant_requests`: Antrian request analisa AI dari antarmuka pengguna.
- `ai_analysis`: Hasil pemrosesan semantik AI (disimpan dalam format JSON).
- `settings`: Konfigurasi sistem (termasuk Gemini API Key dan threshold performa).

## 🛠️ Maintenance Workflow

Sistem ini dikelola menggunakan perintah berbasis `npm` untuk memudahkan pemeliharaan:
- **Inisialisasi**: `npm run db:init` untuk setup awal database.
- **AI Management**:
    - `npm run db:seed-ai`: Mengisi data awal analisa jika diperlukan.
    - `npm run db:clear-ai`: Membersihkan history analisa AI.
    - `npm run db:sync-ai`: Menyinkronkan status analisa terbaru.

---
© 2026 IT Monitoring Team.
