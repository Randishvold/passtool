document.addEventListener('DOMContentLoaded', () => {

    // Helper for getting a cryptographically secure random index within a range [0, range-1]
    function cryptoRandom(range) {
        if (range <= 0) return 0;
        const maxUint32 = 0xFFFFFFFF;
        // Find the largest multiple of 'range' that fits in Uint32
        const maxValidValue = Math.floor(maxUint32 / range) * range;

        let randomBytes = new Uint32Array(1);
        let randomValue;

        do {
            window.crypto.getRandomValues(randomBytes);
            randomValue = randomBytes[0];
        } while (randomValue >= maxValidValue); // Discard values that would cause modulo bias

        return randomValue % range;
    }


    // --- Feature 1: Password Strength Checker ---
    const passwordInput = document.getElementById('passwordInput');
    const strengthIndicator = document.getElementById('strengthIndicator');
    // Removed crackTimeDisplay variable
    const feedbackList = document.getElementById('feedbackList');
    const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibility');

    if (passwordInput && strengthIndicator && feedbackList && togglePasswordVisibilityBtn) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;

            // Clear previous state
            strengthIndicator.className = 'alert mb-2'; // Reset Bootstrap classes
            strengthIndicator.textContent = 'Password belum dimasukkan.'; // Default text
            // Removed crackTimeDisplay.textContent = '-';
            feedbackList.innerHTML = ''; // Clear feedback list


            if (password.length === 0) {
                strengthIndicator.classList.add('alert-secondary');
                return; // Exit if input is empty
            }

            // Use zxcvbn to evaluate strength
            const result = zxcvbn(password); // result IS THE OBJECT

            const score = result.score; // 0-4

            // Update strength indicator text and color based on score
            let strengthText = '';
            let alertClass = '';
            switch (score) {
                case 0:
                    strengthText = 'Sangat Lemah';
                    alertClass = 'alert-score-0';
                    break;
                case 1:
                    strengthText = 'Lemah';
                    alertClass = 'alert-score-1';
                    break;
                case 2:
                    strengthText = 'Sedang';
                    alertClass = 'alert-score-2';
                    break;
                case 3:
                    strengthText = 'Kuat';
                    alertClass = 'alert-score-3';
                    break;
                case 4:
                    strengthText = 'Sangat Kuat';
                    alertClass = 'alert-score-4';
                    break;
                default: // Handle unexpected scores
                    strengthText = 'Tidak Diketahui';
                    alertClass = 'alert-secondary';
            }

            strengthIndicator.classList.add(alertClass);
            strengthIndicator.textContent = `Kekuatan: ${strengthText}`;

            // Removed Display crack time logic

            // Display feedback/suggestions from zxcvbn
            const suggestions = result.feedback.suggestions;
            const warning = result.feedback.warning;

            if (warning || (suggestions && suggestions.length > 0)) {
                const feedbackUl = document.createElement('ul');
                if (warning) {
                    const liWarning = document.createElement('li');
                    liWarning.innerHTML = `<strong class="text-warning">Peringatan:</strong> ${warning}`;
                    feedbackUl.appendChild(liWarning);
                }
                if (suggestions && suggestions.length > 0) {
                    suggestions.forEach(suggestion => {
                        const li = document.createElement('li');
                        li.textContent = suggestion;
                        feedbackUl.appendChild(li);
                    });
                }
                feedbackList.appendChild(feedbackUl);
            }
        });

        // Toggle password visibility
         togglePasswordVisibilityBtn.addEventListener('click', () => {
             const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
             passwordInput.setAttribute('type', type);

             // Toggle eye icon
             const icon = togglePasswordVisibilityBtn.querySelector('i');
             icon.classList.toggle('bi-eye');
             icon.classList.toggle('bi-eye-slash');
         });


    } else {
         console.error("Elements for Password Strength Checker not found.");
    }


    // --- Feature 2: Password Generator ---
    const passwordLengthInput = document.getElementById('passwordLengthInput');
    const passwordLengthValueDisplay = document.getElementById('passwordLengthValue');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    const generatedPasswordInput = document.getElementById('generatedPasswordInput');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');

    // Define character sets
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|;:,.<>?/~`';

    if (passwordLengthInput && passwordLengthValueDisplay && includeLowercase && includeUppercase && includeNumbers && includeSymbols && generatePasswordBtn && generatedPasswordInput && copyPasswordBtn) {

         // Update display value when slider moves
         passwordLengthInput.addEventListener('input', () => {
             passwordLengthValueDisplay.textContent = passwordLengthInput.value;
         });

        // Function to generate password
        function generatePassword() {
            const length = parseInt(passwordLengthInput.value, 10);
            let characterPool = '';
            const mustInclude = [];

            if (includeLowercase.checked) {
                characterPool += lower;
                mustInclude.push(lower[cryptoRandom(lower.length)]);
            }
            if (includeUppercase.checked) {
                characterPool += upper;
                 mustInclude.push(upper[cryptoRandom(upper.length)]);
            }
            if (includeNumbers.checked) {
                characterPool += numbers;
                 mustInclude.push(numbers[cryptoRandom(numbers.length)]);
            }
            if (includeSymbols.checked) {
                characterPool += symbols;
                 mustInclude.push(symbols[cryptoRandom(symbols.length)]);
            }

            // Basic validation
            if (length < 12) {
                alert('Panjang password minimal adalah 12 karakter.');
                return '';
            }
            if (characterPool.length === 0) {
                alert('Pilih setidaknya satu jenis karakter.');
                return '';
            }
             if (length < mustInclude.length) {
                 alert(`Panjang password minimal harus sama dengan jumlah jenis karakter yang dipilih (${mustInclude.length}).`);
                 return '';
             }

            let passwordArray = new Array(length);
            const poolLength = characterPool.length;

             // Place the 'must include' characters randomly
             const usedIndices = new Set();
             mustInclude.forEach(char => {
                 let randomIndex;
                 do {
                     randomIndex = cryptoRandom(length);
                 } while(usedIndices.has(randomIndex));
                 passwordArray[randomIndex] = char;
                 usedIndices.add(randomIndex);
             });

            // Fill the remaining positions with random characters from the pool
            for (let i = 0; i < length; i++) {
                if (passwordArray[i] === undefined) {
                     const randomPoolIndex = cryptoRandom(poolLength);
                     passwordArray[i] = characterPool[randomPoolIndex];
                }
            }

            // Shuffle the array
             for (let i = passwordArray.length - 1; i > 0; i--) {
                 const j = cryptoRandom(i + 1);
                 [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
             }

            return passwordArray.join('');
        }


        // Event listener for generate button
        generatePasswordBtn.addEventListener('click', () => {
            const password = generatePassword();
            if (password) {
                generatedPasswordInput.value = password;
            }
        });

        // Event listener for copy button
        copyPasswordBtn.addEventListener('click', () => {
            const password = generatedPasswordInput.value;
            if (password) {
                navigator.clipboard.writeText(password)
                    .then(() => {
                        const originalHtml = copyPasswordBtn.innerHTML; // Store full HTML including text
                        copyPasswordBtn.innerHTML = '<i class="bi bi-check-lg"></i> Tersalin!';
                        setTimeout(() => {
                             copyPasswordBtn.innerHTML = originalHtml; // Restore full HTML
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Gagal menyalin password:', err);
                        alert('Gagal menyalin password. Silakan salin manual.');
                    });
            } else {
                 alert('Tidak ada password yang bisa disalin.');
            }
        });

        // Initial display of slider value
        passwordLengthValueDisplay.textContent = passwordLengthInput.value;

    } else {
        console.error("Elements for Password Generator not found.");
    }


    // --- Feature 3: Indonesian Passphrase Generator ---
    const passphraseWordCountInput = document.getElementById('passphraseWordCountInput');
    const passphraseWordCountValueDisplay = document.getElementById('passphraseWordCountValue');
    const wordSeparatorSelect = document.getElementById('wordSeparatorSelect');
    const capitalizeWords = document.getElementById('capitalizeWords'); // Checkbox for random capitalization
    const addNumber = document.getElementById('addNumber'); // Checkbox for adding number
    const generatePassphraseBtn = document.getElementById('generatePassphraseBtn');
    const generatedPassphraseInput = document.getElementById('generatedPassphraseInput');
    const copyPassphraseBtn = document.getElementById('copyPassphraseBtn');

    // --- Indonesian Word List ---
    // NOTE: This list is still relatively small for demonstration.
    // For a strong passphrase generator, use a list with thousands of words (e.g., EFF Diceware list).
    // (Keeping the same extended list as before)
    const indonesianWords = [
        "aku", "kamu", "dia", "kita", "mereka", "adalah", "dan", "atau", "tetapi", "namun",
        "di", "ke", "dari", "pada", "untuk", "dengan", "tanpa", "rumah", "jalan", "kota",
        "desa", "gunung", "laut", "sungai", "pohon", "bunga", "buah", "makanan", "minuman", "baju",
        "celana", "sepatu", "mobil", "motor", "sepeda", "kereta", "pesawat", "kapal", "buku", "pena",
        "pensil", "kertas", "meja", "kursi", "pintu", "jendela", "atap", "lantai", "dinding", "langit",
        "bumi", "bulan", "matahari", "bintang", "awan", "hujan", "angin", "panas", "dingin", "besar",
        "kecil", "panjang", "pendek", "luas", "sempit", "berat", "ringan", "cepat", "lambat", "baru",
        "lama", "baik", "buruk", "cantik", "jelek", "kaya", "miskin", "senang", "sedih", "marah",
        "takut", "berani", "pintar", "bodoh", "rajin", "malas", "tidur", "makan", "minum", "jalan",
        "lari", "duduk", "berdiri", "bicara", "mendengar", "melihat", "membaca", "menulis", "bekerja", "belajar",
        "bermain", "menyanyi", "menari", "tertawa", "menangis", "datang", "pergi", "pulang", "masuk", "keluar",
        "naik", "turun", "buka", "tutup", "mulai", "selesai", "cari", "temu", "beli", "jual",
        "buat", "rusak", "benar", "salah", "ya", "tidak", "tolong", "terima", "kasih", "sama",
        "pagi", "siang", "sore", "malam", "hari", "minggu", "bulan", "tahun", "sekarang", "nanti",
        "kemarin", "besok", "di sini", "di sana", "kapan", "mengapa", "bagaimana", "apa", "siapa", "mana",
        "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh",
         "apel", "jeruk", "pisang", "mangga", "stroberi", "naga", "durian", "rambutan", "salak", "jambu",
         "wortel", "bayam", "kangkung", "tomat", "cabai", "bawang", "jahe", "kunyit", "lengkuas", "sereh",
         "ayam", "sapi", "kambing", "ikan", "udang", "cumi", "telur", "susu", "keju", "roti",
         "nasi", "mie", "goreng", "rebus", "bakar", "sate", "sup", "soto", "rendang", "gulai",
         "sambal", "kerupuk", "kopi", "teh", "jus", "sirup", "es", "panas", "hangat", "dingin",
         "merah", "biru", "hijau", "kuning", "putih", "hitam", "cokelat", "ungu", "pink", "abu-abu",
         "indah", "jelek", "bagus", "jelek", "bersih", "kotor", "terang", "gelap", "kaya", "miskin",
         "senang", "sedih", "ramai", "sepi", "jauh", "dekat", "depan", "belakang", "atas", "bawah",
         "dalam", "luar", "kiri", "kanan", "tengah", "pinggir", "pojok", "bundar", "persegi", "segitiga",
         "garis", "titik", "lingkaran", "kotak", "bola", "kubus", "kaca", "kayu", "batu", "pasir",
         "tanah", "air", "api", "udara", "asap", "abu", "debu", "lumpur", "karat", "lumut",
         "lampu", "listrik", "radio", "televisi", "komputer", "ponsel", "internet", "program", "kode", "desain",
         "warna", "suara", "gambar", "video", "musik", "lagu", "film", "baca", "tulis", "hitung",
         "gambar", "lukis", "ukir", "tenun", "jahit", "masak", "bakar", "goreng", "rebus", "kukus",
         "jemur", "angin", "angin", "gelombang", "ombak", "pasang", "surut", "pantai", "pulau", "tanjung",
         "teluk", "selat", "samudra", "benua", "negara", "provinsi", "kabupaten", "kecamatan", "desa", "kota",
         "pusat", "pinggir", "utara", "selatan", "timur", "barat", "tenggara", "timur", "laut", "darat"
    ];
    const wordListLength = indonesianWords.length;


    if (passphraseWordCountInput && passphraseWordCountValueDisplay && wordSeparatorSelect && capitalizeWords && addNumber && generatePassphraseBtn && generatedPassphraseInput && copyPassphraseBtn) {

         // Update display value when slider moves
         passphraseWordCountInput.addEventListener('input', () => {
             passphraseWordCountValueDisplay.textContent = passphraseWordCountInput.value;
         });


        // Function to generate passphrase
        function generatePassphrase() {
            const wordCount = parseInt(passphraseWordCountInput.value, 10);
            const separator = wordSeparatorSelect.value;
            const doRandomCapitalize = capitalizeWords.checked; // Use a clearer variable name
            const doAddNumber = addNumber.checked; // Use a clearer variable name

            // Validation
            if (wordCount < parseInt(passphraseWordCountInput.min, 10)) {
                alert(`Jumlah kata minimal untuk passphrase adalah ${passphraseWordCountInput.min}.`);
                return '';
            }
            if (wordListLength === 0) {
                 alert('Daftar kata Bahasa Indonesia tidak ditemukan atau kosong.');
                 return '';
            }

            const passphraseWords = [];
            // Use cryptoRandom helper for word indices
            for (let i = 0; i < wordCount; i++) {
                 const randomIndex = cryptoRandom(wordListLength);
                 let word = indonesianWords[randomIndex];

                 // Apply random capitalization per word IF doRandomCapitalize is checked
                 if (doRandomCapitalize && cryptoRandom(2) === 1) { // 50% chance per word
                      word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                 } else {
                     // Ensure lowercase if not capitalized
                     word = word.toLowerCase();
                 }
                 passphraseWords.push(word);
            }

            // Add random number if checked
            if (doAddNumber) {
                 // Generate a random number (e.g., 2-4 digits, 10-9999)
                 // Let's use 3-4 digits for slightly better complexity
                 const randomNumber = 100 + cryptoRandom(9900); // Range 100-9999

                 // Choose a random position to insert the number within the words array (including before the first word or after the last)
                 // Array length is wordCount. Valid indices for splice insertion are 0 to wordCount.
                 const insertIndex = cryptoRandom(wordCount + 1);

                 // Insert the number (as a string) at the random index
                 passphraseWords.splice(insertIndex, 0, randomNumber.toString());
             }


             // Join the final array (which might now include a number string) with the selected separator
            const passphrase = passphraseWords.join(separator);


            return passphrase;
        }


         // Event listener for generate button
        generatePassphraseBtn.addEventListener('click', () => {
            const passphrase = generatePassphrase();
            if (passphrase) {
                generatedPassphraseInput.value = passphrase;
            }
        });

         // Event listener for copy button
         copyPassphraseBtn.addEventListener('click', () => {
            const passphrase = generatedPassphraseInput.value;
            if (passphrase) {
                navigator.clipboard.writeText(passphrase)
                    .then(() => {
                         const originalHtml = copyPassphraseBtn.innerHTML; // Store full HTML including text
                         copyPassphraseBtn.innerHTML = '<i class="bi bi-check-lg"></i> Tersalin!'; // Icon only
                         setTimeout(() => {
                              copyPassphraseBtn.innerHTML = originalHtml; // Restore full HTML
                         }, 2000);
                    })
                    .catch(err => {
                        console.error('Gagal menyalin passphrase:', err);
                        alert('Gagal menyalin passphrase. Silakan salin manual.');
                    });
                } else {
                    alert('Tidak ada passphrase yang bisa disalin.');
                }
            });

         // Initial display of slider value
         passphraseWordCountValueDisplay.textContent = passphraseWordCountInput.value;


    } else {
        console.error("Elements for Passphrase Generator not found.");
    }


}); // End DOMContentLoaded