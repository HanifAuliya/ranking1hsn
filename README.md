# Ranking 1 HSN

Web latihan soal untuk **Lomba Hari Statistik Nasional (HSN) 2026** antarprovinsi, dengan format dan timer mengikuti tahapan lomba:

| Tahap | Nama | Bentuk soal | Waktu |
|---|---|---|---|
| 1 | **IPA**: Ilmu Pilihan Akurat | Pilihan ganda tentang pengetahuan BPS, konsep lapangan, dan etika petugas | 10 detik |
| 2 | **IPS**: Ilmu Peta Statistik | Pilihan ganda tentang provinsi, data Kalsel, dan membaca grafik | 10 detik |
| 3 | **Matematika**: Mari Tebak Cermat Pertanyaan Terbuka | Isian angka (benar = 10) | 15 detik |
| 4 | **Ekonomi**: Eksplorasi Kode Lapangan Usaha Indonesia | Kode KBLI (5/4/3/2/1 digit = 10/8/6/4/2) | 45 detik |

## Fitur
- **Simulasi lengkap** Tahap 1 sampai 4 (10 soal per tahap). Nilai akhir = Tahap 3 + Tahap 4.
- **Latihan per tahap** dengan pilihan 10, 20, atau 30 soal, pembahasan per soal, dan mode tanpa timer.
- Soal matematika **acak tanpa batas** dari generator.
- **KBLI Acak**: soal diambil dari 1.559 kode KBLI.
- Soal IPS bergrafik, tampilan ramah HP, tema gelap/terang, dan bisa dijawab lewat keyboard (A–D / 1–4 / Enter).
- Skor terbaik tersimpan di browser.

## Menjalankan secara lokal
```bash
python -m http.server 5173
```
Lalu buka http://localhost:5173.

## Sumber data
- Data Kalimantan Selatan dan perbandingan antarprovinsi: BPS, *Provinsi Kalimantan Selatan Dalam Angka 2026*, dan Berita Resmi Statistik.
- Daftar kode KBLI: API publik tenderx.id (struktur KBLI terbaru). Selalu cocokkan dengan **SIBAKU** BPS. Untuk kode yang berubah dari KBLI 2020 (misalnya bengkel motor 95320 ↔ 45405), kedua kode diterima.

Dibuat untuk latihan pribadi, bukan situs resmi BPS.
