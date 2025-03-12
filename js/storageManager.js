// /js/storageManager.js - 로컬 스토리지 관리 모듈

/**
 * 스토리지 관리자 모듈 - 로컬 스토리지 데이터 저장 및 불러오기
 */
const StorageManager = {
    /**
     * 프로필 정보를 로컬 스토리지에 저장
     * @param {Object} profiles - 저장할 프로필 정보 객체
     * @param {Object} profiles.displayNames - 사용자 표시 이름
     * @param {Object} profiles.userProfileImages - 사용자 프로필 이미지
     * @param {Object} profiles.userColors - 사용자 색상
     * @param {Set} selectedUsers - 내 메시지로 표시할 사용자들
     */
    saveProfiles(profiles, selectedUsers) {
        try {
            localStorage.setItem('chatProfiles', JSON.stringify({
                displayNames: profiles.displayNames,
                userProfileImages: profiles.userProfileImages,
                userColors: profiles.userColors
            }));
            
            localStorage.setItem('selectedUsers', JSON.stringify(Array.from(selectedUsers)));
        } catch (error) {
            console.error('프로필 저장 중 오류 발생:', error);
        }
    },

    /**
     * 저장된 프로필 정보를 로컬 스토리지에서 불러오기
     * @returns {Object} 불러온 프로필 정보와 선택된 사용자
     */
    loadProfiles() {
        const result = {
            displayNames: {},
            userProfileImages: {},
            userColors: {},
            selectedUsers: new Set()
        };

        try {
            const savedProfiles = localStorage.getItem('chatProfiles');
            if (savedProfiles) {
                const profiles = JSON.parse(savedProfiles);
                result.displayNames = profiles.displayNames || {};
                result.userProfileImages = profiles.userProfileImages || {};
                result.userColors = profiles.userColors || {};
            }

            const savedSelectedUsers = localStorage.getItem('selectedUsers');
            if (savedSelectedUsers) {
                result.selectedUsers = new Set(JSON.parse(savedSelectedUsers));
            }
        } catch (error) {
            console.error('프로필 불러오기 중 오류 발생:', error);
        }

        return result;
    },

    /**
     * 이미지 설정 저장
     * @param {Object} settings - 이미지 설정 객체
     */
    saveImageSettings(settings) {
        try {
            localStorage.setItem('imageSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('이미지 설정 저장 중 오류 발생:', error);
        }
    },

    /**
     * 이미지 설정 불러오기
     * @returns {Object|null} 저장된 이미지 설정 객체 또는 null
     */
    loadImageSettings() {
        try {
            const savedSettings = localStorage.getItem('imageSettings');
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error('이미지 설정 불러오기 실패:', error);
        }
        return null;
    },

    /**
     * 테마 설정 저장
     * @param {boolean} isDarkMode - 다크모드 여부
     */
    saveThemePreference(isDarkMode) {
        localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
    },

    /**
     * 테마 설정 불러오기
     * @returns {boolean} 다크모드 여부
     */
    loadThemePreference() {
        return localStorage.getItem('theme-preference') === 'dark';
    },

    /**
     * 업데이트 로그 상태 저장
     * @param {boolean} isOpen - 열려있는지 여부
     */
    saveUpdateLogState(isOpen) {
        localStorage.setItem('updateLogOpen', isOpen);
    },

    /**
     * 업데이트 로그 상태 불러오기
     * @returns {boolean} 열려있는지 여부
     */
    loadUpdateLogState() {
        return localStorage.getItem('updateLogOpen') === 'true';
    },
    
    /**
     * 태그 강조 설정 저장
     * @param {boolean} highlightTags - 태그 강조 활성화 여부
     */
    saveTagHighlightSetting(highlightTags) {
        localStorage.setItem('highlightTags', highlightTags ? 'true' : 'false');
    },
    
    /**
     * 태그 강조 설정 불러오기
     * @returns {boolean} 태그 강조 활성화 여부 (기본값: true)
     */
    loadTagHighlightSetting() {
        // 이전에 설정한 값이 없으면 기본값으로 true 반환
        const savedSetting = localStorage.getItem('highlightTags');
        return savedSetting === null ? true : savedSetting === 'true';
    },
    
    /**
     * 내 메시지의 이미지 표시 설정 저장
     * @param {boolean} showMyProfile - 내 메시지에 프로필 이미지 표시 여부
     */
    saveShowMyProfileSetting(showMyProfile) {
        localStorage.setItem('showMyProfile', showMyProfile ? 'true' : 'false');
    },
    
    /**
     * 내 메시지의 이미지 표시 설정 불러오기
     * @returns {boolean} 내 메시지에 프로필 이미지 표시 여부 (기본값: true)
     */
    loadShowMyProfileSetting() {
        // 이전에 설정한 값이 없으면 기본값으로 true 반환
        const savedSetting = localStorage.getItem('showMyProfile');
        return savedSetting === null ? true : savedSetting === 'true';
    },
    
    /**
     * 고급 설정 저장
     * @param {Object} settings - 고급 설정 객체
     */
    saveAdvancedSettings(settings) {
        try {
            localStorage.setItem('advancedSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('고급 설정 저장 중 오류 발생:', error);
        }
    },
    
    /**
     * 고급 설정 불러오기
     * @returns {Object} 고급 설정 객체 (기본값 포함)
     */
    loadAdvancedSettings() {
        const defaultSettings = {
            highlightTags: true,
            showMyProfile: true,
            imageQuality: 0.7,    // 기본 이미지 품질 (0.4 = 40%)
            useImageCompression: true,
            maxImageSize: 100     // 기본 최대 이미지 크기 (100px)
        };
        
        try {
            const savedSettings = localStorage.getItem('advancedSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // 기본값과 병합하여 누락된 설정이 있으면 기본값 사용
                return { ...defaultSettings, ...parsedSettings };
            }
        } catch (error) {
            console.error('고급 설정 불러오기 실패:', error);
        }
        
        return defaultSettings;
    }
};

// 전역 변수로 노출
window.StorageManager = StorageManager;