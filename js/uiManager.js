// /js/uiManager.js - 통합 UI 생성 및 관리 모듈

/**
 * UI 관리자 모듈 - 사용자 인터페이스 생성, 관리, 테마 처리
 */
const UIManager = {
    /**
     * 상태 메시지 표시
     * @param {string} message - 표시할 메시지
     * @param {boolean} isDarkMode - 다크모드 여부
     */
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

    /**
     * 로딩 오버레이 표시/숨김
     * @param {boolean} show - 표시 여부
     * @param {string} message - 표시할 메시지
     */
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

    /**
     * 동일한 시간대와 사용자의 메시지인지 확인하는 함수
     * @param {Object} message - 현재 메시지
     * @param {number} index - 현재 메시지 인덱스
     * @param {Object} state - 애플리케이션 상태
     * @returns {boolean} 동일한 시간과 사용자인지 여부
     */
    isSameTimeAndUser(message, index, state) {
        // 첫 번째 메시지는 연속 메시지가 아님
        if (index <= 0) return false;
        
        const prevMessage = state.messages[index - 1];
        if (!prevMessage) return false;
        
        // 같은 사용자인지 확인
        const sameUser = message.username === prevMessage.username;
        
        // 같은 시간대인지 확인 (시간 형식 비교)
        let sameTime = false;
        if (typeof MessageParser !== 'undefined' && MessageParser) {
            sameTime = MessageParser.isSameTimeFrame(message.time, prevMessage.time);
        } else {
            // 간단한 시간 비교 (MessageParser 없을 경우)
            sameTime = message.time === prevMessage.time;
        }
        
        return sameUser && sameTime;
    },

    /**
     * 단일 채팅 메시지 HTML 생성
     * @param {Object} message - 메시지 객체
     * @param {number} index - 메시지 인덱스
     * @param {Object} state - 애플리케이션 상태
     * @param {boolean} isContinuousMessage - 연속된 메시지 여부
     * @param {boolean} isLastMessage - 그룹에서 마지막 메시지 여부
     * @returns {string} 메시지 HTML
     */
    createMessageHTML(message, index, state, isContinuousMessage = false, isLastMessage = true) {
        const { time, username, chatMessage } = message;
        const displayName = state.displayNames[username] || username;
        const isMyMessage = state.selectedUsers.has(username);
        
        // 동일 사용자, 동일 시간, 연속 메시지인지 확인
        const isTrueContinuousMessage = isContinuousMessage && this.isSameTimeAndUser(message, index, state);
        
        // 프로필 이미지 처리
        let profileImage = state.userProfileImages[username];
        let profileHTML = '';
        
        // 내 메시지의 프로필 이미지 표시 여부 확인
        const showMyImage = state.showMyProfile !== false;
        
        // 내 메시지이고 이미지를 표시하지 않는 설정이면 빈 문자열 반환
        if (isMyMessage && !showMyImage) {
            profileHTML = '';
        } else if (profileImage) {
            // 프로필 이미지가 있는 경우 (일반 메시지 또는 내 메시지 이미지 표시 설정)
            // 외부 이미지 URL 처리
            if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
                profileHTML = `<img src="${this._escapeHtml(profileImage)}" alt="${this._escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`;
            }
            // 내부 이미지 처리
            else {
                if (typeof ImageHandler !== 'undefined' && ImageHandler) {
                    profileImage = ImageHandler.decompressImageUrl(profileImage);
                }
                profileHTML = `<img src="${profileImage}" alt="${this._escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`;
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
                ? '20px 0 20px 20px'  // 오른쪽 상단 모서리만 직각, 오른쪽 하단 모서리는 둥글게
                : '0 20px 20px 20px'; // 왼쪽 상단 모서리만 직각, 왼쪽 하단 모서리는 둥글게
        } else if (isTrueContinuousMessage) {
            // 연속된 메시지 중 중간 메시지 (동일 시간, 동일 사용자)
            bubbleRadius = isMyMessage
                ? '20px 0 0 20px'  // 오른쪽 상단+하단 모서리 직각, 왼쪽 모서리 둥글게
                : '0 20px 20px 0'; // 왼쪽 상단+하단 모서리 직각, 오른쪽 모서리 둥글게
        } else {
            // 연속 메시지의 첫 번째 메시지 (마지막이 아닌)
            bubbleRadius = isMyMessage
                ? '20px 0 0 20px'  // 오른쪽 상단+하단 모서리 직각, 왼쪽 모서리 둥글게
                : '0 20px 20px 0'; // 왼쪽 상단+하단 모서리 직각, 오른쪽 모서리 둥글게
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
        
        // 사용자 이름 스타일 (연속 메시지일 경우 숨김)
        const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isTrueContinuousMessage ? 'display:none;' : ''}`;
        
        // 말풍선 스타일
        const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;cursor:pointer;background-color:${bubbleColor};color:${textColor};`;
        
        // 시간 스타일 (연속 메시지의 마지막 메시지가 아니면 숨김)
        const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLastMessage ? '' : 'display:none;'}`;
        
        // 말풍선 꼬리 위치와 모양 - 동일 사용자, 동일 시간의 연속 메시지가 아닐 경우에만 꼬리 표시
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
        
        // 프로필 관련 HTML 구성
        let profileSection = '';
        
        // 내 메시지이고 이미지 표시 설정이 꺼져 있는 경우, 프로필 섹션을 출력하지 않음
        if (isMyMessage && !showMyImage) {
            // 프로필 영역 없음 (완전 제거)
            profileSection = '';
        } else {
            // 일반적인 프로필 영역 생성
            const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
            const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
            
            // 연속 메시지여부에 따라 프로필 표시/숨김
            const profileVisibilityStyle = isTrueContinuousMessage ? 'display:none;' : '';
            
            profileSection = `<div style="${profileStyle}${profileVisibilityStyle}">
                <div style="${pictureStyle}">${profileHTML}</div>
            </div>`;
        }
        
        // 연속 메시지의 경우 프로필 영역과 사용자 이름을 완전히 생략한 구조로 변경
        let messageHtml;
        
        if (isTrueContinuousMessage) {
            // 연속 메시지: 프로필 영역 없이 (또는 숨김 처리된) 말풍선만 표시
            if (isMyMessage && !showMyImage) {
                // 내 메시지이고 이미지 표시 설정이 꺼져 있는 경우
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    <div style="${wrapperStyle}">
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            } else {
                // 일반 연속 메시지
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    <div style="width:40px;margin:0 10px;flex-shrink:0;"></div>
                    <div style="${wrapperStyle}">
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            }
        } else {
            // 첫 번째 메시지: 프로필 및 사용자 이름 표시
            if (isMyMessage && !showMyImage) {
                // 내 메시지이고 이미지 숨김 설정인 경우
                messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this._escapeHtml(username)}">
                    <div style="${wrapperStyle}">
                        <div style="${usernameStyle}">${this._escapeHtml(displayName)}</div>
                        <div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})">
                            <div style="${tailStyle}"></div>
                            ${formattedMessage}
                        </div>
                        <div style="${timeStyle}">${this._escapeHtml(time)}</div>
                    </div>
                </div>`;
            } else {
                // 일반 메시지 또는 내 메시지이지만 이미지 표시 설정인 경우
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
    
    /**
     * HTML 이스케이프 함수 - 특수 문자를 HTML 엔티티로 변환
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     * @private
     */
    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
    },
    
    /**
     * 간단한 메시지 텍스트 포맷팅 함수 - @ 태그 처리 및 줄바꿈 변환
     * MessageParser가 없을 때 폴백으로 사용
     * @param {string} text - 포맷팅할 메시지 텍스트
     * @param {Object} [state] - 애플리케이션 상태 (참여자 목록 접근용)
     * @returns {string} 포맷팅된 메시지 HTML
     * @private
     */
    _formatMessageText(text, state = null) {
        if (!text) return '';
        
        // 기본 @태그 처리
        text = text.replace(/@([^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');
        
        // 줄바꿈 처리
        return text.replace(/\n/g, '<br>');
    },
    
    /**
     * 테마 관련 기능 (ThemeManager와 통합)
     */
    
    /**
     * 테마 전환 함수
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
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

    /**
     * 테마 초기화 함수
     * @param {Object} state - 애플리케이션 상태 객체
     */
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

    /**
     * 업데이트 로그 토글 함수
     */
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

    /**
     * 업데이트 로그 토글 초기화 함수
     */
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
    
    /**
     * 테마 변경 이벤트 발생 함수
     * @param {boolean} isDarkMode - 다크모드 여부
     * @private
     */
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