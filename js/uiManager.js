// /js/uiManager.js - UI 생성 및 관리 모듈

/**
 * UI 관리자 모듈 - 사용자 인터페이스 생성 및 관리
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
     * 사용자 프로필 입력 UI 생성
     * @param {string} username - 사용자명
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} onProfileReset - 프로필 초기화 처리 함수
     * @returns {HTMLElement} 생성된 프로필 카드 요소
     */
    createProfileInput(username, state, onProfileReset) {
        const div = document.createElement('div');
        div.className = 'user-profile-card';
        div.dataset.username = username;

        // "내 메시지" 체크박스 추가
        const myMessageCheckbox = document.createElement('input');
        myMessageCheckbox.type = 'checkbox';
        myMessageCheckbox.className = 'my-message-checkbox';
        myMessageCheckbox.title = '내 메시지로 표시';
        myMessageCheckbox.checked = state.selectedUsers.has(username);
        
        // 체크 상태에 따라 카드 스타일 업데이트
        if (myMessageCheckbox.checked) {
            div.classList.add('is-my-message');
        }
        
        // 체크박스 이벤트 리스너
        myMessageCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.selectedUsers.add(username);
                div.classList.add('is-my-message');
            } else {
                state.selectedUsers.delete(username);
                div.classList.remove('is-my-message');
            }
            
            // 선택 상태가 변경될 때마다 저장 및 렌더링
            StorageManager.saveProfiles({
                displayNames: state.displayNames,
                userProfileImages: state.userProfileImages,
                userColors: state.userColors
            }, state.selectedUsers);
            
            // 메시지 다시 렌더링 (외부 함수 호출 필요)
            if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            }
        });
        
        div.appendChild(myMessageCheckbox);

        // 프로필 사진 미리보기
        const preview = document.createElement('div');
        preview.className = 'profile-preview';
        
        // 저장된 이미지가 있다면 표시
        if (state.userProfileImages[username]) {
            // 압축된 이미지 URL 복원
            const displayUrl = ImageHandler.decompressImageUrl(state.userProfileImages[username]);
            const img = document.createElement('img');
            img.src = displayUrl;
            preview.appendChild(img);
        }

        // 이름 컨테이너
        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';

        const displayInput = document.createElement('input');
        displayInput.type = 'text';
        displayInput.value = state.displayNames[username] || username;
        displayInput.className = 'display-name-input';
        displayInput.placeholder = '표시 이름 입력';

        // 색상 선택기
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = state.userColors[username] || '#000000';
        colorInput.className = 'color-picker';
        colorInput.title = '이름 색상 선택';

        const originalName = document.createElement('span');
        originalName.className = 'original-name';
        originalName.textContent = `(${username})`;

        // 파일 입력 - 안전한 ID 사용
        const safeID = MessageParser.safeId(username);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
        fileInput.id = `file-${safeID}`;
        fileInput.className = 'profile-file-input';

        const fileLabel = document.createElement('label');
        fileLabel.htmlFor = `file-${safeID}`;
        fileLabel.className = 'file-input-label';
        fileLabel.textContent = '이미지 선택';

        // 요소들을 이름 컨테이너에 추가
        nameContainer.append(displayInput, colorInput, originalName);

        // 이미지 컨테이너 (프로필 미리보기와 파일 입력 포함)
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.append(preview, fileInput, fileLabel);

        // 초기화 버튼 (×)
        const resetBtn = document.createElement('button');
        resetBtn.className = 'profile-reset-btn';
        resetBtn.innerHTML = '×';
        resetBtn.title = '프로필 초기화';
        resetBtn.onclick = () => {
            if (confirm('프로필을 초기화하시겠습니까?')) {
                onProfileReset(username);
            }
        };

        // 이벤트 리스너
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                
                // 이미지 처리를 ImageHandler에 위임
                ImageHandler.processUploadedImage(
                    file, 
                    preview, 
                    (processedImageUrl) => {
                        // 성공 시 이미지 데이터 저장 및 UI 업데이트
                        state.userProfileImages[username] = processedImageUrl;
                        
                        // 프로필 저장
                        StorageManager.saveProfiles({
                            displayNames: state.displayNames,
                            userProfileImages: state.userProfileImages,
                            userColors: state.userColors
                        }, state.selectedUsers);
                        
                        // 메시지 다시 렌더링
                        if (typeof window.renderMessages === 'function') {
                            window.renderMessages();
                        }
                    }
                );
            }
        });

        displayInput.addEventListener('change', () => {
            state.displayNames[username] = displayInput.value;
            
            // 프로필 저장
            StorageManager.saveProfiles({
                displayNames: state.displayNames,
                userProfileImages: state.userProfileImages,
                userColors: state.userColors
            }, state.selectedUsers);
            
            // 메시지 다시 렌더링
            if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            }
        });

        colorInput.addEventListener('change', () => {
            state.userColors[username] = colorInput.value;
            
            // 프로필 저장
            StorageManager.saveProfiles({
                displayNames: state.displayNames,
                userProfileImages: state.userProfileImages,
                userColors: state.userColors
            }, state.selectedUsers);
            
            // 메시지 다시 렌더링
            if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            }
        });

        // 프로필 카드 조립
        div.append(imageContainer, nameContainer, resetBtn);
        
        // 드래그 앤 드롭 설정
        ImageHandler.setupDragAndDrop(
            div, 
            preview, 
            (processedImageUrl) => {
                state.userProfileImages[username] = processedImageUrl;
                
                // 프로필 저장
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
                
                // 메시지 다시 렌더링
                if (typeof window.renderMessages === 'function') {
                    window.renderMessages();
                }
            }
        );
        
        return div;
    },

    /**
     * 이미지 설정 UI 생성 및 표시
     * @param {Object} currentSettings - 현재 이미지 설정
     * @param {boolean} isDarkMode - 다크모드 여부
     * @returns {HTMLElement} 생성된 설정 패널
     */
    createImageSettingsUI(currentSettings, isDarkMode) {
        // 기존 설정 UI가 있으면 먼저 제거
        const existingSettings = document.getElementById('image-settings-panel');
        if (existingSettings) {
            existingSettings.remove();
        }
        
        // 설정 패널 생성
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'image-settings-panel';
        settingsPanel.className = 'settings-panel';
        settingsPanel.style.padding = '15px';
        settingsPanel.style.marginBottom = '20px';
        settingsPanel.style.backgroundColor = isDarkMode ? '#2d3748' : '#f8fafc';
        settingsPanel.style.borderRadius = '8px';
        settingsPanel.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        // 패널 제목
        const title = document.createElement('h3');
        title.textContent = '이미지 설정';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        title.style.fontSize = '1.1rem';
        title.style.fontWeight = '600';
        title.style.color = isDarkMode ? '#60a5fa' : '#4a90e2';
        
        // 이미지 크기 슬라이더
        const sizeContainer = document.createElement('div');
        sizeContainer.style.marginBottom = '15px';
        
        const sizeLabel = document.createElement('label');
        sizeLabel.textContent = '이미지 크기: ';
        sizeLabel.style.display = 'block';
        sizeLabel.style.marginBottom = '5px';
        sizeLabel.style.fontSize = '0.9rem';
        
        const sizeValue = document.createElement('span');
        sizeValue.id = 'size-value';
        sizeValue.textContent = `${currentSettings.profileImageSize}px`;
        sizeValue.style.marginLeft = '5px';
        sizeValue.style.fontWeight = 'bold';
        
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = '40';
        sizeSlider.max = '800';
        sizeSlider.step = '10';
        sizeSlider.value = currentSettings.profileImageSize;
        sizeSlider.style.width = '100%';
        
        sizeSlider.addEventListener('input', () => {
            sizeValue.textContent = `${sizeSlider.value}px`;
        });
        
        sizeLabel.appendChild(sizeValue);
        sizeContainer.appendChild(sizeLabel);
        sizeContainer.appendChild(sizeSlider);
        
        // 이미지 품질 슬라이더
        const qualityContainer = document.createElement('div');
        qualityContainer.style.marginBottom = '15px';
        
        const qualityLabel = document.createElement('label');
        qualityLabel.textContent = '이미지 품질: ';
        qualityLabel.style.display = 'block';
        qualityLabel.style.marginBottom = '5px';
        qualityLabel.style.fontSize = '0.9rem';
        
        const qualityValue = document.createElement('span');
        qualityValue.id = 'quality-value';
        qualityValue.textContent = `${Math.round(currentSettings.quality * 100)}%`;
        qualityValue.style.marginLeft = '5px';
        qualityValue.style.fontWeight = 'bold';
        
        const qualitySlider = document.createElement('input');
        qualitySlider.type = 'range';
        qualitySlider.min = '10';
        qualitySlider.max = '100';
        qualitySlider.step = '5';
        qualitySlider.value = Math.round(currentSettings.quality * 100);
        qualitySlider.style.width = '100%';
        
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
        });
        
        qualityLabel.appendChild(qualityValue);
        qualityContainer.appendChild(qualityLabel);
        qualityContainer.appendChild(qualitySlider);
        
        // 저장 버튼
        const saveButton = document.createElement('button');
        saveButton.textContent = '설정 저장';
        saveButton.style.padding = '8px 16px';
        saveButton.style.backgroundColor = isDarkMode ? '#3b82f6' : '#4a90e2';
        saveButton.style.color = '#ffffff';
        saveButton.style.border = 'none';
        saveButton.style.borderRadius = '6px';
        saveButton.style.cursor = 'pointer';
        saveButton.style.fontWeight = '500';
        
        saveButton.addEventListener('click', () => {
            // 새 설정 생성
            const newSettings = {
                profileImageSize: parseInt(sizeSlider.value),
                quality: parseInt(qualitySlider.value) / 100
            };
            
            // 설정 업데이트
            ImageHandler.updateSettings(newSettings);
            
            // 설정 저장
            StorageManager.saveImageSettings(newSettings);
            
            // 설정 패널 숨기기
            settingsPanel.style.display = 'none';
            
            // 상태 메시지 표시
            this.showStatusMessage('이미지 설정이 저장되었습니다.', isDarkMode);
        });
        
        // 패널 조립
        settingsPanel.appendChild(title);
        settingsPanel.appendChild(sizeContainer);
        settingsPanel.appendChild(qualityContainer);
        settingsPanel.appendChild(saveButton);
        
        return settingsPanel;
    },

    

    /**
     * 이미지 설정 버튼 추가
     * @param {Object} state - 애플리케이션 상태
     */
    addImageSettingsButton(state) {
        // 이미 버튼이 있는지 확인
        if (document.getElementById('image-settings-button')) {
            return;
        }
        
        // 버튼 컨테이너
        const container = document.querySelector('.button-container');
        if (!container) return;
        
        // 설정 버튼 생성
        const settingsButton = document.createElement('button');
        settingsButton.id = 'image-settings-button';
        settingsButton.innerHTML = '<i class="fas fa-cog"></i> 이미지 설정';
        settingsButton.title = '이미지 크기 및 품질 설정';
        
        // 버튼 클릭 이벤트 - 설정 패널 토글
        settingsButton.addEventListener('click', () => {
            const existingPanel = document.getElementById('image-settings-panel');
            
            if (existingPanel && existingPanel.style.display !== 'none') {
                existingPanel.style.display = 'none';
            } else {
                // 사용자 프로필 섹션 위에 패널 삽입
                const profilesSection = document.getElementById('user-profiles');
                const panel = this.createImageSettingsUI(ImageHandler.settings, state.darkMode);
                panel.style.display = 'block';
                profilesSection.parentNode.insertBefore(panel, profilesSection);
            }
        });
        
        // 버튼 추가
        container.appendChild(settingsButton);
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
        
        // 압축된 이미지 URL 복원 (미리보기용)
        let profileImage = null;
        if (state.userProfileImages[username]) {
            profileImage = ImageHandler.decompressImageUrl(state.userProfileImages[username]);
        }
        
        const isMyMessage = state.selectedUsers.has(username);
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
        if (isContinuousMessage) {
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

        // 기본 컨테이너 스타일
        const messageContainerStyle = isMyMessage 
            ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;' 
            : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';
        
        // 마지막 메시지만 여백 추가
        const marginStyle = isLastMessage ? 'margin-bottom:10px;' : '';
        
        // 프로필 이미지 영역
        const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
        const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
        const imgStyle = 'width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;';
        
        // 연속 메시지일 경우 프로필과 이름 숨김
        const profileVisibilityStyle = isContinuousMessage ? 'visibility:hidden;' : '';
        
        // 메시지 영역 스타일
        const wrapperStyle = isMyMessage 
            ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;' 
            : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
        
        // 사용자 이름 스타일 (연속 메시지일 경우 숨김)
        const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isContinuousMessage ? 'display:none;' : ''}`;
        
        // 말풍선 스타일
        const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;cursor:pointer;background-color:${bubbleColor};color:${textColor};`;
        
        // 시간 스타일 (연속 메시지의 마지막 메시지가 아니면 숨김)
        const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLastMessage ? '' : 'display:none;'}`;
        
        // 말풍선 꼬리 위치와 모양 - 연속 메시지가 아닐 경우에만 꼬리 표시
        let tailStyle = 'display:none;'; // 기본적으로 숨김
        
        if (!isContinuousMessage) {
            tailStyle = isMyMessage
                ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
                : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
        }
        
        // @태그 처리 및 줄바꿈 처리
        const formattedMessage = MessageParser.formatMessageText(MessageParser.escapeHtml(chatMessage));

        // 프로필 이미지 HTML 생성 (이미지가 없을 경우 회색 배경으로 표시)
        const profileHTML = profileImage 
            ? `<img src="${profileImage}" alt="${MessageParser.escapeHtml(displayName)}" style="${imgStyle}">`
            : ''; // 이미지가 없으면 회색 배경의 빈 div(pictureStyle에 이미 background:#ccc 포함됨)
        
        // 완성된 메시지 HTML 생성
        return `<div style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${MessageParser.escapeHtml(username)}"><div style="${profileStyle}${profileVisibilityStyle}"><div style="${pictureStyle}">${profileHTML}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${MessageParser.escapeHtml(displayName)}</div><div class="message-content" style="${bubbleStyle}" onclick="startEdit(${index})"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${MessageParser.escapeHtml(time)}</div></div></div>`;
    }
};

// 전역 변수로 노출
window.UIManager = UIManager;

/**
 * 고급 설정 UI 생성 및 표시
 * @param {Object} state - 애플리케이션 상태
 */
UIManager.createAdvancedSettingsUI = function(state) {
    // 기존 설정 UI가 있으면 먼저 제거
    const existingSettings = document.getElementById('advanced-settings-panel');
    if (existingSettings) {
        existingSettings.remove();
    }
    
    // 현재 설정 불러오기
    let currentSettings = {};
    if (typeof StorageManager !== 'undefined' && StorageManager) {
        currentSettings = StorageManager.loadAdvancedSettings();
    }
    
    // 설정 패널 생성
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'advanced-settings-panel';
    settingsPanel.className = 'settings-panel';
    settingsPanel.style.padding = '15px';
    settingsPanel.style.marginBottom = '20px';
    settingsPanel.style.backgroundColor = state.darkMode ? '#2d3748' : '#f8fafc';
    settingsPanel.style.borderRadius = '8px';
    settingsPanel.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    
    // 패널 제목
    const title = document.createElement('h3');
    title.textContent = '고급 설정';
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    title.style.fontSize = '1.1rem';
    title.style.fontWeight = '600';
    title.style.color = state.darkMode ? '#60a5fa' : '#4a90e2';
    
    // 태그 강조 설정
    const tagHighlightContainer = document.createElement('div');
    tagHighlightContainer.style.marginBottom = '15px';
    
    const tagToggleLabel = document.createElement('label');
    tagToggleLabel.className = 'toggle-switch-label';
    tagToggleLabel.style.display = 'flex';
    tagToggleLabel.style.alignItems = 'center';
    tagToggleLabel.style.cursor = 'pointer';
    
    const tagHighlightCheckbox = document.createElement('input');
    tagHighlightCheckbox.type = 'checkbox';
    tagHighlightCheckbox.id = 'tag-highlight-toggle';
    tagHighlightCheckbox.checked = currentSettings.highlightTags === undefined ? true : currentSettings.highlightTags;
    tagHighlightCheckbox.style.margin = '0 10px 0 0';
    
    const tagHighlightText = document.createElement('span');
    tagHighlightText.textContent = '@태그 강조 표시';
    tagHighlightText.style.fontSize = '0.95rem';
    
    tagToggleLabel.appendChild(tagHighlightCheckbox);
    tagToggleLabel.appendChild(tagHighlightText);
    tagHighlightContainer.appendChild(tagToggleLabel);
    
    // 이미지 설정 구분선
    const divider = document.createElement('hr');
    divider.style.margin = '20px 0';
    divider.style.border = 'none';
    divider.style.borderTop = '1px solid ' + (state.darkMode ? '#4a5568' : '#e2e8f0');
    
    // 이미지 크기 슬라이더
    const sizeContainer = document.createElement('div');
    sizeContainer.style.marginBottom = '15px';
    
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = '이미지 크기: ';
    sizeLabel.style.display = 'block';
    sizeLabel.style.marginBottom = '5px';
    sizeLabel.style.fontSize = '0.9rem';
    
    const sizeValue = document.createElement('span');
    sizeValue.id = 'size-value';
    sizeValue.textContent = `${currentSettings.maxImageSize || 100}px`;
    sizeValue.style.marginLeft = '5px';
    sizeValue.style.fontWeight = 'bold';
    
    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '40';
    sizeSlider.max = '200';
    sizeSlider.step = '10';
    sizeSlider.value = currentSettings.maxImageSize || 100;
    sizeSlider.style.width = '100%';
    
    sizeSlider.addEventListener('input', () => {
        sizeValue.textContent = `${sizeSlider.value}px`;
    });
    
    sizeLabel.appendChild(sizeValue);
    sizeContainer.appendChild(sizeLabel);
    sizeContainer.appendChild(sizeSlider);
    
    // 이미지 품질 슬라이더
    const qualityContainer = document.createElement('div');
    qualityContainer.style.marginBottom = '15px';
    
    const qualityLabel = document.createElement('label');
    qualityLabel.textContent = '이미지 품질: ';
    qualityLabel.style.display = 'block';
    qualityLabel.style.marginBottom = '5px';
    qualityLabel.style.fontSize = '0.9rem';
    
    const qualityValue = document.createElement('span');
    qualityValue.id = 'quality-value';
    qualityValue.textContent = `${Math.round((currentSettings.imageQuality || 0.4) * 100)}%`;
    qualityValue.style.marginLeft = '5px';
    qualityValue.style.fontWeight = 'bold';
    
    const qualitySlider = document.createElement('input');
    qualitySlider.type = 'range';
    qualitySlider.min = '20';
    qualitySlider.max = '80';
    qualitySlider.step = '5';
    qualitySlider.value = Math.round((currentSettings.imageQuality || 0.4) * 100);
    qualitySlider.style.width = '100%';
    
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });
    
    qualityLabel.appendChild(qualityValue);
    qualityContainer.appendChild(qualityLabel);
    qualityContainer.appendChild(qualitySlider);
    
    // 이미지 압축 설정
    const compressionContainer = document.createElement('div');
    compressionContainer.style.marginBottom = '20px';
    
    const compressionLabel = document.createElement('label');
    compressionLabel.className = 'toggle-switch-label';
    compressionLabel.style.display = 'flex';
    compressionLabel.style.alignItems = 'center';
    compressionLabel.style.cursor = 'pointer';
    
    const compressionCheckbox = document.createElement('input');
    compressionCheckbox.type = 'checkbox';
    compressionCheckbox.id = 'image-compression-toggle';
    compressionCheckbox.checked = currentSettings.useImageCompression === undefined ? true : currentSettings.useImageCompression;
    compressionCheckbox.style.margin = '0 10px 0 0';
    
    const compressionText = document.createElement('span');
    compressionText.textContent = '이미지 압축 사용 (URL 길이 단축)';
    compressionText.style.fontSize = '0.95rem';
    
    compressionLabel.appendChild(compressionCheckbox);
    compressionLabel.appendChild(compressionText);
    compressionContainer.appendChild(compressionLabel);
    
    // 저장 버튼
    const saveButton = document.createElement('button');
    saveButton.textContent = '설정 저장';
    saveButton.style.padding = '8px 16px';
    saveButton.style.backgroundColor = state.darkMode ? '#3b82f6' : '#4a90e2';
    saveButton.style.color = '#ffffff';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '6px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontWeight = '500';
    
    // bind(this) 오류 수정 - 올바른 방법으로 this 바인딩
    const self = this;
    saveButton.addEventListener('click', function() {
        // 새 설정 생성
        const newSettings = {
            highlightTags: tagHighlightCheckbox.checked,
            maxImageSize: parseInt(sizeSlider.value),
            imageQuality: parseInt(qualitySlider.value) / 100,
            useImageCompression: compressionCheckbox.checked
        };
        
        // 설정 업데이트
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            StorageManager.saveAdvancedSettings(newSettings);
        }
        
        // 이미지 설정 업데이트
        if (typeof ImageHandler !== 'undefined' && ImageHandler) {
            ImageHandler.updateSettings({
                profileImageSize: newSettings.maxImageSize,
                quality: newSettings.imageQuality,
                compressImages: newSettings.useImageCompression
            });
        }
        
        // 태그 강조 설정 저장
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            StorageManager.saveTagHighlightSetting(newSettings.highlightTags);
        }
        
        // 애플리케이션 상태 업데이트
        state.highlightTags = newSettings.highlightTags;
        
        // 설정 패널 숨기기
        settingsPanel.style.display = 'none';
        
        // 메시지 다시 렌더링 (태그 강조 설정 반영)
        if (state.messages && state.messages.length > 0) {
            if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            }
        }
        
        // 상태 메시지 표시
        self.showStatusMessage('고급 설정이 저장되었습니다.', state.darkMode);
    });
    
    // 패널 조립
    settingsPanel.appendChild(title);
    settingsPanel.appendChild(tagHighlightContainer);
    settingsPanel.appendChild(divider);
    settingsPanel.appendChild(sizeContainer);
    settingsPanel.appendChild(qualityContainer);
    settingsPanel.appendChild(compressionContainer);
    settingsPanel.appendChild(saveButton);
    
    return settingsPanel;
};

/**
 * 고급 설정 버튼 추가
 * @param {Object} state - 애플리케이션 상태
 */
UIManager.addAdvancedSettingsButton = function(state) {
    // 이미 버튼이 있는지 확인
    if (document.getElementById('advanced-settings-button')) {
        return;
    }
    
    // 버튼 컨테이너
    const container = document.querySelector('.button-container');
    if (!container) return;
    
    // 설정 버튼 생성
    const settingsButton = document.createElement('button');
    settingsButton.id = 'advanced-settings-button';
    settingsButton.innerHTML = '<i class="fas fa-sliders-h"></i> 고급 설정';
    settingsButton.title = '태그 강조 및 이미지 최적화 설정';
    
    // 버튼 클릭 이벤트 - 설정 패널 토글
    settingsButton.addEventListener('click', () => {
        const existingPanel = document.getElementById('advanced-settings-panel');
        
        if (existingPanel && existingPanel.style.display !== 'none') {
            existingPanel.style.display = 'none';
        } else {
            // 사용자 프로필 섹션 위에 패널 삽입
            const profilesSection = document.getElementById('user-profiles');
            const panel = this.createAdvancedSettingsUI(state);
            panel.style.display = 'block';
            profilesSection.parentNode.insertBefore(panel, profilesSection);
        }
    });
    
    // 버튼 추가
    container.appendChild(settingsButton);
};