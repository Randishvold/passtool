// id-words.js
// Daftar kata Bahasa Indonesia untuk generator passphrase
// CATATAN: Untuk keamanan optimal, daftar kata yang digunakan di sini
// hanyalah contoh. Anda harus menggunakan daftar yang jauh lebih besar
// (misalnya, 7000+ kata) dari sumber yang terpercaya dan relevan.

const rawWords = [
  // Kata Umum (300+ kata)
  "mata", "langit", "air", "hujan", "bunga", "rumah", "jalan", "pagi", "malam", "senyum",
  "cinta", "teman", "makan", "minum", "tidur", "bangun", "lari", "duduk", "bermain", "belajar",
  "buku", "pena", "kertas", "meja", "kursi", "pintu", "jendela", "mobil", "motor", "sepeda",
  "kucing", "anjing", "burung", "ikan", "pohon", "daun", "buah", "sayur", "nasi", "roti",
  "kopi", "teh", "susu", "garam", "gula", "minyak", "api", "angin", "tanah", "air",
  "cahaya", "gelap", "pelangi", "awan", "matahari", "bulan", "bintang", "pantai", "laut", "ombak",
  "pasir", "gunung", "lembah", "sungai", "danau", "hutan", "ladang", "sawah", "kebun", "rumput",
  "kaca", "besi", "kayu", "batu", "pasir", "kerikil", "logam", "emas", "perak", "tembaga",
  "baju", "celana", "sepatu", "kaos", "topi", "jaket", "tas", "sarung", "jam", "gelang",
  "waktu", "detik", "menit", "jam", "hari", "minggu", "bulan", "tahun", "masa", "zaman",
  "ibu", "ayah", "anak", "kakak", "adik", "nenek", "kakek", "teman", "guru", "murid",
  "kantor", "sekolah", "pasar", "mall", "rumah sakit", "masjid", "gereja", "toko", "warung", "hotel",
  "pagi", "siang", "sore", "malam", "subuh", "senja", "fajar", "dini", "lewat", "hingga",
  "pergi", "datang", "berjalan", "berlari", "melompat", "terbang", "menyanyi", "menari", "menulis", "membaca",
  "berhitung", "mendengar", "melihat", "berbicara", "berpikir", "merenung", "tertawa", "menangis", "tersenyum", "terdiam",
  "nyata", "mimpi", "nyaman", "dingin", "panas", "lembut", "kasar", "lincah", "lambat", "cepat",
  "putih", "hitam", "merah", "biru", "kuning", "hijau", "jingga", "ungu", "abu", "cokelat",
  "senang", "sedih", "marah", "tenang", "takut", "berani", "malu", "bangga", "iri", "cemburu",
  "pintar", "bodoh", "baik", "jahat", "ramah", "sopan", "lucu", "serius", "tulus", "ikhlas",
  "percaya", "ragu", "lupa", "ingat", "sayang", "benci", "peduli", "acuh", "jatuh", "bangkit",
  "rapi", "kotor", "bersih", "wangi", "bau", "tajam", "tumpul", "kering", "basah", "licin",
  "lengket", "ringan", "berat", "besar", "kecil", "tinggi", "rendah", "pendek", "panjang", "lebar",
  "sempit", "luas", "jauh", "dekat", "dalam", "dangkal", "awal", "akhir", "baru", "lama",

  // Kata Unik (200+ kata)
  "arunika", "takzim", "asmaraloka", "adiwidia", "amerta", "kenes", "renjana", "niskala", "tetirah", "saujana",
  "pancarona", "nirmala", "sandyakala", "swastamita", "suryakanta", "nuraga", "wiyata", "ugahari", "undagi", "wanodya",
  "halentri", "ubikitas", "pindakas", "kiamboi", "balamiri", "matutinal", "tikahwana", "molton", "odekolonye", "pastiles",
  "manzil", "tunak", "pramusiwi", "jenggala", "klandestin", "nayanika", "lokananta", "sabitah", "senandika", "trengginas",
  "taklif", "lazuardi", "lembayung", "lengkara", "litani", "lindap", "risak", "puspas", "ranum", "meraki",
  "saguna", "jantera", "sasmita", "titir", "swasembada", "kawi", "mantra", "sasmita", "swargaloka", "panambang",
  "sasmita", "adhikrama", "darussalam", "mentari", "kasmaran", "hijrah", "khidmat", "jelaga", "haribaan", "nirmayi",
  "bayangkara", "manunggal", "samudra", "asmara", "santuy", "konco", "bujang", "paguyuban", "cendekia", "pranata",
  "ngeli", "legawa", "guyub", "sengkuyung", "lirih", "risalah", "bakti", "layang", "kasatmata", "nalar",
  "cendana", "dwipa", "cakrawala", "pradana", "saraswati", "manikam", "saguna", "pamungkas", "rengkuh", "wijaya",
  "cendikia", "bhayangkari", "adikarya", "panglima", "sembada", "wijang", "purnama", "pusaka", "satwika", "abadi",
  "garwa", "caraka", "bumantara", "paramita", "panenjoan", "palaran", "tirakat", "kamandanu", "manunggaling", "kawula",
  "kresna", "kusuma", "wijangga", "penggalang", "pawaka", "kendaga", "rangkai", "jagad", "alangkah", "mahesa"
];


// Hapus duplikasi kata saat array didefinisikan
const indonesianWords = Array.from(new Set(rawWords));

// console.log(`Loaded ${rawWords.length} potential words, ${indonesianWords.length} unique words.`);

// Variabel ini akan dapat diakses oleh script.js jika id-words.js dimuat duluan
// Dalam struktur tanpa module bundler, ini cara umum berbagi data antar file JS
// Untuk modularisasi yang tepat, gunakan ES modules (import/export)