# Password Toolkit (Passtool) 🔐

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Made with Love](https://img.shields.io/badge/Made%20with-Love-ff69b4.svg)]()

Alat bantu untuk memeriksa, menghasilkan, dan mempelajari password yang kuat. Dirancang dengan fokus pada keamanan dan kemudahan penggunaan.

> 🤖 _README ini dibuat oleh GitHub Copilot pada 2025-05-17 10:05:31 UTC_

## 🌟 Fitur Utama

### 1. Pemeriksa Kekuatan Password
- Analisis mendalam menggunakan library zxcvbn
- Indikator kekuatan visual
- Estimasi waktu crack
- Saran perbaikan yang detail

### 2. Generator Password
- Panjang yang dapat disesuaikan (12-64 karakter)
- Opsi karakter yang dapat dikustomisasi:
  - Huruf besar (A-Z)
  - Huruf kecil (a-z)
  - Angka (0-9)
  - Simbol (!@#$%^&* dll)
- Menggunakan cryptographically secure random number generator

### 3. Generator Passphrase
- Menggunakan kamus kata Bahasa Indonesia
- Opsi kapitalisasi
- Berbagai pilihan pemisah
- Penambahan angka acak opsional
- Range: 5-20 kata

## 🔒 Keamanan

- Implementasi Content Security Policy (CSP)
- Pemrosesan data sepenuhnya di sisi klien
- Penggunaan window.crypto.getRandomValues()
- Tidak ada penyimpanan atau transmisi data

## 🚀 Cara Penggunaan

1. Clone repositori:
```bash
git clone https://github.com/Randishvold/passtool.git
```

2. Buka `index.html` di browser modern

3. Mulai gunakan fitur-fitur yang tersedia:
   - Tab "Pemeriksa Kekuatan" untuk menganalisis password
   - Tab "Generator Password" untuk membuat password acak
   - Tab "Generator Passphrase" untuk membuat passphrase dalam Bahasa Indonesia

## 💻 Teknologi

- HTML5
- CSS3 (dengan Bootstrap)
- JavaScript ES6+
- Library:
  - Bootstrap untuk UI
  - zxcvbn untuk analisis password
  - Kamus kata Bahasa Indonesia custom

## 📋 Persyaratan Sistem

- Browser modern dengan dukungan JavaScript ES6+
- Direkomendasikan:
  - Chrome 60+
  - Firefox 54+
  - Safari 10+
  - Edge 79+

## 🤝 Kontribusi

Kontribusi sangat dihargai! Berikut cara untuk berkontribusi:

1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📜 Lisensi

Dilisensikan di bawah [MIT License](LICENSE).

## 🔍 FAQ

**T: Apakah aplikasi ini aman?**
J: Ya. Semua pemrosesan dilakukan secara lokal di browser Anda. Tidak ada data yang dikirim ke server.

**T: Bagaimana dengan kualitas password yang dihasilkan?**
J: Password dihasilkan menggunakan cryptographically secure random number generator bawaan browser.

**T: Apakah passphrase mendukung bahasa lain?**
J: Saat ini hanya mendukung Bahasa Indonesia. Dukungan bahasa lain dapat ditambahkan di masa depan.

## 🎯 Roadmap

- [ ] Implementasi Progressive Web App (PWA)
- [ ] Penambahan fitur export/import
- [ ] Dukungan multi-bahasa untuk passphrase
- [ ] Penambahan unit testing
- [ ] Fitur password history
- [ ] Mode offline

## 📞 Kontak

- GitHub: [@Randishvold](https://github.com/Randishvold)

---
<p align="center">Made with ❤️ in Indonesia</p>
