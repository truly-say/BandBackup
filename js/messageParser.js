// /js/messageParser.js - 밴드 채팅 메시지 파싱 및 포맷팅 관련 모듈

const MessageParser = {
    // 밴드 채팅 메시지 파싱 및 포맷팅
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
    },

    // 메시지 텍스트 포맷팅
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
        
        // 개선된 태그 패턴 매칭
        // 1. 대괄호 내 문자열 패턴 (@[사망]강담윤, @[사망/NPC] 은이연)
        // 2. 파이프(|) 구분자 패턴 (@34 | 15 | 범유라)
        // 3. 대괄호 내 파이프/슬래시 구분자 패턴 (@[31|23]강담윤, @[30/48] 한채희)
        const patterns = [
            // 기본 패턴: @로 시작하는 일반 태그
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 내 텍스트 패턴 - @[사망]강담윤, @[사망/NPC] 은이연
            /@\[([^\]]+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 내 숫자와 구분자 패턴 - @[31|23]강담윤, @[30/48] 한채희
            /@\[(\d+[\|\/]\d+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 파이프(|) 구분자 패턴 - @34 | 15 | 범유라
            /@(\d+\s*\|\s*\d+\s*\|\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 숫자 슬래시 패턴 - @34/15 범유라
            /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 숫자 띄어쓰기 구분자 패턴 - @34 15 범유라
            /@(\d+\s+\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 시스템 및 특수 태그
            /@(SYSTEM|BOT|ADMIN|Manager|총괄|부계|공지|관리자|매니저)/g
        ];
        
        // 태그 강조 처리
        let processedText = text;
        
        // 태그 매칭 전처리 - 숫자와 특수문자 사이 태그
        patterns.forEach(pattern => {
            processedText = processedText.replace(pattern, (match) => {
                // '@'를 포함한 전체 태그를 파란색으로 처리
                return `<span style="color:#0d5bd1;font-weight:bold;">${match}</span>`;
            });
        });
        
        // 참여자 목록 기반 태그 처리 (더 정교한 처리)
        if (participants.size > 0) {
            // 이미 태그 처리된 부분은 건너뛰도록 정규식 분석
            let lastIndex = 0;
            let result = '';
            const tagRegex = /<span[^>]*>@[^<]+<\/span>|@([^@<>\n\s:.,!?;()\[\]{}"']+)/g;
            let match;
            
            while ((match = tagRegex.exec(processedText)) !== null) {
                // 이미 태그 처리된 부분은 그대로 유지
                if (match[0].startsWith('<span')) {
                    result += processedText.substring(lastIndex, match.index) + match[0];
                    lastIndex = match.index + match[0].length;
                    continue;
                }
                
                // 새로운 태그 발견
                const tagUsername = match[1];
                if (tagUsername) {
                    // 참여자 목록 확인
                    let isParticipant = false;
                    
                    // 정확히 일치하는지 확인
                    if (participants.has(tagUsername)) {
                        isParticipant = true;
                    } else {
                        // 부분 일치 확인 (사용자 이름에 공백이 있는 경우)
                        for (const participant of participants) {
                            if (participant.includes(' ') && tagUsername.includes(participant)) {
                                isParticipant = true;
                                break;
                            }
                        }
                    }
                    
                    // 태그 강조 처리
                    if (isParticipant) {
                        result += processedText.substring(lastIndex, match.index);
                        result += `<span style="color:#0d5bd1;font-weight:bold;">@${tagUsername}</span>`;
                    } else {
                        result += processedText.substring(lastIndex, match.index);
                        result += `<span style="color:#0d5bd1;font-weight:bold;">@${tagUsername}</span>`;
                    }
                    
                    lastIndex = match.index + match[0].length;
                }
            }
            
            // 남은 텍스트 추가
            if (lastIndex < processedText.length) {
                result += processedText.substring(lastIndex);
            }
            
            processedText = result || processedText;
        }
        
        // 줄바꿈 처리
        return processedText.replace(/\n/g, '<br>');
    },

    // 시간 형식이 같은지 확인
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

    // 밴드 채팅 데이터 파싱
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

    // 태그된 사용자 추출
    extractTaggedUsers(text, participants = []) {
        if (!text) return [];
        
        const tags = [];
        const participantSet = new Set(participants);
        
        // 여러 패턴에 맞는 태그 추출 - 개선된 패턴으로 변경
        const patterns = [
            // 기본 패턴: @로 시작하는 일반 태그
            /@([^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 내 텍스트 패턴 - @[사망]강담윤, @[사망/NPC] 은이연
            /@\[([^\]]+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 대괄호 내 숫자와 구분자 패턴 - @[31|23]강담윤, @[30/48] 한채희
            /@\[(\d+[\|\/]\d+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 파이프(|) 구분자 패턴 - @34 | 15 | 범유라
            /@(\d+\s*\|\s*\d+\s*\|\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 숫자 슬래시 패턴 - @34/15 범유라
            /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 숫자 띄어쓰기 구분자 패턴 - @34 15 범유라
            /@(\d+\s+\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
            
            // 시스템 및 특수 태그
            /@(SYSTEM|BOT|ADMIN|Manager|총괄|부계|공지|관리자|매니저)/g
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

    // 안전한 ID 생성
    safeId(text) {
        return text.replace(/[^a-z0-9]/gi, '_');
    }
};

// 전역 변수로 노출
window.MessageParser = MessageParser;