// script.js
// Main JavaScript logic for Password Toolkit
// Refactored to use ES6+ standards

// --- Constants ---
// Define key parameters as constants for easier management
const MIN_PASSWORD_LENGTH = 12;
const DEFAULT_PASSWORD_LENGTH = 16;
const MAX_PASSWORD_LENGTH = 64; // Practical max for slider
const PASSWORD_INPUT_MAX_LENGTH = 128; // Actual input max length

const MIN_PASSPHRASE_WORDS = 5;
const DEFAULT_PASSPHRASE_WORDS = 5;
const MAX_PASSPHRASE_WORDS = 20; // Practical max for slider
const PASSPHRASE_INPUT_MAX_LENGTH = 256; // Actual input max length (approximate, depends on words+separator)

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
    // Initialize Bootstrap Tabs using querySelectorAll and forEach with arrow function
    const triggerTabList = document.querySelectorAll('#featureTabs button');
    triggerTabList.forEach(triggerEl => {
      const tabTrigger = new bootstrap.Tab(triggerEl); // Assuming bootstrap is loaded globally

      triggerEl.addEventListener('click', event => { // Arrow function for event listener
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
    const secureRandomInt = (min, max) => { // Converted to arrow function
        if (min > max) {
            throw new Error("Min cannot be greater than max");
        }
        const range = max - min + 1;
        if (range === 1) {
            return min;
        }

        let bytesNeeded = Math.ceil(Math.log2(range) / 8);
        if (bytesNeeded <= 0) bytesNeeded = 1;

        let maxUintValue = Math.pow(256, bytesNeeded) - 1;
        let maxValidValue = Math.floor(maxUintValue / range) * range;

        const randomBytes = new Uint8Array(bytesNeeded); // Use const
        let randomNumber; // Use let

        do {
            window.crypto.getRandomValues(randomBytes);
            randomNumber = 0;
            for (let i = 0; i < bytesNeeded; i++) { // Use let for loop variable
                randomNumber = (randomNumber << 8) + randomBytes[i];
            }
        } while (randomNumber >= maxValidValue);

        return min + (randomNumber % range);
    }; // Added semicolon

    /**
     * Securely shuffle an array using the Fisher-Yates (Knuth) algorithm.
     * Uses secureRandomInt for randomness.
     * @param {Array} array - The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    const secureShuffleArray = (array) => { // Converted to arrow function
        const shuffledArray = [...array]; // Use spread syntax for copying
        for (let i = shuffledArray.length - 1; i > 0; i--) { // Use let for loop variable
            const j = secureRandomInt(0, i); // Use const for random index
            // Use array destructuring for swapping (ES6)
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }; // Added semicolon


    /**
     * Copies text to the clipboard and shows a temporary message.
     * @param {string} text - The text to copy.
     * @param {HTMLElement} messageElement - The element to display the temporary message.
     * @returns {Promise<void>}
     */
    const copyToClipboard = async (text, messageElement) => { // Converted to arrow function, kept async
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            console.warn("Clipboard API not available.");
            const fallbackMessage = 'Browser Anda tidak mendukung salin ke clipboard.'; // Use const
            if (messageElement) {
                messageElement.textContent = fallbackMessage;
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
            } else {
                 alert(fallbackMessage);
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            if (messageElement) {
                messageElement.textContent = 'Tersalin ke clipboard!';
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            const errorMessage = 'Gagal menyalin ke clipboard.'; // Use const
            if (messageElement) {
                messageElement.textContent = errorMessage;
                messageElement.style.display = 'block';
                setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
            } else {
                 alert(errorMessage);
            }
        }
    }; // Added semicolon

     /**
      * Pastes text from the clipboard into an input field and triggers an input event.
      * @param {HTMLInputElement} inputElement - The input element to paste into.
      * @param {HTMLElement} messageElement - The element to display the temporary message.
      * @returns {Promise<void>}
      */
    const pasteFromClipboard = async (inputElement, messageElement) => { // Converted to arrow function, kept async
         if (!navigator.clipboard || !navigator.clipboard.readText) {
              console.warn("Clipboard API not available for reading.");
              const fallbackMessage = 'Browser Anda tidak mendukung tempel dari clipboard.'; // Use const
              if (messageElement) {
                 messageElement.textContent = fallbackMessage;
                 messageElement.style.display = 'block';
                 setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
             } else {
                  alert(fallbackMessage);
             }
              return;
         }
         try {
              const text = await navigator.clipboard.readText(); // Use const
              // Apply maxlength explicitly on paste
              const pastedText = text.substring(0, inputElement.maxLength || text.length); // Use const
              inputElement.value = pastedText;

              // Trigger input event manually so listeners (like strength checker) react
              const event = new Event('input', { bubbles: true }); // Use const
              inputElement.dispatchEvent(event);

              const successMessage = 'Teks ditempel dari clipboard.'; // Use const
              if (messageElement) {
                  messageElement.textContent = successMessage;
                  messageElement.style.display = 'block';
                  setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
              }

         } catch (err) {
              console.error('Failed to paste text: ', err);
              const errorMessage = 'Gagal menempelkan teks. Pastikan clipboard berisi teks.'; // Use const
               if (messageElement) {
                 messageElement.textContent = errorMessage;
                 messageElement.style.display = 'block';
                 setTimeout(() => messageElement.style.display = 'none', CLIPBOARD_MESSAGE_DURATION); // Arrow function for callback
             } else {
                  alert(errorMessage);
             }
         }
    }; // Added semicolon


    // --- Password Strength Checker ---
    const passwordInput = document.getElementById('passwordInput');
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthFeedback = document.getElementById('strengthFeedback');
    const pastePasswordBtn = document.getElementById('pastePasswordBtn');
    const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
    // Use optional chaining and const
    const togglePasswordVisibilityIcon = togglePasswordVisibilityBtn?.querySelector('i');
    const strengthClipboardMessage = document.getElementById('strengthClipboardMessage');


    // Function to update strength display - Converted to arrow function
    const updateStrengthDisplay = () => {
        const password = passwordInput.value; // Use const

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
        const result = zxcvbn(password);
        // Use destructuring for result properties
        const { score, crack_times_display, feedback } = result;
        const offlineCrackTime = crack_times_display.offline_slow_hashing_1e4_per_second; // Use const

        // Determine strength level and color based on score
        let strengthText; // Use let as it's reassigned
        let indicatorClass; // Use let as it's reassigned

        // Use switch statement for clarity
        switch (score) {
            case 0:
                strengthText = 'Sangat Lemah';
                indicatorClass = 'strength-score-0';
                break;
            case 1:
                strengthText = 'Lemah';
                indicatorClass = 'strength-score-1';
                break;
            case 2:
                strengthText = 'Sedang';
                indicatorClass = 'strength-score-2';
                break;
            case 3:
                strengthText = 'Kuat';
                indicatorClass = 'strength-score-3';
                break;
            case 4:
                strengthText = 'Sangat Kuat';
                indicatorClass = 'strength-score-4';
                break;
            default:
                strengthText = 'Tidak Diketahui';
                indicatorClass = 'progress-bar'; // Default/fallback class
                break;
        }


        // Update UI using template literals
        strengthIndicator.style.width = `${((score + 1) / 5) * 100}%`;
        strengthIndicator.className = `progress-bar ${indicatorClass}`; // Combine base class and score class
        strengthLabel.textContent = strengthText;
        strengthIndicator.setAttribute('aria-valuenow', score);

        // Display feedback using template literals
        let feedbackHTML = `<strong>Estimasi Waktu Tebakan Offline (Lambat):</strong> ${offlineCrackTime}<br>`; // Use let as it's appended

        // Add zxcvbn suggestions if available
        if (feedback && feedback.suggestions && feedback.suggestions.length > 0) {
             feedbackHTML += '<strong>Saran:</strong><ul>';
             // Use map and join to build list items efficiently
             feedbackHTML += feedback.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('');
             feedbackHTML += '</ul>';
        } else if (feedback && feedback.warning) {
             feedbackHTML += `<strong>Peringatan:</strong> ${feedback.warning}`; // Use template literal
        } else {
            // Default message if no specific feedback from zxcvbn
            if (score < 4) {
                 feedbackHTML += '<strong>Saran Umum:</strong> Gunakan kombinasi huruf besar/kecil, angka, dan simbol. Tingkatkan panjang password. Hindari kata-kata umum atau pola yang mudah ditebak.';
            } else {
                 feedbackHTML += 'Password ini terlihat sangat kuat.';
            }
        }

        strengthFeedback.innerHTML = feedbackHTML;
        strengthFeedback.style.display = 'block';
    }; // Added semicolon


    // Conditional setup based on element availability and zxcvbn
    if (passwordInput && strengthIndicator && strengthLabel && strengthFeedback && pastePasswordBtn && togglePasswordVisibilityBtn && strengthClipboardMessage && typeof zxcvbn !== 'undefined') {

        // Limit input length via JS as a safeguard, although maxlength attribute is primary
         passwordInput.maxLength = PASSWORD_INPUT_MAX_LENGTH;


        // Event listener for input changes (typing or pasting via keyboard) - Use arrow function
        passwordInput.addEventListener('input', updateStrengthDisplay);

        // Event listener for Paste button - Use arrow function and async
        pastePasswordBtn.addEventListener('click', async () => {
             await pasteFromClipboard(passwordInput, strengthClipboardMessage);
             // updateStrengthDisplay is triggered by the 'input' event dispatched by pasteFromClipboard
        });

        // Event listener for Visibility toggle button - Use arrow function
        togglePasswordVisibilityBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; // Use const
            passwordInput.setAttribute('type', type);

            // Toggle icon and title
            if (togglePasswordVisibilityIcon) { // Check if icon element exists
                if (type === 'text') {
                    togglePasswordVisibilityIcon.classList.remove('bi-eye-slash');
                    togglePasswordVisibilityIcon.classList.add('bi-eye');
                    togglePasswordVisibilityBtn.setAttribute('title', 'Sembunyikan Password');
                } else {
                    togglePasswordVisibilityIcon.classList.remove('bi-eye');
                    togglePasswordVisibilityIcon.classList.add('bi-eye-slash');
                    togglePasswordVisibilityBtn.setAttribute('title', 'Tampilkan Password');
                }
            }
        });

         // Initial check if there's a default value or autocompleted value
         // Use a small timeout to allow browser autofill to complete before checking
         setTimeout(updateStrengthDisplay, 100); // Arrow function implicitly used

    } else {
         console.error("Password Strength Checker elements not found or zxcvbn not loaded.");
         if (typeof zxcvbn === 'undefined') {
              alert("Library zxcvbn gagal dimuat. Pemeriksa kekuatan password mungkin tidak berfungsi.");
         }
    }


    // --- Password Generator ---
    const passwordLengthInput = document.getElementById('passwordLength');
    const passwordLengthValueSpan = document.getElementById('passwordLengthValue');
    const includeUppercaseCheckbox = document.getElementById('includeUppercase');
    const includeLowercaseCheckbox = document.getElementById('includeLowercase');
    const includeNumbersCheckbox = document.getElementById('includeNumbers');
    const includeSymbolsCheckbox = document.getElementById('includeSymbols');
    const generatedPasswordInput = document.getElementById('generatedPassword');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');
    const refreshPasswordBtn = document.getElementById('refreshPasswordBtn');
    const generatorAlert = document.getElementById('generatorAlert');
    const generatorClipboardMessage = document.getElementById('generatorClipboardMessage');


    // Function to generate password - Converted to arrow function
    const generatePassword = () => {
        const length = parseInt(passwordLengthInput.value, 10); // Use const
        // Use destructuring for checkbox states
        const { checked: includeUppercase } = includeUppercaseCheckbox;
        const { checked: includeLowercase } = includeLowercaseCheckbox;
        const { checked: includeNumbers } = includeNumbersCheckbox;
        const { checked: includeSymbols } = includeSymbolsCheckbox;

        let characterPool = ''; // Use let as it's modified
        let guaranteedChars = []; // Use let as it's modified

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

        // Handle empty character pool
        if (characterPool.length === 0) {
            generatedPasswordInput.value = '';
            generatorAlert.textContent = 'Mohon pilih setidaknya satu jenis karakter.';
            generatorAlert.style.display = 'block';
            return;
        } else {
             generatorAlert.style.display = 'none';
        }

        // Calculate the minimum length required by selected character types
        const minRequiredLength = guaranteedChars.length; // Use const

        // Ensure the slider's minimum attribute reflects the required minimum
        // And adjust the slider value if it's below the new minimum
        // Only update if the new minimum is higher than the current min attribute
        if (passwordLengthInput.min < minRequiredLength) {
            passwordLengthInput.min = minRequiredLength;
            // If the current value is less than the new minimum, update the value as well
            if (parseInt(passwordLengthInput.value, 10) < minRequiredLength) {
                 passwordLengthInput.value = minRequiredLength;
                 passwordLengthValueSpan.textContent = minRequiredLength; // Update displayed value
                 console.warn(`Password length adjusted to ${minRequiredLength} to meet minimum character type requirements.`);
            }
             // If the min attribute was just updated, ensure the displayed value reflects the potentially new minimum
             // (This covers the case where the value was already >= the old min but < the new min)
             passwordLengthValueSpan.textContent = passwordLengthInput.value; // Always sync display after potential value change
        } else if (passwordLengthInput.min > minRequiredLength) {
             // If checkboxes were unchecked, the minRequiredLength might decrease.
             // Don't decrease the slider's min attribute automatically below the global MIN_PASSWORD_LENGTH.
             // This ensures the user doesn't accidentally set a length below the recommended minimum.
             // The slider's min should be the greater of MIN_PASSWORD_LENGTH and minRequiredLength.
             const effectiveMin = Math.max(MIN_PASSWORD_LENGTH, minRequiredLength); // Use const
             if (passwordLengthInput.min != effectiveMin) { // Update only if needed
                  passwordLengthInput.min = effectiveMin;
                  // If the current value is less than the new effective minimum, update the value
                 if (parseInt(passwordLengthInput.value, 10) < effectiveMin) {
                      passwordLengthInput.value = effectiveMin;
                      passwordLengthValueSpan.textContent = effectiveMin;
                       console.warn(`Password length adjusted to ${effectiveMin} based on requirements.`);
                 } else {
                      // Even if value didn't change, ensure display is correct after min update
                      passwordLengthValueSpan.textContent = passwordLengthInput.value;
                 }
             } else {
                   // Min attribute didn't need updating, just ensure display is in sync
                   passwordLengthValueSpan.textContent = passwordLengthInput.value;
             }
        } else {
             // minRequiredLength hasn't changed or matches existing min, just ensure display is in sync
             passwordLengthValueSpan.textContent = passwordLengthInput.value;
        }


        // Use the potentially updated length from the input after adjustments
        const actualLength = parseInt(passwordLengthInput.value, 10); // Use const

        let password = ''; // Use let

        // Add guaranteed characters first
        // Shuffle guaranteed characters for better distribution initially
        const shuffledGuaranteed = secureShuffleArray(guaranteedChars); // Use const
        password += shuffledGuaranteed.join(''); // Join the array into string

        // Fill the rest of the length with random characters from the pool
        const remainingLength = actualLength - shuffledGuaranteed.length; // Use const

        for (let i = 0; i < remainingLength; i++) { // Use let for loop variable
             const randomIndex = secureRandomInt(0, characterPool.length - 1); // Use const
             password += characterPool[randomIndex];
        }

         // Final shuffle of the entire password string (convert to array, shuffle, join)
        password = secureShuffleArray(password.split('')).join('');

        generatedPasswordInput.value = password;
    }; // Added semicolon

    // Add event listeners for generator
    // Use const for checkbox array
    const charTypeCheckboxes = [includeUppercaseCheckbox, includeLowercaseCheckbox, includeNumbersCheckbox, includeSymbolsCheckbox];

    if (passwordLengthInput && passwordLengthValueSpan && generatedPasswordInput && copyPasswordBtn && refreshPasswordBtn && generatorAlert && generatorClipboardMessage && charTypeCheckboxes.every(el => el !== null)) {

        // Initialize slider min/max and value span text
         passwordLengthInput.min = MIN_PASSWORD_LENGTH;
         passwordLengthInput.max = MAX_PASSWORD_LENGTH;
         passwordLengthInput.value = DEFAULT_PASSWORD_LENGTH;
         passwordLengthValueSpan.textContent = passwordLengthInput.value; // Initial display

        // Update displayed length value when slider moves AND regenerate - Use arrow function
        passwordLengthInput.addEventListener('input', () => {
             passwordLengthValueSpan.textContent = passwordLengthInput.value; // Update span immediately
             generatePassword(); // Regenerate on change
        });

        // Regenerate when character type checkboxes change - Use forEach with arrow function
         charTypeCheckboxes.forEach(checkbox => {
             checkbox.addEventListener('change', generatePassword);
         });

        // Regenerate on button click - Use arrow function
        refreshPasswordBtn.addEventListener('click', generatePassword);

        // Copy to clipboard - Use arrow function and async
        copyPasswordBtn.addEventListener('click', async () => {
            const textToCopy = generatedPasswordInput.value; // Use const
            if (textToCopy) {
                await copyToClipboard(textToCopy, generatorClipboardMessage);
            }
        });

        // Generate initial password on load
        generatePassword(); // Trigger initial generation which will also set the correct min slider value based on default checkboxes

    } else {
         console.error("Password Generator elements not found.");
    }


    // --- Passphrase Generator ---
    const passphraseWordCountInput = document.getElementById('passphraseWordCount');
    const passphraseWordCountValueSpan = document.getElementById('passphraseWordCountValue');
    const passphraseCapitalizeCheckbox = document.getElementById('passphraseCapitalize');
    const passphraseAddNumberCheckbox = document.getElementById('passphraseAddNumber');
    const passphraseSeparatorSelect = document.getElementById('passphraseSeparator');
    const generatedPassphraseInput = document.getElementById('generatedPassphrase');
    const copyPassphraseBtn = document.getElementById('copyPassphraseBtn');
    const refreshPassphraseBtn = document.getElementById('refreshPassphraseBtn');
    const passphraseAlert = document.getElementById('passphraseAlert');
    const passphraseClipboardMessage = document.getElementById('passphraseClipboardMessage');


    // Access the word list (assuming id-words.js loaded it as const indonesianWords)
    // SECURITY: Read the word list into a local variable once on load
    // Use const with a default empty array if not defined
    const localWordList = typeof indonesianWords !== 'undefined' ? indonesianWords : [];

    // Conditional setup based on element availability and word list size
    const passphraseElementsExist = passphraseWordCountInput && passphraseWordCountValueSpan && passphraseCapitalizeCheckbox && passphraseAddNumberCheckbox && passphraseSeparatorSelect && generatedPassphraseInput && copyPassphraseBtn && refreshPassphraseBtn && passphraseAlert && passphraseClipboardMessage; // Use const for combined check

    if (localWordList.length < MIN_UNIQUE_WORDS_FOR_PASSPHRASE) {
         const errorMessage = `Daftar kata Bahasa Indonesia terlalu kecil (${localWordList.length} kata). Generator passphrase dinonaktifkan. Diperlukan minimal ${MIN_UNIQUE_WORDS_FOR_PASSPHRASE} kata unik.`; // Use const
         console.error(errorMessage);
         if (passphraseAlert) {
             passphraseAlert.textContent = errorMessage;
             passphraseAlert.style.display = 'block';
         }
         // Disable passphrase generator UI if data is missing or insufficient, use optional chaining for safety
         if (passphraseWordCountInput) passphraseWordCountInput.disabled = true;
         if (passphraseCapitalizeCheckbox) passphraseCapitalizeCheckbox.disabled = true;
         if (passphraseAddNumberCheckbox) passphraseAddNumberCheckbox.disabled = true; // Fix typo here (passphraseAddphraseAddNumberCheckbox)
         if (passphraseSeparatorSelect) passphraseSeparatorSelect.disabled = true;
         if (refreshPassphraseBtn) refreshPassphraseBtn.disabled = true;
         if (copyPassphraseBtn) copyPassphraseBtn.disabled = true;

         // Exit setup if word list is not ready
         // No need to return, the conditional below handles it.
         // The error message and disabling are sufficient.

    } else if (passphraseElementsExist) { // Only proceed if word list is sufficient AND elements exist

        // Function to generate passphrase - Converted to arrow function
        const generatePassphrase = () => {
            // Re-check word list availability just in case (redundant due to outer check, but harmless)
            if (!localWordList || localWordList.length < MIN_UNIQUE_WORDS_FOR_PASSPHRASE) {
                 console.error("Word list not available or too small for passphrase generation.");
                 generatedPassphraseInput.value = ''; // Clear output
                 return;
            }

            const numWords = parseInt(passphraseWordCountInput.value, 10); // Use const
            // Use destructuring for checkbox state
            const { checked: capitalize } = passphraseCapitalizeCheckbox;
            const { checked: addNumber } = passphraseAddNumberCheckbox;
            const separator = passphraseSeparatorSelect.value; // Use const

            let selectedWords = []; // Use let

            // Select random words using secureRandomInt - Use Array.from for conciseness
            selectedWords = Array.from({ length: numWords }, () =>
                 localWordList[secureRandomInt(0, localWordList.length - 1)]
            );

            // Apply transformations to selected words using map and arrow function
            let passphraseParts = selectedWords.map(word => { // Use let
                // Ensure lowercase before capitalizing first letter
                const baseWord = word.toLowerCase(); // Use const
                 if (capitalize && baseWord.length > 0) {
                     return baseWord.charAt(0).toUpperCase() + baseWord.slice(1);
                 }
                 return baseWord;
            }).filter(part => part.length > 0); // Filter out any potential empty parts - Use arrow function

            // Add number if requested
            if (addNumber) {
                const randomNumber = secureRandomInt(0, PASSPHRASE_NUMBER_RANGE); // Use const
                const numberString = String(randomNumber); // Use const

                // Insert the number randomly within the passphrase parts array
                // Choose a random index to insert BEFORE the element at that index
                // Index can be 0 (start) up to passphraseParts.length (end)
                const insertionIndex = secureRandomInt(0, passphraseParts.length); // Use const

                passphraseParts.splice(insertionIndex, 0, numberString);
            }

            const finalPassphrase = passphraseParts.join(separator); // Use const
            // Ensure passphrase does not exceed maxlength set in HTML
             generatedPassphraseInput.value = finalPassphrase.substring(0, generatedPassphraseInput.maxLength || finalPassphrase.length); // Use maxLength || length for safety
        }; // Added semicolon


         // Initialize slider min/max and value span text
         passphraseWordCountInput.min = MIN_PASSPHRASE_WORDS;
         passphraseWordCountInput.max = MAX_PASSPHRASE_WORDS;
         passphraseWordCountInput.value = DEFAULT_PASSPHRASE_WORDS;
         passphraseWordCountValueSpan.textContent = passphraseWordCountInput.value; // Initial display

        // Update displayed word count value when slider moves AND regenerate - Use arrow function
        passphraseWordCountInput.addEventListener('input', () => {
             passphraseWordCountValueSpan.textContent = passphraseWordCountInput.value; // Update span immediately
             generatePassphrase(); // Regenerate on change
        });

        // Regenerate when options change (capitalize, add number, separator)
        // Use const for array of elements
         const passphraseOptionElements = [passphraseCapitalizeCheckbox, passphraseAddNumberCheckbox, passphraseSeparatorSelect];
         passphraseOptionElements.forEach(element => { // Use forEach with arrow function
             element.addEventListener('change', generatePassphrase);
         });

        // Regenerate on button click - Use arrow function
        refreshPassphraseBtn.addEventListener('click', generatePassphrase);

        // Copy to clipboard - Use arrow function and async
        copyPassphraseBtn.addEventListener('click', async () => {
            const textToCopy = generatedPassphraseInput.value; // Use const
            if (textToCopy) {
                await copyToClipboard(textToCopy, passphraseClipboardMessage);
            }
        });

        // Generate initial passphrase on load
        generatePassphrase();

    } else {
        // This else block is reached if word list was sufficient, but some UI elements were missing.
        console.error("Passphrase Generator UI elements not fully found.");
    }

    // SECURITY NOTE: Clipboard data persistence
    // The Clipboard API is subject to browser security models.
    // Automatically clearing the clipboard after a set time is possible
    // but requires permissions in some browsers and is not universally reliable.
    // A common UX pattern is to simply show a success message and
    // educate users about clipboard security (mentioned in the info section).
    // Implementing auto-clear securely cross-browser is complex and out of scope
    // for this simple client-side example.

}); // End of DOMContentLoaded listener - Added semicolon


// Note on zxcvbn library: It is assumed to be loaded via a separate <script> tag before this script.
// Its usage `zxcvbn(password)` remains standard.

// Note on `indonesianWords`: It is assumed to be loaded via a separate <script> tag (e.g., id-words.js)
// before this script, defining a global constant `indonesianWords`. Accessing it with `typeof` check
// and assigning to a local `const` variable `localWordList` is good practice.