// /js/settingsPanel.js - 설정 패널 및 드롭다운 메뉴 구현

/**
 * 설정 패널 관리 모듈 - 다크모드 및 태그 강조 등 사용자 설정 관리
 */
const SettingsPanel = {
    // 패널 상태
    isOpen: false,
    
    /**
     * 설정 패널 초기화
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    init(state, renderMessages) {
        // 설정 패널 초기화
        this.setupSettingsPanel(state, renderMessages);
        
        // 초기화 이벤트 설정
        this.setupCloseEvents();
        
        console.log('설정 패널이 초기화되었습니다.');
    },
    
    /**
     * 설정 패널 생성 및 설정
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    setupSettingsPanel(state, renderMessages) {
        // 설정 버튼 요소 찾기
        const settingsButton = document.getElementById('settingsButton');
        if (!settingsButton) {
            console.error('설정 버튼 요소를 찾을 수 없습니다');
            return;
        }
        
        // 설정 버튼 클릭 이벤트 설정
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSettingsPanel(state, renderMessages);
        });
        
        // 설정 패널 생성
        this.createSettingsPanel(state, renderMessages);
    },
    
    /**
     * 설정 패널 생성
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    createSettingsPanel(state, renderMessages) {
        // 기존 패널 제거
        const existingPanel = document.getElementById('settings-panel');
        if (existingPanel) existingPanel.remove();
        
        // 설정 패널 생성
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'settings-panel';
        settingsPanel.className = 'settings-panel';
        
        // 패널 초기 상태 설정
        settingsPanel.style.display = 'none';
        settingsPanel.style.opacity = '0';
        settingsPanel.style.transform = 'translateY(10px)';
        
        // 패널 위치 설정
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            const buttonRect = settingsButton.getBoundingClientRect();
            settingsPanel.style.position = 'fixed';
            settingsPanel.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
            settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width/2) + 'px';
        } else {
            settingsPanel.style.position = 'fixed';
            settingsPanel.style.bottom = '70px';
            settingsPanel.style.right = '40px';
        }
        
        // 패널 내용 생성
        // 1. 다크 모드 설정
        const darkModeOption = this.createSettingOption(
            'dark-mode-option',
            '<i class="fas fa-moon"></i> 다크 모드',
            state.darkMode,
            (checked) => {
                // 다크 모드 상태가 변경된 경우만 처리
                if (checked !== state.darkMode) {
                    // ThemeManager를 통해 테마 변경
                    if (typeof ThemeManager !== 'undefined' && ThemeManager) {
                        ThemeManager.toggleTheme(state, renderMessages);
                    } else {
                        // ThemeManager가 없는 경우 직접 처리
                        state.darkMode = checked;
                        document.body.classList.toggle('dark', checked);
                        
                        // LocalStorage에 설정 저장
                        if (typeof StorageManager !== 'undefined' && StorageManager) {
                            StorageManager.saveThemePreference(checked);
                        } else {
                            localStorage.setItem('theme-preference', checked ? 'dark' : 'light');
                        }
                        
                        // 메시지 다시 렌더링
                        if (typeof renderMessages === 'function') {
                            renderMessages();
                        }
                    }
                }
            }
        );
        
        // 2. 태그 강조 설정
        const tagOption = this.createSettingOption(
            'tag-highlight-option',
            '<i class="fas fa-at"></i> 태그 강조',
            state.highlightTags !== false, // 기본값은 true
            (checked) => {
                // 태그 강조 설정 변경
                state.highlightTags = checked;
                
                // 설정 저장
                if (typeof StorageManager !== 'undefined' && StorageManager) {
                    StorageManager.saveTagHighlightSetting(checked);
                    
                    // 고급 설정에도 저장
                    const advancedSettings = StorageManager.loadAdvancedSettings() || {};
                    advancedSettings.highlightTags = checked;
                    StorageManager.saveAdvancedSettings(advancedSettings);
                } else {
                    localStorage.setItem('highlightTags', checked ? 'true' : 'false');
                }
                
                // 메시지 다시 렌더링
                if (typeof renderMessages === 'function') {
                    renderMessages();
                } else if (typeof window.renderMessages === 'function') {
                    window.renderMessages();
                }
            }
        );
        
        // 3. 내 메시지 이미지 표시 설정 (새로 추가)
        const showMyProfileOption = this.createSettingOption(
            'show-my-profile-option',
            '<i class="fas fa-user-circle"></i> 내 메시지의 이미지 표시하기',
            state.showMyProfile !== false, // 기본값은 true
            (checked) => {
                // 내 메시지 이미지 표시 설정 변경
                state.showMyProfile = checked;
                
                // 설정 저장
                if (typeof StorageManager !== 'undefined' && StorageManager) {
                    // 새로운 세팅 함수 추가 필요
                    if (typeof StorageManager.saveShowMyProfileSetting === 'function') {
                        StorageManager.saveShowMyProfileSetting(checked);
                    } else {
                        localStorage.setItem('showMyProfile', checked ? 'true' : 'false');
                    }
                    
                    // 고급 설정에도 저장
                    const advancedSettings = StorageManager.loadAdvancedSettings() || {};
                    advancedSettings.showMyProfile = checked;
                    StorageManager.saveAdvancedSettings(advancedSettings);
                } else {
                    localStorage.setItem('showMyProfile', checked ? 'true' : 'false');
                }
                
                // 메시지 다시 렌더링
                if (typeof renderMessages === 'function') {
                    renderMessages();
                } else if (typeof window.renderMessages === 'function') {
                    window.renderMessages();
                }
            }
        );

        // 구분선 추가
        const divider = document.createElement('div');
        divider.className = 'settings-divider';
        
        // 4. 설정 섹션 정보
        const aboutOption = document.createElement('div');
        aboutOption.className = 'settings-about';
        aboutOption.innerHTML = `
            <div class="settings-about-info">
                <i class="fas fa-info-circle"></i> 버전 정보: v1.0.3
            </div>
            <div class="settings-about-credits">
                @C2H5OH_snow
            </div>
        `;
        
        // 패널에 옵션 추가
        settingsPanel.appendChild(darkModeOption);  // 다크 모드 옵션 추가
        settingsPanel.appendChild(tagOption);
        settingsPanel.appendChild(showMyProfileOption); // 내 메시지 이미지 표시 옵션 추가
        settingsPanel.appendChild(divider);
        settingsPanel.appendChild(aboutOption);
        
        // 패널을 body에 추가
        document.body.appendChild(settingsPanel);
    },
    
    /**
     * 설정 옵션 항목 생성
     * @param {string} id - 요소 ID
     * @param {string} label - 표시할 라벨
     * @param {boolean} initialState - 초기 상태 (체크 여부)
     * @param {Function} onChange - 상태 변경 시 호출될 함수
     * @returns {HTMLElement} 생성된 설정 옵션 요소
     */
    createSettingOption(id, label, initialState, onChange) {
        const option = document.createElement('div');
        option.className = 'settings-option';
        
        // 토글 스위치 생성
        const toggleSwitch = document.createElement('label');
        toggleSwitch.className = 'settings-switch';
        
        // 체크박스 생성
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = initialState;
        
        // 슬라이더 생성
        const slider = document.createElement('span');
        slider.className = 'settings-slider';
        
        // 라벨 생성
        const labelText = document.createElement('span');
        labelText.className = 'settings-label';
        labelText.innerHTML = label;
        
        // 상태 변경 이벤트
        checkbox.addEventListener('change', (e) => {
            if (typeof onChange === 'function') {
                onChange(e.target.checked);
            }
        });
        
        // 요소 조립
        toggleSwitch.appendChild(checkbox);
        toggleSwitch.appendChild(slider);
        
        option.appendChild(labelText);
        option.appendChild(toggleSwitch);
        
        return option;
    },
    
    /**
     * 설정 패널 토글
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    toggleSettingsPanel(state, renderMessages) {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsButton = document.getElementById('settingsButton');
        
        if (!settingsPanel || !settingsButton) return;
        
        // 상태 토글
        this.isOpen = !this.isOpen;
        
        // 패널 표시/숨김
        if (this.isOpen) {
            // 패널 위치 조정 - 버튼 위치 기준으로 계산
            const buttonRect = settingsButton.getBoundingClientRect();
            settingsPanel.style.position = 'fixed';
            settingsPanel.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
            
            // 설정 패널을 더 왼쪽에 표시하여 도움말과 겹치지 않게 함
            const panelWidth = 250; // 패널 기본 너비
            const offset = 25;     // 오프셋 증가
        
        // 화면 크기에 따라 패널 위치 조정
        if (window.innerWidth <= 480) {
            // 작은 화면에서는 패널을 더 오른쪽으로 이동
            settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width + offset) + 'px';
        } else {
            // 큰 화면에서는 패널을 더 오른쪽으로 이동
            settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width + offset) + 'px';
        }
            
            // 패널 표시 애니메이션
            settingsPanel.style.display = 'block';
            setTimeout(() => {
                settingsPanel.style.opacity = '1';
                settingsPanel.style.transform = 'translateY(0)';
            }, 10);
            
            // 현재 설정 상태 업데이트
            document.getElementById('dark-mode-option').checked = state.darkMode;
            document.getElementById('tag-highlight-option').checked = state.highlightTags !== false;
            document.getElementById('show-my-profile-option').checked = state.showMyProfile !== false;
        } else {
            // 패널 숨김 애니메이션
            settingsPanel.style.opacity = '0';
            settingsPanel.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                settingsPanel.style.display = 'none';
            }, 300);
        }
    },
    
    /**
     * 패널 닫는 이벤트 (외부 클릭, ESC 키) 설정
     */
    setupCloseEvents() {
        // 문서 클릭 시 패널 닫기
        document.addEventListener('click', (e) => {
            if (this.isOpen) {
                const settingsPanel = document.getElementById('settings-panel');
                const settingsButton = document.getElementById('settingsButton');
                
                // 패널과 버튼 외부 클릭 시 닫기
                if (settingsPanel && settingsButton && 
                    !settingsPanel.contains(e.target) && 
                    !settingsButton.contains(e.target)) {
                    this.isOpen = false;
                    
                    // 패널 숨김
                    settingsPanel.style.opacity = '0';
                    settingsPanel.style.transform = 'translateY(10px)';
                    
                    setTimeout(() => {
                        settingsPanel.style.display = 'none';
                    }, 300);
                }
            }
        });
        
        // ESC 키 누를 때 패널 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                const settingsButton = document.getElementById('settingsButton');
                if (settingsButton) {
                    settingsButton.click();
                }
            }
        });
    },
    
    /**
     * 설정 패널 상태 업데이트
     * @param {Object} state - 애플리케이션 상태 객체
     */
    updateSettings(state) {
        const darkModeOption = document.getElementById('dark-mode-option');
        const tagHighlightOption = document.getElementById('tag-highlight-option');
        const showMyProfileOption = document.getElementById('show-my-profile-option');
        
        if (darkModeOption) {
            darkModeOption.checked = state.darkMode;
        }
        
        if (tagHighlightOption) {
            tagHighlightOption.checked = state.highlightTags !== false;
        }
        
        if (showMyProfileOption) {
            showMyProfileOption.checked = state.showMyProfile !== false;
        }
    }
};

// 전역 변수로 노출
window.SettingsPanel = SettingsPanel;