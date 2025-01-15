//config에서 id 불러오기
import config from './config.js';

const IMGUR_CLIENT_ID = config.IMGUR_CLIENT_ID;
const MAX_USERS = 25;
const LOCAL_STORAGE_KEYS = {
    PROFILES: 'chatProfiles',
    SELECTED_USERS: 'selectedUsers'  // 새로운 키 추가
};

const state = {
    transformedHtml: '',
    userProfileImages: {},
    messages: [],
    displayNames: {},
    selectedUsers: new Set(),
    userColors: {},
    isFirstLoad: true
};

document.addEventListener('DOMContentLoaded', function() {
    // elements 객체는 여기서 정의
    const elements = {
        inputText: document.getElementById('input-text'),
        chatContainer: document.getElementById('chat-container'),
        userProfiles: document.getElementById('user-profiles'),
        userCheckboxes: document.getElementById('user-checkboxes'),
        userSelect: document.getElementById('user-select'),
        chatUserSelect: document.getElementById('chat-user'),
        analyzeBtn: document.getElementById('analyze-btn'),
        convertBtn: document.getElementById('convert-btn'),
        copyBtn: document.getElementById('copy-btn'),
        clearBtn: document.getElementById('clear-btn')
    };

window.parseMessages = function(chatData) {
    // 더 정확한 정규식 패턴
    const messageRegex = /^(\d{4}년\s*(?:0?[1-9]|1[0-2])월\s*(?:0?[1-9]|[12][0-9]|3[01])일\s*(?:오전|오후)\s*(?:0?[1-9]|1[0-2]):(?:[0-5][0-9])):([^:]+):(.+)$/;
    
    const lines = chatData.split('\n');
    let currentMessage = null;
    const messages = [];
    
    lines.forEach(line => {
        // 앞뒤 공백 제거
        const trimmedLine = line.trim();
        
        if (!trimmedLine) {
            return; // 빈 줄 무시
        }
        
        const match = trimmedLine.match(messageRegex);
        
        if (match) {
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            currentMessage = {
                time: match[1].trim(),
                username: match[2].trim(),
                chatMessage: match[3].trim()
            };
        } else if (currentMessage) {
            // 이전 메시지의 연속된 줄인 경우
            currentMessage.chatMessage += '\n' + trimmedLine;
        }
    });
    
    // 마지막 메시지 처리
    if (currentMessage) {
        messages.push(currentMessage);
    }
    return messages;
};

    async function uploadImageToImgur(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    Authorization: `Client-ID ${IMGUR_CLIENT_ID}`
                },
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error('이미지는 png와 jpg 형식만 지원합니다.');
            }
            return data.data.link;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        .user-checkboxes {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 10px 0;
        }

        .user-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 4px;
        }

        .user-checkbox-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .user-select-container h3 {
            font-size: 14px;
            margin-bottom: 8px;
            color: #333;
        }

       .color-picker {
    width: 30px; /* 크기 조정 */
    height: 30px; /* 크기 조정 */
    padding: 0;
    border: none;
    border-radius: 50%; /* 동그라미 형태 */
    cursor: pointer;
    margin: 0 8px;
}

    .color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
    }

    .color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
    }
    `;
    document.head.appendChild(style);

    function createProfileInput(username) {
        const div = document.createElement('div');
        div.className = 'user-profile';

        // Profile Picture
        const preview = document.createElement('div');
        preview.className = 'profile-preview';
        if (state.userProfileImages[username]) {
            const img = document.createElement('img');
            img.src = state.userProfileImages[username];
            preview.appendChild(img);
        }

        // Username Container
        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';

        const displayInput = document.createElement('input');
        displayInput.type = 'text';
        displayInput.value = state.displayNames[username] || username;
        displayInput.className = 'display-name-input';
        displayInput.placeholder = 'Enter display name';

        // Add color picker
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = state.userColors[username] || '#000000';
        colorInput.className = 'color-picker';
        colorInput.title = '이름 색상 선택';

        const originalName = document.createElement('span');
        originalName.className = 'original-name';
        originalName.textContent = `(${username})`;

        // File Input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.id = `file-${username}`;

        const fileLabel = document.createElement('label');
        fileLabel.htmlFor = `file-${username}`;
        fileLabel.className = 'file-input-label';
        fileLabel.textContent = '이미지 선택';

        // Add all elements to name container
        nameContainer.append(displayInput, colorInput, originalName, fileInput, fileLabel);

        // Reset Button (×)
        const resetBtn = document.createElement('button');
        resetBtn.className = 'profile-delete-btn';
        resetBtn.innerHTML = '×';
        resetBtn.onclick = () => {
            if (confirm('프로필을 초기화하시겠습니까?')) {
                resetProfile(username);
            }
        };

        // Event listeners
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const imgUrl = await uploadImageToImgur(file);
                    state.userProfileImages[username] = imgUrl;
                    preview.innerHTML = `<img src="${imgUrl}">`;
                    saveProfiles();
                } catch (error) {
                    alert('이미지 업로드 실패');
                }
            }
        });

        displayInput.addEventListener('change', () => {
            state.displayNames[username] = displayInput.value;
            saveProfiles();
            renderMessages();
        });

        colorInput.addEventListener('change', () => {
            state.userColors[username] = colorInput.value;
            saveProfiles();
            renderMessages();
        });

        div.append(preview, nameContainer, resetBtn);
        return div;
    }

    function resetProfile(username) {
        delete state.userProfileImages[username];
        delete state.userColors[username];
        state.displayNames[username] = username;
        saveProfiles();
        updateProfileUI(username);
        const fileInput = document.querySelector(`#file-${username}`);
        if (fileInput) {
            fileInput.value = '';
        }

        // Update preview
        const preview = document.querySelector(`.user-profile[data-username="${username}"] .profile-preview`);
        if (preview) {
            preview.innerHTML = '';
        }
        renderMessages();
    }

    // Message handling
    function deleteMessage(index) {
        if (confirm('메시지를 삭제하시겠습니까?')) {
            const chatContainer = document.querySelector('.chat-container');

            // 현재 스크롤 위치 저장
            const currentScrollPosition = chatContainer.scrollTop;

            // 메시지 삭제 처리
            state.messages.splice(index, 1);
            renderMessages();

            // 스크롤 위치 복원
            chatContainer.scrollTop = currentScrollPosition;
        }
    }

    window.deleteMessage = deleteMessage;

    let editingIndex = null; // 현재 편집 중인 메시지의 인덱스를 추적

function startEdit(index) {
    // 이미 편집 중인 메시지의 인덱스와 동일한 메시지는 편집 불가
    if (editingIndex !== null && editingIndex !== index) {
        return; // 다른 메시지가 편집 중이면 아무 일도 일어나지 않음
    }

    const messageDiv = document.querySelector(`[data-index="${index}"] .message-content`);
    // 이미 편집 버튼이 추가되어 있으면 새로 추가하지 않도록 확인
    if (messageDiv.querySelector('.edit-buttons')) {
        return; // 버튼이 이미 있으면 추가하지 않음
    }

    const currentText = state.messages[index].chatMessage;
    // 기존 메시지 영역을 비우고 textarea 추가
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-textarea';
    textarea.value = currentText;
    messageDiv.innerHTML = ''; // 기존 내용을 지운 뒤 textarea만 넣음
    messageDiv.appendChild(textarea);

    // 버튼 생성 (저장, 취소, 삭제 버튼)
    const editButtonsContainer = document.createElement('div');
    editButtonsContainer.className = 'edit-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = '저장';
    saveButton.className = 'save-button';
    editButtonsContainer.appendChild(saveButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '취소';
    cancelButton.className = 'cancel-button';
    editButtonsContainer.appendChild(cancelButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '삭제';
    deleteButton.className = 'delete-button';
    editButtonsContainer.appendChild(deleteButton);

    // 버튼을 messageDiv 외부가 아닌 내부에 추가
    messageDiv.parentNode.appendChild(editButtonsContainer);

    // 편집 중인 메시지 설정
    editingIndex = index;

    // 화면 밖 클릭 감지를 위한 이벤트 핸들러
    function handleClickOutside(e) {
        const isClickInside = messageDiv.contains(e.target) || 
                            editButtonsContainer.contains(e.target);
        
        if (!isClickInside) {
            editingIndex = null;
            renderMessages();
            document.removeEventListener('click', handleClickOutside);
        }
    }

    // 다음 틱에서 이벤트 리스너 추가
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);

    // 저장 버튼 클릭 이벤트
    saveButton.addEventListener('click', function() {
        const newText = textarea.value.trim();
        if (newText) {
            state.messages[index].chatMessage = newText;
        }
        editingIndex = null;
        document.removeEventListener('click', handleClickOutside);
        renderMessages();
    });

    // 취소 버튼 클릭 이벤트
    cancelButton.addEventListener('click', function() {
        editingIndex = null;
        document.removeEventListener('click', handleClickOutside);
        renderMessages();
    });

    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener('click', function() {
        const confirmDelete = confirm('정말로 이 메시지를 삭제하시겠습니까?');
        if (confirmDelete) {
            state.messages.splice(index, 1);
            editingIndex = null;
            document.removeEventListener('click', handleClickOutside);
            renderMessages();
        }
    });

    // Enter (저장) / Escape (취소) 키 이벤트
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const newText = textarea.value.trim();
            if (newText) {
                state.messages[index].chatMessage = newText;
            }
            editingIndex = null;
            document.removeEventListener('click', handleClickOutside);
            renderMessages();
        }
        if (e.key === 'Escape') {
            editingIndex = null;
            document.removeEventListener('click', handleClickOutside);
            renderMessages();
        }
    });

    // 커서 위치 자동 조정 (마우스 커서가 끝으로 가는 것을 방지)
    textarea.addEventListener('focus', function() {
        setTimeout(() => {
            const cursorPosition = textarea.selectionStart;
            textarea.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    });

    // textarea 클릭 시 포커스가 사라지지 않도록
    textarea.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

window.startEdit = startEdit;

    // Storage management
    function saveProfiles() {
    try {
        // 프로필 정보 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.PROFILES, JSON.stringify({
            displayNames: state.displayNames,
            userProfileImages: state.userProfileImages,
            userColors: state.userColors
        }));
        
        // 선택된 사용자 저장
        localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_USERS, 
            JSON.stringify(Array.from(state.selectedUsers)));
    } catch (error) {
        console.error('Error saving profiles:', error);
    }
}

   function loadProfiles() {
    try {
        const savedProfiles = localStorage.getItem(LOCAL_STORAGE_KEYS.PROFILES);
        if (savedProfiles) {
            const profiles = JSON.parse(savedProfiles);
            state.displayNames = profiles.displayNames || {};
            state.userProfileImages = profiles.userProfileImages || {};
            state.userColors = profiles.userColors || {};
        }

        // 저장된 선택 사용자 불러오기
        const savedSelectedUsers = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_USERS);
        if (savedSelectedUsers) {
            state.selectedUsers = new Set(JSON.parse(savedSelectedUsers));
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
    }
}
    // UI Updates
    function updateProfileUI(username) {
        const usernameElement = document.getElementById(`username-${username}`);
        if (usernameElement) {
            usernameElement.textContent = state.displayNames[username];
        }

        const profileImageElement = document.getElementById(`profile-img-${username}`);
        if (profileImageElement) {
            if (state.userProfileImages[username]) {
                profileImageElement.src = state.userProfileImages[username];
                profileImageElement.style.backgroundColor = '';
            } else {
                profileImageElement.style.backgroundColor = '#ccc';
                profileImageElement.style.backgroundImage = '';
            }
        }
    }

    const darkModeStyles = `
body.dark .chat-message .username {
    color: #ffffff;
}

body:not(.dark) .chat-message .username {
    color: #000000;
}
`;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = darkModeStyles;
    document.head.appendChild(styleSheet);

  window.themeState = {
    isDark: localStorage.getItem('theme-preference') === 'dark'
};

function createMessageHTML(message, index) {
    const { time, username, chatMessage } = message;
    const displayName = state.displayNames[username] || username;
    const profileImage = state.userProfileImages[username];
    const isMyMessage = state.selectedUsers.has(username);
    // isDarkMode를 window.themeState에서 가져오도록 수정
    const isDarkMode = window.themeState.isDark;

    const userColor = isDarkMode ? '#e2e8f0' : (state.userColors[username] || '#000');
    const messageContainerStyle = isMyMessage ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:12px;align-items:start;' : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:12px;align-items:start;';
    const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
    const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
    const imgStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
    const wrapperStyle = isMyMessage ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;' : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
    const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor}`;
    const contentStyle = isMyMessage ? (isDarkMode ? 'padding:10px 16px;border-radius:20px;background-color:#2d6a4f;color:#e2e8f0;word-break:break-word;max-width:100%;cursor:pointer;' : 'padding:10px 16px;border-radius:20px;background-color:#b3e6b3;color:#333;word-break:break-word;max-width:100%;cursor:pointer;') : (isDarkMode ? 'padding:10px 16px;border-radius:20px;background-color:#4c4f56;color:#e2e8f0;word-break:break-word;max-width:100%;cursor:pointer;' : 'padding:10px 16px;border-radius:20px;background-color:#f1f1f1;color:#333;word-break:break-word;max-width:100%;cursor:pointer;');
    const timeStyle = 'font-size:12px;color:#888;margin-top:3px;';
    const formattedMessage = escapeHtml(chatMessage).replace(/\n/g, '<br>');

    return `<div style="${messageContainerStyle}" data-index="${index}"><div style="${profileStyle}"><div style="${pictureStyle}">${profileImage ? `<img src="${profileImage}" alt="${escapeHtml(displayName)}" style="${imgStyle}">` : ''}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${escapeHtml(displayName)}</div><div class="message-content" style="${contentStyle}" onclick="startEdit(${index})">${formattedMessage}</div><div style="${timeStyle}">${escapeHtml(time)}</div></div></div>`;
}

// toggleDarkMode 함수 수정
function toggleDarkMode() {
    window.themeState.isDark = !window.themeState.isDark;
    
    localStorage.setItem('theme-preference', window.themeState.isDark ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', window.themeState.isDark);
    
    // 채팅 컨테이너 즉시 업데이트
    if (state.messages && state.messages.length > 0) {
        renderMessages();
    }
    
    showStatusMessage();
}
    
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

    // 라이트 모드로 강제 설정하여 메시지 생성
    const exportMessages = state.messages
        .map((msg, idx) => {
            const tempState = { ...state };
            // 내보내기용 메시지 생성 시 라이트 모드 강제 적용
            localStorage.setItem('theme-preference', 'light');
            const messageHTML = createMessageHTML(msg, idx);
            return messageHTML;
        })
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
    
    // Add this to your existing JavaScript code
    function initializeMultiSelect() {
        const state = {
            selectedMessages: new Set(),
            bulkActionBar: null
        };

        function updateBulkActionBar() {
            if (state.selectedMessages.size > 0) {
                if (!state.bulkActionBar) {
                    state.bulkActionBar = document.createElement('div');
                    state.bulkActionBar.className = 'bulk-action-bar';
                    state.bulkActionBar.innerHTML = `
                    <span class="selected-count">${state.selectedMessages.size}개의 메시지 선택됨</span>
                    <button class="bulk-delete-btn">선택 삭제</button>
                `;
                    const chatContainer = document.getElementById('chat-container');
                    chatContainer.insertBefore(state.bulkActionBar, chatContainer.firstChild);

                    state.bulkActionBar.querySelector('.bulk-delete-btn').addEventListener('click', () => {
                        if (confirm(`${state.selectedMessages.size}개의 메시지를 삭제하시겠습니까?`)) {
                            const indicesToDelete = Array.from(state.selectedMessages).sort((a, b) => b - a);
                            indicesToDelete.forEach(index => {
                                deleteMessage(index);
                            });
                            state.selectedMessages.clear();
                            updateBulkActionBar();
                        }
                    });
                } else {
                    state.bulkActionBar.querySelector('.selected-count').textContent =
                        `${state.selectedMessages.size}개의 메시지 선택됨`;
                }
            } else if (state.bulkActionBar) {
                state.bulkActionBar.remove();
                state.bulkActionBar = null;
            }
        }

        document.getElementById('chat-container').addEventListener('change', (e) => {
            if (e.target.classList.contains('message-select')) {
                const messageIndex = parseInt(e.target.dataset.index);
                if (e.target.checked) {
                    state.selectedMessages.add(messageIndex);
                } else {
                    state.selectedMessages.delete(messageIndex);
                }
                updateBulkActionBar();
            }
        });

        const originalDeleteMessage = window.deleteMessage;
        window.deleteMessage = function(index) {
            originalDeleteMessage(index);
            state.selectedMessages.delete(index);
            const newSelected = new Set();
            state.selectedMessages.forEach(idx => {
                if (idx > index) {
                    newSelected.add(idx - 1);
                } else if (idx < index) {
                    newSelected.add(idx);
                }
            });
            state.selectedMessages = newSelected;
            updateBulkActionBar();
        };
    }

    document.addEventListener('DOMContentLoaded', function() {
        initializeMultiSelect();
    });

    state.isFirstLoad = true;

    function renderMessages() {
    const selectedUser = elements.chatUserSelect.value;
    const chatContainer = elements.chatContainer;
    const previousScrollTop = chatContainer.scrollTop;
    const previousScrollHeight = chatContainer.scrollHeight;

    const formattedMessages = state.messages.map((message, index) =>
        createMessageHTML(message, index, selectedUser)
    ).join('\n');

    state.transformedHtml = `<div>${formattedMessages}</div>`;
    chatContainer.innerHTML = state.transformedHtml;

    // 채팅 컨테이너 스크롤 위치 복원
    if (state.isFirstLoad) {
        chatContainer.scrollTop = 0;
        state.isFirstLoad = false;
    } else {
        chatContainer.scrollTop = previousScrollTop + (chatContainer.scrollHeight - previousScrollHeight);
    }
}

    
    elements.analyzeBtn.addEventListener('click', () => {
    const chatData = elements.inputText.value.trim();
    if (!chatData) {
        alert('채팅 데이터를 입력해주세요!');
        return;
    }

    // 메시지 파싱
    state.messages = parseMessages(chatData);
    
    // 유니크 유저네임 가져오기
    const usernames = new Set(state.messages.map(msg => msg.username));

    if (usernames.size > MAX_USERS) {
        alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        elements.userProfiles.innerHTML = '';
        elements.userProfiles.style.display = 'none';
        elements.userSelect.innerHTML = '';
        elements.userSelect.style.display = 'none';
        return;
    }

    // Create profile inputs
    elements.userProfiles.innerHTML = '<h3 style="margin-bottom: 15px;">채팅 참여자 프로필 설정</h3>';
    Array.from(usernames).forEach(username => {
        elements.userProfiles.appendChild(createProfileInput(username));
    });
    elements.userProfiles.style.display = 'block';

    // Update user selection UI
    elements.userSelect.innerHTML = `
        <div class="user-select-container">
            <h3>내 메시지로 표시할 사용자</h3>
            <div id="user-checkboxes" class="user-checkboxes"></div>
        </div>
    `;

    const checkboxContainer = document.getElementById('user-checkboxes');
    Array.from(usernames).forEach(username => {
        const label = document.createElement('label');
        label.className = 'user-checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = username;
        // 저장된 선택 상태 반영
        checkbox.checked = state.selectedUsers.has(username);
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.selectedUsers.add(username);
            } else {
                state.selectedUsers.delete(username);
            }
            saveProfiles(); // 선택 상태가 변경될 때마다 저장
            renderMessages();
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(state.displayNames[username] || username));
        checkboxContainer.appendChild(label);
    });

    elements.userSelect.style.display = 'block';
    renderMessages();
});


elements.convertBtn.addEventListener('click', () => {
    const chatData = elements.inputText.value.trim();
    if (!chatData) {
        alert('채팅 데이터를 입력해주세요!');
        return;
    }

    // Use the shared parser
    state.messages = parseMessages(chatData);

    // Validate participant count
    const usernames = new Set(state.messages.map(msg => msg.username));
    if (usernames.size >= MAX_USERS + 1) {
        alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        return;
    }

    // Hide user profiles and user selection when converting
    elements.userProfiles.style.display = 'none';
    elements.userSelect.style.display = 'none';
    renderMessages();
});
    
    elements.clearBtn.addEventListener('click', () => {
        if (confirm('채팅 데이터와 입력을 지우시겠습니까?')) {
            state.messages = [];
            state.selectedUsers.clear(); // Clear selected users
            renderMessages();

            elements.inputText.value = '';
            elements.userProfiles.style.display = 'none';
            elements.userSelect.style.display = 'none';

            const userProfileNames = document.querySelectorAll('.user-profile');
            userProfileNames.forEach(profile => {
                profile.classList.remove('selected');
            });
        }
    });

    function showStatusMessage() {
        const statusMessage = document.getElementById('statusMessage');

        // 메시지 보여주기
        statusMessage.style.display = 'block'; // 메시지 표시

        // 애니메이션 시작 (위로 올라오며 나타남)
        setTimeout(() => {
            statusMessage.style.opacity = '1';
            statusMessage.style.bottom = '10px';
        }, 10); // 10ms 뒤에 애니메이션 효과 시작

        // 2초 후 메시지를 아래로 내려서 숨기기
        setTimeout(() => {
            statusMessage.style.opacity = '0';
            statusMessage.style.bottom = '-50px';

            // 애니메이션 종료 후 숨기기
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 500); // 애니메이션 종료 후 display: none 처리
        }, 2000); // 2초 뒤에 내려감
    }

    // 버튼 클릭 시 메시지를 표시하도록 연결
    document.getElementById('themeToggle').addEventListener('click', function() {
        showStatusMessage();
    });

    // Utility functions
    function escapeHtml(str) {
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.documentElement.textContent || str;
    }

    // Initialize
    loadProfiles();
});

window.state = state;
