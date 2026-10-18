# EduCore: TPA & TOEFL Like STIE Nasional Banjarmasin

EduCore adalah portal ujian CAT berbasis React, TypeScript, Vite, dan Supabase untuk TPA serta TOEFL Like di STIE Nasional Banjarmasin. Antarmuka mengikuti tiga referensi Stitch di `stitch_stie_nas_toefl_portal/`; mode produksi menampilkan tiga Google Form buatan admin, satu untuk tiap section, dengan prefill identitas dan timer per section.

## Jalankan mode demo

```powershell
npm install
npm run dev
```

Buka URL Vite yang ditampilkan di terminal. Peserta harus memasukkan token sesi yang disediakan pengawas. Pengelola masuk melalui tombol **Akses Pengelola** menggunakan akun Supabase Auth yang dikonfigurasi; URL Google Form dapat diatur dari panel pengelola.

## Pemulihan sesi ujian

Saat peserta memulai ujian, EduCore menyimpan data peserta, token, bagian TOEFL/TPA, progres bagian, dan batas waktu bagian di `localStorage` browser. Jika tab ditutup atau halaman dimuat ulang, buka kembali EduCore pada browser/perangkat yang sama, masukkan NIM untuk verifikasi, lalu pilih **Lanjutkan ke Ujian**. Timer tetap berjalan selama aplikasi tertutup. Data sesi peserta juga disinkronkan ke Supabase; saat pemulihan, EduCore mencoba menyinkronkan kembali catatan peserta.

Pemulihan ini tidak menyimpan jawaban yang belum dikirim dalam Google Form. Form berada di domain Google dan EduCore tidak dapat membaca kolom jawaban di dalam iframe. Aktifkan fitur draf Google Form dan minta peserta menggunakan akun Google bila draf perlu dipulihkan; pilihan paling andal adalah menekan **Kirim** sebelum menutup halaman. Menghapus data situs/browser, memakai mode privat, atau berpindah browser/perangkat dapat menghilangkan sesi lokal. Agar jawaban bisa dipulihkan lintas perangkat, soal dan jawaban harus dikelola serta disimpan oleh backend EduCore, bukan hanya disematkan dari Google Form.

## Sesi pengelola

Sesi login pengelola dipertahankan oleh Supabase Auth di storage browser dan direstorasi setelah halaman dimuat ulang. EduCore memvalidasi sesi tersimpan terhadap Supabase Auth serta membandingkan identitas dengan `VITE_ADMIN_EMAIL` sebelum membuka panel. Untuk mengakhiri sesi, gunakan tombol **Keluar**; sesi juga akan berakhir bila token refresh kedaluwarsa/dicabut atau data situs dibersihkan.

## Laporan peserta

Pada panel **Rekap Peserta**, laporan TOEFL Like dan TPA tersedia terpisah. Tombol **Excel (.xls)** mengunduh file SpreadsheetML yang dapat dibuka di Microsoft Excel; tombol **Cetak / PDF** membuka laporan siap cetak, lalu pilih **Simpan sebagai PDF** pada dialog cetak browser. Kedua laporan memuat peserta yang sedang mengerjakan maupun yang sudah selesai, beserta identitas, token, waktu, status, dan posisi seksi. Izinkan pop-up browser untuk membuka laporan cetak.

## Konfigurasi Supabase

1. Siapkan proyek Supabase dan jalankan `supabase_schema.sql` melalui SQL Editor.
2. Pastikan URL proyek dan anon key pada `src/supabase.ts` menunjuk ke proyek yang benar.
3. Di Supabase Dashboard, buat user admin di **Authentication → Users** dengan email `arief@stienas-ypb.ac.id`, atur kata sandi admin, lalu pastikan akun terkonfirmasi.
4. Salin `.env.example` menjadi `.env.local`. Atur `VITE_ADMIN_USERNAME=labterpadu` dan `VITE_ADMIN_EMAIL=arief@stienas-ypb.ac.id`. Atur juga `VITE_STATION_ID` dan `VITE_LISTENING_AUDIO_URL`.
5. Jalankan `npm install` dan `npm run dev`.

Login admin diverifikasi melalui Supabase Auth menggunakan email akun yang dikonfigurasi; kata sandi tidak disimpan atau ditanam ke bundel aplikasi. Terapkan kebijakan Row Level Security Supabase yang membatasi operasi admin sebelum memakai data produksi.

Jika login ditolak, pastikan user `arief@stienas-ypb.ac.id` berada di proyek Supabase dengan project ref `qqjeajnrepmawqjqsuup`, status emailnya terkonfirmasi, dan gunakan kata sandi yang diset untuk akun Auth tersebut. Reset kata sandi atau konfirmasikan email dari Supabase Dashboard bila perlu.

## Deploy ke GitHub Pages

Repository ini memakai sumber GitHub Pages dari branch `main`, folder `/docs`. Pastikan nilai `VITE_ADMIN_USERNAME` dan `VITE_ADMIN_EMAIL` sudah diatur sebelum `npm run build`, lalu commit dan push perubahan di folder `docs/` bersama perubahan sumber. Output build menggunakan base path `/educore/` dan menyertakan `.nojekyll`. File `.env.local` tidak ikut di-push; kata sandi hanya diverifikasi oleh Supabase Auth dan tidak masuk ke bundel. Terapkan RLS Supabase untuk membatasi akses data.

## Siapkan data produksi

Sebelum ujian peserta dapat dimulai, pengawas mengatur URL Listening, Structure, dan Reading pada panel **Kontrol portal & Google Form**, beserta entry ID masing-masing Form, lalu menyimpan dan membuka gerbang. Ambil ID dari tautan **Get pre-filled link** pada setiap Form; masukkan angka setelah `entry.`. Roster aktif diimpor melalui panel data. Format roster minimal:

```json
{
  "students": [{ "nim": "2110112044", "name": "Nama sesuai SIAKAD", "program": "S1 Akuntansi", "cohort": "2021", "active": true }],
  "questionBank": {
    "questions": [{ "id": "L001", "section": "listening", "prompt": "Question text", "context": "Optional passage", "choices": ["A", "B", "C", "D"], "correctChoice": 0 }]
  },
  "scoreConversion": {
    "tables": {
      "listening": { "0": 31, "1": 31 },
      "structure": { "0": 31, "1": 31 },
      "reading": { "0": 31, "1": 31 }
    }
  }
}
```

Untuk alur Google Form, `students` wajib; `questionBank` dan `scoreConversion` opsional dan hanya digunakan jalur penilaian internal/cadangan. Bila disediakan, bank internal harus berisi tepat 50 soal `listening`, 40 `structure`, dan 50 `reading`, sedangkan tabel konversi harus memetakan semua jumlah jawaban benar ke skor 31–68. Jangan gunakan tabel contoh ini untuk produksi; isikan nilai yang disahkan UPT Bahasa.

## Konfigurasi yang perlu disediakan kampus

- Konfigurasi Supabase, kredensial admin pada environment deployment, roster mahasiswa yang diizinkan, dan bank soal beserta kunci jawaban resmi.
- Tabel konversi PBT resmi dari UPT Bahasa. Skor tidak dapat dianggap resmi sebelum tabel itu dimasukkan.
- Tiga URL Google Form aktif dan entry ID NIM/nama prefill untuk setiap Form (Listening, Structure, Reading), URL audio listening yang berlisensi/diotorisasi, serta roster peserta yang boleh ikut.
- Peserta mengerjakan Form Listening, Structure, lalu Reading. Sebelum berpindah, mereka harus menekan **Kirim** pada Form aktif dan mengonfirmasi di portal. Karena iframe lintas-origin, portal tidak bisa memverifikasi klik kirim; dashboard mencatat Form selesai dengan nilai **menunggu**. Skor Google Forms perlu disinkronkan melalui integrasi kampus sebelum sertifikat/kelulusan diterbitkan.
- Nilai `VITE_STATION_ID` hanya label stasiun dari konfigurasi browser, bukan bukti identitas workstation atau subnet. Penguncian IP/subnet yang sungguh-sungguh perlu dilakukan oleh jaringan lab, kiosk/agent terkelola, atau lapisan gateway tepercaya; jangan mengandalkan nilai ini sebagai kontrol keamanan tunggal.

Admin dapat membuka/menutup gerbang global, mencabut token, mengatur durasi tiap section dan passing score, mengelola ketiga URL Form serta entry ID prefill-nya, dan mengatur audio. Menutup gerbang menghentikan portal peserta setelah polling; Form yang dibuka langsung tetap harus dilindungi dengan pengaturan akses Google Workspace/kiosk kampus. Penguncian IP/subnet sesungguhnya tetap membutuhkan jaringan lab atau agent workstation terkelola.
