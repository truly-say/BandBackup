// /js/exportManager.js - HTML 내보내기 및 복사 관리 모듈

/**
 * 내보내기 관리자 모듈 - HTML 복사 및 내보내기 기능
 */
const ExportManager = {
    /**
     * HTML을 클립보드에 복사
     * @param {Object} state - 애플리케이션 상태
     * @param {Function} showStatus - 상태 메시지 표시 함수
     * @param {Function} toggleLoading - 로딩 표시 토글 함수
     */
    copyHtmlToClipboard: async function(state, showStatus, toggleLoading) {
        const chatContainer = document.getElementById('chat-container');
        if (!chatContainer || !chatContainer.innerHTML) {
            alert('먼저 채팅을 변환해주세요!');
            return;
        }
        
        // 이미 처리 중이면 중복 실행 방지
        if (state.isProcessing) {
            return;
        }
        
        // 참여자 수 검증
        const MAX_USERS = 25; // 최대 지원 사용자 수
        const uniqueUsers = new Set(state.messages.map(msg => msg.username));
        if (uniqueUsers.size >= MAX_USERS + 1) {
            alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
            return;
        }
        
        // 처리 중 상태 표시
    state.isProcessing = true;
    if (typeof toggleLoading === 'function') {
        toggleLoading(true, '채팅 내용을 복사 중입니다...');
    }
    
    try {
        // 비율 유지 이미지 최적화 적용 (내보내기 전)
        if (typeof AspectRatioOptimizer !== 'undefined') {
            if (typeof showStatus === 'function') {
                showStatus('이미지 최적화 중...', state.darkMode);
            }
            
            // 모든 사용자 이미지 최적화
            await AspectRatioOptimizer.optimizeAllUserImages(state);
        }
        
        // HTML 생성
        if (typeof showStatus === 'function') {
            showStatus('HTML 생성 중...', state.darkMode);
        }
            const exportMessages = [];
            
            // 메시지 그룹화와 처리
            let currentGroupUsername = null;
            let messageGroup = [];
            
            // 모든 메시지 처리
            for (let i = 0; i < state.messages.length; i++) {
                const message = state.messages[i];
                const { username } = message;
                
                if (username !== currentGroupUsername) {
                    // 새 그룹 시작 - 이전 그룹 처리
                    if (messageGroup.length > 0) {
                        this.processMessageGroup(messageGroup, exportMessages, state);
                    }
                    
                    // 새 그룹 시작
                    currentGroupUsername = username;
                    messageGroup = [{ message, index: i }];
                } else {
                    // 같은 그룹에 메시지 추가
                    messageGroup.push({ message, index: i });
                }
                
                // 대량 메시지 처리 시 진행 상황 표시 (100개 단위)
                if (i % 100 === 0 && i > 0 && typeof showStatus === 'function') {
                    showStatus(`메시지 처리 중... (${i}/${state.messages.length})`, state.darkMode);
                }
            }
            
            // 마지막 그룹 처리
            if (messageGroup.length > 0) {
                this.processMessageGroup(messageGroup, exportMessages, state);
            }
            
            // 최종 HTML 생성 - 각 메시지 간에 줄바꿈 추가
            let fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;">${exportMessages.join('\n')}</div>`;
            
            // 압축된 이미지 URL을 복원 (HTML 복사 시에만)
            if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                fullHtml = UrlCompressor.decompressAllImages(fullHtml);
            }
            
            // 클립보드에 복사
            await navigator.clipboard.writeText(fullHtml);
            if (typeof showStatus === 'function') {
                showStatus('채팅이 클립보드에 복사되었습니다!', state.darkMode);
            } else {
                alert('채팅이 클립보드에 복사되었습니다!');
            }
        } catch (error) {
            console.error('복사 중 오류 발생:', error);
            
            // 대체 복사 방법 시도
            try {
                const exportContainer = document.createElement('textarea');
                exportContainer.value = chatContainer.innerHTML;
                document.body.appendChild(exportContainer);
                exportContainer.select();
                document.execCommand('copy');
                document.body.removeChild(exportContainer);
                if (typeof showStatus === 'function') {
                    showStatus('채팅이 클립보드에 복사되었습니다! (대체 방식)', state.darkMode);
                } else {
                    alert('채팅이 클립보드에 복사되었습니다! (대체 방식)');
                }
            } catch (fallbackError) {
                alert('채팅 복사 중 오류가 발생했습니다. 다시 시도해주세요.');
                console.error('대체 복사 방법도 실패:', fallbackError);
            }
        } finally {
            // 처리 중 상태 해제
            if (typeof toggleLoading === 'function') {
                toggleLoading(false);
            }
            state.isProcessing = false;
        }
    },

    /**
     * 메시지 그룹을 처리하여 HTML 생성
     * @param {Array} messageGroup - 같은 사용자의 메시지 그룹
     * @param {Array} exportMessages - 결과 HTML을 저장할 배열
     * @param {Object} state - 애플리케이션 상태
     */
    processMessageGroup: function(messageGroup, exportMessages, state) {
        messageGroup.forEach((groupMsg, groupIndex) => {
            const { message, index } = groupMsg;
            const { time, username, chatMessage } = message;
            const displayName = state.displayNames[username] || username;
            const isMyMessage = state.selectedUsers.has(username);
            
            const isFirst = groupIndex === 0;
            const isLast = groupIndex === messageGroup.length - 1;
            const isContinuous = !isFirst;
            
            // 사용자 색상
            const userColor = state.userColors[username] || '#000000';
            
            // 메시지 스타일 설정
            const bubbleColor = isMyMessage 
                ? (state.darkMode ? '#2d3647' : '#d8f4e7')
                : (state.darkMode ? '#4c4f56' : '#f1f1f1');

            const textColor = isMyMessage
                ? (state.darkMode ? '#e2e8f0' : '#333')
                : (state.darkMode ? '#e2e8f0' : '#333');
            
            // 말풍선 둥근 모서리 스타일 - 연속 메시지 여부와 위치에 따라 조정
            let bubbleRadius;
            if (isContinuous) {
                // 연속 메시지의 경우, 특정 상단 모서리를 직각으로
                bubbleRadius = isMyMessage
                    ? '20px 0 20px 20px'  // 오른쪽 상단 모서리만 직각
                    : '0 20px 20px 20px'; // 왼쪽 상단 모서리만 직각
            } else {
                // 첫 메시지인 경우, 기본 스타일
                bubbleRadius = isMyMessage
                    ? '20px 0 20px 20px'  // 오른쪽 상단 모서리만 직각
                    : '0 20px 20px 20px'; // 왼쪽 상단 모서리만 직각
            }
                    
            const messageContainerStyle = isMyMessage 
                ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;' 
                : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';
                
            // 마지막 메시지만 여백 추가
            const marginStyle = isLast ? 'margin-bottom:10px;' : '';
                
            const wrapperStyle = isMyMessage 
                ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;' 
                : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
            
            // 프로필 이미지 영역
            const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
            const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
            
            // 연속 메시지일 경우 프로필 숨김
            const profileVisibilityStyle = isContinuous ? 'visibility:hidden;' : '';
            
            // 이미지 URL 사용 (있는 경우 - 압축된 상태 유지)
            const profileImage = state.userProfileImages[username]; // 압축 상태로 유지
            const profileHTML = profileImage 
                ? `<img src="${profileImage}" alt="${this.escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`
                : ''; // 이미지가 없으면 회색 배경만 표시
                    
            // 사용자 이름 (연속 메시지일 경우 표시 안 함)
            const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isContinuous ? 'display:none;' : ''}`;
            
            // 말풍선 스타일
            const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;background-color:${bubbleColor};color:${textColor};`;
            
            // 말풍선 꼬리 위치와 모양 - 연속 메시지가 아닐 경우에만 꼬리 표시
            let tailStyle = 'display:none;'; // 기본적으로 숨김
            
            if (!isContinuous) {
                tailStyle = isMyMessage
                    ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
                    : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
            }
            
            // 시간 (마지막 메시지만 표시)
            const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLast ? '' : 'display:none;'}`;
            
            // 메시지 포맷팅 - 참여자 목록 전달
            const formattedMessage = this.formatMessageText(this.escapeHtml(chatMessage), state);
            
            // 메시지 HTML 생성 (한 줄로 압축)
            const html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${profileStyle}${profileVisibilityStyle}"><div style="${pictureStyle}">${profileHTML}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${this.escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
            
            // 각 메시지를 별도의 줄에 추가 (메시지 개수 세기 용도)
            exportMessages.push(html);
        });
    },

    /**
     * HTML 이스케이프 함수
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     */
    escapeHtml: function(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
    },
    
    /**
     * 메시지 텍스트 포맷팅 함수 - 개선된 @태그 처리
     * @param {string} text - 포맷팅할 텍스트
     * @param {Object} state - 애플리케이션 상태 (참여자 목록 접근용)
     * @returns {string} 포맷팅된 HTML
     */
    formatMessageText: function(text, state = null) {
        // MessageParser가 있으면 그것을 활용
        if (typeof MessageParser !== 'undefined' && MessageParser) {
            return MessageParser.formatMessageText(text, state);
        }
        
        if (!text) return '';
        
        // 자체 구현 (MessageParser 없을 경우)
        // 정규식 패턴들
        const patterns = [
            // 패턴 1: @로 시작하고 공백이나 특수문자로 끝나는 패턴 (일반 사용자명)
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 패턴 2: 대괄호가 포함된 패턴 (@[숫자] 이름 형식)
            /@(\[\d+(?:\/\d+)?\]\s*[^\s:.,!?;()\[\]{}<>"']*)/g,
            
            // 패턴 3: 숫자 패턴 (@숫자 숫자 문자 이름 형식) 
            /@(\d+\s+\d+\s*[•]\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 패턴 4: 슬래시 패턴 (@숫자/숫자 이름 형식)
            /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 패턴 5: 특수 키워드
            /@(SYSTEM|BOT|ADMIN|Manager)/g
        ];
        
        let processedText = text;
        
        // 채팅 참여자 목록 (가능한 경우)
        let participants = new Set();
        if (state && state.messages) {
            state.messages.forEach(msg => {
                if (msg.username) {
                    participants.add(msg.username);
                }
            });
        }
        
        // 각 패턴에 대해 처리
        patterns.forEach(pattern => {
            processedText = processedText.replace(pattern, (match, tagContent) => {
                // '@'를 포함한 전체 태그를 파란색으로 처리
                return `<span style="color:#0d5bd1;font-weight:bold;">${match}</span>`;
            });
        });
        
        // 참여자 목록 기반 처리 (더 정교한 방식)
        if (participants.size > 0) {
            // '@' 뒤에 나오는 모든 것을 찾는 넓은 패턴
            processedText = processedText.replace(/@([^@<>\n]+)/g, (match, potentialName) => {
                // 이미 태그 처리된 경우 건너뛰기
                if (match.includes('<span')) {
                    return match;
                }
                
                // 공백이나 특수문자로 잘라내기
                const trimmedName = potentialName.split(/[\s:.,!?;()\[\]{}<>"']/)[0];
                
                // 참여자 목록에 있는지 확인
                if (trimmedName && participants.has(trimmedName)) {
                    return `<span style="color:#0d5bd1;font-weight:bold;">@${trimmedName}</span>${potentialName.substring(trimmedName.length)}`;
                }
                
                // 대략적인 일치 확인
                for (const participant of participants) {
                    if (potentialName.includes(participant)) {
                        const parts = potentialName.split(participant);
                        return `<span style="color:#0d5bd1;font-weight:bold;">@${participant}</span>${parts.slice(1).join(participant)}`;
                    }
                }
                
                // 기본 형식 처리
                if (trimmedName) {
                    return `<span style="color:#0d5bd1;font-weight:bold;">@${trimmedName}</span>${potentialName.substring(trimmedName.length)}`;
                }
                
                return match; // 변경 없음
            });
        }
        
        // 줄바꿈 처리
        return processedText.replace(/\n/g, '<br>');
    }
};

/**
 * HTML을 클립보드에 복사 - 티스토리 최적화 버전
 * @param {Object} state - 애플리케이션 상태
 * @param {Function} showStatus - 상태 메시지 표시 함수
 * @param {Function} toggleLoading - 로딩 표시 토글 함수
 */
ExportManager.copyHtmlToClipboardOptimized = async function(state, showStatus, toggleLoading) {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
    }
    
    // 이미 처리 중이면 중복 실행 방지
    if (state.isProcessing) {
        return;
    }
    
    // 참여자 수 검증
    const MAX_USERS = 25; // 최대 지원 사용자 수
    const uniqueUsers = new Set(state.messages.map(msg => msg.username));
    if (uniqueUsers.size >= MAX_USERS + 1) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        return;
    }
    
    // 처리 중 상태 표시
    state.isProcessing = true;
    if (typeof toggleLoading === 'function') {
        toggleLoading(true, '채팅 내용을 복사 중입니다...');
    }
    
    try {
        // 간소화된 이미지 최적화 적용 (내보내기 전)
        if (typeof SimpleImageOptimizer !== 'undefined') {
            if (typeof showStatus === 'function') {
                showStatus('이미지 최적화 중...', state.darkMode);
            }
            
            // 모든 사용자 이미지 최적화
            await SimpleImageOptimizer.optimizeAllUserImages(state);
        }
        
        // HTML 생성
        if (typeof showStatus === 'function') {
            showStatus('HTML 생성 중...', state.darkMode);
        }
        
        const exportMessages = [];
        
        // 메시지 그룹화와 처리
        let currentGroupUsername = null;
        let messageGroup = [];
        
        // 모든 메시지 처리
        for (let i = 0; i < state.messages.length; i++) {
            const message = state.messages[i];
            const { username } = message;
            
            if (username !== currentGroupUsername) {
                // 새 그룹 시작 - 이전 그룹 처리
                if (messageGroup.length > 0) {
                    this.processMessageGroup(messageGroup, exportMessages, state);
                }
                
                // 새 그룹 시작
                currentGroupUsername = username;
                messageGroup = [{ message, index: i }];
            } else {
                // 같은 그룹에 메시지 추가
                messageGroup.push({ message, index: i });
            }
            
            // 대량 메시지 처리 시 진행 상황 표시 (100개 단위)
            if (i % 100 === 0 && i > 0 && typeof showStatus === 'function') {
                showStatus(`메시지 처리 중... (${i}/${state.messages.length})`, state.darkMode);
            }
        }
        
        // 마지막 그룹 처리
        if (messageGroup.length > 0) {
            this.processMessageGroup(messageGroup, exportMessages, state);
        }
        
        // 3. 최종 HTML 생성 및 최적화
        if (typeof toggleLoading === 'function') {
            toggleLoading(true, '최종 변환 중...');
        }
        
        let fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;">${exportMessages.join('\n')}</div>`;
        
        // 티스토리 백업을 위한 HTML 최적화 (이미지 처리)
        if (typeof ImageOptimizer !== 'undefined' && ImageOptimizer) {
            if (typeof showStatus === 'function') {
                showStatus('티스토리 최적화 중...', state.darkMode);
            }
            fullHtml = await ImageOptimizer.optimizeHtmlForTistory(fullHtml);
        }
        // 기존 이미지 URL 복원
        else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
            fullHtml = UrlCompressor.decompressAllImages(fullHtml);
        }
        
        // 4. 클립보드에 복사
        await navigator.clipboard.writeText(fullHtml);
        
        if (typeof showStatus === 'function') {
            showStatus('티스토리 최적화 완료! 클립보드에 복사되었습니다.', state.darkMode);
        } else {
            alert('티스토리 최적화 완료! 클립보드에 복사되었습니다.');
        }
    } catch (error) {
        console.error('티스토리 최적화 중 오류 발생:', error);
        
        // 대체 복사 방법 시도
        try {
            const exportContainer = document.createElement('textarea');
            exportContainer.value = chatContainer.innerHTML;
            document.body.appendChild(exportContainer);
            exportContainer.select();
            document.execCommand('copy');
            document.body.removeChild(exportContainer);
            
            if (typeof showStatus === 'function') {
                showStatus('기본 방식으로 복사되었습니다. (최적화 실패)', state.darkMode);
            } else {
                alert('기본 방식으로 복사되었습니다. (최적화 실패)');
            }
        } catch (fallbackError) {
            alert('채팅 복사 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('대체 복사 방법도 실패:', fallbackError);
        }
    } finally {
        // 처리 중 상태 해제
        if (typeof toggleLoading === 'function') {
            toggleLoading(false);
        }
        state.isProcessing = false;
    }
};

// 원본 내보내기 함수를 티스토리 최적화 버전으로 교체
ExportManager.copyHtmlToClipboard = ExportManager.copyHtmlToClipboardOptimized;

// 전역 변수로 노출
window.ExportManager = ExportManager;

// 콘솔에 로드 확인 메시지 출력
console.log('ExportManager 모듈이 성공적으로 로드되었습니다.');