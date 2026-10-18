# Portal CAT TOEFL STIENAS

Portal CAT berbasis React, TypeScript, Vite, dan Supabase. Antarmuka mengikuti tiga referensi Stitch di `stitch_stie_nas_toefl_portal/`; mode produksi menampilkan tiga Google Form buatan admin, satu untuk tiap section, dengan prefill identitas dan timer per section.

## Jalankan mode demo

```powershell
npm install
npm run dev
```

Buka URL Vite yang ditampilkan di terminal. Token demo awal adalah `STN-2025-LSTN1`. Masuk ke dashboard melalui tautan **Akses pengawas**, pilih **Buka dashboard demo**, lalu atur tiga URL Google Form untuk mencoba iframe. Data demo hanya tersimpan di browser. Tanpa URL Form, portal memakai lima soal contoh per bagian; nilainya bukan skor TOEFL resmi.

## Konfigurasi Supabase

1. Siapkan proyek Supabase dan jalankan `supabase_schema.sql` melalui SQL Editor.
2. Pastikan URL proyek dan anon key pada `src/supabase.ts` menunjuk ke proyek yang benar.
3. Salin `.env.example` menjadi `.env.local`. Atur `VITE_ADMIN_USERNAME` dan `VITE_ADMIN_PASSWORD` untuk login admin, serta sesuaikan `VITE_STATION_ID` dan `VITE_LISTENING_AUDIO_URL`.
4. Jalankan `npm install` dan `npm run dev`.

Login admin saat ini diperiksa di browser; variabel `VITE_*` akan tertanam pada bundel aplikasi dan bukan tempat penyimpanan rahasia. Jangan mengandalkan login ini sebagai batas keamanan untuk data produksi. Lindungi operasi data dengan autentikasi serta Row Level Security Supabase yang sesuai sebelum membuka portal ke publik.

## Deploy ke GitHub Pages

Repository ini memakai sumber GitHub Pages dari branch `main`, folder `/docs`. Jalankan `npm run build`, lalu commit dan push perubahan di folder `docs/` bersama perubahan sumber. Output build sudah menggunakan base path `/testakademik/` dan menyertakan `.nojekyll` untuk deployment project Pages. File `.env.local` tidak ikut di-push, dan kredensial admin sengaja dikosongkan pada build produksi agar tidak bocor ke bundel publik. Login admin di client-side tidak dapat menjadi kontrol akses yang aman; gunakan Supabase Auth dan kebijakan RLS sebelum mengaktifkan akses admin produksi.

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
