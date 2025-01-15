document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const STORAGE_KEY = 'theme-preference';
    const DARK_CLASS = 'dark';
    const THEME_TOGGLE_ID = 'themeToggle';
    const STATUS_MESSAGE_ID = 'statusMessage';

    // Cache DOM elements
    const body = document.body;
    const themeToggle = document.getElementById(THEME_TOGGLE_ID);
    const statusMessage = document.getElementById(STATUS_MESSAGE_ID);

    // Initialize theme
    let isDarkMode = localStorage.getItem(STORAGE_KEY) === 'dark';

    // Apply initial theme
    function initializeTheme() {
        if (isDarkMode) {
            body.classList.add(DARK_CLASS);
            themeToggle.textContent = '라이트 모드로 전환';
        } else {
            body.classList.remove(DARK_CLASS);
            themeToggle.textContent = '다크 모드로 전환';
        }

        // Set status message styles based on theme
        updateStatusMessageStyle();
    }

    // Update status message style based on the current theme
    function updateStatusMessageStyle() {
        if (isDarkMode) {
            statusMessage.style.backgroundColor = 'rgba(30, 41, 59, 0.9)'; // Dark mode background
            statusMessage.style.color = '#e2e8f0'; // Dark mode text color
        } else {
            statusMessage.style.backgroundColor = '#ffffff'; // Light mode background
            statusMessage.style.color = '#333'; // Light mode text color
        }
    }

    // Toggle theme function
    function toggleTheme() {
        isDarkMode = !isDarkMode;

        // Update DOM
        body.classList.toggle(DARK_CLASS);
        themeToggle.textContent = isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환';

        // Save preference
        localStorage.setItem(STORAGE_KEY, isDarkMode ? 'dark' : 'light');

        // Update status message style
        updateStatusMessageStyle();

        // Show status message
        showStatusMessage(isDarkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다');
    }

    // Status message animation
    function showStatusMessage(message) {
        statusMessage.textContent = message;

        // Reset any ongoing animations
        statusMessage.style.display = 'block';
        statusMessage.style.opacity = '0';
        statusMessage.style.bottom = '-50px'; // Start below the screen

        // Force reflow
        statusMessage.offsetHeight;

        // Show message with animation: slide up from below
        requestAnimationFrame(() => {
            statusMessage.style.opacity = '1';
            statusMessage.style.bottom = '10px'; // Move to a visible position

            setTimeout(() => {
                statusMessage.style.opacity = '0';
                statusMessage.style.bottom = '-50px'; // Slide back down

                // Hide element after animation
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 500); // Wait for the animation to complete before hiding
            }, 2000); // Keep the message visible for 2 seconds
        });
    }

    // Add event listeners
    themeToggle.addEventListener('click', toggleTheme);

    // Check for system theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            isDarkMode = e.matches;
            initializeTheme();
        }
    });

    // Initialize on load
    initializeTheme();

    // Add smooth transitions for theme changes
    const style = document.createElement('style');
    style.textContent = `
        body, body * {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        #statusMessage {
            transition: opacity 0.3s ease, bottom 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
