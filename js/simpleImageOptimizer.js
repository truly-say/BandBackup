// /js/simpleImageOptimizer.js - 간소화된 이미지 최적화

/**
 * 간소화된 이미지 최적화 모듈
 * 설정 옵션 없이 최적의 값으로 고정
 */
const SimpleImageOptimizer = {
    /**
     * 프로필 이미지 최적화 (고정 설정)
     * @param {string} imageDataUrl - 원본 이미지 URL
     * @param {boolean} isImportant - 중요 사용자 여부
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    optimizeImage: async function(imageDataUrl, isImportant = false) {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            return imageDataUrl;
        }
        
        // 기존 압축 형식 복원
        let sourceUrl = imageDataUrl;
        if (imageDataUrl.includes('LZSTR:') || imageDataUrl.includes('OPTIMIZE:') || imageDataUrl.includes('LZPROF:')) {
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
                    const canvas = document.createElement('canvas');
                    
                    // 고정된 최적의 크기 (120px)
                    const maxSize = 120;
                    
                    // 정사각형 프로필 이미지로 크롭
                    const size = Math.min(maxSize, Math.min(img.width, img.height));
                    canvas.width = size;
                    canvas.height = size;
                    
                    // 중앙에서 정사각형 크롭
                    const offsetX = (img.width - size) / 2;
                    const offsetY = (img.height - size) / 2;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(
                        img, 
                        offsetX, offsetY, size, size, 
                        0, 0, size, size
                    );
                    
                    // 고정된 최적의 품질 (중요도에 따라 차이)
                    const quality = isImportant ? 0.92 : 0.9;
                    
                    // 최적의 포맷 (WebP 우선, 지원 안되면 JPEG)
                    let optimizedUrl;
                    if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                        optimizedUrl = canvas.toDataURL('image/webp', quality);
                    } else {
                        optimizedUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    // LZ-String 압축 적용
                    if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                        const originalSize = Math.round(optimizedUrl.length / 1024);
                        const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
                        const compressedSize = Math.round(compressedUrl.length / 1024);
                        
                        console.log(`이미지 최적화: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% 감소) [${size}x${size}px]`);
                        
                        resolve(compressedUrl);
                    } else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                        resolve(UrlCompressor.compressImageUrl(optimizedUrl));
                    } else {
                        resolve(optimizedUrl);
                    }
                };
                
                img.onerror = () => {
                    console.error('이미지 로드 실패');
                    resolve(sourceUrl);
                };
                
                img.src = sourceUrl;
            });
        } catch (error) {
            console.error('이미지 최적화 실패:', error);
            return sourceUrl; // 실패 시 원본 반환
        }
    },
    
    /**
     * 모든 사용자 이미지 최적화
     * @param {Object} state - 애플리케이션 상태
     * @returns {Promise<void>}
     */
    optimizeAllUserImages: async function(state) {
        if (!state || !state.userProfileImages) return;
        
        const promises = [];
        
        // 각 사용자 이미지 처리
        for (const [username, imageUrl] of Object.entries(state.userProfileImages)) {
            if (!imageUrl) continue;
            
            // 내 메시지 사용자는 중요도 높게 처리
            const isImportant = state.selectedUsers && state.selectedUsers.has(username);
            
            // 최적화 작업 추가
            const promise = this.optimizeImage(imageUrl, isImportant)
                .then(optimizedUrl => {
                    state.userProfileImages[username] = optimizedUrl;
                });
            
            promises.push(promise);
        }
        
        // 모든 처리 완료 대기
        await Promise.all(promises);
        console.log(`${promises.length}개 이미지 최적화 완료`);
    }
};

// 전역 변수로 노출
window.SimpleImageOptimizer = SimpleImageOptimizer;

console.log('간소화된 이미지 최적화 모듈이 로드되었습니다.');