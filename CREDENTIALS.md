# 🔐 Monitoring Order - Technical Credentials & Workflow

This reference guide contains internal credentials and procedures for manual AI data processing.

> [!IMPORTANT]
> **Priority Workflow**: Untuk kelancaran analisa data dalam jumlah besar (seperti request history bulanan), gunakan **Raw Data Approach** (Manual Fetch). Proses analisa dilakukan oleh **Antigravity (AI Assistant)** secara langsung dengan membaca raw data, bukan bergantung sepenuhnya pada API eksternal yang terkena limit.

## 📡 SIMRS API Credentials
- **Base URL**: `http://103.148.235.37:5010`
- **Username**: `nugrohochairul`
- **Password**: `12345`
- **Auth Method**: Login via `POST /secure/auth_validate_login` to get JWT, then use in header `access-token`.

## 🗄️ Database Connection (Local)
- **Host**: `127.0.0.1`
- **User**: `root`
- **Password**: (empty)
- **Database**: `monitoring_order_db`

### Key Tables:
- `ai_assistant_requests`: Daftar antrian analisa dari UI.
- `ai_analysis`: Hasil akhir analisa AI (JSON disimpan di `result_json`).
- `settings`: Tempat menyimpan Gemini API Key (`gemini_api_key`).

---

## 🛠️ Manual Analysis Workflow (Recommended)

Jika request dari UI macet atau Error 429:

1. **Fetch Raw Data**: Jalankan script penarik data mentah untuk rentang tertentu.
   ```powershell
   npx tsx scripts/manual-fetch-data-v2.ts
   ```
   *Data akan tersimpan di `scripts/raw_data_YYYY-MM-DD.json` dan `scripts/raw_data.json`.*

2. **Run Analysis via Script**: Jalankan pemroses AI yang membaca data dari file/buffer untuk memproses ID request tertentu.
   ```powershell
   npx tsx scripts/process-manual-task.ts
   ```

3. **Verifikasi**: Cek Dashboard atau Menu Repeat Orders untuk melihat hasilnya.

---

## 📝 Script Reference
- `scripts/manual-fetch-data-v2.ts`: Script tangguh menggunakan Axios & Delay. Menghasilkan `raw_data_YYYY-MM-DD.json` dan `raw_data.json`.
- `scripts/process-manual-task.ts`: Runner untuk memproses Task ID. Otomatis mendeteksi file backup terbaru.
- `lib/ai-handler.ts`: Logic pemrosesan AI (mendukung multi-model).

---

## 🤖 Template Request ke Assistant
Gunakan template ini untuk menyuruh Assistant memproses request analisa jika background worker sedang sibuk:

```text
Tolong proses request analisa ID: [MASUKKAN_ID_DISINI].
Saya sudah menjalankan fetch data terbaru (raw_data).
Gunakan data mentah tersebut untuk melakukan analisa semantik manual.
```
