// /js/imageHandler.js - 이미지 처리 및 최적화 모듈

/**
 * 이미지 핸들러 모듈 - 이미지 처리 및 최적화
 */
const ImageHandler = {
    // 기본 설정
    settings: {
        profileImageSize: 100,  // 기본 프로필 이미지 크기 (픽셀)
        quality: 0.4,          // 기본 이미지 품질 (0.4 = 40%)
        compressImages: true    // 이미지 압축 사용 여부
    },

    /**
     * 이미지 설정 업데이트
     * @param {Object} newSettings - 새 설정 객체
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    },

    /**
     * 업로드된 이미지 처리
     * @param {File} file - 업로드된 이미지 파일
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @param {Function} onComplete - 처리 완료 콜백 함수
     */
    processUploadedImage(file, previewElement, onComplete) {
        // 이미지 타입 확인
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        const reader = new FileReader();
        
        // 로딩 표시
        if (typeof UIManager !== 'undefined' && UIManager) {
            UIManager.toggleLoadingOverlay(true, '이미지 처리 중...');
        }
        
        reader.onload = async (e) => {
            try {
                // 이미지 데이터 URL
                const imageDataUrl = e.target.result;
                
                // 미리보기 이미지 표시
                previewElement.innerHTML = '';
                const img = document.createElement('img');
                img.src = imageDataUrl;
                previewElement.appendChild(img);
                
                // 비율 유지 이미지 최적화 사용 (있는 경우)
                let optimizedImageUrl;
                if (typeof AspectRatioOptimizer !== 'undefined') {
                    // 내 메시지 사용자는 더 높은 품질로 처리
                    const isImportant = true; // 업로드 시에는 기본적으로 중요하게 처리
                    optimizedImageUrl = await AspectRatioOptimizer.optimizeImage(imageDataUrl, isImportant);
                } else {
                    // 기존 최적화 사용
                    optimizedImageUrl = await this.optimizeImage(imageDataUrl);
                }
                
                // 완료 콜백 호출
                if (typeof onComplete === 'function') {
                    onComplete(optimizedImageUrl);
                }
            } catch (error) {
                console.error('이미지 처리 중 오류 발생:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            } finally {
                // 로딩 표시 숨김
                if (typeof UIManager !== 'undefined' && UIManager) {
                    UIManager.toggleLoadingOverlay(false);
                }
            }
        };
        
        reader.onerror = () => {
            console.error('파일 읽기 실패');
            alert('파일을 읽는 중 오류가 발생했습니다.');
            if (typeof UIManager !== 'undefined' && UIManager) {
                UIManager.toggleLoadingOverlay(false);
            }
        };
        
        // 파일 읽기 시작
        reader.readAsDataURL(file);
    },

    /**
     * 이미지 최적화 함수
     * @param {string} imageDataUrl - 이미지 Data URL
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    optimizeImage(imageDataUrl) {
        return new Promise((resolve, reject) => {
            try {
                // 이미 압축된 이미지인지 확인
                if (imageDataUrl && (
                    imageDataUrl.includes('LZSTR:') || 
                    imageDataUrl.includes('LZPROF:') || 
                    imageDataUrl.includes('OPTIMIZE:') ||
                    imageDataUrl.includes('NOCOMPRESS:')
                )) {
                    return resolve(imageDataUrl);
                }
                
                // 빈 이미지 확인
                if (!imageDataUrl || imageDataUrl === '') {
                    return resolve('');
                }
                
                // 이미지 로드
                const img = new Image();
                img.src = imageDataUrl;
                
                img.onload = () => {
                    try {
                        // 고급 설정 로드
                        let advancedSettings = {};
                        if (typeof StorageManager !== 'undefined' && StorageManager) {
                            advancedSettings = StorageManager.loadAdvancedSettings();
                        }
                        
                        // 설정 적용 (사용자 정의 설정 또는 기본값)
                        const maxSize = advancedSettings.maxImageSize || this.settings.profileImageSize;
                        const imageQuality = advancedSettings.imageQuality || this.settings.quality;
                        const useCompression = advancedSettings.hasOwnProperty('useImageCompression') 
                            ? advancedSettings.useImageCompression 
                            : this.settings.compressImages;
                        
                        // 캔버스에 이미지 그리기 (크기 최적화)
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        
                        // 이미지가 최대 크기보다 큰 경우에만 조정
                        if (width > maxSize || height > maxSize) {
                            if (width > height) {
                                height = Math.round(height * maxSize / width);
                                width = maxSize;
                            } else {
                                width = Math.round(width * maxSize / height);
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // 이미지 형식 및 품질 설정
                        let optimizedUrl;
                        if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                            // WebP 지원 시
                            optimizedUrl = canvas.toDataURL('image/webp', imageQuality);
                        } else {
                            // WebP 미지원 시 JPEG 사용
                            optimizedUrl = canvas.toDataURL('image/jpeg', imageQuality);
                        }
                        
                        // 이미지 압축 적용 (설정에 따라)
                        if (useCompression) {
                            // LZ-String 압축 우선 사용 (사용 가능한 경우)
                            if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                                const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
                                
                                // 압축률 로깅 (디버그용)
                                const originalSize = (optimizedUrl.length / 1024).toFixed(1);
                                const compressedSize = (compressedUrl.length / 1024).toFixed(1);
                                const ratio = Math.round((1 - compressedUrl.length / optimizedUrl.length) * 100);
                                console.log(`이미지 압축: ${originalSize}KB → ${compressedSize}KB (${ratio}% 감소)`);
                                
                                resolve(compressedUrl);
                            } 
                            // 기존 UrlCompressor 폴백
                            else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                                resolve(UrlCompressor.compressImageUrl(optimizedUrl));
                            }
                            // 압축 라이브러리 없으면 최적화만 적용
                            else {
                                resolve(optimizedUrl);
                            }
                        } else {
                            // 압축 없이 최적화된 URL 반환
                            resolve(optimizedUrl);
                        }
                    } catch (error) {
                        console.error('이미지 최적화 처리 실패:', error);
                        // 최적화 실패 시 원본 반환
                        resolve(imageDataUrl);
                    }
                };
                
                img.onerror = (error) => {
                    console.error('이미지 로드 실패:', error);
                    reject(error);
                };
            } catch (error) {
                console.error('이미지 최적화 중 예외 발생:', error);
                reject(error);
            }
        });
    },

    /**
     * 압축된 이미지 URL 복원
     * @param {string} compressedImageUrl - 압축된 이미지 URL
     * @returns {string} 복원된 이미지 URL
     */
    decompressImageUrl(compressedImageUrl) {
        // LZ-String 압축 형식 우선 확인
        if (typeof ImageCompressor !== 'undefined' && ImageCompressor && 
            compressedImageUrl && compressedImageUrl.includes('LZSTR:')) {
            return ImageCompressor.decompressImageUrl(compressedImageUrl);
        }
        
        // 기존 압축 형식 처리 (폴백)
        if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
            return UrlCompressor.decompressImageUrl(compressedImageUrl);
        }
        
        return compressedImageUrl;
    },

    /**
     * 모든 이미지 압축 해제
     * @param {string} html - 압축된 이미지가 포함된 HTML
     * @returns {string} 압축 해제된 HTML
     */
    decompressAllImages(html) {
        if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
            return ImageCompressor.decompressAllImages(html);
        }
        
        if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
            return UrlCompressor.decompressAllImages(html);
        }
        
        return html;
    },

    /**
     * 드래그 앤 드롭 설정
     * @param {HTMLElement} container - 드래그 대상 컨테이너
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @param {Function} onComplete - 처리 완료 콜백
     */
    setupDragAndDrop(container, previewElement, onComplete) {
        // 드래그 오버 이벤트
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.add('drag-over');
        });
        
        // 드래그 떠남 이벤트
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');
        });
        
        // 드롭 이벤트
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');
            
            // 드롭된 파일 가져오기
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                
                // 이미지 파일 확인
                if (file.type.startsWith('image/')) {
                    // 이미지 처리 로직 호출
                    this.processUploadedImage(file, previewElement, onComplete);
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                }
            }
        });
    },
    
    /**
     * 이미지의 Data URL 크기 계산 (KB 단위)
     * @param {string} dataUrl - 이미지 Data URL
     * @returns {number} 크기 (KB)
     */
    getDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;
        // Base64 부분만 추출
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // Base64 디코딩 후 바이트 수 계산
        const decodedSize = atob(base64).length;
        // KB 단위로 변환 (소수점 1자리)
        return Math.round(decodedSize / 1024 * 10) / 10;
    }
};

// 초기 이미지 설정 로드
function initImageSettings() {
    // 저장된 이미지 설정 불러오기
    if (typeof StorageManager !== 'undefined' && StorageManager) {
        const savedSettings = StorageManager.loadImageSettings();
        if (savedSettings) {
            ImageHandler.updateSettings(savedSettings);
        }
        
        // 고급 설정 불러오기
        const advancedSettings = StorageManager.loadAdvancedSettings();
        if (advancedSettings) {
            // 이미지 관련 설정 적용
            const imageSettings = {
                profileImageSize: advancedSettings.maxImageSize || ImageHandler.settings.profileImageSize,
                quality: advancedSettings.imageQuality || ImageHandler.settings.quality,
                compressImages: advancedSettings.hasOwnProperty('useImageCompression') 
                    ? advancedSettings.useImageCompression 
                    : ImageHandler.settings.compressImages
            };
            ImageHandler.updateSettings(imageSettings);
        }
    }
}

// DOM 로드 시 이미지 설정 초기화
document.addEventListener('DOMContentLoaded', initImageSettings);

// 전역 변수로 노출
window.ImageHandler = ImageHandler;