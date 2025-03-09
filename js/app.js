// /js/app.js - 메인 애플리케이션 로직

// 애플리케이션 상태 객체
const state = {
    messages: [],
    userProfileImages: {},
    userColors: {},
    displayNames: {},
    selectedUsers: new Set(),
    darkMode: false,
    isProcessing: false,
    isFirstLoad: true,
    highlightTags: true 
};

// DOM이 로드된 후 초기화
// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('앱 초기화 시작');
    
    // 저장된 설정 불러오기
    if (typeof StorageManager !== 'undefined' && StorageManager) {
        const profiles = StorageManager.loadProfiles();
        state.displayNames = profiles.displayNames;
        state.userProfileImages = profiles.userProfileImages;
        state.userColors = profiles.userColors;
        state.selectedUsers = profiles.selectedUsers;
        state.darkMode = StorageManager.loadThemePreference();
        
        // 태그 강조 설정 불러오기
        state.highlightTags = StorageManager.loadTagHighlightSetting();
        
        // 고급 설정 불러오기
        const advancedSettings = StorageManager.loadAdvancedSettings();
        if (advancedSettings) {
            state.highlightTags = advancedSettings.highlightTags;
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 테마 초기화
    if (typeof ThemeManager !== 'undefined' && ThemeManager) {
        ThemeManager.initializeTheme(state);
        ThemeManager.initUpdateLogToggle();
    }
    
    console.log('앱 초기화 완료');
});

/**
 * 이벤트 리스너 설정 함수
 */
function setupEventListeners() {
    console.log('이벤트 리스너 설정 중');
    
    // 버튼 요소 가져오기
    const analyzeBtn = document.getElementById('analyze-btn');
    const convertBtn = document.getElementById('convert-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const themeToggle = document.getElementById('themeToggle');
    
    // 채팅 분석 버튼
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            console.log('채팅 분석 버튼 클릭됨');
            handleAnalyze();
        });
    } else {
        console.error('analyze-btn 요소를 찾을 수 없습니다');
    }
    
    // 변환 버튼
    if (convertBtn) {
        convertBtn.addEventListener('click', function() {
            console.log('변환 버튼 클릭됨');
            handleConvert();
        });
    } else {
        console.error('convert-btn 요소를 찾을 수 없습니다');
    }
    
    // HTML 복사 버튼
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            console.log('HTML 복사 버튼 클릭됨');
            handleCopy();
        });
    } else {
        console.error('copy-btn 요소를 찾을 수 없습니다');
    }
    
    // 초기화 버튼
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            console.log('초기화 버튼 클릭됨');
            handleClear();
        });
    } else {
        console.error('clear-btn 요소를 찾을 수 없습니다');
    }
    
    // 테마 토글 버튼
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            console.log('테마 토글 버튼 클릭됨');
            if (typeof ThemeManager !== 'undefined' && ThemeManager) {
                ThemeManager.toggleTheme(state, renderMessages);
            } else {
                console.error('ThemeManager가 로드되지 않았습니다');
            }
        });
    } else {
        console.error('themeToggle 요소를 찾을 수 없습니다');
    }
    
    console.log('이벤트 리스너 설정 완료');
}

/**
 * 메시지 렌더링 함수
 */
function renderMessages() {
    console.log('메시지 렌더링 시작');
    
    if (!state.messages || state.messages.length === 0) {
        console.log('렌더링할 메시지가 없습니다');
        return;
    }
    
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) {
        console.error('chat-container 요소를 찾을 수 없습니다');
        return;
    }
    
    // 이전 스크롤 위치 저장
    const previousScrollTop = chatContainer.scrollTop;
    const previousScrollHeight = chatContainer.scrollHeight;
    
    let prevUsername = null;
    let messageHTML = [];
    
    for (let i = 0; i < state.messages.length; i++) {
        const message = state.messages[i];
        const { username } = message;
        
        const isSameUser = username === prevUsername;
        const isLast = i === state.messages.length - 1 || state.messages[i + 1].username !== username;
        
        // 연속 메시지 처리
        if (isSameUser) {
            let isContinuous = true;
            
            if (typeof MessageParser !== 'undefined' && MessageParser) {
                const timeMatch = MessageParser.isSameTimeFrame(state.messages[i - 1].time, message.time);
                isContinuous = timeMatch;
            }
            
            if (typeof UIManager !== 'undefined' && UIManager) {
                messageHTML.push(UIManager.createMessageHTML(message, i, state, isContinuous, isLast));
            }
        } else {
            // 새 사용자의 메시지
            if (typeof UIManager !== 'undefined' && UIManager) {
                messageHTML.push(UIManager.createMessageHTML(message, i, state, false, isLast));
            }
            prevUsername = username;
        }
    }
    
    // HTML 저장하고 화면에 출력
    chatContainer.innerHTML = messageHTML.join('');
    
    // 스크롤 위치 조정
    if (state.isFirstLoad) {
        chatContainer.scrollTop = 0;
        state.isFirstLoad = false;
    } else {
        chatContainer.scrollTop = previousScrollTop + (chatContainer.scrollHeight - previousScrollHeight);
    }
    
    console.log('메시지 렌더링 완료');
}

/**
 * 채팅 분석 처리 함수
 */
function handleAnalyze() {
    console.log('handleAnalyze 함수 실행 시작');
    
    const inputText = document.getElementById('input-text');
    if (!inputText) {
        console.error('input-text 요소를 찾을 수 없습니다');
        return;
    }
    
    const userProfiles = document.getElementById('user-profiles');
    if (!userProfiles) {
        console.error('user-profiles 요소를 찾을 수 없습니다');
        return;
    }
    
    const chatData = inputText.value.trim();
    if (!chatData) {
        alert('채팅 데이터를 입력해주세요!');
        return;
    }

    // 메시지 파싱
    if (typeof MessageParser !== 'undefined' && MessageParser) {
        console.log('MessageParser를 사용하여 메시지 파싱 중');
        state.messages = MessageParser.parseMessages(chatData);
    } else {
        console.error('MessageParser가 로드되지 않았습니다');
        // 간단한 파싱 기능 구현
        state.messages = [];
        const lines = chatData.split('\n');
        const regex = /^(\d{4}년\s*(?:0?[1-9]|1[0-2])월\s*(?:0?[1-9]|[12][0-9]|3[01])일\s*(?:오전|오후)\s*(?:0?[1-9]|1[0-2]):(?:[0-5][0-9])):([^:]+):(.+)$/;
        
        let currentMessage = null;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            const match = trimmedLine.match(regex);
            if (match) {
                if (currentMessage) state.messages.push(currentMessage);
                currentMessage = {
                    time: match[1].trim(),
                    username: match[2].trim(),
                    chatMessage: match[3].trim()
                };
            } else if (currentMessage) {
                currentMessage.chatMessage += '\n' + trimmedLine;
            }
        });
        
        if (currentMessage) state.messages.push(currentMessage);
    }
    
    console.log(`파싱된 메시지 개수: ${state.messages.length}`);
    
    // 유니크 유저네임 가져오기
    const usernames = new Set(state.messages.map(msg => msg.username));
    console.log(`고유 사용자 수: ${usernames.size}`);
    
    // 최대 지원 사용자 수 검증
    const MAX_USERS = 25;
    if (usernames.size > MAX_USERS) {
        alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        userProfiles.innerHTML = '';
        userProfiles.style.display = 'none';
        return;
    }

    // 프로필 설정 UI 생성
    if (typeof ProfileManager !== 'undefined' && ProfileManager && typeof ProfileManager.createProfileSettings === 'function') {
        console.log('ProfileManager를 사용하여 프로필 설정 UI 생성 중');
        ProfileManager.createProfileSettings(state, renderMessages);
    } else {
        console.error('ProfileManager가 로드되지 않았거나 createProfileSettings 함수가 없습니다');
    }

    // 프로필 설정 UI 생성 후 고급 설정 버튼 추가
    if (typeof ProfileManager !== 'undefined' && ProfileManager && typeof ProfileManager.createProfileSettings === 'function') {
        ProfileManager.createProfileSettings(state, renderMessages);
        
        // 고급 설정 버튼 추가
        if (typeof UIManager !== 'undefined' && UIManager && typeof UIManager.addAdvancedSettingsButton === 'function') {
            UIManager.addAdvancedSettingsButton(state);
        }
    }

    // 메시지 렌더링
    renderMessages();
    
    // 상태 메시지 표시
    if (typeof UIManager !== 'undefined' && UIManager) {
        UIManager.showStatusMessage('채팅 분석 완료!', state.darkMode);
    } else {
        console.error('UIManager가 로드되지 않았습니다');
        // 기본 알림 표시
        alert('채팅 분석 완료!');
    }
    
    console.log('handleAnalyze 함수 실행 완료');
}

/**
 * 채팅 변환 처리 함수
 */
function handleConvert() {
    console.log('handleConvert 함수 실행 시작');
    
    if (state.messages.length === 0) {
        const inputText = document.getElementById('input-text');
        if (!inputText) {
            console.error('input-text 요소를 찾을 수 없습니다');
            return;
        }
        
        const chatData = inputText.value.trim();
        if (!chatData) {
            alert('채팅 데이터를 입력해주세요!');
            return;
        }

        // 메시지 파싱
        if (typeof MessageParser !== 'undefined' && MessageParser) {
            state.messages = MessageParser.parseMessages(chatData);
        } else {
            alert('MessageParser 모듈이 로드되지 않았습니다. 먼저 채팅 분석을 실행해주세요.');
            return;
        }
    }
    
    // 참여자 수 검증
    const uniqueUsers = new Set(state.messages.map(msg => msg.username));
    if (uniqueUsers.size > 25) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 25명까지만 지원됩니다.`);
        return;
    }

    // 메시지 렌더링
    renderMessages();
    
    // 상태 메시지 표시
    if (typeof UIManager !== 'undefined' && UIManager) {
        UIManager.showStatusMessage('채팅 변환 완료! 이제 HTML을 복사할 수 있습니다.', state.darkMode);
    } else {
        alert('채팅 변환 완료! 이제 HTML을 복사할 수 있습니다.');
    }
    
    console.log('handleConvert 함수 실행 완료');
}

/**
 * HTML 복사 처리 함수
 */
function handleCopy() {
    console.log('handleCopy 함수 실행 시작');
    
    if (typeof ExportManager !== 'undefined' && ExportManager) {
        ExportManager.copyHtmlToClipboard(
            state, 
            function(message, isDarkMode) {
                // 상태 메시지 표시 콜백
                if (typeof UIManager !== 'undefined' && UIManager) {
                    UIManager.showStatusMessage(message, isDarkMode);
                } else {
                    alert(message);
                }
            },
            function(show, message) {
                // 로딩 오버레이 표시 콜백
                if (typeof UIManager !== 'undefined' && UIManager) {
                    UIManager.toggleLoadingOverlay(show, message);
                }
            }
        );
    } else {
        console.error('ExportManager가 로드되지 않았습니다');
        alert('내보내기 모듈이 로드되지 않았습니다.');
    }
    
    console.log('handleCopy 함수 실행 완료');
}

/**
 * 초기화 처리 함수
 */
function handleClear() {
    console.log('handleClear 함수 실행 시작');
    
    if (confirm('채팅 데이터와 입력을 지우시겠습니까?')) {
        const inputText = document.getElementById('input-text');
        const userProfiles = document.getElementById('user-profiles');
        const chatContainer = document.getElementById('chat-container');
        
        if (inputText) inputText.value = '';
        if (userProfiles) userProfiles.style.display = 'none';
        if (chatContainer) chatContainer.innerHTML = '';
        
        state.messages = [];
        state.isFirstLoad = true;
        
        if (typeof UIManager !== 'undefined' && UIManager) {
            UIManager.showStatusMessage('모든 데이터가 초기화되었습니다.', state.darkMode);
        } else {
            alert('모든 데이터가 초기화되었습니다.');
        }
    }
    
    console.log('handleClear 함수 실행 완료');
}

// 전역 함수로 노출
window.renderMessages = renderMessages;
window.handleAnalyze = handleAnalyze;
window.handleConvert = handleConvert;
window.handleCopy = handleCopy;
window.handleClear = handleClear;
window.startEdit = function(index) {
    if (typeof EditManager !== 'undefined' && EditManager) {
        EditManager.startEdit(index, state, renderMessages);
    } else {
        console.error('EditManager가 로드되지 않았습니다');
        alert('편집 모듈이 로드되지 않았습니다.');
    }
};

console.log('app.js 파일이 성공적으로 로드되었습니다.');