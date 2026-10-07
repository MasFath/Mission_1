# 💻 COMPUTER LAB CLUB — Digital Mission System
*Learn by Doing — Digital Explorer* · “Jelajahi Dunia Komputer, Ciptakan Karyamu”

Web app statis (HTML, CSS, JavaScript vanilla) untuk ekstrakurikuler Computer Lab Club SMP/MTs. Tanpa framework, backend, database, login, CDN, atau API eksternal. Berjalan offline di Chrome dan Edge.

## 1. Menjalankan secara lokal
Buka `index.html` langsung di Chrome/Edge (klik dua kali), atau jalankan server lokal:
```
python -m http.server 8000     # lalu buka http://localhost:8000
```

## 2. Deploy ke GitHub Pages
1. Buat repository baru, unggah seluruh isi folder ini (`index.html` harus di root).
2. Buka **Settings → Pages**.
3. Pada *Build and deployment*, pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu Save.
4. Tunggu 1–2 menit; alamat: `https://USERNAME.github.io/NAMA-REPO/`.

## 3. Menambah Mission baru
1. Salin `missions/mission-01.js` menjadi `missions/mission-02.js`, ganti nama konstanta menjadi `mission02`, `id: "mission-02"`, serta isi `title`, `task`, `timeLimit`, `passingScore`, dan `questions` (`answer` = indeks opsi, 0=A … 3=D).
2. Tambahkan `<script src="missions/mission-02.js"></script>` di `index.html` **sebelum** `app.js`.
3. Di `app.js`, pada `MISSION_LIST`, lengkapi entri `mission-02` dengan `title` dan `points` (daftar poin di kartu).
4. Unlock otomatis: Mission 02 berstatus AVAILABLE setelah `mission01_completed = true` (lihat `requires`). Mission tanpa file data tetap tampil sebagai LOCKED / SEGERA HADIR.

## 4. Soft-lock
Sistem ini menggunakan soft-lock berbasis browser. JavaScript dapat mendeteksi perpindahan halaman/tab dan perubahan fullscreen, tetapi tidak dapat mengunci sistem operasi Windows. Untuk penguncian komputer tingkat sistem dapat digunakan Windows Kiosk Mode/Assigned Access secara terpisah jika diperlukan.

Navigasi soal bebas: siswa dapat mengganti jawaban, kembali, maju, atau melompat lewat nomor soal. Soal kosong dihitung salah (ada konfirmasi sebelum selesai).

Peringatan keluar sistem: pindah tab, pindah jendela/aplikasi (deteksi `blur`), dan keluar fullscreen memunculkan modal peringatan, bunyi beep, dan judul tab berkedip. Klik di luar konten halaman (mis. address bar saat tidak fullscreen) juga dapat terdeteksi sebagai keluar.

Aturan: pindah tab/meninggalkan halaman dan keluar fullscreen masing-masing dihitung sebagai pelanggaran (kejadian beruntun dalam ±1,5 detik dihitung satu). Pelanggaran ke-3 = Mission Failed. Timer tetap berjalan saat tab tidak aktif.

## 5. Keterbatasan browser
- Anti-cheat ringan (klik kanan, Ctrl+U/C/V/S, F12) hanya menghalangi secara sopan; browser/OS tetap dapat melewatinya (mis. Alt+Tab, Win+D, Ctrl+W, menu browser). Bukan keamanan absolut.
- Kunci jawaban ada di file JavaScript sehingga dapat dibaca siswa yang mahir. Cocok untuk latihan/checkpoint, bukan ujian berisiko tinggi.
- Fullscreen harus dipicu klik pengguna; jika ditolak, Mission tetap berjalan dengan pemberitahuan.
- Reload/menutup tab hanya memunculkan konfirmasi standar browser; jika tetap dilanjutkan, Mission yang sedang berjalan hilang dan kembali ke dashboard (progress tersimpan tidak rusak).
- Progress disimpan di `localStorage` per browser/komputer (hanya `missionXX_completed` dan `missionXX_score`; tanpa data pribadi). Menghapus data browser mereset progress.

## 6. Cara menguji
| Uji | Cara | Hasil |
|---|---|---|
| 1 | Mulai Mission | Fullscreen, timer 15:00, soal 1, pelanggaran 0/3 |
| 2 | Jawab semua benar (B,C,D,A,A,A,C,C,C,C) | 100/100, MISSION COMPLETE |
| 3 | 8 benar | 80/100, COMPLETE |
| 4 | 7 benar | 70/100, FAILED |
| 5 | Pindah tab 1× | Pelanggaran 1/3 + modal saat kembali |
| 6 | Pindah tab 3× (jeda >2 detik) | MISSION FAILED |
| 7 | Tekan Esc (keluar fullscreen) | Pelanggaran +1 |
| 8 | Waktu habis (ubah `timeLimit` sementara menjadi 20) | TIME OUT, FAILED |
| 9 | Tekan F5 saat Mission | Peringatan browser; tidak ada state rusak |
| 10 | Selesaikan Mission | Dashboard menampilkan ✓ COMPLETED + skor |

Shortcut keyboard: `A–D` pilih jawaban, `→`/Enter lanjut, `←` kembali.

## 7. Struktur folder
```
computer-lab-club/
├── index.html          dashboard + semua tampilan
├── style.css           seluruh styling (CSS variables)
├── app.js              state, timer, fullscreen, pelanggaran, hasil
├── missions/
│   └── mission-01.js   data Mission 01 (10 soal)
├── assets/
│   └── favicon.svg
└── README.md
```
