# Product Requirement Document (PRD) & Project Brief
## Portal Ujian CAT TOEFL & Prediction Test — STIE Nasional Banjarmasin

---

### 1. Executive Summary & Ringkasan Proyek

* **Nama Produk / Platform:** Sistem CAT Ujian TOEFL STIE Nasional Banjarmasin (Portal Ujian TOEFL CBT STIENAS)
* **Pemilik Produk:** Unit Pelaksana Teknis (UPT) Bahasa & Sertifikasi Internasional bekerjasama dengan Bagian Akademik & IT STIE Nasional Banjarmasin.
* **Target Pengguna Utama:**
  1. **Mahasiswa Tingkat Akhir / Reguler STIENAS:** Peserta tes TOEFL prediction sebagai syarat kelulusan yudisium, sidang skripsi, atau sertifikasi kompetensi.
  2. **Pengawas & Administrator Lab CBT:** Tim pengawas laboratorium komputer yang mengatur sesi, merilis token acak dinamis, dan memantau workstation.
  3. **Kepala UPT Bahasa & Biro Akademik:** Penerima rekapitulasi data nilai otomatis, validasi kelulusan skor minimal (passing score), dan penerbit e-sertifikat resmi.

---

### 2. Latar Belakang & Pernyataan Masalah (Problem Statement)

1. **Efisiensi Pengisian Lembar Jawaban Manual:** Pelaksanaan ujian TOEFL konvensional berbasis kertas (PBT) membutuhkan waktu koreksi manual yang lama dan rentan kesalahan pensil 2B.
2. **Kebutuhan Standardisasi Mirip CAT Nasional:** Dibutuhkan alur ujian yang teratur, formal, dan berintegritas tinggi menyerupai sistem CAT BKN/CPNS agar mahasiswa terbiasa dengan ujian berbasis komputer berstandar nasional.
3. **Pemanfaatan Bank Soal Google Form Eksisting:** Pihak kampus telah memiliki bank soal digital terstruktur di Google Form, namun membutuhkan wrapper antarmuka (portal) yang aman, membatasi kecurangan (lockdown & token), serta menyediakan sistem autentikasi dan rekapitulasi otomatis.

---

### 3. Tujuan Produk & Key Results (Objectives & OKRs)

* **O1: Pengalaman Ujian yang Terstruktur & Aman**
  * *KR 1.1:* Penerapan otentikasi ganda (NIM + Token Sesi Dinamis) untuk seluruh peserta.
  * *KR 1.2:* Nol insiden kesalahan identitas peserta melalui konfirmasi biodata dan sinkronisasi NIM terverifikasi.
* **O2: Pengintegrasian Google Form Tanpa Kendala (Seamless Embed/API)**
  * *KR 2.1:* Soal Google Form ditampilkan rapi berdampingan dengan Audio Master Player (Section 1), timer countdown, dan panel identitas.
  * *KR 2.2:* Data mahasiswa (NIM, Nama, Token) otomatis terisi (*pre-filled*) ke dalam formulir ujian tanpa pengisian ganda.
* **O3: Pelaporan Nilai Cepat & Transparan**
  * *KR 3.1:* Konversi otomatis jawaban benar ke standar skor skala TOEFL (310 – 677).
  * *KR 3.2:* Hasil nilai instan dapat dilihat mahasiswa pasca-submit dan rekapitulasi nilai per sesi tersedia bagi admin dalam format spreadsheet / PDF.

---

### 4. Persona Pengguna (User Personas)

#### Persona 1: Muhammad Farhan (Mahasiswa Peserta Ujian)
* **Karakteristik:** Mahasiswa Semester 7/8 Program Studi S1 Manajemen Bisnis & Keuangan STIENAS.
* **Kebutuhan:** Memerlukan skor TOEFL minimal 450 untuk syarat pendaftaran ujian yudisium skripsi.
* **Tantangan:** Khawatir koneksi lab bermasalah, bingung mendengarkan audio listening jika tidak ada uji suara, membutuhkan kepastian bahwa jawabannya tersimpan dan nilainya segera keluar.

#### Persona 2: Drs. H. M. Zaini, M.Pd. (Pengawas Lab CBT & Staf UPT Bahasa)
* **Karakteristik:** Pengawas ruangan laboratorium komputer CBT STIENAS.
* **Kebutuhan:** Mengontrol siapa saja yang boleh masuk lab per gelombang sesi, merilis token tiap interval 15 menit, memantau workstation PC mahasiswa secara real-time, dan mencetak berita acara ujian.

---

### 5. Arsitektur Alur Pengguna (User Journey & Information Architecture)

```
[Tahap 1: Gerbang Masuk]
  ├── Buka Portal Ujian di Workstation Lab Komputer
  ├── Input NIM / Nomor Peserta
  ├── Input Token Ujian Rilis Pengawas (misal: STN-2025-LSTN1)
  ├── Validasi Captcha & Telemetri Stasiun
  └── Verifikasi Kredensial Berhasil
          │
[Tahap 2: Verifikasi & Kelengkapan Biodata]
  ├── Validasi Data Terkunci (Nama & NIM sinkron SIAKAD)
  ├── Konfirmasi Program Studi & Tahun Angkatan
  ├── Pilih Tujuan Ujian (Syarat Yudisium / Skripsi)
  ├── Input Kontak Notifikasi (WhatsApp & Email Institusi)
  ├── Uji Coba Suara Headset (Audio Sound Test)
  ├── Checklist Pakta Integritas CAT Anti-Kecurangan
  └── Tombol: "Simpan Biodata & Masuk Section 1"
          │
[Tahap 3: Ruang Ujian Digital (Exam Dashboard)]
  ├── Header: Master Audio Listening Player (Part A, B, C)
  ├── Sidebar Kiri: Identitas Peserta, Progres Seksi, Tata Tertib, Tombol Panggil Pengawas
  ├── Kontainer Utama: Lembar Ujian Google Form Interaktif (Pre-filled Data Mahasiswa)
  ├── Floating Status Bar: Indikator Cloud Sync, Sisa Waktu Countdown, Tombol Submit Sesi
  └── Transisi Antar Seksi (Listening -> Structure -> Reading)
          │
[Tahap 4: Selesai Ujian & Laporan Skor (Post-Exam)]
  ├── Konfirmasi Penyelesaian Lembar Ujian
  ├── Kalkulasi Otomatis Skor Konversi TOEFL (310 - 677)
  ├── Penerbitan Transkrip Hasil Sementara (Print/PDF)
  └── Pengiriman Arsip Nilai ke Database SIAKAD & Email Mahasiswa
```

---

### 6. Rincian Fitur Utama (Functional Requirements)

#### 6.1. Modul Gerbang Masuk (Token-Based Authentication)
* **Autentikasi Token Dinamis:** Mahasiswa hanya dapat login menggunakan token alfanumerik yang digenerate oleh pengawas lab (berlaku masa kedaluwarsa per sesi).
* **Workstation & Subnet Lockdown:** Mendeteksi IP Address lokal dan stasiun kerja PC (`WS-LAB03-24`) untuk mencegah pengerjaan di luar lab terdaftar.
* **Captcha Security:** Mengeliminasi bot/brute force pada mesin lab.

#### 6.2. Modul Verifikasi Identitas & Readiness Check
* **Pre-population Data Akademik:** Menampilkan data resmi mahasiswa (Nama, NIM, Foto Peserta).
* **Pemilihan Tujuan Tes:** Pilihan kategori ujian (*Syarat Sidang Skripsi*, *Yudisium*, atau *Sertifikasi Reguler*).
* **Headphone Diagnostic Utility:** Fitur *Sound Sample Player* untuk memastikan volume headset lab berfungsi optimal sebelum timer Section Listening dimulai.
* **Pakta Integritas Digital:** Pernyataan anti-joki dan kepatuhan aturan CCTV laboratorium CBT.

#### 6.3. Modul Ruang Ujian Terintegrasi (CBT Room Interface)
* **Google Form Wrapper:** Embed formulir Google Form yang bersih dan bebas scroll horizontal, dengan integrasi parameter URL pre-fill (`?entry.NIM=...&entry.NAMA=...`).
* **Audio Master Player:** Kontrol audio resmi terpusat untuk listening test dengan durasi sinkron per gelombang soal (Part A, B, C).
* **Floating Exam Monitor:** Jam waktu sisa sesi (countdown timer), indikator latensi LAN server, dan tombol pemanggil pengawas fisik (*Call Proctor*).

#### 6.4. Modul Manajemen Admin & Pelaporan Nilai (Admin & Grading Engine)
* **Token Generator:** Fitur bagi admin untuk membuat token per sesi ujian dengan parameter masa berlaku dan batas jumlah peserta.
* **Konversi Skor TOEFL Otomatis:** Script backend penghitung jawaban benar dari spreadsheet Google Form ke tabel konversi resmi TOEFL PBT (310–677).
* **Ekspor Laporan & Berita Acara:** Unduh rekapitulasi nilai seluruh peserta dalam format Excel/CSV serta cetak daftar hadir dan berita acara ujian resmi.

---

### 7. Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Keandalan & Stabilitas (Reliability):** Sistem harus tetap stabil dan autosave jawaban berjalan di jaringan intranet lokal lab CBT STIENAS dengan toleransi latensi < 10 ms.
* **Keamanan (Security):** Mencegah pembukaan tab baru (*fullscreen / exam kiosk mode*), proteksi token sekali pakai (single-use session per NIM), enkripsi session token SHA-256.
* **Kompatibilitas Tampilan (UI/UX):** Layout desktop terstandar (1920x1080 dan 1366x768 monitor PC lab), typography modern dengan Plus Jakarta Sans, dan warna institusional STIENAS (Gold, Navy, Emerald).

---

### 8. Peta Jalan Pengembangan (Roadmap & Next Milestones)

* **Fase 1 (Selesai):** Desain Antarmuka Utama (Gerbang Token CAT, Konfirmasi Biodata, Ruang Ujian CBT Terintegrasi).
* **Fase 2 (Berikutnya):** Desain Layar Pengumuman Nilai Instan & E-Sertifikat Prediksi TOEFL Mahasiswa.
* **Fase 3:** Desain Dashboard Pengawas/Admin CBT (Generator Token, Monitoring Real-Time Stasiun PC, Rekapitulasi Nilai).
* **Fase 4:** Integrasi Google Apps Script Webhook untuk sinkronisasi nilai otomatis dari Google Form ke Portal Ujian.
