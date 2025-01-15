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

    const darkModeStyles = `
body.dark-mode {
    background-color: #1a1a1a;
    color: #e2e8f0;
}

body.dark-mode .chat-container {
    background-color: #262626;
}

body.dark-mode #input-text {
    background-color: #333;
    color: #e2e8f0;
    border-color: #404040;
}

body.dark-mode .button-container button {
    background-color: #404040;
    color: #e2e8f0;
}

body.dark-mode #update-log {
    background-color: #333;
    color: #e2e8f0;
}

body.dark-mode .user-profiles,
body.dark-mode .user-select {
    background-color: #333;
    color: #e2e8f0;
}

body.dark-mode #footer {
    color: #e2e8f0;
}
`;


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

function createMessageHTML(message, index, isForExport = false) {
    const { time, username, chatMessage } = message;
    const displayName = state.displayNames[username] || username;
    const profileImage = state.userProfileImages[username];
    const isMyMessage = state.selectedUsers.has(username);
    
    // isForExport가 true면 항상 라이트 모드 스타일 사용
    const isDarkMode = isForExport ? false : window.themeState.isDark;

    const userColor = isDarkMode ? '#e2e8f0' : (state.userColors[username] || '#000');
    const messageContainerStyle = isMyMessage ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:12px;align-items:start;' : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:12px;align-items:start;';
    const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
    const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
    const imgStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
    const wrapperStyle = isMyMessage ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;' : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
    const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor}`;
    
    // 메시지 스타일 설정
    const messageStyle = isMyMessage ? 
        (isDarkMode ? 
            'background-color:#2d6a4f;color:#e2e8f0;' : 
            'background-color:#b3e6b3;color:#333;') :
        (isDarkMode ? 
            'background-color:#4c4f56;color:#e2e8f0;' : 
            'background-color:#f1f1f1;color:#333;');
            
    const contentStyle = `padding:10px 16px;border-radius:20px;word-break:break-word;max-width:100%;cursor:pointer;${messageStyle}`;
    const timeStyle = `font-size:12px;color:${isDarkMode ? '#888' : '#666'};margin-top:3px;`;
    const formattedMessage = escapeHtml(chatMessage).replace(/\n/g, '<br>');

    return `<div style="${messageContainerStyle}" data-index="${index}">
        <div style="${profileStyle}">
            <div style="${pictureStyle}">
                ${profileImage ? `<img src="${profileImage}" alt="${escapeHtml(displayName)}" style="${imgStyle}">` : ''}
            </div>
        </div>
        <div style="${wrapperStyle}">
            <div style="${usernameStyle}">${escapeHtml(displayName)}</div>
            <div class="message-content" style="${contentStyle}" onclick="startEdit(${index})">${formattedMessage}</div>
            <div style="${timeStyle}">${escapeHtml(time)}</div>
        </div>
    </div>`;
}

// copyBtn 이벤트 리스너 수정
elements.copyBtn.addEventListener('click', () => {
    if (!state.transformedHtml) {
        alert('먼저 채팅을 변환해주세요!');
        return;
    }

    const uniqueUsers = new Set(state.messages.map(msg => msg.username));
    if (uniqueUsers.size >= MAX_USERS + 1) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        return;
    }

    // 항상 라이트 모드로 내보내기
    const exportMessages = state.messages
        .map((msg, idx) => createMessageHTML(msg, idx, true))
        .join('\n');

    const fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;">${exportMessages}</div>`;

    const exportContainer = document.createElement('textarea');
    exportContainer.value = fullHtml;
    document.body.appendChild(exportContainer);
    exportContainer.select();
    document.execCommand('copy');
    document.body.removeChild(exportContainer);
    alert('채팅이 복사되었습니다!');
});

function renderMessages() {
    const selectedUser = elements.chatUserSelect.value;
    const chatContainer = elements.chatContainer;
    const previousScrollTop = chatContainer.scrollTop;
    const previousScrollHeight = chatContainer.scrollHeight;

    const formattedMessages = state.messages
        .map((message, index) => createMessageHTML(message, index, false))
        .join('\n');

    state.transformedHtml = `<div>${formattedMessages}</div>`;
    chatContainer.innerHTML = state.transformedHtml;

    if (state.isFirstLoad) {
        chatContainer.scrollTop = 0;
        state.isFirstLoad = false;
    } else {
        chatContainer.scrollTop = previousScrollTop + (chatContainer.scrollHeight - previousScrollHeight);
    }
}
