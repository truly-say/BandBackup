// /js/uiManager.js - 통합 UI 생성 및 관리 모듈

// UI 관리자 
const UIManager = {
    // 상태 메시지 표시 
    showStatusMessage(message, isDarkMode) {
        const statusMessage = document.getElementById('statusMessage');
        if (!statusMessage) return;

        // 메시지 내용 설정
        statusMessage.textContent = message || (isDarkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다');

        // 메시지 보여주기
        statusMessage.style.display = 'block';

        // 애니메이션 시작 (위에서 내려옴)
        setTimeout(() => {
            statusMessage.style.opacity = '1';
            statusMessage.style.top = '10px'; // 위에서 내려온 위치
        }, 10);

        // 2초 후 메시지를 위로 올려서 숨기기
        setTimeout(() => {
            statusMessage.style.opacity = '0';
            statusMessage.style.top = '-50px';

            // 애니메이션 종료 후 숨기기
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 500);
        }, 2000);
    },

    // 로딩 오버레이 표시/숨김
    toggleLoadingOverlay(show, message = '처리 중...') {
        // 기존 오버레이 찾기
        let overlay = document.getElementById('loading-overlay');

        // 표시 요청이면서 오버레이가 없으면 생성
        if (show && !overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';

            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';

            const messageEl = document.createElement('div');
            messageEl.className = 'loading-message';
            messageEl.textContent = message;
            messageEl.style.color = '#fff';
            messageEl.style.marginTop = '15px';
            messageEl.style.fontSize = '16px';

            const content = document.createElement('div');
            content.className = 'loading-content';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.alignItems = 'center';

            content.appendChild(spinner);
            content.appendChild(messageEl);
            overlay.appendChild(content);

            document.body.appendChild(overlay);

            // 애니메이션을 위한 지연 효과
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
        }
        // 숨김 요청이면서 오버레이가 있으면 제거
        else if (!show && overlay) {
            overlay.style.opacity = '0';

            // 트랜지션 효과 후 제거
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    },

    // 동일 사용자 및 시간 메시지 연속 여부 확인
    isSameTimeAndUser(message, index, state) {
        // 첫 번째 메시지는 연속 메시지가 아님
        if (index <= 0) return false;

        const prevMessage = state.messages[index - 1];
        if (!prevMessage) return false;

        // 1. 같은 사용자인지 확인
        const sameUser = message.username === prevMessage.username;
        if (!sameUser) return false;

        // 2. 같은 시간대인지 확인 (시간 형식 비교)
        let sameTime = false;
        if (typeof MessageParser !== 'undefined' && MessageParser) {
            sameTime = MessageParser.isSameTimeFrame(message.time, prevMessage.time);
        } else {
            // 간단한 시간 비교 (MessageParser 없을 경우)
            sameTime = message.time === prevMessage.time;
        }
        if (!sameTime) return false;

        // 3. 추가 - 중간에 다른 사용자의 메시지가 없는지 확인
        // 현재 메시지와 이전 메시지 사이에 다른 사용자의 메시지가 있는지 확인
        // (index - 1부터 역순으로 스캔하면서 다른 사용자를 만나면 연속 메시지가 아님)

        // 연속된 이전 메시지들을 확인
        let checkIndex = index - 2; // index-1은 이미 확인했으므로 그 이전부터 확인

        while (checkIndex >= 0) {
            const checkMessage = state.messages[checkIndex];

            // 시간이 다르면 연속성이 끊김 (시간 순서대로 정렬된 메시지 가정)
            if (!MessageParser.isSameTimeFrame(message.time, checkMessage.time)) {
                break;
            }

            // 다른 사용자의 메시지가 발견되면 연속 메시지가 아님
            if (checkMessage.username !== message.username) {
                return false;
            }

            checkIndex--;
        }

        // 모든 조건을 만족하면 연속 메시지임
        return true;
    },

    // 단일 메시지 HTML 생성
    createMessageHTML(message, index, state, isContinuousMessage = false, isLastMessage = true) {
        const { time, username, chatMessage } = message;
        const displayName = state.displayNames[username] || username;
        const isMyMessage = state.selectedUsers.has(username);

        // 연속 메시지 여부 확인 (명시적으로 전달받은 값 사용)
        const isTrueContinuousMessage = isContinuousMessage;

       // 프로필 이미지 처리
// 프로필 이미지 처리
let profileImage = state.userProfileImages[username];
let profileHTML = '';

// 내 메시지의 프로필 이미지 표시 여부 확인
const showMyImage = state.showMyProfile !== false;

// 프로필 이미지 처리 로직
if (profileImage) {
    try {
        // 외부 라이브러리 의존성 최소화
        profileHTML = `<img src="${profileImage}" alt="${this._escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`;
    } catch (error) {
        console.error('이미지 URL 처리 중 오류:', error);
        profileHTML = ''; // 오류 시 빈 HTML
    }
}

        const isDarkMode = state.darkMode;
        const userColor = isDarkMode ? '#e2e8f0' : (state.userColors[username] || '#000');

        // 메시지 스타일 설정
        const bubbleColor = isMyMessage
            ? (isDarkMode ? '#2d3647' : '#d8f4e7')
            : (isDarkMode ? '#4c4f56' : '#f1f1f1');

        const textColor = isMyMessage
            ? (isDarkMode ? '#e2e8f0' : '#333')
            : (isDarkMode ? '#e2e8f0' : '#333');

        // 말풍선 둥근 모서리 스타일 - 연속 메시지 여부와 위치에 따라 조정
        let bubbleRadius;
        if (isLastMessage) {
            // 마지막 메시지 (연속 또는 단일 메시지에 상관없이)
            bubbleRadius = isMyMessage
                ? '20px 4px 20px 20px'  // 오른쪽 상단 모서리를 살짝 둥글게
                : '4px 20px 20px 20px'; // 왼쪽 상단 모서리를 살짝 둥글게
        } else if (isTrueContinuousMessage) {
            // 연속된 메시지 중 중간 메시지
            bubbleRadius = isMyMessage
                ? '20px 4px 4px 20px'  // 오른쪽 상단+하단 모서리 살짝 둥글게
                : '4px 20px 20px 4px'; // 왼쪽 상단+하단 모서리 살짝 둥글게
        } else {
            // 연속 메시지의 첫 번째 메시지 (마지막이 아닌)
            bubbleRadius = isMyMessage
                ? '20px 4px 4px 20px'  // 오른쪽 상단+하단 모서리 살짝 둥글게
                : '4px 20px 20px 4px'; // 왼쪽 상단+하단 모서리 살짝 둥글게
        }

        // 기본 컨테이너 스타일
        const messageContainerStyle = isMyMessage
            ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;'
            : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';

        // 마지막 메시지만 여백 추가
        const marginStyle = isLastMessage ? 'margin-bottom:10px;' : '';

        // 메시지 영역 스타일
        const wrapperStyle = isMyMessage
            ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;'
            : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';

        // *** 중요 변경: 사용자 이름 표시 조건 ***
        // 연속 메시지일 경우 사용자 이름 숨김 (첫 번째 메시지만 이름 표시)
        const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isTrueContinuousMessage ? 'display:none;' : ''}`;

        // 말풍선 스타일 - 포지션 상대값 추가로 꼬리가 잘리지 않게 함
        const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;cursor:pointer;background-color:${bubbleColor};color:${textColor};`;

        // *** 중요 변경: 시간 표시 조건 ***
        // 마지막 메시지만 시간 표시 (연속 메시지의 마지막 메시지)
        const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLastMessage ? '' : 'display:none;'}`;

        // 말풍선 꼬리 위치와 모양 - 첫 번째 메시지에만 꼬리 표시
        let tailStyle = 'display:none;'; // 기본적으로 숨김

        if (!isTrueContinuousMessage) {
            tailStyle = isMyMessage
                ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
                : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
        }

        // @태그 처리 및 줄바꿈 처리
        const formattedMessage = typeof MessageParser !== 'undefined' && MessageParser
            ? MessageParser.formatMessageText(this._escapeHtml(chatMessage), state)
            : this._formatMessageText(this._escapeHtml(chatMessage), state);

        // 메시지 타입 클래스
        const messageType = isMyMessage ? "mine" : "other";

        // 메시지 HTML 구성 - 연속 메시지인지, 내 메시지인지, 이미지 표시 여부에 따라 다르게 구성
        let messageHtml;

        // 내 메시지이고 이미지 표시 설정이 꺼져 있는 경우
        if (isMyMessage && !showMyImage) {
            if (isTrueContinuousMessage) {
                // 연속된 내 메시지 (이미지 숨김)
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    <!-- 말풍선 꼬리 공간 유지 (30px, 화살표 위치/크기 감안) -->
                    <div style="width:30px;margin:0;flex-shrink:0;visibility:hidden;"></div>
                    <div style="${wrapperStyle}">
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            } else {
                // 첫 메시지 - 내 메시지 (이미지 숨김)
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    <!-- 말풍선 꼬리 공간 유지 (30px 여백) -->
                    <div style="width:30px;margin:0;flex-shrink:0;visibility:hidden;"></div>
                    <div style="${wrapperStyle}">
                        <div style="${usernameStyle}">${this._escapeHtml(displayName)}</div>
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            }
        } else {
            // 상대방 메시지 또는 내 메시지이면서 이미지 표시 설정인 경우

            // 프로필 관련 HTML 구성
            let profileSection = '';

            // 일반적인 프로필 영역 생성
            const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
            const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';

            // 연속 메시지일 경우 프로필 표시 조건 (공간은 유지, 이미지만 숨김)
            const profileVisibilityStyle = isTrueContinuousMessage ? 'visibility:hidden;' : '';

            profileSection = `<div style="${profileStyle}">
                <div style="${pictureStyle}${profileVisibilityStyle}">${profileHTML}</div>
            </div>`;

            if (isTrueContinuousMessage) {
                // 연속 메시지 (프로필 및 이름 숨김, 시간은 마지막에만 표시)
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    ${profileSection}
                    <div style="${wrapperStyle}">
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            } else {
                // 첫 번째 메시지: 프로필 및 사용자 이름 표시
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    ${profileSection}
                    <div style="${wrapperStyle}">
                        <div style="${usernameStyle}">${this._escapeHtml(displayName)}</div>
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            }
        }

        return messageHtml;
    },

    // 특수문자 HTML 이스케이프 함수
    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // 메시지 텍스트 포맷팅 함수
    _formatMessageText(text, state = null) {
        if (!text) return '';

        // 기본 @태그 처리
        text = text.replace(/@([^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 줄바꿈 처리
        return text.replace(/\n/g, '<br>');
    },

// 테마 관련 UI 처리 함수
    toggleTheme(state, renderMessages) {
        const body = document.body;

        // 다크모드 상태 토글
        state.darkMode = !state.darkMode;

        // DOM 업데이트
        body.classList.toggle('dark');

        // 설정 저장
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            StorageManager.saveThemePreference(state.darkMode);
        } else {
            localStorage.setItem('theme-preference', state.darkMode ? 'dark' : 'light');
        }

        // 상태 메시지 설정
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = state.darkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다';

            // 상태 메시지 스타일 업데이트
            statusMessage.style.backgroundColor = state.darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            statusMessage.style.color = state.darkMode ? '#e2e8f0' : '#333';
        }

        // 메시지 다시 렌더링
        if (state.messages && state.messages.length > 0 && typeof renderMessages === 'function') {
            renderMessages();
        }

        // 상태 메시지 표시
        this.showStatusMessage(null, state.darkMode);

        // 설정 패널 업데이트
        if (typeof SettingsPanel !== 'undefined' && SettingsPanel) {
            SettingsPanel.updateSettings(state);
        }

        // 테마 변경 이벤트 발생 (도움말 시스템 등에 알림)
        this._dispatchThemeChangeEvent(state.darkMode);
    },

    // 초기 테마 설정 함수
    initializeTheme(state) {
        const body = document.body;
        const statusMessage = document.getElementById('statusMessage');

        if (!body) return;

        // 테마 적용
        if (state.darkMode) {
            body.classList.add('dark');

            if (statusMessage) {
                statusMessage.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                statusMessage.style.color = '#e2e8f0';
            }
        } else {
            body.classList.remove('dark');

            if (statusMessage) {
                statusMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                statusMessage.style.color = '#333';
            }
        }

        // 테마 변경 이벤트 발생 (도움말 시스템 등에 알림)
        this._dispatchThemeChangeEvent(state.darkMode);
    },

    // 업데이트 로그 토글 함수
    toggleUpdateLog() {
        const content = document.querySelector('.update-content');
        const icon = document.querySelector('.toggle-icon');

        if (!content || !icon) return;

        content.classList.toggle('show');
        icon.style.transform = content.classList.contains('show') ? 'rotate(-180deg)' : 'rotate(0deg)';

        // 토글 상태를 localStorage에 저장
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            StorageManager.saveUpdateLogState(content.classList.contains('show'));
        } else {
            localStorage.setItem('updateLogOpen', content.classList.contains('show'));
        }
    },

    // 업데이트 로그 토글 초기화 함수
    initUpdateLogToggle() {
        const content = document.querySelector('.update-content');
        const icon = document.querySelector('.toggle-icon');

        let wasOpen = false;

        if (typeof StorageManager !== 'undefined' && StorageManager) {
            wasOpen = StorageManager.loadUpdateLogState();
        } else {
            wasOpen = localStorage.getItem('updateLogOpen') === 'true';
        }

        if (wasOpen && content && icon) {
            content.classList.add('show');
            icon.style.transform = 'rotate(-180deg)';
        }
    },

    // 테마 변경 이벤트 발생 함수
    _dispatchThemeChangeEvent(isDarkMode) {
        // 테마 변경 이벤트 발생
        const event = new CustomEvent('themeChanged', {
            detail: { isDarkMode: isDarkMode }
        });
        document.dispatchEvent(event);
    }
};

// 전역 변수로 노출
window.UIManager = UIManager;

// ThemeManager 호환성 유지
window.ThemeManager = {
    toggleTheme: UIManager.toggleTheme.bind(UIManager),
    initializeTheme: UIManager.initializeTheme.bind(UIManager),
    initUpdateLogToggle: UIManager.initUpdateLogToggle.bind(UIManager),
    _dispatchThemeChangeEvent: UIManager._dispatchThemeChangeEvent.bind(UIManager)
};

// 전역 함수로 등록 (HTML onclick에서 호출)
window.toggleUpdateLog = UIManager.toggleUpdateLog.bind(UIManager);