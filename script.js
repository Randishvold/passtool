// script.js
// Main JavaScript logic for Password Toolkit

// --- Constants ---
// Define key parameters as constants for easier management
const MIN_PASSWORD_LENGTH = 12;
const DEFAULT_PASSWORD_LENGTH = 16;
const MAX_PASSWORD_LENGTH = 64; // Practical max for slider
const PASSWORD_INPUT_MAX_LENGTH = 128; // Actual input max length

const MIN_PASSPHRASE_WORDS = 5;
const DEFAULT_PASSPHRASE_WORDS = 5;
const MAX_PASSPHRASE_WORDS = 20; // Practical max for slider
const PASSPHRASE_INPUT_MAX_LENGTH = 256; // Actual input max length

const MIN_UNIQUE_WORDS_FOR_PASSPHRASE = 100; // Minimum size of the unique word list

const PASSPHRASE_NUMBER_RANGE = 9999; // Max value for added number (0-9999)

const CLIPBOARD_MESSAGE_DURATION = 3000; // Duration in ms for clipboard message

const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
const numberChars = '0123456789';
// Expanded symbol list for variety and security
const symbolChars = '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?`~';

// List of possible separators for passphrase (must match select options values)
const passphraseSeparators = {
    ' ': 'Spasi',
    '-': 'Tanda Hubung (-)',
    '_': 'Garis Bawah (_)',
    '.': 'Titik (.)',
    ',': 'Koma (,)',
    '/': 'Garis Miring (/)',
    '+': 'Plus (+)',
    '=': 'Sama Dengan (=)',
    '!': 'Tanda Seru (!)',
    '@': 'At (@)',
    '#': 'Pagar (#)',
    '$': 'Dolar ($)',
    '%': 'Persen (%)',
    '&': 'Ampersand (&)',
    '*': 'Bintang (*)'
};


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
        if (min > max) {
            throw new Error("Min cannot be greater than max");
        }
        const range = max - min + 1;
        if (range === 1) { // Handle case where min equals max
            return min;
        }

        // Determine the number of bytes needed to cover the range
        let bytesNeeded = Math.ceil(Math.log2(range) / 8);
        if (bytesNeeded <= 0) bytesNeeded = 1; // Ensure at least one byte

        // Determine the largest possible value that fits within those bytes
        let maxUintValue = Math.pow(256, bytesNeeded) - 1;
        // Calculate the largest value that is a multiple of the range and fits within maxUintValue
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
        // Create a copy to avoid modifying original array (especially important for word list if we needed uniqueness across calls)
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            // Use secureRandomInt to get an index from 0 to i (inclusive)
            const j = secureRandomInt(0, i);
            // Swap elements
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    /**
     * Copies text to the clipboard and shows a temporary message.
     * @param {string} text - The text to copy.
     * @param {HTMLElement} messageElement - The element to display the temporary message.
     * @returns {Promise<void>}
     */
    async function copyToClipboard(text, messageElement) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            console.warn("Clipboard API not available.");
            if (messageElement) {
                messageElement.textContent = 'Browser Anda tidak mendukung salin ke clipboard.';
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
            } else {
                 alert('Browser Anda tidak mendukung salin ke clipboard.');
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            // Show success message
            if (messageElement) {
                messageElement.textContent = 'Tersalin ke clipboard!';
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Show error message
            if (messageElement) {
                messageElement.textContent = 'Gagal menyalin ke clipboard.';
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
            } else {
                 alert('Gagal menyalin teks ke clipboard.');
            }
        }
    }

     /**
      * Pastes text from the clipboard into an input field and triggers an input event.
      * @param {HTMLInputElement} inputElement - The input element to paste into.
      * @param {HTMLElement} messageElement - The element to display the temporary message.
      * @returns {Promise<void>}
      */
    async function pasteFromClipboard(inputElement, messageElement) {
         if (!navigator.clipboard || !navigator.clipboard.readText) {
              console.warn("Clipboard API not available for reading.");
              if (messageElement) {
                 messageElement.textContent = 'Browser Anda tidak mendukung tempel dari clipboard.';
                 messageElement.style.display = 'block';
                 setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
             } else {
                  alert('Browser Anda tidak mendukung tempel dari clipboard.');
             }
              return;
         }
         try {
              const text = await navigator.clipboard.readText();
              // Apply maxlength explicitly on paste
              const pastedText = text.substring(0, inputElement.maxLength || text.length); // Use input's maxlength if set
              inputElement.value = pastedText;

              // Trigger input event manually so listeners (like strength checker) react
              const event = new Event('input', { bubbles: true });
              inputElement.dispatchEvent(event);

               // Show success message
              if (messageElement) {
                  messageElement.textContent = 'Teks ditempel dari clipboard.';
                  messageElement.style.display = 'block';
                  setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
              }

         } catch (err) {
              console.error('Failed to paste text: ', err);
               // This often happens if permission is denied or clipboard is empty/non-text
               if (messageElement) {
                 messageElement.textContent = 'Gagal menempelkan teks. Pastikan clipboard berisi teks.';
                 messageElement.style.display = 'block';
                 setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION);
             } else {
                  alert('Gagal menempelkan teks dari clipboard. Pastikan Anda mengizinkan akses clipboard dan clipboard berisi teks.');
             }
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
    const strengthClipboardMessage = document.getElementById('strengthClipboardMessage');


    // Function to update strength display
    function updateStrengthDisplay() {
        const password = passwordInput.value;

        if (password.length === 0) {
            // Reset state if input is empty
            strengthIndicator.style.width = '0%';
            strengthIndicator.className = 'progress-bar'; // Reset classes
            strengthLabel.textContent = 'Belum Diperiksa';
            strengthIndicator.setAttribute('aria-valuenow', 0);
            strengthFeedback.style.display = 'none';
            strengthFeedback.innerHTML = '';
            return;
        }

        // Use zxcvbn to estimate strength
        // Passing user_inputs can improve accuracy if you have known user data,
        // but for a client-side tool without user login, this is usually omitted.
        const result = zxcvbn(password); // zxcvbn scores: 0 (terrible) -> 4 (excellent)
        const score = result.score;
        // Use offline slow hashing estimate - generally more realistic for attacker scenarios
        const crackTimeDisplay = result.crack_times_display.offline_slow_hashing_1e4_per_second;

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
        // Scale 0-4 score to 0-100% width. Add +1 to score to make 0 score visible (e.g., 20%)
        strengthIndicator.style.width = ((score + 1) / 5) * 100 + '%';
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
                 feedbackHTML += 'Password ini terlihat sangat kuat.';
            }
        }

         // Basic validation feedback (redundant if zxcvbn already covers, but can be explicit)
         // let customFeedback = [];
         // if (password.length < MIN_PASSWORD_LENGTH) {
         //      customFeedback.push(`Panjang password sebaiknya minimal ${MIN_PASSWORD_LENGTH} karakter.`);
         // }
         // if (customFeedback.length > 0) {
         //     feedbackHTML += '<strong>Validasi Umum Tambahan:</strong><ul>';
         //     customFeedback.forEach(item => {
         //         feedbackHTML += `<li>${item}</li>`;
         //     });
         //     feedbackHTML += '</ul>';
         // }


        strengthFeedback.innerHTML = feedbackHTML;
        strengthFeedback.style.display = 'block';
    }


    if (passwordInput && strengthIndicator && strengthLabel && strengthFeedback && pastePasswordBtn && togglePasswordVisibilityBtn && strengthClipboardMessage && typeof zxcvbn !== 'undefined') {

        // Limit input length via JS as a safeguard, although maxlength attribute is primary
         passwordInput.maxLength = PASSWORD_INPUT_MAX_LENGTH;


        // Event listener for input changes (typing or pasting via keyboard)
        passwordInput.addEventListener('input', updateStrengthDisplay);

        // Event listener for Paste button
        pastePasswordBtn.addEventListener('click', () => {
             pasteFromClipboard(passwordInput, strengthClipboardMessage);
             // updateStrengthDisplay is triggered by the 'input' event dispatched by pasteFromClipboard
        });

        // Event listener for Visibility toggle button
        togglePasswordVisibilityBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle icon and title
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
         // Use a small timeout to allow browser autofill to complete before checking
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
    const generatorClipboardMessage = document.getElementById('generatorClipboardMessage');


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
            // Select a random char securely
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

        // --- Bug Fix: Handle empty character pool ---
        if (characterPool.length === 0) {
            generatedPasswordInput.value = '';
             generatorAlert.textContent = 'Mohon pilih setidaknya satu jenis karakter.';
             generatorAlert.style.display = 'block';
            return;
        } else {
             generatorAlert.style.display = 'none'; // Hide alert if characters are selected
        }

        // --- Bug Fix: Slider min value vs. guaranteed chars ---
        // Calculate the minimum length required by selected character types
        const minRequiredLength = guaranteedChars.length;

        // Ensure the slider's minimum attribute reflects the required minimum
        // This prevents the user from setting a length lower than required *after* checking boxes
        // Also visually update the slider value if it's currently below the minimum
        if (passwordLengthInput.min != minRequiredLength) { // Only update if it changes
             passwordLengthInput.min = minRequiredLength;
        }
         // If the current value is less than the new minimum, update the value as well
        if (length < minRequiredLength) {
             passwordLengthInput.value = minRequiredLength;
             passwordLengthValueSpan.textContent = minRequiredLength; // Update displayed value
             // Recalculate length based on potentially updated input value
             const updatedLength = parseInt(passwordLengthInput.value, 10);
             console.warn(`Password length adjusted from ${length} to ${updatedLength} to meet minimum character type requirements.`);
             // Display a temporary message about the adjustment (optional)
        }


        // Use the potentially updated length from the input after adjustments
        const actualLength = parseInt(passwordLengthInput.value, 10);


        let password = '';
        // Add guaranteed characters first, then shuffle
        // Shuffling guaranteed chars right away and mixing into pool helps distribution
        const shuffledGuaranteed = secureShuffleArray(guaranteedChars);
        password += shuffledGuaranteed.join('');


        // Fill the rest of the length with random characters from the pool
        const remainingLength = actualLength - shuffledGuaranteed.length;

        for (let i = 0; i < remainingLength; i++) {
             // Select a random index from the character pool securely
             const randomIndex = secureRandomInt(0, characterPool.length - 1);
             password += characterPool[randomIndex];
        }

         // Final shuffle of the entire password string
        password = secureShuffleArray(password.split('')).join('');

        generatedPasswordInput.value = password;
    }

    // Add event listeners for generator
    if (passwordLengthInput && passwordLengthValueSpan && includeUppercaseCheckbox && includeLowercaseCheckbox && includeNumbersCheckbox && includeSymbolsCheckbox && generatedPasswordInput && copyPasswordBtn && refreshPasswordBtn && generatorAlert && generatorClipboardMessage) {

        // Update displayed length value when slider moves AND regenerate
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
                await copyToClipboard(textToCopy, generatorClipboardMessage);
            }
        });

        // Initialize slider min/max and value span text
         passwordLengthInput.min = MIN_PASSWORD_LENGTH; // Set initial min
         passwordLengthInput.max = MAX_PASSWORD_LENGTH; // Set initial max
         passwordLengthInput.value = DEFAULT_PASSWORD_LENGTH; // Set initial default value
         passwordLengthValueSpan.textContent = passwordLengthInput.value; // Set initial value display

        // Generate initial password on load
        generatePassword(); // Trigger initial generation which will also set the correct min slider value

    } else {
         console.error("Password Generator elements not found.");
    }


    // --- Passphrase Generator ---
    const passphraseWordCountInput = document.getElementById('passphraseWordCount');
    const passphraseWordCountValueSpan = document.getElementById('passphraseWordCountValue'); // Span to display value
    const passphraseCapitalizeCheckbox = document.getElementById('passphraseCapitalize');
    const passphraseAddNumberCheckbox = document.getElementById('passphraseAddNumber');
    const passphraseSeparatorSelect = document.getElementById('passphraseSeparator'); // Select element
    const generatedPassphraseInput = document.getElementById('generatedPassphrase');
    const copyPassphraseBtn = document.getElementById('copyPassphraseBtn');
    const refreshPassphraseBtn = document.getElementById('refreshPassphraseBtn');
    const passphraseAlert = document.getElementById('passphraseAlert');
    const passphraseClipboardMessage = document.getElementById('passphraseClipboardMessage');


    // Access the word list (assuming id-words.js loaded it as const indonesianWords)
    // SECURITY: Read the word list into a local variable once on load
    const localWordList = typeof indonesianWords !== 'undefined' ? indonesianWords : [];

    if (localWordList.length < MIN_UNIQUE_WORDS_FOR_PASSPHRASE) {
         console.error(`Indonesian word list too small. Found ${localWordList.length} unique words, need at least ${MIN_UNIQUE_WORDS_FOR_PASSPHRASE}.`);
         if (passphraseAlert) {
             passphraseAlert.textContent = `Daftar kata Bahasa Indonesia terlalu kecil (${localWordList.length} kata). Generator passphrase dinonaktifkan.`;
             passphraseAlert.style.display = 'block';
         }
         // Disable passphrase generator UI if data is missing or insufficient
         if (passphraseWordCountInput) passphraseWordCountInput.disabled = true;
         if (passphraseCapitalizeCheckbox) passphraseCapitalizeCheckbox.disabled = true;
         if (passphraseAddNumberCheckbox) passphraseAddphraseAddNumberCheckbox.disabled = true;
         if (passphraseSeparatorSelect) passphraseSeparatorSelect.disabled = true;
         if (refreshPassphraseBtn) refreshPassphraseBtn.disabled = true;
         if (copyPassphraseBtn) copyPassphraseBtn.disabled = true;

         // Exit setup if word list is not ready
         return;
    } else {
         // Word list is ready, populate separator select options (if not already done in HTML)
         // HTML already has options, so no need to populate here. Just ensure its enabled.
    }


    // Function to generate passphrase
    function generatePassphrase() {
        // Re-check word list availability just in case
        if (!localWordList || localWordList.length < MIN_UNIQUE_WORDS_FOR_PASSPHRASE) {
             console.error("Word list not available or too small for passphrase generation.");
             // Alert message is already shown during setup if needed
             generatedPassphraseInput.value = ''; // Clear output
             return;
        }

        const numWords = parseInt(passphraseWordCountInput.value, 10);
        const capitalize = passphraseCapitalizeCheckbox.checked;
        const addNumber = passphraseAddNumberCheckbox.checked;
        const separator = passphraseSeparatorSelect.value; // Get selected separator

        // Ensure minimum word count (handled by slider min attr and input listener)
        // if (numWords < MIN_PASSPHRASE_WORDS) { ... } // This is handled by the slider input event


        let selectedWords = [];
        // Select random words using secureRandomInt
        // Allow repetition for simplicity and potentially larger keyspace with smaller word lists
        for (let i = 0; i < numWords; i++) {
            const randomIndex = secureRandomInt(0, localWordList.length - 1);
            selectedWords.push(localWordList[randomIndex]);
        }

        // Apply transformations to selected words
        let passphraseParts = selectedWords.map(word => {
            // Ensure lowercase before capitalizing first letter
            const baseWord = word.toLowerCase();
            if (capitalize) {
                // Handle empty words from a malformed list, although unlikely with Set de-duplication
                 if (baseWord.length > 0) {
                     return baseWord.charAt(0).toUpperCase() + baseWord.slice(1);
                 }
                 return ''; // Return empty if word was empty
            }
            return baseWord;
        }).filter(part => part.length > 0); // Filter out any potential empty parts

        // Add number if requested
        if (addNumber) {
            // Generate a random number within the defined range
            const randomNumber = secureRandomInt(0, PASSPHRASE_NUMBER_RANGE);
            const numberString = String(randomNumber);

            // Insert the number randomly within the passphrase parts array
            // Choose a random index to insert BEFORE the element at that index
            // Index can be 0 (start) up to passphraseParts.length (end)
            const insertionIndex = secureRandomInt(0, passphraseParts.length);

            passphraseParts.splice(insertionIndex, 0, numberString);
        }

        const finalPassphrase = passphraseParts.join(separator);
        generatedPassphraseInput.value = finalPassphrase;
         // Ensure passphrase does not exceed maxlength set in HTML
         generatedPassphraseInput.value = finalPassphrase.substring(0, generatedPassphraseInput.maxLength);
    }


     // Add event listeners for passphrase generator
    if (passphraseWordCountInput && passphraseWordCountValueSpan && passphraseCapitalizeCheckbox && passphraseAddNumberCheckbox && passphraseSeparatorSelect && generatedPassphraseInput && copyPassphraseBtn && refreshPassphraseBtn && passphraseAlert && passphraseClipboardMessage) { // Ensure all elements exist AND word list is okay

        // Initialize slider min/max and value span text
         passphraseWordCountInput.min = MIN_PASSPHRASE_WORDS; // Set initial min
         passphraseWordCountInput.max = MAX_PASSPHRASE_WORDS; // Set initial max
         passphraseWordCountInput.value = DEFAULT_PASSPHRASE_WORDS; // Set initial default value
         passphraseWordCountValueSpan.textContent = passphraseWordCountInput.value; // Set initial value display

        // Update displayed word count value when slider moves AND regenerate
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
                await copyToClipboard(textToCopy, passphraseClipboardMessage);
            }
        });

        // Generate initial passphrase on load
        generatePassphrase();

    } else {
        // Error messages for missing elements are less critical than word list, just log
        console.error("Passphrase Generator UI elements not fully found or word list issues preventing activation.");
        // The word list error message and disabling UI should already be handled above.
    }

    // --- Initial Setup / Checks ---
    // The generator setup blocks already trigger initial generation if elements are present.
    // The strength checker also triggers on load via a timeout.
    // No need for additional global initial calls here.


    // SECURITY NOTE: Clipboard data persistence
    // The Clipboard API is subject to browser security models.
    // Automatically clearing the clipboard after a set time is possible
    // but requires permissions in some browsers and is not universally reliable.
    // A common UX pattern is to simply show a success message and
    // educate users about clipboard security (mentioned in the info section).
    // Implementing auto-clear securely cross-browser is complex and out of scope
    // for this simple client-side example.

});