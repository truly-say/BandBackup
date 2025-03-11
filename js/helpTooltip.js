// /js/helpTooltip.js - 컨텍스트 기반 도움말 시스템

/**
 * 도움말 시스템 - 컨텍스트 기반 툴팁과 모달 창 제공
 */
const HelpSystem = {
    // 초기화 완료 여부 플래그 추가
    initialized: false,
    
    /**
     * 도움말 초기화 (페이지 로드 시 호출)
     * @param {boolean} isDarkMode - 다크모드 여부
     */
    init(isDarkMode = false) {
        // 이미 초기화되었으면 중복 초기화 방지
        if (this.initialized) {
            console.log('도움말 시스템이 이미 초기화되었습니다.');
            return;
        }
        
        // 도움말 아이콘 추가
        this.addHelpIcons();
        
        // 모달 컨테이너 추가
        this.createModalContainer(isDarkMode);
        
        // 초기화 완료 표시
        this.initialized = true;
        
        console.log('도움말 시스템이 초기화되었습니다.');
    },
    
    /**
     * 각 섹션에 도움말 아이콘 추가 (통합된 도움말로 변경)
     */
    addHelpIcons() {
        // 도움말 데이터 정의 (통합된 섹션별 도움말)
        const helpSections = [
            {
                selector: '#input-text',
                position: 'after',
                title: '채팅 입력 및 분석',
                tooltip: '채팅 입력 및 분석에 관한 도움말',
                content: `
                <h3>채팅 입력 및 분석</h3>
                <p>네이버 밴드에서 내보낸 채팅 내용을 붙여넣고 분석하는 과정에 대한 도움말입니다.</p>
                
                <h4>채팅 붙여넣기:</h4>
                <ol>
                    <li>밴드 채팅방에서 우측 상단 메뉴(⋮) 클릭</li>
                    <li>'대화 내용 내보내기' 선택</li>
                    <li>원하는 기간 선택 후 내보내기</li>
                    <li>내보낸 텍스트 전체 선택하여 복사 (Ctrl+A, Ctrl+C)</li>
                    <li>입력창에 붙여넣기 (Ctrl+V)</li>
                </ol>
                
                <h4>채팅 분석:</h4>
                <ul>
                    <li><strong>① 채팅 분석</strong> 버튼을 클릭하면 채팅을 분석하고 프로필 설정 화면을 표시합니다</li>
                    <li>분석 과정에서 사용자 목록 추출, 메시지 형식 검증, 오류 확인 등을 수행합니다</li>
                    <li>분석이 완료되면 각 참여자의 프로필 이미지, 이름, 색상을 설정할 수 있습니다</li>
                </ul>
                
                <p class="help-note">💡 지원하는 최대 참여자 수: <strong>25명</strong>. 대화하는 인원수가 25명을 넘길 시 작동하지 않습니다.</p>
                <p class="help-note">💡 채팅 분석은 단순히 분석만 하며, 내용을 외부로 전송하지 않습니다.</p>
                `
            },
            {
                selector: '#convert-btn',
                position: 'after',
                title: '변환 및 복사',
                tooltip: '채팅 변환 및 HTML 복사에 관한 도움말',
                content: `
                <h3>변환 및 복사 기능</h3>
                <p>채팅을 HTML 형식으로 변환하고 복사하는 기능에 대한 안내입니다.</p>
                
                <h4>변환하기:</h4>
                <ul>
                    <li><strong>② 변환하기</strong> 버튼을 클릭하면 설정한 프로필 정보를 적용하여 채팅을 HTML 형식으로 변환합니다</li>
                    <li>프로필 이미지 최적화, 사용자별 스타일 적용 등이 진행됩니다</li>
                    <li>변환된 결과물을 미리보기로 표시합니다</li>
                </ul>
                
                <h4>HTML 복사:</h4>
                <ul>
                    <li><strong>③ HTML 복사</strong> 버튼을 클릭하면 변환된 채팅을 HTML 형식으로 클립보드에 복사합니다</li>
                    <li>복사된 HTML은 블로그, 티스토리 등 HTML을 지원하는 플랫폼에 붙여넣을 수 있습니다</li>
                    <li>모든 스타일, 이미지, 메시지 형식이 그대로 유지됩니다</li>
                </ul>
                
                <h4>초기화:</h4>
                <ul>
                    <li>초기화 버튼을 클릭하면 모든 입력 내용과 설정을 초기 상태로 되돌립니다</li>
                </ul>
                
                <p class="help-note">💡 복사 전에 반드시 먼저 <strong>변환하기</strong> 버튼을 클릭해야 합니다.</p>
                <p class="help-note">💡 이미지 삽입 시 업로드 및 변환 과정에 시간이 소요될 수 있습니다.</p>
                `
            },
            {
                selector: '.user-profiles',
                position: 'prepend',
                title: '프로필 설정',
                tooltip: '채팅 참여자의 프로필을 설정합니다',
                content: `
                <h3>프로필 설정 기능</h3>
                <p>채팅 참여자의 프로필 이미지, 표시 이름, 색상 등을 설정하는 방법입니다.</p>
                
                <h4>프로필 설정 방법:</h4>
                <ul>
                    <li><strong>프로필 이미지:</strong> 각 사용자 카드에서 '이미지 선택' 버튼을 클릭하거나 이미지를 드래그하여 업로드</li>
                    <li><strong>표시 이름:</strong> 원하는 표시 이름을 입력 (기본값은 원래 사용자명)</li>
                    <li><strong>색상 선택:</strong> 색상 선택기를 통해 사용자 이름 색상 변경</li>
                    <li><strong>내 메시지 설정:</strong> "내 메시지로 설정" 버튼을 클릭하여 해당 사용자의 메시지를 내 메시지로 표시</li>
                </ul>
                
                <h4>초기화 옵션:</h4>
                <ul>
                    <li><strong>개별 초기화:</strong> 각 프로필 카드 우측 상단의 × 버튼</li>
                    <li><strong>전체 프로필 초기화:</strong> 모든 프로필 설정 초기화</li>
                    <li><strong>모든 체크 해제:</strong> 내 메시지 설정 모두 해제</li>
                </ul>
                
                <p class="help-note">💡 변경사항은 자동으로 저장되며, 동일 브라우저에서 다음 방문 시에도 유지됩니다.</p>
                <p class="help-note">💡 설정 패널에서 '내 메시지의 이미지 표시하기' 옵션으로 내 메시지의 프로필 이미지 표시 여부를 설정할 수 있습니다.</p>
                `
            },
            {
                selector: '#chat-container',
                position: 'prepend',
                title: '채팅 미리보기 및 편집',
                tooltip: '변환된 채팅의 미리보기 및 편집 방법',
                content: `
                <h3>채팅 미리보기 및 편집</h3>
                <p>설정한 프로필과 함께 변환된 채팅 내용을 미리보고 편집하는 방법입니다.</p>
                
                <h4>미리보기 특징:</h4>
                <ul>
                    <li><strong>메시지 스타일:</strong> 일반 메시지는 회색/설정색상, 내 메시지는 녹색 말풍선으로 표시</li>
                    <li><strong>프로필 이미지:</strong> 각 사용자에게 설정한 이미지 표시</li>
                    <li><strong>연속 메시지:</strong> 동일 사용자의 동일 시간대 연속 메시지는 프로필 생략하고 말풍선만 표시</li>
                    <li><strong>@태그:</strong> 사용자 태그는 파란색으로 강조 표시</li>
                </ul>
                
                <h4>메시지 편집:</h4>
                <ul>
                    <li>편집하려는 메시지를 클릭하면 편집 모드가 활성화됩니다</li>
                    <li>내용 수정 후 저장 버튼을 클릭하거나 Enter 키를 누르세요</li>
                    <li>편집을 취소하려면 취소 버튼을 클릭하거나 Esc 키를 누르세요</li>
                    <li>메시지를 삭제하려면, 메시지 편집 모드에서 삭제 버튼을 클릭하세요</li>
                </ul>
                
                <p class="help-note">💡 최종 복사본과 동일한 모습으로 미리 볼 수 있습니다.</p>
                <p class="help-note">💡 메시지 편집 후 반드시 HTML 복사 버튼을 클릭하여 결과를 저장해야 합니다.</p>
                `
            },
            {
                selector: '#settingsButton',
                position: 'before',
                title: '설정 옵션',
                tooltip: '다크 모드, 태그 강조 등 설정을 변경합니다',
                content: `
                <h3>설정 옵션</h3>
                <p>애플리케이션의 다양한 설정을 변경하는 방법입니다.</p>
                
                <h4>사용 가능한 설정:</h4>
                <ul>
                    <li><strong>다크 모드:</strong> 화면 테마를 밝은 색/어두운 색으로 전환합니다</li>
                    <li><strong>태그 강조:</strong> @태그 강조 표시 여부를 설정합니다</li>
                    <li><strong>내 메시지의 이미지 표시하기:</strong> 내 메시지로 설정된 사용자의 프로필 이미지 표시 여부를 설정합니다</li>
                </ul>
                
                <h4>설정 사용법:</h4>
                <ol>
                    <li>화면 우측 하단의 설정 버튼(⚙️)을 클릭하여 설정 패널을 엽니다</li>
                    <li>원하는 설정을 토글하여 변경합니다</li>
                    <li>설정은 자동으로 저장되며 즉시 적용됩니다</li>
                </ol>
                
                <p class="help-note">💡 다크 모드는 작업 환경에 영향을 주지만 최종 내보내기 결과에는 영향을 주지 않습니다.</p>
                <p class="help-note">💡 내 메시지의 이미지 표시 옵션을 끄면 내 메시지로 설정된 사용자의 프로필 이미지가 숨겨집니다.</p>
                `
            },
            {
                selector: '#update-log',
                position: 'before',
                title: '업데이트 및 버전 정보',
                tooltip: '최신 업데이트 및 버전 정보',
                content: `
                <h3>업데이트 내역 및 버전 정보</h3>
                <p>이 애플리케이션의 최근 업데이트 내역과 버전 정보를 확인할 수 있습니다.</p>
                
                <h4>최신 업데이트:</h4>
                <ul>
                    <li><strong>v1.3.3 (25.03.11):</strong> 설정 패널 통합, 다크 모드 개선, 내 메시지 이미지 표시 설정 추가, 코드 최적화</li>
                    <li><strong>v1.3.2 (25.03.10):</strong> 메시지 편집 기능 추가 및 버그 수정</li>
                    <li><strong>v1.3.1 (25.03.09):</strong> 연속 메시지 처리 개선, 이미지 최적화 강화</li>
                </ul>
                
                <h4>향후 업데이트 계획:</h4>
                <ul>
                    <li>더 많은 프로필 이미지 템플릿 추가</li>
                    <li>메시지 필터링 및 검색 기능</li>
                    <li>대화 통계 및 분석 기능</li>
                </ul>
                
                <p class="help-note">💡 새로운 버전이 출시되면 자동으로 업데이트됩니다.</p>
                `
            },
        ];
        
        // 각 섹션에 도움말 아이콘 추가
        helpSections.forEach(section => {
            const targetElement = document.querySelector(section.selector);
            if (!targetElement) return;
            
            // 이미 도움말 아이콘이 있는지 확인 (중복 방지)
            const existingIcon = (section.position === 'before' || section.position === 'after') 
                ? (targetElement.previousElementSibling?.classList.contains('help-icon') || 
                   targetElement.nextElementSibling?.classList.contains('help-icon'))
                : targetElement.querySelector('.help-icon');
                
            if (existingIcon) {
                console.log(`이미 도움말 아이콘이 있습니다: ${section.selector}`);
                return;
            }
            
            // 도움말 아이콘 생성
            const helpIcon = document.createElement('div');
            helpIcon.className = 'help-icon';
            helpIcon.innerHTML = '<i class="fas fa-question-circle"></i>';
            helpIcon.title = section.tooltip;
            helpIcon.dataset.title = section.title;
            helpIcon.dataset.content = section.content;
            
            // 클릭 이벤트 - 도움말 모달 표시
            helpIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showHelpModal(section.title, section.content);
            });
            
            // 위치에 따라 아이콘 추가
            if (section.position === 'prepend') {
                // 요소 내부의 맨 앞에 추가
                targetElement.prepend(helpIcon);
            } else if (section.position === 'append') {
                // 요소 내부의 맨 뒤에 추가
                targetElement.append(helpIcon);
            } else if (section.position === 'before') {
                // 요소 이전에 추가
                targetElement.parentNode.insertBefore(helpIcon, targetElement);
            } else {
                // 기본: 요소 이후에 추가
                if (targetElement.nextSibling) {
                    targetElement.parentNode.insertBefore(helpIcon, targetElement.nextSibling);
                } else {
                    targetElement.parentNode.appendChild(helpIcon);
                }
            }
        });
        
        // 다크 모드 변경 감지 이벤트 추가
        document.addEventListener('themeChanged', (e) => {
            const isDark = e.detail.isDarkMode;
            this.updateHelpIconsTheme(isDark);
        });
    },
    
    /**
     * 도움말 아이콘 테마 업데이트
     * @param {boolean} isDarkMode - 다크모드 여부
     */
    updateHelpIconsTheme(isDarkMode) {
        const helpIcons = document.querySelectorAll('.help-icon');
        
        helpIcons.forEach(icon => {
            if (isDarkMode) {
                icon.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                icon.style.color = '#60a5fa';
            } else {
                icon.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
                icon.style.color = '#4a90e2';
            }
        });
        
        // 모달 컨테이너 테마 업데이트
        const modalContainer = document.getElementById('help-modal-container');
        if (modalContainer) {
            if (isDarkMode) {
                modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                
                const modalContent = modalContainer.querySelector('.help-modal-content');
                if (modalContent) {
                    modalContent.style.backgroundColor = '#1e293b';
                    modalContent.style.color = '#e2e8f0';
                    modalContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
                }
                
                const modalHeader = modalContainer.querySelector('.help-modal-header');
                if (modalHeader) {
                    modalHeader.style.borderBottomColor = '#2d3748';
                }
                
                const modalClose = modalContainer.querySelector('.help-modal-close');
                if (modalClose) {
                    modalClose.style.color = '#e2e8f0';
                }
            } else {
                modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                
                const modalContent = modalContainer.querySelector('.help-modal-content');
                if (modalContent) {
                    modalContent.style.backgroundColor = '#ffffff';
                    modalContent.style.color = '#333333';
                    modalContent.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
                }
                
                const modalHeader = modalContainer.querySelector('.help-modal-header');
                if (modalHeader) {
                    modalHeader.style.borderBottomColor = '#e2e8f0';
                }
                
                const modalClose = modalContainer.querySelector('.help-modal-close');
                if (modalClose) {
                    modalClose.style.color = '#333333';
                }
            }
        }
    },
    
    /**
     * 도움말 모달 컨테이너 생성
     * @param {boolean} isDarkMode - 다크모드 여부
     */
    createModalContainer(isDarkMode) {
        // 기존 컨테이너가 있으면 제거
        const existingContainer = document.getElementById('help-modal-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // 모달 컨테이너 생성
        const modalContainer = document.createElement('div');
        modalContainer.id = 'help-modal-container';
        modalContainer.style.display = 'none';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)';
        modalContainer.style.zIndex = '9999';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.justifyContent = 'center';
        
        // 모달 창 클릭 시 닫기 (이벤트 위임)
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                this.hideHelpModal();
            }
        });
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalContainer.style.display === 'flex') {
                this.hideHelpModal();
            }
        });
        
        // body에 추가
        document.body.appendChild(modalContainer);
    },
    
    /**
     * 도움말 모달 표시
     * @param {string} title - 모달 제목
     * @param {string} content - 모달 내용 (HTML)
     */
    showHelpModal(title, content) {
        const modalContainer = document.getElementById('help-modal-container');
        if (!modalContainer) return;
        
        // 기존 내용 초기화
        modalContainer.innerHTML = '';
        
        // 다크모드 감지
        const isDarkMode = document.body.classList.contains('dark');
        
        // 모달 내용 생성
        const modalContent = document.createElement('div');
        modalContent.className = 'help-modal-content';
        modalContent.style.backgroundColor = isDarkMode ? '#1e293b' : '#ffffff';
        modalContent.style.color = isDarkMode ? '#e2e8f0' : '#333333';
        modalContent.style.borderRadius = '8px';
        modalContent.style.padding = '0';
        modalContent.style.maxWidth = '600px';
        modalContent.style.width = '90%';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
        modalContent.style.boxShadow = isDarkMode 
            ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
            : '0 10px 25px rgba(0, 0, 0, 0.2)';
        modalContent.style.overflow = 'hidden';
        modalContent.style.fontFamily = 'Pretendard, -apple-system, system-ui, sans-serif';
        
        // 모달 헤더
        const modalHeader = document.createElement('div');
        modalHeader.className = 'help-modal-header';
        modalHeader.style.display = 'flex';
        modalHeader.style.alignItems = 'center';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.padding = '16px 20px';
        modalHeader.style.borderBottom = isDarkMode 
            ? '1px solid #2d3748' 
            : '1px solid #e2e8f0';
        
        // 모달 제목
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = title;
        modalTitle.style.margin = '0';
        modalTitle.style.fontSize = '18px';
        modalTitle.style.fontWeight = '600';
        modalTitle.style.color = isDarkMode ? '#60a5fa' : '#4a90e2';
        
        // 닫기 버튼
        const closeButton = document.createElement('button');
        closeButton.className = 'help-modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = isDarkMode ? '#e2e8f0' : '#333333';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0';
        closeButton.style.lineHeight = '1';
        closeButton.style.fontWeight = 'bold';
        
        closeButton.addEventListener('click', () => {
            this.hideHelpModal();
        });
        
        // 모달 본문
        const modalBody = document.createElement('div');
        modalBody.className = 'help-modal-body';
        modalBody.style.padding = '20px';
        modalBody.style.overflowY = 'auto';
        modalBody.style.maxHeight = 'calc(80vh - 70px)';
        
        // 스타일 추가 (내용의 하위 요소에 대한 스타일)
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .help-modal-body h3 {
                color: ${isDarkMode ? '#60a5fa' : '#4a90e2'};
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .help-modal-body h4 {
                color: ${isDarkMode ? '#90cdf4' : '#3182ce'};
                margin-top: 15px;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            .help-modal-body p {
                margin-bottom: 12px;
                line-height: 1.5;
            }
            
            .help-modal-body ul, .help-modal-body ol {
                padding-left: 20px;
                margin-bottom: 12px;
            }
            
            .help-modal-body li {
                margin-bottom: 5px;
                line-height: 1.5;
            }
            
            .help-modal-body strong {
                color: ${isDarkMode ? '#f7fafc' : '#1a202c'};
                font-weight: 600;
            }
            
            .help-modal-body .help-note {
                padding: 10px;
                border-radius: 6px;
                background-color: ${isDarkMode ? 'rgba(36, 99, 235, 0.1)' : 'rgba(236, 253, 245, 0.8)'};
                border-left: 3px solid ${isDarkMode ? '#60a5fa' : '#4a90e2'};
                margin: 15px 0;
                font-size: 14px;
            }
        `;
        
        // 내용 설정
        modalBody.innerHTML = content;
        
        // 구성 요소 조립
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        modalContent.appendChild(styleElement);
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        
        modalContainer.appendChild(modalContent);
        
        // 모달 표시
        modalContainer.style.display = 'flex';
        
        // 모달 표시 애니메이션
        modalContent.animate(
            [
                { opacity: 0, transform: 'translateY(-20px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ],
            {
                duration: 200,
                easing: 'ease-out'
            }
        );
    },
    
    /**
     * 도움말 모달 숨기기
     */
    hideHelpModal() {
        const modalContainer = document.getElementById('help-modal-container');
        if (!modalContainer) return;
        
        const modalContent = modalContainer.querySelector('.help-modal-content');
        
        // 닫기 애니메이션
        const closeAnimation = modalContent.animate(
            [
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-20px)' }
            ],
            {
                duration: 150,
                easing: 'ease-in'
            }
        );
        
        closeAnimation.onfinish = () => {
            modalContainer.style.display = 'none';
        };
    }
};

// 테마 변경 이벤트 생성 함수 (기존 ThemeManager에 추가)
function dispatchThemeChangeEvent(isDarkMode) {
    const event = new CustomEvent('themeChanged', {
        detail: { isDarkMode: isDarkMode }
    });
    document.dispatchEvent(event);
}

// 문서 로드 후 도움말 시스템 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 현재 테마 감지
    const isDarkMode = document.body.classList.contains('dark');
    
    // 도움말 시스템 초기화
    HelpSystem.init(isDarkMode);
});

// 전역 변수로 노출
window.HelpSystem = HelpSystem;