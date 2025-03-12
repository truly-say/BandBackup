// /js/exportManager.js - HTML 내보내기 및 복사 관리 모듈

// HTML 내보내기 및 복사 관리 모듈
const ExportManager = {
    // 이미지 캐싱 시스템
    imageCache: {},
    imageCacheCounter: 0,

    // HTML 내보내기
    copyHtmlToClipboard: async function (state, showStatus, toggleLoading) {
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
            // 이미지 최적화 적용 (내보내기 전)
            if (typeof ImageHandler !== 'undefined' && ImageHandler) {
                if (typeof showStatus === 'function') {
                    showStatus('이미지 최적화 중...', state.darkMode);
                }

                // 이미지 최적화 메서드로 변경
                await ImageHandler.optimizeAllUserImages(state);
            }

            // HTML 생성
            if (typeof showStatus === 'function') {
                showStatus('HTML 생성 중...', state.darkMode);
            }

            // 각 사용자별 이미지 분석 및 CSS 클래스 매핑 생성
            const userImageMap = new Map(); // username -> CSS 클래스 ID
            let classIdCounter = 1;

            // 각 사용자별 메시지 개수 카운팅
            const userMessageCounts = new Map(); // username -> 메시지 수

            // 메시지 수 계산
            state.messages.forEach(msg => {
                const count = userMessageCounts.get(msg.username) || 0;
                userMessageCounts.set(msg.username, count + 1);
            });

            // 이미지가 있고 2개 이상 메시지가 있는 사용자만 CSS 클래스 할당
            for (const [username, count] of userMessageCounts.entries()) {
                if (count >= 2 && state.userProfileImages[username]) {
                    userImageMap.set(username, `u${classIdCounter++}`);
                }
            }

            // CSS 스타일 생성 - 사용자별 이미지 클래스
            let cssStyles = '<style>\n';
            userImageMap.forEach((classId, username) => {
                const imageUrl = state.userProfileImages[username];
                if (imageUrl) {
                    cssStyles += `.${classId}{background-image:url("${imageUrl}");}\n`;
                }
            });
            cssStyles += '</style>\n';

            const exportMessages = [];

            // 메시지 그룹화와 처리
            let currentUsername = null;
            let currentTimeMinute = null;
            let messageGroup = [];

            // 모든 메시지 처리
            for (let i = 0; i < state.messages.length; i++) {
                const message = state.messages[i];
                const { username, time } = message;

                // 시간에서 분 단위 추출 - "2024년 1월 28일 오전 1:28" 형식 가정
                const timeMatch = time.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
                const timeMinute = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}-${timeMatch[4]}-${timeMatch[5]}-${timeMatch[6]}` : null;

                if (username !== currentUsername || timeMinute !== currentTimeMinute) {
                    // 새 그룹 시작 - 이전 그룹 처리
                    if (messageGroup.length > 0) {
                        this.processMessageGroup(messageGroup, exportMessages, state, userImageMap);
                    }

                    // 새 그룹 시작
                    currentUsername = username;
                    currentTimeMinute = timeMinute;
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
                this.processMessageGroup(messageGroup, exportMessages, state, userImageMap);
            }

            // 폰트 사이즈가 적용된 HTML 생성
            let fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;font-size:${state.fontSize || 16}px;">${cssStyles}${exportMessages.join('')}</div>`;

            // 줄바꿈, 불필요한 공백 제거하여 1줄로 압축
            fullHtml = fullHtml.replace(/\s+/g, ' ')
                .replace(/> </g, '><')
                .replace(/\n/g, '')
                .trim();

            // 압축된 이미지 URL을 복원 (HTML 복사 시에만)
            if (typeof Compressor !== 'undefined' && Compressor) {
                fullHtml = Compressor.decompressAllImages(fullHtml);
            }

            // 클립보드에 복사
            await navigator.clipboard.writeText(fullHtml);

            // 분석 결과 로깅 (개발자 확인용)
            const totalImageUrls = Object.keys(state.userProfileImages).length;
            const cssClassCount = userImageMap.size;
            const totalMessages = state.messages.length;
            const optimizedMessages = Array.from(userMessageCounts.entries())
                .filter(([username]) => userImageMap.has(username))
                .reduce((sum, [_, count]) => sum + count, 0);

            console.log('사용자 이미지 최적화 분석:', {
                '총 사용자 수': uniqueUsers.size,
                '이미지 있는 사용자 수': totalImageUrls,
                'CSS 클래스 생성 수': cssClassCount,
                '총 메시지 수': totalMessages,
                '최적화된 메시지 수': optimizedMessages,
                '최적화 비율': ((optimizedMessages / totalMessages) * 100).toFixed(1) + '%'
            });

            if (typeof showStatus === 'function') {
                showStatus('채팅이 클립보드에 복사되었습니다!', state.darkMode);
            } else {
                alert('채팅이 클립보드에 복사되었습니다!');
            }
        } catch (error) {
            console.error('복사 중 오류 발생:', error);
            // 오류 처리 코드...
        } finally {
            // 처리 중 상태 해제
            if (typeof toggleLoading === 'function') {
                toggleLoading(false);
            }
            state.isProcessing = false;
        }
    },

    // 이미지 캐시 HTML 생성
    generateImageCacheHTML: function () {
        if (typeof ImageHandler === 'undefined' || !ImageHandler._imageCache) {
            return '';
        }

        const imageCacheHTML = Object.entries(ImageHandler._imageCache)
            .map(([hash, imageUrl]) =>
                `<img id="${hash}" src="${imageUrl}" style="display:none;">`
            )
            .join('');

        return `<div id="image-cache" style="display:none;">${imageCacheHTML}</div>`;
    },

    // 이미지 URL 캐싱 - 중복 이미지 효율화
    cacheImage: function (imageUrl) {
        // 캐싱 비활성화 - 원본 그대로 반환
        return imageUrl;
    },

    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // 메시지 그룹 처리
    processMessageGroup: function (messageGroup, exportMessages, state, userImageMap) {
        messageGroup.forEach((groupMsg, groupIndex) => {
            const { message, index } = groupMsg;
            const { time, username, chatMessage } = message;
            const displayName = state.displayNames[username] || username;
            const isMyMessage = state.selectedUsers.has(username);

            // 프로필 이미지 처리 - 사용자별 CSS 클래스 참조
            let profileHTML = '';

            if (state.userProfileImages[username]) {
                // 사용자에게 할당된 CSS 클래스가 있는지 확인
                if (userImageMap && userImageMap.has(username)) {
                    // CSS 클래스로 이미지 참조
                    const classId = userImageMap.get(username);
                    profileHTML = `<div class="${classId}" style="width:100%;height:100%;background-size:cover;background-position:center;"></div>`;
                } else {
                    // CSS 클래스가 없으면 직접 이미지 URL 포함
                    profileHTML = `<div style="width:100%;height:100%;background-image:url('${state.userProfileImages[username]}');background-size:cover;background-position:center;"></div>`;
                }
            }

            // 기존 코드 유지...
            const isFirst = groupIndex === 0;
            const isLast = groupIndex === messageGroup.length - 1;
            const isContinuous = !isFirst;
            const userColor = state.userColors[username] || '#000000';
            const bubbleColor = isMyMessage
                ? (state.darkMode ? '#2d3647' : '#d8f4e7')
                : (state.darkMode ? '#4c4f56' : '#f1f1f1');
            const textColor = isMyMessage
                ? (state.darkMode ? '#e2e8f0' : '#333')
                : (state.darkMode ? '#e2e8f0' : '#333');

            // 말풍선 둥근 모서리 스타일 계산
            let bubbleRadius;
            if (isLast) {
                bubbleRadius = isMyMessage ? '20px 4px 20px 20px' : '4px 20px 20px 20px';
            } else if (isContinuous) {
                bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
            } else {
                bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
            }

            // 폰트 사이즈를 포함한 기본 스타일
            const messageContainerStyle = isMyMessage
                ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;'
                : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';
            const marginStyle = isLast ? 'margin-bottom:10px;' : '';
            const wrapperStyle = isMyMessage
                ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;'
                : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
            const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isContinuous ? 'display:none;' : ''}`;
            const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;background-color:${bubbleColor};color:${textColor};font-size:${state.fontSize || 16}px;`;
            const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLast ? '' : 'display:none;'}`;

            // 메시지 포맷팅
            const formattedMessage = this.formatMessageText(this.escapeHtml(chatMessage), state);

            // 말풍선 꼬리 스타일
            let tailStyle = 'display:none;';
            if (!isContinuous) {
                tailStyle = isMyMessage
                    ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
                    : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
            }

            // 내 메시지의 프로필 이미지 표시 여부
            const showMyImage = state.showMyProfile !== false;

            let html;

            // HTML 구성...
            if (isContinuous) {
                // 연속 메시지: 프로필 영역 결정
                if (isMyMessage && !showMyImage) {
                    // 이미지 없이 메시지만 표시
                    html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
                } else {
                    // 일반적인 연속 메시지 (이미지 공간 보존)
                    html = `<div style="${messageContainerStyle}${marginStyle}"><div style="width:40px;margin:0 10px;flex-shrink:0;"></div><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
                }
            } else {
                // 첫 번째 메시지: 프로필 처리
                if (isMyMessage && !showMyImage) {
                    // 내 메시지 + 이미지 숨김: 프로필 영역 없음
                    html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${usernameStyle}">${this.escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
                } else {
                    // 일반 메시지 또는 내 메시지 + 이미지 표시
                    const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
                    const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';

                    html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${profileStyle}"><div style="${pictureStyle}">${profileHTML}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${this.escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
                }
            }

            // 각 메시지를 별도의 줄에 추가
            exportMessages.push(html);
        });
    },
    // HTML 이스케이프 함수
    escapeHtml: function (str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // 태그 강조 처리
    formatMessageText: function (text, state = null) {
        // MessageParser가 있으면 그것을 활용
        if (typeof MessageParser !== 'undefined' && MessageParser) {
            return MessageParser.formatMessageText(text, state);
        }

        if (!text) return '';

        // 자체 구현 (MessageParser 없을 경우)
        // 기본 패턴: @로 시작하는 일반 태그
        text = text.replace(/@([^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 대괄호 내 텍스트 패턴 - @[사망]강담윤, @[사망/NPC] 은이연
        text = text.replace(/@\[([^\]]+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@[$1]$2</span>');

        // 대괄호 내 숫자와 구분자 패턴 - @[31|23]강담윤, @[30/48] 한채희
        text = text.replace(/@\[(\d+[\|\/]\d+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@[$1]$2</span>');

        // 파이프(|) 구분자 패턴 - @34 | 15 | 범유라
        text = text.replace(/@(\d+\s*\|\s*\d+\s*\|\s*[^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 숫자 슬래시 패턴 - @34/15 범유라
        text = text.replace(/@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 숫자 띄어쓰기 구분자 패턴 - @34 15 범유라
        text = text.replace(/@(\d+\s+\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 시스템 및 특수 태그
        text = text.replace(/@(SYSTEM|BOT|ADMIN|Manager|총괄|부계|공지|관리자|매니저)/g, '<span style="color:#0d5bd1;font-weight:bold;">@$1</span>');

        // 줄바꿈 처리
        return text.replace(/\n/g, '<br>');
    }
};

// 전역 변수로 노출
window.ExportManager = ExportManager;

// 콘솔에 로드 확인 메시지 출력
console.log('ExportManager 모듈이 성공적으로 로드되었습니다.');