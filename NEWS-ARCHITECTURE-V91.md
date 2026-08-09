# V91 — Kontrak Arsitektur Berita Spensus

Dokumen ini mengunci rancangan beranda berita agar perubahan visual berikutnya tidak mengorbankan fitur, akses, atau performa PAIBP SMART SMP.

## 1. Hak akses
- Hanya Editor yang dapat membuat, mengubah, menerbitkan, menarik, dan menghapus berita.
- Guru dan murid tidak mendapat kontrol penerbitan.
- Murid tetap hanya mengakses konten yang memang publik / materi belajar sesuai hak akses yang sudah ada.

## 2. Terbit langsung
- Tombol `Terbitkan` wajib menulis ke backend publik, bukan hanya `localStorage`.
- Status baru boleh ditampilkan sebagai `Tayang` setelah backend mengembalikan sukses, `articleId`, `slug`, `publishedAt`, dan URL publik.
- Jika jaringan gagal, berita tidak boleh diberi status palsu sebagai sudah tayang. Editor mendapat status `Menunggu koneksi / Coba lagi`.
- Setelah sukses, feed berita terbaru harus diperbarui/invalidate sehingga posting baru muncul pada beranda tanpa edit GitHub manual.

## 3. Struktur berita
Setiap berita minimal mempunyai:
- id
- slug
- judul
- ringkasan
- isi
- tanggal kegiatan
- publishedAt
- updatedAt
- tahun
- bulan
- kategori
- thumbnail
- daftar media
- status (`draft` / `published` / `archived`)
- penulis/editor

## 4. Arsip otomatis
- Arsip dikelompokkan otomatis per tahun.
- Di dalam tahun dapat difilter per bulan dan kategori.
- Tahun diturunkan dari `publishedAt` / tanggal publikasi yang valid; tidak diketik ulang sebagai indeks terpisah oleh editor.
- URL arsip harus dapat dibuka langsung, misalnya pola `/berita/?tahun=2026`.

## 5. Performa — jangan pernah mengirim seluruh arsip ke browser
- Beranda hanya mengambil 8–12 berita terbaru.
- Arsip menggunakan cursor pagination; halaman berikutnya diambil hanya ketika diminta.
- Pencarian dilakukan terhadap indeks/backend, bukan dengan mengunduh seluruh database ke HP.
- Metadata berita dipisahkan dari media.
- Gambar asli tidak dimuat pada kartu; gunakan thumbnail responsif.
- `loading="lazy"`, `decoding="async"`, `srcset`/ukuran media adaptif, dan cache CDN wajib.
- Berita di bawah viewport menggunakan `content-visibility:auto` bila aman.
- Tidak menggunakan MutationObserver global atau scan DOM berulang.
- Tidak menyimpan seluruh arsip berita di `localStorage`.

## 6. Media
- Upload gambar diproses menjadi beberapa ukuran/thumbnail sebelum dikirim ke pembaca.
- Kartu berita memakai versi kecil; halaman detail baru memuat resolusi lebih besar.
- Media harus memiliki dimensi untuk mencegah layout shift.
- Arsip media tidak boleh ikut dalam payload daftar berita.

## 7. Mobile-first
- Satu kolom utama pada layar kecil.
- Tombol sentuh minimal nyaman digunakan.
- Tidak ada hover-only control.
- Navigasi berita, tahun, bulan, dan kategori tetap bisa digunakan dengan satu tangan.
- Teks utama menjaga kontras tinggi dan ukuran baca yang nyaman.
- Efek visual tidak boleh menyebabkan jank; animasi kontinu dihindari.

## 8. Cache dan penyegaran
- Feed terbaru memakai cache singkat + stale-while-revalidate.
- Arsip tahun lama boleh memakai cache lebih panjang.
- Setelah Editor menerbitkan/mengubah/menghapus berita, backend wajib melakukan invalidasi versi feed terkait.
- Browser tidak dipaksa membersihkan seluruh cache aplikasi hanya karena satu berita baru.

## 9. Beranda baru
- Fokus utama beranda adalah berita/kegiatan SMP Negeri 1 Susukan.
- Teks berjalan Visi–Misi tetap dipertahankan.
- Akses Ruang Murid, Fitur Islami, Game, Mapel Lain, Portal Guru, dan Spensus AI tetap tersedia tetapi dibuat ringkas agar tidak merebut area utama berita.
- Spensus AI tetap floating, draggable, dan lazy-loaded.
- Bagian yang tidak lagi penting boleh disederhanakan hanya saat redesign beranda disetujui; fitur di baliknya tidak dihapus.

## 10. Prinsip skala
Jumlah total arsip tidak boleh menentukan berat beranda. Browser hanya menerima potongan data yang sedang dibutuhkan. Dengan demikian, ketika arsip tumbuh sangat besar, payload awal tetap kecil dan waktu render halaman awal tetap terkendali.

## 11. Larangan regresi
Redesign berita tidak boleh mengubah atau menghapus: login NISN/wajib HP, CAT, penguncian materi guru, perangkat PAIBP, Al Qur'an internal, qori/audio/download/share, Simulasi Ibadah, Mapel Lain, Spensus AI, Portal Guru, maupun Kendali Editor yang sudah ada.
