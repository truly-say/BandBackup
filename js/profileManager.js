// /js/profileManager.js - 프로필 관리 모듈

/**
 * 프로필 관리자 모듈 - 유저 프로필 설정 및 관리
 */
const ProfileManager = {
    /**
     * 모듈 초기화 상태
     */
    initialized: false,

    /**
     * 프로필 설정 UI 생성
     * @param {Object} state - 애플리케이션 상태
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    createProfileSettings(state, renderMessages) {
        console.log('ProfileManager.createProfileSettings 시작');
        
        const userProfiles = document.getElementById('user-profiles');
        if (!userProfiles) {
            console.error('user-profiles 요소를 찾을 수 없습니다');
            return;
        }
        
        // 프로필 그리드 확인 및 초기화 - 항상 새로 생성
        const existingGrid = userProfiles.querySelector('.profile-grid');
        if (existingGrid) {
            console.log('기존 프로필 그리드를 초기화합니다');
            // 기존 그리드 삭제
            userProfiles.innerHTML = '';
        }
        
        // 유니크 유저네임 가져오기
        const usernames = new Set(state.messages.map(msg => msg.username));
        console.log(`고유 사용자 수: ${usernames.size}`);
        
        const MAX_USERS = 25; // 최대 지원 사용자 수
        if (usernames.size > MAX_USERS) {
            alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
            userProfiles.innerHTML = '';
            userProfiles.style.display = 'none';
            return;
        }

        // 프로필 입력 UI 생성
        userProfiles.innerHTML = `
            <div class="profile-header">
                <h3>채팅 참여자 프로필 설정</h3>
                <p class="profile-info">체크박스를 선택하면 해당 사용자의 메시지가 내 메시지로 표시됩니다. (복수 선택 가능)</p>
                <div class="profile-actions">
                    <button id="reset-all-profiles" class="action-button">전체 프로필 초기화</button>
                    <button id="uncheck-all" class="action-button">모든 체크 해제</button>
                </div>
                <p class="upload-info">※ 이미지 삽입 시 업로드 및 변환 과정에 시간이 소요될 수 있습니다.</p>
            </div>
            <div class="profile-grid"></div>
        `;
        
        const profileGrid = userProfiles.querySelector('.profile-grid');
        if (!profileGrid) {
            console.error('profile-grid 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('프로필 카드 생성 시작');
        
        // 각 사용자별 프로필 카드 생성
        let profilesAdded = 0;
        Array.from(usernames).forEach(username => {
            try {
                // onProfileReset 함수 참조 전달
                const profileCard = this.createProfileInput(
                    username, 
                    state, 
                    (username) => this.resetProfile(username, state, renderMessages)
                );
                
                if (profileCard) {
                    profileGrid.appendChild(profileCard);
                    profilesAdded++;
                }
            } catch (error) {
                console.error(`사용자 '${username}' 프로필 카드 생성 중 오류:`, error);
            }
        });
        
        console.log(`프로필 카드 ${profilesAdded}개 생성됨`);
        
        // 명시적으로 표시 설정
        userProfiles.style.display = 'block';
        userProfiles.style.visibility = 'visible';
        userProfiles.style.opacity = '1';
        
        console.log('userProfiles 요소 스타일:');
        console.log('- display:', userProfiles.style.display);
        console.log('- visibility:', userProfiles.style.visibility);
        console.log('- opacity:', userProfiles.style.opacity);
        
        // 전체 프로필 초기화 버튼 이벤트 추가
        const resetAllBtn = document.getElementById('reset-all-profiles');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                console.log('전체 프로필 초기화 버튼 클릭됨');
                this.resetAllProfiles(state, renderMessages);
            });
        } else {
            console.error('reset-all-profiles 버튼을 찾을 수 없습니다');
        }
        
        // 모든 체크 해제 버튼 이벤트 추가
        const uncheckAllBtn = document.getElementById('uncheck-all');
        if (uncheckAllBtn) {
            uncheckAllBtn.addEventListener('click', () => {
                console.log('모든 체크 해제 버튼 클릭됨');
                this.uncheckAllProfiles(state, renderMessages);
            });
        } else {
            console.error('uncheck-all 버튼을 찾을 수 없습니다');
        }
        
        console.log('ProfileManager.createProfileSettings 완료');
    },

    /**
     * 사용자 프로필 입력 UI 생성 함수
     * @param {string} username - 사용자명
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} onProfileReset - 프로필 초기화 처리 함수
     * @returns {HTMLElement} 생성된 프로필 카드 요소
     */
    createProfileInput(username, state, onProfileReset) {
        if (!username) {
            console.error('사용자명이 제공되지 않았습니다');
            return null;
        }
        
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
            console.log(`체크박스 상태 변경: ${username}, 체크됨: ${e.target.checked}`);
            
            if (e.target.checked) {
                state.selectedUsers.add(username);
                div.classList.add('is-my-message');
            } else {
                state.selectedUsers.delete(username);
                div.classList.remove('is-my-message');
            }
            
            // 선택 상태가 변경될 때마다 저장 및 렌더링
            if (typeof StorageManager !== 'undefined' && StorageManager) {
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
            } else {
                console.error('StorageManager가 로드되지 않았습니다');
            }
            
            // 메시지 다시 렌더링
            if (typeof renderMessages === 'function') {
                renderMessages();
            } else if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            } else {
                console.error('renderMessages 함수를 찾을 수 없습니다');
            }
        });
        
        div.appendChild(myMessageCheckbox);

        // 프로필 사진 미리보기
        const preview = document.createElement('div');
        preview.className = 'profile-preview';
        
        // 저장된 이미지가 있다면 표시
        if (state.userProfileImages[username]) {
            // 압축된 이미지 URL 복원
            try {
                if (typeof ImageHandler !== 'undefined' && ImageHandler) {
                    const displayUrl = ImageHandler.decompressImageUrl(state.userProfileImages[username]);
                    const img = document.createElement('img');
                    img.src = displayUrl;
                    preview.appendChild(img);
                } else {
                    console.error('ImageHandler가 로드되지 않았습니다');
                }
            } catch (error) {
                console.error(`이미지 URL 복원 중 오류: ${username}`, error);
            }
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
        const safeID = (typeof MessageParser !== 'undefined' && MessageParser) 
            ? MessageParser.safeId(username) 
            : username.replace(/[^a-z0-9]/gi, '_');
            
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
            console.log(`프로필 초기화 버튼 클릭: ${username}`);
            if (confirm('프로필을 초기화하시겠습니까?')) {
                if (typeof onProfileReset === 'function') {
                    onProfileReset(username);
                } else {
                    console.error('onProfileReset 함수가 제공되지 않았습니다');
                }
            }
        };

        // 이벤트 리스너
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                console.log(`파일 선택됨: ${username}, 파일명: ${file.name}`);
                
                // 이미지 처리를 ImageHandler에 위임
                if (typeof ImageHandler !== 'undefined' && ImageHandler) {
                    ImageHandler.processUploadedImage(
                        file, 
                        preview, 
                        (processedImageUrl) => {
                            console.log(`이미지 처리 완료: ${username}`);
                            // 성공 시 이미지 데이터 저장 및 UI 업데이트
                            state.userProfileImages[username] = processedImageUrl;
                            
                            // 프로필 저장
                            if (typeof StorageManager !== 'undefined' && StorageManager) {
                                StorageManager.saveProfiles({
                                    displayNames: state.displayNames,
                                    userProfileImages: state.userProfileImages,
                                    userColors: state.userColors
                                }, state.selectedUsers);
                            } else {
                                console.error('StorageManager가 로드되지 않았습니다');
                            }
                            
                            // 메시지 다시 렌더링
                            if (typeof renderMessages === 'function') {
                                renderMessages();
                            } else if (typeof window.renderMessages === 'function') {
                                window.renderMessages();
                            } else {
                                console.error('renderMessages 함수를 찾을 수 없습니다');
                            }
                        }
                    );
                } else {
                    console.error('ImageHandler가 로드되지 않았습니다');
                    alert('이미지 처리 모듈이 로드되지 않았습니다.');
                }
            }
        });

        displayInput.addEventListener('change', () => {
            console.log(`표시 이름 변경: ${username} -> ${displayInput.value}`);
            state.displayNames[username] = displayInput.value;
            
            // 프로필 저장
            if (typeof StorageManager !== 'undefined' && StorageManager) {
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
            } else {
                console.error('StorageManager가 로드되지 않았습니다');
            }
            
            // 메시지 다시 렌더링
            if (typeof renderMessages === 'function') {
                renderMessages();
            } else if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            } else {
                console.error('renderMessages 함수를 찾을 수 없습니다');
            }
        });

        colorInput.addEventListener('change', () => {
            console.log(`색상 변경: ${username} -> ${colorInput.value}`);
            state.userColors[username] = colorInput.value;
            
            // 프로필 저장
            if (typeof StorageManager !== 'undefined' && StorageManager) {
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
            } else {
                console.error('StorageManager가 로드되지 않았습니다');
            }
            
            // 메시지 다시 렌더링
            if (typeof renderMessages === 'function') {
                renderMessages();
            } else if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            } else {
                console.error('renderMessages 함수를 찾을 수 없습니다');
            }
        });

        // 프로필 카드 조립
        div.append(imageContainer, nameContainer, resetBtn);
        
        // 드래그 앤 드롭 설정
        if (typeof ImageHandler !== 'undefined' && ImageHandler) {
            ImageHandler.setupDragAndDrop(
                div, 
                preview, 
                (processedImageUrl) => {
                    console.log(`드래그 앤 드롭으로 이미지 추가: ${username}`);
                    state.userProfileImages[username] = processedImageUrl;
                    
                    // 프로필 저장
                    if (typeof StorageManager !== 'undefined' && StorageManager) {
                        StorageManager.saveProfiles({
                            displayNames: state.displayNames,
                            userProfileImages: state.userProfileImages,
                            userColors: state.userColors
                        }, state.selectedUsers);
                    } else {
                        console.error('StorageManager가 로드되지 않았습니다');
                    }
                    
                    // 메시지 다시 렌더링
                    if (typeof renderMessages === 'function') {
                        renderMessages();
                    } else if (typeof window.renderMessages === 'function') {
                        window.renderMessages();
                    } else {
                        console.error('renderMessages 함수를 찾을 수 없습니다');
                    }
                }
            );
        } else {
            console.error('ImageHandler가 로드되지 않았습니다');
        }
        
        return div;
    },

    /**
     * 프로필 초기화 함수
     * @param {string} username - 초기화할 사용자명
     * @param {Object} state - 애플리케이션 상태
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    resetProfile(username, state, renderMessages) {
        console.log(`프로필 초기화: ${username}`);
        
        // 프로필 이미지 초기화
        delete state.userProfileImages[username];
        delete state.userColors[username];
        state.displayNames[username] = username;
        
        // 변경사항 저장
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            StorageManager.saveProfiles({
                displayNames: state.displayNames,
                userProfileImages: state.userProfileImages,
                userColors: state.userColors
            }, state.selectedUsers);
        } else {
            console.error('StorageManager가 로드되지 않았습니다');
        }
        
        // 프로필 미리보기 업데이트
        const preview = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .profile-preview`);
        if (preview) {
            preview.innerHTML = '';
        }
        
        // 파일 입력 초기화
        const safeID = (typeof MessageParser !== 'undefined' && MessageParser) 
            ? MessageParser.safeId(username) 
            : username.replace(/[^a-z0-9]/gi, '_');
        const fileInput = document.getElementById(`file-${safeID}`);
        if (fileInput) {
            fileInput.value = '';
        }
        
        // 체크박스 초기화 
        const checkbox = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .my-message-checkbox`);
        if (checkbox) {
            checkbox.checked = false;
        }
        
        // 카드 강조 스타일 제거
        const card = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"]`);
        if (card) {
            card.classList.remove('is-my-message');
        }
        
        // 선택된 사용자에서 제거
        state.selectedUsers.delete(username);
        
        // 디스플레이 이름 입력 필드 업데이트
        const displayInput = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .display-name-input`);
        if (displayInput) {
            displayInput.value = username;
        }
        
        // 색상 선택기 초기화
        const colorInput = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .color-picker`);
        if (colorInput) {
            colorInput.value = '#000000';
        }
        
        // 메시지 다시 렌더링
        if (typeof renderMessages === 'function') {
            renderMessages();
        } else if (typeof window.renderMessages === 'function') {
            window.renderMessages();
        } else {
            console.error('renderMessages 함수를 찾을 수 없습니다');
        }
    },

    /**
     * 모든 사용자 프로필 초기화 함수
     * @param {Object} state - 애플리케이션 상태
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    resetAllProfiles(state, renderMessages) {
        console.log('모든 프로필 초기화 시도');
        
        if (confirm('모든 사용자의 프로필을 초기화하시겠습니까?\n(이름, 색상, 이미지가 모두 초기화됩니다)')) {
            console.log('모든 프로필 초기화 확인');
            
            // 고유 사용자 이름 목록 가져오기 
            const usernames = new Set(state.messages.map(msg => msg.username));
            
            // 선택된 사용자 목록 비우기
            state.selectedUsers.clear();
            
            // 각 사용자별 프로필 초기화
            usernames.forEach(username => {
                // 프로필 이미지 초기화
                delete state.userProfileImages[username];
                // 사용자 색상 초기화
                delete state.userColors[username];
                // 표시 이름을 원래 이름으로 초기화
                state.displayNames[username] = username;
                
                // UI 요소 초기화
                const card = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"]`);
                if (card) {
                    // 미리보기 이미지 초기화
                    const preview = card.querySelector('.profile-preview');
                    if (preview) preview.innerHTML = '';
                    
                    // 체크박스 초기화
                    const checkbox = card.querySelector('.my-message-checkbox');
                    if (checkbox) checkbox.checked = false;
                    
                    // 카드 강조 스타일 제거
                    card.classList.remove('is-my-message');
                    
                    // 이름 입력 초기화
                    const displayInput = card.querySelector('.display-name-input');
                    if (displayInput) displayInput.value = username;
                    
                    // 색상 선택기 초기화
                    const colorInput = card.querySelector('.color-picker');
                    if (colorInput) colorInput.value = '#000000';
                    
                    // 파일 입력 초기화
                    const fileInput = card.querySelector('.profile-file-input');
                    if (fileInput) fileInput.value = '';
                }
            });
            
            // 변경사항 저장
            if (typeof StorageManager !== 'undefined' && StorageManager) {
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
            } else {
                console.error('StorageManager가 로드되지 않았습니다');
            }
            
            // 메시지 다시 렌더링
            if (typeof renderMessages === 'function') {
                renderMessages();
            } else if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            } else {
                console.error('renderMessages 함수를 찾을 수 없습니다');
            }
            
            // 상태 메시지 표시
            if (typeof UIManager !== 'undefined' && UIManager) {
                UIManager.showStatusMessage('모든 프로필이 초기화되었습니다.', state.darkMode);
            } else {
                alert('모든 프로필이 초기화되었습니다.');
            }
        }
    },

    /**
     * 모든 체크박스 해제 함수
     * @param {Object} state - 애플리케이션 상태
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    uncheckAllProfiles(state, renderMessages) {
        console.log('모든 체크 해제 시도');
        
        if (state.selectedUsers.size === 0) {
            console.log('선택된 사용자가 없음');
            
            if (typeof UIManager !== 'undefined' && UIManager) {
                UIManager.showStatusMessage('선택된 사용자가 없습니다.', state.darkMode);
            } else {
                alert('선택된 사용자가 없습니다.');
            }
            return;
        }
        
        if (confirm('모든 사용자의 "내 메시지" 설정을 해제하시겠습니까?')) {
            console.log('모든 체크 해제 확인됨');
            
            state.selectedUsers.clear();
            
            // 모든 체크박스 업데이트
            document.querySelectorAll('.my-message-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 모든 카드 스타일 업데이트
            document.querySelectorAll('.user-profile-card').forEach(card => {
                card.classList.remove('is-my-message');
            });
            
            // 변경사항 저장
            if (typeof StorageManager !== 'undefined' && StorageManager) {
                StorageManager.saveProfiles({
                    displayNames: state.displayNames,
                    userProfileImages: state.userProfileImages,
                    userColors: state.userColors
                }, state.selectedUsers);
            } else {
                console.error('StorageManager가 로드되지 않았습니다');
            }
            
            // 메시지 다시 렌더링
            if (typeof renderMessages === 'function') {
                renderMessages();
            } else if (typeof window.renderMessages === 'function') {
                window.renderMessages();
            } else {
                console.error('renderMessages 함수를 찾을 수 없습니다');
            }
            
            // 상태 메시지 표시
            if (typeof UIManager !== 'undefined' && UIManager) {
                UIManager.showStatusMessage('모든 "내 메시지" 설정이 해제되었습니다.', state.darkMode);
            } else {
                alert('모든 "내 메시지" 설정이 해제되었습니다.');
            }
        }
    }
};

// 전역 변수로 노출
window.ProfileManager = ProfileManager;

// 콘솔에 로드 확인 메시지 출력
console.log('ProfileManager 모듈이 성공적으로 로드되었습니다.');

// 초기화 코드 - DOM 로드 시 모듈 초기화
document.addEventListener('DOMContentLoaded', function() {
    // DOMContentLoaded 이벤트가 여러 번 발생할 수 있으므로 이미 초기화되었는지 확인
    if (!window.ProfileManager.initialized) {
        console.log('ProfileManager 모듈 초기화 중...');
        window.ProfileManager.initialized = true;
    }
});