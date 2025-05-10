// script.js
// Main JavaScript logic for Password Toolkit

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap Tabs
    const triggerTabList = document.querySelectorAll('#featureTabs button');
    triggerTabList.forEach(triggerEl => {
      const tabTrigger = new bootstrap.Tab(triggerEl);

      triggerEl.addEventListener('click', event => {
        event.preventDefault();
        tabTrigger.show();
      });
    });

    // --- Helper Functions ---

    /**
     * Securely generate a random integer within a range [min, max].
     * Uses window.crypto.getRandomValues to generate cryptographically secure random numbers.
     * Handles potential modulo bias.
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {number} A secure random integer.
     */
    function secureRandomInt(min, max) {
        const range = max - min + 1;
        if (range <= 0) {
             console.error("Invalid range for secureRandomInt");
             return min; // Or handle error appropriately
        }

        // Determine the number of bytes needed to cover the range
        let bytesNeeded = Math.ceil(Math.log2(range) / 8);
        // Determine the largest possible value that fits within those bytes
        let maxUintValue = Math.pow(256, bytesNeeded) - 1;
        // Calculate the largest value that is a multiple of the range and fits within bytesNeeded
        let maxValidValue = Math.floor(maxUintValue / range) * range;

        let randomBytes = new Uint8Array(bytesNeeded);
        let randomNumber;

        // Keep generating random numbers until we get one within the valid range to avoid bias
        do {
            window.crypto.getRandomValues(randomBytes);
            randomNumber = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                randomNumber = (randomNumber << 8) + randomBytes[i];
            }
        } while (randomNumber >= maxValidValue);

        // Map the valid random number to the desired range
        return min + (randomNumber % range);
    }

    /**
     * Securely shuffle an array using the Fisher-Yates (Knuth) algorithm.
     * Uses secureRandomInt for randomness.
     * @param {Array} array - The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    function secureShuffleArray(array) {
        const shuffledArray = [...array]; // Create a copy to avoid modifying original
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            // Use secureRandomInt to get an index from 0 to i
            const j = secureRandomInt(0, i);
            // Swap elements
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    /**
     * Copies text to the clipboard.
     * Uses the Clipboard API. Requires user interaction (e.g., button click).
     * @param {string} text - The text to copy.
     * @returns {Promise<void>} A promise that resolves when the text is copied.
     */
    async function copyToClipboard(text) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            console.warn("Clipboard API not available.");
            alert('Browser Anda tidak mendukung salin ke clipboard.');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            // console.log('Text copied to clipboard'); // Optional feedback
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Gagal menyalin teks ke clipboard.');
        }
    }

    /**
     * Pastes text from the clipboard into an input field.
     * Uses the Clipboard API. Requires user interaction (e.g., button click).
     * @param {HTMLInputElement} inputElement - The input element to paste into.
     * @returns {Promise<string|null>} A promise that resolves with the pasted text or null if failed.
     */
    async function pasteFromClipboard(inputElement) {
         if (!navigator.clipboard || !navigator.clipboard.readText) {
              console.warn("Clipboard API not available for reading.");
              alert('Browser Anda tidak mendukung tempel dari clipboard.');
              return null;
         }
         try {
              const text = await navigator.clipboard.readText();
              // Basic validation: ensure it's primarily string content
              // Clipboard API readText already returns a string.
              // We can add more complex checks if needed, but for a password field,
              // pasting potentially complex strings is expected.
              // Limit is handled by maxlength attribute on input.
              inputElement.value = text.substring(0, inputElement.maxLength); // Apply maxlength explicitly on paste just in case
              // Trigger input event manually so listeners (like strength checker) react
              const event = new Event('input', { bubbles: true });
              inputElement.dispatchEvent(event);
              // console.log('Text pasted from clipboard'); // Optional feedback
              return text;
         } catch (err) {
              console.error('Failed to paste text: ', err);
               // This often happens if permission is denied or clipboard is empty/non-text
              alert('Gagal menempelkan teks dari clipboard. Pastikan Anda mengizinkan akses clipboard dan clipboard berisi teks.');
              return null;
         }
    }


    // --- Password Strength Checker ---
    const passwordInput = document.getElementById('passwordInput');
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthFeedback = document.getElementById('strengthFeedback');
    const pastePasswordBtn = document.getElementById('pastePasswordBtn');
    const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
    const togglePasswordVisibilityIcon = togglePasswordVisibilityBtn ? togglePasswordVisibilityBtn.querySelector('i') : null;


    // Function to update strength display
    function updateStrengthDisplay() {
        const password = passwordInput.value;

        if (password.length === 0) {
            // Reset state
            strengthIndicator.style.width = '0%';
            strengthIndicator.className = 'progress-bar'; // Reset classes
            strengthLabel.textContent = 'Belum Diperiksa';
            strengthIndicator.setAttribute('aria-valuenow', 0);
            strengthFeedback.style.display = 'none';
            strengthFeedback.innerHTML = '';
            return;
        }

        // Use zxcvbn to estimate strength
        // zxcvbn scores: 0 (terrible) -> 4 (excellent)
        // Add common names/data as options for zxcvbn to check against (optional but improves accuracy)
        // For this example, we won't pass user-specific data, relying on zxcvbn's built-in dictionaries.
        const result = zxcvbn(password);
        const score = result.score;
        // const crackTimeDisplay = result.crack_times_display.online_throttling_100_per_hour; // Example: estimate against throttled online attacks
         const crackTimeDisplay = result.crack_times_display.offline_slow_hashing_1e4_per_second; // Often more relevant estimate


        // Determine strength level and color based on score
        let strengthText = 'Sangat Lemah';
        let indicatorClass = 'strength-score-0'; // See style.css for colors

        if (score === 1) {
            strengthText = 'Lemah';
            indicatorClass = 'strength-score-1';
        } else if (score === 2) {
            strengthText = 'Sedang';
            indicatorClass = 'strength-score-2';
        } else if (score === 3) {
            strengthText = 'Kuat';
            indicatorClass = 'strength-score-3';
        } else if (score === 4) {
            strengthText = 'Sangat Kuat';
            indicatorClass = 'strength-score-4';
        }

        // Update UI
        strengthIndicator.style.width = ((score + 1) / 5) * 100 + '%'; // Scale 0-4 score to 0-100% width
        strengthIndicator.className = 'progress-bar ' + indicatorClass; // Apply color class
        strengthLabel.textContent = strengthText;
        strengthIndicator.setAttribute('aria-valuenow', score);


        // Display feedback
        let feedbackHTML = `<strong>Estimasi Waktu Tebakan Offline (Lambat):</strong> ${crackTimeDisplay}<br>`;

        // Add zxcvbn suggestions if available
        if (result.feedback && result.feedback.suggestions && result.feedback.suggestions.length > 0) {
             feedbackHTML += '<strong>Saran:</strong><ul>';
             result.feedback.suggestions.forEach(suggestion => {
                  feedbackHTML += `<li>${suggestion}</li>`;
             });
             feedbackHTML += '</ul>';
        } else if (result.feedback && result.feedback.warning) {
             feedbackHTML += `<strong>Peringatan:</strong> ${result.feedback.warning}`;
        } else {
            // Default message if no specific feedback from zxcvbn
            if (score < 4) {
                 feedbackHTML += '<strong>Saran Umum:</strong> Gunakan kombinasi huruf besar/kecil, angka, dan simbol. Tingkatkan panjang password. Hindari kata-kata umum atau pola yang mudah ditebak.';
            } else {
                 feedbackHTML += 'Password ini terlihat sangat kuat. Pertimbangkan untuk menggunakan pengelola password.';
            }
        }


        strengthFeedback.innerHTML = feedbackHTML;
        strengthFeedback.style.display = 'block';
    }


    if (passwordInput && strengthIndicator && strengthLabel && strengthFeedback && pastePasswordBtn && togglePasswordVisibilityBtn && typeof zxcvbn !== 'undefined') {
        // Event listener for input changes (typing or pasting via keyboard)
        passwordInput.addEventListener('input', updateStrengthDisplay);

        // Event listener for Paste button
        pastePasswordBtn.addEventListener('click', () => {
             pasteFromClipboard(passwordInput);
             // updateStrengthDisplay is triggered by the 'input' event dispatched by pasteFromClipboard
        });

        // Event listener for Visibility toggle button
        togglePasswordVisibilityBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle icon
            if (type === 'text') {
                togglePasswordVisibilityIcon.classList.remove('bi-eye-slash');
                togglePasswordVisibilityIcon.classList.add('bi-eye');
                 togglePasswordVisibilityBtn.setAttribute('title', 'Sembunyikan Password');
            } else {
                togglePasswordVisibilityIcon.classList.remove('bi-eye');
                togglePasswordVisibilityIcon.classList.add('bi-eye-slash');
                 togglePasswordVisibilityBtn.setAttribute('title', 'Tampilkan Password');
            }
        });

         // Initial check if there's a default value or autocompleted value
         // setTimeout to allow browser autofill to complete
         setTimeout(updateStrengthDisplay, 100);

    } else {
         console.error("Password Strength Checker elements not found or zxcvbn not loaded.");
         if (typeof zxcvbn === 'undefined') {
              alert("Library zxcvbn gagal dimuat. Pemeriksa kekuatan password mungkin tidak berfungsi.");
         }
    }


    // --- Password Generator ---
    const passwordLengthInput = document.getElementById('passwordLength');
    const passwordLengthValueSpan = document.getElementById('passwordLengthValue'); // Span to display value
    const includeUppercaseCheckbox = document.getElementById('includeUppercase');
    const includeLowercaseCheckbox = document.getElementById('includeLowercase');
    const includeNumbersCheckbox = document.getElementById('includeNumbers');
    const includeSymbolsCheckbox = document.getElementById('includeSymbols');
    const generatedPasswordInput = document.getElementById('generatedPassword');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');
    const refreshPasswordBtn = document.getElementById('refreshPasswordBtn');
    const generatorAlert = document.getElementById('generatorAlert');

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?`~'; // Extended common symbols

    // Function to generate password
    function generatePassword() {
        const length = parseInt(passwordLengthInput.value, 10);
        const includeUppercase = includeUppercaseCheckbox.checked;
        const includeLowercase = includeLowercaseCheckbox.checked;
        const includeNumbers = includeNumbersCheckbox.checked;
        const includeSymbols = includeSymbolsCheckbox.checked;

        let characterPool = '';
        let guaranteedChars = []; // Array to hold at least one of each selected type

        if (includeUppercase) {
            characterPool += uppercaseChars;
            guaranteedChars.push(uppercaseChars[secureRandomInt(0, uppercaseChars.length - 1)]);
        }
        if (includeLowercase) {
            characterPool += lowercaseChars;
            guaranteedChars.push(lowercaseChars[secureRandomInt(0, lowercaseChars.length - 1)]);
        }
        if (includeNumbers) {
            characterPool += numberChars;
            guaranteedChars.push(numberChars[secureRandomInt(0, numberChars.length - 1)]);
        }
        if (includeSymbols) {
            characterPool += symbolChars;
            guaranteedChars.push(symbolChars[secureRandomInt(0, symbolChars.length - 1)]);
        }

        // Hide alert if it was showing
        generatorAlert.style.display = 'none';

        // Check if any character type is selected
        if (characterPool === '') {
            generatedPasswordInput.value = '';
             generatorAlert.textContent = 'Mohon pilih setidaknya satu jenis karakter.';
             generatorAlert.style.display = 'block';
            return;
        }

        // Adjust length if it's less than the number of required character types
        let actualLength = Math.max(length, guaranteedChars.length);
         if (actualLength > parseInt(passwordLengthInput.max, 10)) {
             actualLength = parseInt(passwordLengthInput.max, 10);
         }
         // Update slider value if it was less than guaranteed chars length (only if user input)
         // For automatic generation on slider/checkbox change, this adjustment ensures minimum length
         if (length < guaranteedChars.length) {
             generatorAlert.textContent = `Panjang password disesuaikan menjadi ${actualLength} untuk menyertakan semua jenis karakter yang dipilih.`;
             generatorAlert.style.display = 'block';
             passwordLengthInput.value = actualLength; // Update slider position
             passwordLengthValueSpan.textContent = actualLength; // Update displayed value
         }


        let password = '';
        // Add guaranteed characters first
        password += guaranteedChars.join('');

        // Fill the rest of the length with random characters from the pool
        const remainingLength = actualLength - guaranteedChars.length;

        for (let i = 0; i < remainingLength; i++) {
             const randomIndex = secureRandomInt(0, characterPool.length - 1);
             password += characterPool[randomIndex];
        }

         // Shuffle the password to mix the guaranteed characters
        password = secureShuffleArray(password.split('')).join('');

        generatedPasswordInput.value = password;
    }

    // Add event listeners for generator
    if (passwordLengthInput && passwordLengthValueSpan && includeUppercaseCheckbox && includeLowercaseCheckbox && includeNumbersCheckbox && includeSymbolsCheckbox && generatedPasswordInput && copyPasswordBtn && refreshPasswordBtn && generatorAlert) {

        // Update displayed length value when slider moves and regenerate
        passwordLengthInput.addEventListener('input', () => {
             passwordLengthValueSpan.textContent = passwordLengthInput.value;
             generatePassword(); // Regenerate automatically on slider change
        });

        // Regenerate when character type checkboxes change
         [includeUppercaseCheckbox, includeLowercaseCheckbox, includeNumbersCheckbox, includeSymbolsCheckbox].forEach(checkbox => {
             checkbox.addEventListener('change', generatePassword);
         });

        // Regenerate on button click
        refreshPasswordBtn.addEventListener('click', generatePassword);

        // Copy to clipboard
        copyPasswordBtn.addEventListener('click', async () => {
            const textToCopy = generatedPasswordInput.value;
            if (textToCopy) {
                await copyToClipboard(textToCopy);
            }
        });

        // Generate initial password on load
         passwordLengthValueSpan.textContent = passwordLengthInput.value; // Set initial value display
        generatePassword(); // Generate initial password

    } else {
         console.error("Password Generator elements not found.");
    }


    // --- Passphrase Generator ---
    const passphraseWordCountInput = document.getElementById('passphraseWordCount');
    const passphraseWordCountValueSpan = document.getElementById('passphraseWordCountValue'); // Span to display value
    const passphraseHyphensCheckbox = document.getElementById('passphraseHyphens'); // Keep this reference, maybe needed if we add it back as an option, but replaced by select
    const passphraseCapitalizeCheckbox = document.getElementById('passphraseCapitalize');
    const passphraseAddNumberCheckbox = document.getElementById('passphraseAddNumber');
    const passphraseSeparatorSelect = document.getElementById('passphraseSeparator'); // New select element
    const generatedPassphraseInput = document.getElementById('generatedPassphrase');
    const copyPassphraseBtn = document.getElementById('copyPassphraseBtn');
    const refreshPassphraseBtn = document.getElementById('refreshPassphraseBtn');
    const passphraseAlert = document.getElementById('passphraseAlert');

    // Check if Indonesian word list is loaded (from id-words.js)
    const wordList = window.indonesianWords; // Access the global variable

    if (!wordList || wordList.length < 100) { // Basic check for minimum list size
         console.error("Indonesian word list not loaded or too small.");
         if (passphraseAlert) {
             passphraseAlert.textContent = "Daftar kata Bahasa Indonesia belum dimuat atau terlalu kecil (" + (wordList ? wordList.length : 0) + " kata). Generator passphrase dinonaktifkan.";
             passphraseAlert.style.display = 'block';
         }
         // Disable passphrase generator UI if data is missing
         if (passphraseWordCountInput) passphraseWordCountInput.disabled = true;
         // if (passphraseHyphensCheckbox) passphraseHyphensCheckbox.disabled = true; // This checkbox is removed
         if (passphraseCapitalizeCheckbox) passphraseCapitalizeCheckbox.disabled = true;
         if (passphraseAddNumberCheckbox) passphraseAddNumberCheckbox.disabled = true;
         if (passphraseSeparatorSelect) passphraseSeparatorSelect.disabled = true;
         if (refreshPassphraseBtn) refreshPassphraseBtn.disabled = true;
         if (copyPassphraseBtn) copyPassphraseBtn.disabled = true;
    }

    // Function to generate passphrase
    function generatePassphrase() {
        if (!wordList || wordList.length < 100) {
             console.error("Word list not available for passphrase generation.");
             return; // Exit if word list is not ready/sufficient
        }

        const numWords = parseInt(passphraseWordCountInput.value, 10);
        const capitalize = passphraseCapitalizeCheckbox.checked;
        const addNumber = passphraseAddNumberCheckbox.checked;
        const separator = passphraseSeparatorSelect.value; // Get selected separator

        // Ensure minimum word count
        if (numWords < 5) {
             // This should be handled by slider's min attribute, but double check
             passphraseWordCountInput.value = 5;
             passphraseWordCountValueSpan.textContent = 5;
        }
        passphraseAlert.style.display = 'none'; // Hide alert if it was showing


        let selectedWords = [];
        // Select random words using secureRandomInt
        // Allow repetition for simplicity and potentially larger keyspace with smaller word lists
        for (let i = 0; i < numWords; i++) {
            const randomIndex = secureRandomInt(0, wordList.length - 1);
            selectedWords.push(wordList[randomIndex]);
        }

        // Apply transformations
        let passphraseParts = selectedWords.map(word => {
            // Ensure lowercase if not capitalizing to avoid mixed case from source list
            const baseWord = word.toLowerCase();
            if (capitalize) {
                return baseWord.charAt(0).toUpperCase() + baseWord.slice(1);
            }
            return baseWord;
        });

        // Add number if requested
        if (addNumber) {
            // Generate a random number (e.g., 0-9999) - adjust range as needed
            const randomNumber = secureRandomInt(0, 9999); // Use a slightly larger range for numbers
             const numberString = String(randomNumber);

            // Insert the number randomly within the passphrase parts array
            // Choose a random index to insert BEFORE the element at that index
            // Index can be 0 (start) up to passphraseParts.length (end)
            const insertionIndex = secureRandomInt(0, passphraseParts.length);

            passphraseParts.splice(insertionIndex, 0, numberString);
        }

        const finalPassphrase = passphraseParts.join(separator);
        generatedPassphraseInput.value = finalPassphrase;
         // Ensure passphrase does not exceed maxlength set in HTML, although with slider ranges it's unlikely
         generatedPassphraseInput.value = finalPassphrase.substring(0, generatedPassphraseInput.maxLength);

    }


     // Add event listeners for passphrase generator
    if (passphraseWordCountInput && passphraseWordCountValueSpan && passphraseCapitalizeCheckbox && passphraseAddNumberCheckbox && passphraseSeparatorSelect && generatedPassphraseInput && copyPassphraseBtn && refreshPassphraseBtn && wordList && wordList.length >= 100) {

        // Update displayed word count value when slider moves and regenerate
        passphraseWordCountInput.addEventListener('input', () => {
             passphraseWordCountValueSpan.textContent = passphraseWordCountInput.value;
             generatePassphrase(); // Regenerate automatically on slider change
        });

        // Regenerate when options change (capitalize, add number, separator)
         [passphraseCapitalizeCheckbox, passphraseAddNumberCheckbox, passphraseSeparatorSelect].forEach(element => {
             element.addEventListener('change', generatePassphrase);
         });

        // Regenerate on button click
        refreshPassphraseBtn.addEventListener('click', generatePassphrase);

        // Copy to clipboard
        copyPassphraseBtn.addEventListener('click', async () => {
            const textToCopy = generatedPassphraseInput.value;
            if (textToCopy) {
                await copyToClipboard(textToCopy);
            }
        });

        // Generate initial passphrase on load
         passphraseWordCountValueSpan.textContent = passphraseWordCountInput.value; // Set initial value display
        generatePassphrase(); // Generate initial passphrase

    } else {
        if (!wordList || wordList.length < 100) {
            console.warn("Passphrase Generator disabled due to missing/small word list.");
            // Alert message already set above
        } else {
             console.error("Passphrase Generator elements not found.");
        }
    }

    // --- Initial Setup ---
    // No need for separate initial calls here, they are handled within each section's event listeners
    // triggered by the initial state or DOMContentLoaded.

});