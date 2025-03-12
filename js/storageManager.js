// /js/storageManager.js - 로컬 스토리지 관리 모듈

const StorageManager = {

    // 프로필 정보를 로컬 스토리지에 저장
     
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

    saveImageSettings(settings) {
        try {
            localStorage.setItem('imageSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('이미지 설정 저장 중 오류 발생:', error);
        }
    },

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

    saveThemePreference(isDarkMode) {
        localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
    },

    loadThemePreference() {
        return localStorage.getItem('theme-preference') === 'dark';
    },

    saveUpdateLogState(isOpen) {
        localStorage.setItem('updateLogOpen', isOpen);
    },

    loadUpdateLogState() {
        return localStorage.getItem('updateLogOpen') === 'true';
    },
    
    saveTagHighlightSetting(highlightTags) {
        localStorage.setItem('highlightTags', highlightTags ? 'true' : 'false');
    },
    
    loadTagHighlightSetting() {
        // 이전에 설정한 값이 없으면 기본값으로 true 반환
        const savedSetting = localStorage.getItem('highlightTags');
        return savedSetting === null ? true : savedSetting === 'true';
    },
    
    saveShowMyProfileSetting(showMyProfile) {
        localStorage.setItem('showMyProfile', showMyProfile ? 'true' : 'false');
    },
    
    loadShowMyProfileSetting() {
        // 이전에 설정한 값이 없으면 기본값으로 true 반환
        const savedSetting = localStorage.getItem('showMyProfile');
        return savedSetting === null ? true : savedSetting === 'true';
    },
    
    saveAdvancedSettings(settings) {
        try {
            localStorage.setItem('advancedSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('고급 설정 저장 중 오류 발생:', error);
        }
    },
    
    loadAdvancedSettings() {
        const defaultSettings = {
            highlightTags: true,
            showMyProfile: true,
            imageQuality: 0.6,   
            useImageCompression: true,
            maxImageSize: 150     
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