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
     * 메시지 텍스트 포맷팅 함수 - @ 태그 처리 및 줄바꿈 변환 (개선된 태그 강조 알고리즘 포함)
     * @param {string} text - 포맷팅할 메시지 텍스트
     * @param {Object} [state] - 애플리케이션 상태 (참여자 목록 접근용)
     * @returns {string} 포맷팅된 메시지 HTML
     */
    // /js/messageParser.js - 메시지 텍스트 포맷팅 함수 개선

/**
 * 메시지 텍스트 포맷팅 함수 - @ 태그 처리 및 줄바꿈 변환 (추가 개선된 태그 알고리즘)
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

    // 채팅 참여자 목록 가져오기
    let participants = new Set();
    if (state && state.messages) {
        state.messages.forEach(msg => {
            if (msg.username) {
                participants.add(msg.username);
            }
        });
    }
    
    // @ 태그 추출 및 포맷팅을 위한 정확한 패턴 매칭
    // 예: '@SYSTEM 피합니다'에서 '@SYSTEM'만 추출
    const tagRegex = /@((?:[A-Za-z0-9가-힣_.\[\]]+(?:\/|\||\s|•|·)*)+)/g;
    
    // 태그 위치와 내용을 모두 저장 (정확한 치환을 위해)
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
        const fullTag = match[0]; // '@SYSTEM'
        const tagContent = match[1]; // 'SYSTEM'
        const startPos = match.index;
        const endPos = startPos + fullTag.length;
        
        // 첫 번째 공백이나 특수문자를 찾아서 실제 태그의 끝을 결정
        let realEndPos = endPos;
        for (let i = startPos + 1; i < endPos; i++) {
            // 공백이나 특수문자가 있으면 그 위치까지만 태그로 간주
            if (/[\s:.,!?;()\[\]{}]/.test(text[i])) {
                // 이전 문자가 공백이었다면 건너뛰기 (예: '@ 이름'에서 '@ '은 태그에 포함)
                if (i > startPos + 1) {
                    realEndPos = i;
                    break;
                }
            }
        }
        
        // 키워드나 특수 패턴, 참여자 이름 등의 경우 정확히 매칭 처리
        let actualTag = fullTag;
        let actualEndPos = endPos;
        
        // 시스템/관리자 등 특수 키워드 매칭
        if (/^@(SYSTEM|BOT|ADMIN|Manager|총괄|부계|공지|관리자|매니저)$/.test(fullTag)) {
            actualTag = fullTag;
            actualEndPos = endPos;
        }
        // 대괄호 형식 (예: [@공격]) - 대괄호를 사용한 특별 표시
        else if (/^@\[[^\]]+\]/.test(fullTag)) {
            const bracketEndPos = text.indexOf(']', startPos) + 1;
            if (bracketEndPos > startPos) {
                actualTag = text.substring(startPos, bracketEndPos);
                actualEndPos = bracketEndPos;
            }
        }
        // 참여자 목록에 있는 이름 매칭 (정확한 사용자 이름)
        else if (participants.size > 0) {
            for (const participant of participants) {
                // 태그 내용이 참여자 이름으로 시작하는지 확인
                if (tagContent.startsWith(participant)) {
                    actualTag = '@' + participant;
                    actualEndPos = startPos + actualTag.length;
                    break;
                }
                // 공백이 있는 이름 (예: "강 찬")
                else if (participant.includes(' ') && tagContent.includes(participant)) {
                    actualTag = '@' + participant;
                    actualEndPos = startPos + actualTag.length;
                    break;
                }
            }
        }
        
        // 태그 정보 저장
        tags.push({
            originalTag: fullTag,
            actualTag: actualTag,
            startPos: startPos,
            endPos: actualEndPos
        });
    }
    
    // 뒤에서부터 처리하여 위치 변화로 인한 문제 방지
    tags.sort((a, b) => b.startPos - a.startPos);
    
    // 태그를 HTML로 변환
    let processedText = text;
    for (const tag of tags) {
        const highlightedTag = `<span style="color:#0d5bd1;font-weight:bold;">${tag.actualTag}</span>`;
        processedText = processedText.substring(0, tag.startPos) + 
                      highlightedTag + 
                      processedText.substring(tag.endPos);
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
        
        // 시간, 분 비교 - 분까지 정확히 일치해야 함
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
        
        // 여러 패턴에 맞는 태그 추출 - 업데이트된 패턴으로 변경
        const patterns = [
            // 기본 패턴: '@'로 시작하고 공백이나 특수문자로 끝나는 패턴
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 패턴: '@[숫자] 이름' 또는 '@[숫자/숫자] 이름' 형식
            /@(\[\d+(?:\/\d+)?\][ ]*[^\s:.,!?;()\[\]{}<>"']*)/g,
            
            // 대괄호 패턴2: '@[글자] 이름' 형식
            /@(\[[^[\]]+\][ ]*[^\s:.,!?;()\[\]{}<>"']*)/g,
            
            // 숫자로 시작하는 패턴: '@숫자 숫자 • 이름' 형식 
            /@(\d+\s+\d+\s*[•|·]?\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 슬래시, 파이프 패턴: '@숫자/숫자' 또는 '@숫자|숫자' 형식
            /@(\d+[\/|]\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 특수 키워드 패턴: '@SYSTEM' 등
            /@(SYSTEM|총괄|관리자)/g,
            
            // 공백이 있는 이름 패턴: '@이름 구분자' 형식 (강, 찬 등)
            /@([^\s]+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            
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
                    
                    // 공백으로 분리된 이름 처리 (예: "강 찬")
                    if (cleanText.includes(' ')) {
                        const spaceParts = cleanText.split(' ');
                        const spaceUsername = spaceParts.slice(0, 2).join(' ');
                        
                        if (participantSet.has(spaceUsername) && !tags.includes(spaceUsername)) {
                            tags.push(spaceUsername);
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