// /js/sharpImageOptimizer.js - 선명도 우선 이미지 최적화

/**
 * 선명도 우선 이미지 최적화 모듈
 * 작은 크기 + 고품질 + LZ-String 압축 조합
 */
const SharpImageOptimizer = {
    // 기본 설정
    settings: {
        maxSize: 300,        // 최대 120x120px (작은 크기)
        quality: 1,        // 90% 품질 (선명도 우선)
        useWebP: true,       // WebP 지원 시 사용 (더 작은 크기)
        forceSquare: false,  // 정사각형 강제 여부
        antialias: true      // 안티앨리어싱 적용 (선명도 향상)
    },
    
    /**
     * 설정 업데이트
     * @param {Object} newSettings - 새 설정 객체
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('이미지 최적화 설정 업데이트:', this.settings);
    },
    
    /**
     * 이미지 최적화 처리 (선명도 우선)
     * @param {string} imageDataUrl - 원본 이미지 Data URL
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    async optimizeImage(imageDataUrl) {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            return imageDataUrl; // 유효하지 않은 이미지는 그대로 반환
        }
        
        // 이미 압축된 이미지 확인 및 복원
        let sourceUrl = imageDataUrl;
        if (imageDataUrl.includes('LZSTR:') || 
            imageDataUrl.includes('OPTIMIZE:') || 
            imageDataUrl.includes('LZPROF:')) {
            
            if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                sourceUrl = ImageCompressor.decompressImageUrl(imageDataUrl);
            } else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                sourceUrl = UrlCompressor.decompressImageUrl(imageDataUrl);
            }
        }
        
        try {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // 캔버스 생성
                    const canvas = document.createElement('canvas');
                    let width, height;
                    
                    if (this.settings.forceSquare) {
                        // 정사각형으로 크롭
                        const size = Math.min(this.settings.maxSize, Math.min(img.width, img.height));
                        width = height = size;
                        
                        canvas.width = size;
                        canvas.height = size;
                        
                        // 중앙에서 정사각형 크롭
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = this.settings.antialias;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(
                            img, 
                            offsetX, offsetY, size, size, 
                            0, 0, size, size
                        );
                    } else {
                        // 비율 유지 크기 조정
                        if (img.width > img.height) {
                            width = Math.min(this.settings.maxSize, img.width);
                            height = Math.round(img.height * width / img.width);
                        } else {
                            height = Math.min(this.settings.maxSize, img.height);
                            width = Math.round(img.width * height / img.height);
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = this.settings.antialias;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    // 최적의 이미지 포맷 선택
                    let optimizedUrl;
                    if (this.settings.useWebP && canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                        optimizedUrl = canvas.toDataURL('image/webp', this.settings.quality);
                    } else {
                        // 브라우저가 WebP를 지원하지 않으면 JPEG 사용
                        optimizedUrl = canvas.toDataURL('image/jpeg', this.settings.quality);
                    }
                    
                    // LZ-String 압축 적용
                    if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                        // 압축 전후 크기 비교 (디버그용)
                        const originalSize = (optimizedUrl.length / 1024).toFixed(1);
                        const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
                        const compressedSize = (compressedUrl.length / 1024).toFixed(1);
                        
                        console.log(`이미지 최적화: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% 감소) [${width}x${height}px, ${Math.round(this.settings.quality * 100)}% 품질]`);
                        
                        resolve(compressedUrl);
                    } else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                        // 폴백: 기존 UrlCompressor 사용
                        resolve(UrlCompressor.compressImageUrl(optimizedUrl));
                    } else {
                        // 압축 모듈 없으면 압축 없이 반환
                        resolve(optimizedUrl);
                    }
                };
                
                img.onerror = () => {
                    console.error('이미지 로드 실패');
                    resolve(sourceUrl); // 로드 실패 시 원본 반환
                };
                
                img.src = sourceUrl;
            });
        } catch (error) {
            console.error('이미지 최적화 중 오류:', error);
            return sourceUrl; // 오류 시 원본 반환
        }
    },
    
    /**
     * 프로필 이미지 최적화 (선명도 우선)
     * @param {string} imageDataUrl - 원본 이미지 Data URL
     * @param {boolean} isMyMessage - 내 메시지인지 여부
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    async optimizeProfileImage(imageDataUrl, isMyMessage = false) {
        // 내 메시지는 더 높은 품질 유지
        const tempSettings = { ...this.settings };
        
        if (isMyMessage) {
            // 내 메시지는 더 높은 품질 적용
            this.settings.quality = 0.92;  // 92% 품질
            this.settings.forceSquare = true; // 정사각형 프로필
        } else {
            // 일반 메시지는 기본 설정 유지
            this.settings.quality = 0.9;   // 90% 품질
            this.settings.forceSquare = true; // 정사각형 프로필
        }
        
        // 이미지 최적화
        const result = await this.optimizeImage(imageDataUrl);
        
        // 설정 복원
        this.settings = tempSettings;
        
        return result;
    },
    
    /**
     * 모든 사용자 이미지 최적화
     * @param {Object} state - 애플리케이션 상태 (사용자 이미지 포함)
     * @returns {Promise<void>} 완료 Promise
     */
    async optimizeAllUserImages(state) {
        if (!state || !state.userProfileImages) return;
        
        const promises = [];
        const userCount = Object.keys(state.userProfileImages).length;
        
        console.log(`총 ${userCount}명의 사용자 이미지 최적화 시작...`);
        
        for (const [username, imageUrl] of Object.entries(state.userProfileImages)) {
            if (!imageUrl) continue; // 빈 이미지 스킵
            
            // 내 메시지 사용자 여부 확인
            const isMyMessage = state.selectedUsers && state.selectedUsers.has(username);
            
            // 이미지 최적화 작업 추가
            const promise = this.optimizeProfileImage(imageUrl, isMyMessage)
                .then(optimizedUrl => {
                    state.userProfileImages[username] = optimizedUrl;
                    return { username, success: true };
                })
                .catch(error => {
                    console.error(`${username} 이미지 최적화 실패:`, error);
                    return { username, success: false, error };
                });
            
            promises.push(promise);
        }
        
        // 모든 이미지 최적화 완료 대기
        try {
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            console.log(`이미지 최적화 완료: ${successCount}/${results.length} 성공`);
        } catch (error) {
            console.error('이미지 일괄 최적화 중 오류 발생:', error);
        }
    }
};

// 전역 변수로 노출
window.SharpImageOptimizer = SharpImageOptimizer;

console.log('선명도 우선 이미지 최적화 모듈이 로드되었습니다.');