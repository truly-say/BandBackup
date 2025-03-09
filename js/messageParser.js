// /js/messageParser.js - 밴드 채팅 메시지 파싱 및 포맷팅 관련 모듈

/**
 * 메시지 파서 모듈 - 채팅 메시지 파싱 및 포맷팅
 */
const MessageParser = {
    /**
     * HTML 이스케이프 함수 - 특수 문자를 HTML 엔티티로 변환
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     */
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
    },

    /**
     * 메시지 텍스트 포맷팅 함수 - @ 태그 처리 및 줄바꿈 변환
     * @param {string} text - 포맷팅할 메시지 텍스트
     * @param {Object} [state] - 애플리케이션 상태 (참여자 목록 접근용)
     * @returns {string} 포맷팅된 메시지 HTML
     */
    formatMessageText(text, state = null) {
        if (!text) return '';
        
        // 태그 강조 설정 확인
        let highlightTags = true; // 기본값
        
        // state에서 태그 강조 설정 가져오기
        if (state && state.hasOwnProperty('highlightTags')) {
            highlightTags = state.highlightTags;
        }
        // LocalStorage에서 태그 강조 설정 가져오기 (state에 없는 경우)
        else if (typeof StorageManager !== 'undefined' && StorageManager) {
            highlightTags = StorageManager.loadTagHighlightSetting();
        }

        // 태그 강조 기능이 꺼져 있으면 줄바꿈만 처리하고 반환
        if (!highlightTags) {
            return text.replace(/\n/g, '<br>');
        }

        // 정규식 패턴들: 다양한 사용자명 형식 지원
        const patterns = [
            // 기본 패턴: '@'로 시작하고 공백이나 특수문자 전까지
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 패턴: '@[숫자] 이름' 또는 '@[숫자/숫자] 이름' 형식
            /@(\[\d+(?:\/\d+)?\]\s*[^\s:.,!?;()\[\]{}<>"']*)/g,
            
            // 숫자로 시작하는 패턴: '@숫자 숫자 • 이름' 형식
            /@(\d+\s+\d+\s*[•]\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 숫자/숫자 패턴: '@숫자/숫자 이름' 형식
            /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 특수 키워드 패턴: '@SYSTEM' 등
            /@(SYSTEM|BOT|ADMIN|Manager)/g,
            
            // 따옴표 패턴: '@"이름 with 공백"'
            /@"([^"]+)"/g
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
        
        // 패턴 기반 처리 (1차)
        patterns.forEach(pattern => {
            processedText = processedText.replace(pattern, (match, tagContent) => {
                // '@'를 포함한 전체 태그를 파란색으로 처리
                return `<span style="color:#0d5bd1;font-weight:bold;">${match}</span>`;
            });
        });
        
        // 참여자 목록 기반 처리 (2차 - 더 정교한 방식)
        if (participants.size > 0) {
            // '@' 뒤에 나오는 모든 것을 찾는 넓은 패턴
            processedText = processedText.replace(/@([^@<>\n]+)/g, (match, potentialName) => {
                // 이미 태그 처리된 경우 건너뛰기 (span 태그가 있는 경우)
                if (match.includes('<span')) {
                    return match;
                }
                
                // 공백이나 특수문자로 잘라내기
                const trimmedName = potentialName.split(/[\s:.,!?;()\[\]{}<>"']/)[0];
                
                // 참여자 목록에 있는지 확인 (정확히 일치하는 경우)
                if (trimmedName && participants.has(trimmedName)) {
                    return `<span style="color:#0d5bd1;font-weight:bold;">@${trimmedName}</span>${potentialName.substring(trimmedName.length)}`;
                }
                
                // 대략적인 일치 확인 (참여자명이 태그 내에 포함되는 경우)
                for (const participant of participants) {
                    if (potentialName.includes(participant)) {
                        const parts = potentialName.split(participant);
                        return `<span style="color:#0d5bd1;font-weight:bold;">@${participant}</span>${parts.slice(1).join(participant)}`;
                    }
                }
                
                // 기본 형식 처리: 공백이나 특수문자 전까지만 태그로 처리
                if (trimmedName) {
                    return `<span style="color:#0d5bd1;font-weight:bold;">@${trimmedName}</span>${potentialName.substring(trimmedName.length)}`;
                }
                
                return match; // 변경 없음
            });
        }
        
        // 줄바꿈 처리
        return processedText.replace(/\n/g, '<br>');
    },

    /**
     * 시간 포맷 비교 함수 - 같은 시간대 메시지인지 확인
     * @param {string} time1 - 첫 번째 시간 문자열
     * @param {string} time2 - 두 번째 시간 문자열
     * @returns {boolean} 같은 시간대이면 true, 아니면 false
     */
    isSameTimeFrame(time1, time2) {
        if (!time1 || !time2) return false;
        
        // 시간 형식: "2023년 3월 15일 오전 12:25"
        // 분 단위까지 추출하여 비교
        const timeRegex = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/;
        
        const match1 = time1.match(timeRegex);
        const match2 = time2.match(timeRegex);
        
        if (!match1 || !match2) return false;
        
        // 년, 월, 일 비교
        if (match1[1] !== match2[1] || match1[2] !== match2[2] || match1[3] !== match2[3]) {
            return false;
        }
        
        // 오전/오후 비교
        if (match1[4] !== match2[4]) {
            return false;
        }
        
        // 시간, 분 비교
        if (match1[5] !== match2[5] || match1[6] !== match2[6]) {
            return false;
        }
        
        return true;
    },

    /**
     * 메시지 텍스트를 파싱하여 구조화된 객체로 변환
     * @param {string} chatData - 밴드에서 내보낸 채팅 텍스트
     * @returns {Array} 파싱된 메시지 객체 배열
     */
    parseMessages(chatData) {
        // 밴드 채팅 형식 정규식
        const messageRegex = /^(\d{4}년\s*(?:0?[1-9]|1[0-2])월\s*(?:0?[1-9]|[12][0-9]|3[01])일\s*(?:오전|오후)\s*(?:0?[1-9]|1[0-2]):(?:[0-5][0-9])):([^:]+):(.+)$/;
        
        const lines = chatData.split('\n');
        let currentMessage = null;
        const messages = [];
        
        lines.forEach(line => {
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
    },

    /**
     * 메시지에서 @태그된 사용자명 추출
     * @param {string} text - 메시지 텍스트
     * @param {Array} participants - 채팅 참여자 목록 (선택 사항)
     * @returns {Array} 태그된 사용자명 배열
     */
    extractTaggedUsers(text, participants = []) {
        if (!text) return [];
        
        const tags = [];
        const participantSet = new Set(participants);
        
        // 여러 패턴에 맞는 태그 추출
        const patterns = [
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            /@(\[\d+(?:\/\d+)?\]\s*[^\s:.,!?;()\[\]{}<>"']*)/g,
            /@(\d+\s+\d+\s*[•]\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            /@(SYSTEM|BOT|ADMIN|Manager)/g,
            /@"([^"]+)"/g
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const tagName = match[1].trim();
                if (tagName) {
                    tags.push(tagName);
                }
            }
        });
        
        // 참여자 목록 기반 추가 처리
        if (participantSet.size > 0) {
            // '@' 뒤에 나오는 텍스트 찾기
            const atMatches = text.match(/@([^@<>\n]+)/g);
            if (atMatches) {
                atMatches.forEach(atText => {
                    // 이미 추출된 태그는 건너뛰기
                    const cleanText = atText.substring(1); // '@' 제거
                    
                    // 참여자 목록에서 일치하는 항목 찾기
                    for (const participant of participantSet) {
                        if (cleanText.includes(participant) && !tags.includes(participant)) {
                            tags.push(participant);
                            break;
                        }
                    }
                });
            }
        }
        
        return [...new Set(tags)]; // 중복 제거
    },

    /**
     * 안전한 ID 생성 함수 - 특수문자 제거
     * @param {string} text - 원본 텍스트
     * @returns {string} 안전한 ID 문자열
     */
    safeId(text) {
        return text.replace(/[^a-z0-9]/gi, '_');
    }
};

// 전역 변수로 노출
window.MessageParser = MessageParser;