// /js/imageHandler.js - 통합 이미지 처리 및 최적화 모듈

// 이미지 처리 및 최적화 모듈
const ImageHandler = {
    // 초기화 상태
    initialized: false,

    // 기본 설정
    settings: {
        profileImageSize: 250,    // 프로필 이미지 크기
        quality: 0.75,            // 이미지 품질
        compressImages: true,     // 이미지 압축 사용 여부
        useWebP: true,            // WebP 형식 사용 (지원 시)
        forceSquare: true,        // 정사각형 강제 적용
        antialias: true           // 안티앨리어싱 적용
    },

    // WebP 지원 여부 확인 함수 추가
    checkWebPSupport: function () {
        const canvas = document.createElement('canvas');
        if (!canvas.toDataURL) return false;

        const dataURL = canvas.toDataURL('image/webp');
        return dataURL.indexOf('data:image/webp') === 0;
    },

    // 초기화 함수에 WebP 지원 확인 추가
    init() {
        if (this.initialized) return;

        // 고급 설정 불러오기
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            const advancedSettings = StorageManager.loadAdvancedSettings();
            if (advancedSettings) {
                // 적용 가능한 설정 업데이트
                if (advancedSettings.imageQuality) {
                    this.settings.quality = advancedSettings.imageQuality;
                }
                if (advancedSettings.hasOwnProperty('useImageCompression')) {
                    this.settings.compressImages = advancedSettings.useImageCompression;
                }
                if (advancedSettings.maxImageSize) {
                    this.settings.profileImageSize = advancedSettings.maxImageSize;
                }
            }
        }

        // WebP 지원 여부 확인
        this.settings.supportsWebP = this.checkWebPSupport();

        this.initialized = true;
        console.log('이미지 핸들러 초기화 완료:', this.settings);
    },

    optimizeImage: function (imageDataUrl, isImportant = false) {
        // 이미 압축된 이미지는 다시 압축하지 않음
        if (!imageDataUrl ||
            imageDataUrl.includes('LZSTR:') ||
            imageDataUrl.includes('OPTIMIZE:') ||
            imageDataUrl.includes('NOCOMPRESS:')) {
            return Promise.resolve(imageDataUrl);
        }

        // 외부 URL 처리
        if (imageDataUrl.startsWith('http')) {
            return Promise.resolve(imageDataUrl);
        }

        try {
            return new Promise((resolve) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');


                    const size = 100;
                    canvas.width = size;
                    canvas.height = size;

                    // 품질 설정 - 더 낮은 품질로 설정해도 화질 차이 미미
                    const quality = 0.7;

                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // 정사각형 크롭 계산
                    const cropSize = Math.min(img.width, img.height);
                    const offsetX = (img.width - cropSize) / 2;
                    const offsetY = (img.height - cropSize) / 2;

                    // 이미지 그리기
                    ctx.drawImage(
                        img,
                        offsetX, offsetY, cropSize, cropSize,
                        0, 0, canvas.width, canvas.height
                    );

                    // JPEG 최적화 - 호환성 최대화
                    const optimizedUrl = canvas.toDataURL('image/jpeg', quality);

                    console.log('Optimization complete', {
                        originalSize: (imageDataUrl.length / 1024).toFixed(1) + 'KB',
                        optimizedSize: (optimizedUrl.length / 1024).toFixed(1) + 'KB',
                        reduction: ((1 - optimizedUrl.length / imageDataUrl.length) * 100).toFixed(1) + '%'
                    });

                    resolve(optimizedUrl);
                };

                img.onerror = () => {
                    console.error('Image load failed');
                    resolve(imageDataUrl);
                };

                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('Image optimization error:', error);
            return Promise.resolve(imageDataUrl);
        }
    },

    // 설정 업데이트 함수
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('이미지 처리 설정 업데이트:', this.settings);

        // 설정 저장 (가능한 경우)
        if (typeof StorageManager !== 'undefined' && StorageManager) {
            const advancedSettings = StorageManager.loadAdvancedSettings() || {};
            advancedSettings.imageQuality = this.settings.quality;
            advancedSettings.useImageCompression = this.settings.compressImages;
            advancedSettings.maxImageSize = this.settings.profileImageSize;
            StorageManager.saveAdvancedSettings(advancedSettings);
        }
    },

    // 이미지 처리 함수
    processUploadedImage(file, previewElement, onComplete) {
        // 모듈 초기화 확인
        if (!this.initialized) this.init();

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

                // 이미지 최적화 처리
                const isImportant = true; // 업로드 시에는 기본적으로 중요하게 처리
                const optimizedImageUrl = await this.optimizeImage(imageDataUrl, isImportant);

                // 디버깅용 로그 추가
                console.log('Optimized imageDataUrl:', optimizedImageUrl);

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

    // 이미지 최적화 함수
    optimizeImage(imageDataUrl, isImportant = false) {
        console.log('Optimizing image:', imageDataUrl.substring(0, 10) + '...');

        // 이미 압축된 이미지는 다시 압축하지 않음
        if (!imageDataUrl ||
            imageDataUrl.includes('LZSTR:') ||
            imageDataUrl.includes('OPTIMIZE:') ||
            imageDataUrl.includes('NOCOMPRESS:')) {
            return Promise.resolve(imageDataUrl);
        }

        // 외부 URL 처리
        if (imageDataUrl.startsWith('http')) {
            return Promise.resolve(imageDataUrl);
        }

        try {
            return new Promise((resolve) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const quality = isImportant ? 0.85 : this.settings.quality;

                    // 정사각형 이미지로 변환 (중앙 크롭)
                    const size = Math.min(img.width, img.height);
                    canvas.width = this.settings.profileImageSize;
                    canvas.height = this.settings.profileImageSize;

                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = this.settings.antialias;
                    ctx.imageSmoothingQuality = 'high';

                    const offsetX = (img.width - size) / 2;
                    const offsetY = (img.height - size) / 2;

                    ctx.drawImage(
                        img,
                        offsetX, offsetY, size, size,
                        0, 0, canvas.width, canvas.height
                    );

                    // JPEG로 압축
                    const optimizedUrl = canvas.toDataURL('image/jpeg', quality);

                    console.log('Optimization complete', {
                        originalSize: (imageDataUrl.length / 1024).toFixed(1) + 'KB',
                        optimizedSize: (optimizedUrl.length / 1024).toFixed(1) + 'KB'
                    });

                    resolve(optimizedUrl);
                };

                img.onerror = () => {
                    console.error('Image load failed');
                    resolve(imageDataUrl);
                };

                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('Image optimization error:', error);
            return Promise.resolve(imageDataUrl);
        }
    },

    // LZ-String 압축 함수
    _directCompress(optimizedUrl, resolve) {
        try {
            // 헤더와 데이터 부분 분리
            const [header, base64Data] = optimizedUrl.split(',');

            // LZ-String으로 압축
            const compressedData = window.LZString.compressToEncodedURIComponent(base64Data);

            // 압축 식별자와 함께 압축된 데이터 반환
            const result = `${header},LZSTR:${compressedData}`;

            // 압축 결과 로깅
            const originalSize = (optimizedUrl.length / 1024).toFixed(1);
            const compressedSize = (result.length / 1024).toFixed(1);
            console.log(`LZ-String 압축: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% 감소)`);

            resolve(result);
        } catch (error) {
            console.error('LZ-String 압축 실패:', error);
            resolve(optimizedUrl); // 압축 실패 시 최적화된 URL 반환
        }
    },

    // 이미지 URL 복원 함수
    decompressImageUrl: function (compressedImageUrl) {
        if (!compressedImageUrl) return compressedImageUrl;

        try {
            // WebP 형식 처리 추가
            if (compressedImageUrl.includes('WEBP:')) {
                // WebP 식별자 제거
                return compressedImageUrl.replace('WEBP:', '');
            }

            // LZSTR 형식 처리 - 기존 코드
            if (compressedImageUrl.includes('LZSTR:')) {
                const [header, compressedData] = compressedImageUrl.split(',');
                const cleanCompressedData = compressedData.replace('LZSTR:', '');
                const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
                return `${header},${originalBase64}`;
            }

            // 기타 압축 형식 처리 (이전 버전 호환성)
            if (compressedImageUrl.includes('OPTIMIZE:') ||
                compressedImageUrl.includes('NOCOMPRESS:')) {
                return compressedImageUrl.replace(/(?:OPTIMIZE:|NOCOMPRESS:)/, '');
            }

            // 압축되지 않은 경우 원본 반환
            return compressedImageUrl;
        } catch (error) {
            console.error('이미지 URL 복원 중 오류 발생:', error);
            return compressedImageUrl; // 복원 실패 시 원본 반환
        }
    },


    // HTML 내 이미지 압축 해제 함수
    decompressAllImages: function (html) {
        if (!html) return html;

        try {
            // WebP 형식 처리 추가
            html = html.replace(/data:image\/webp,WEBP:([^"']+)/g, (match, p1) => {
                return `data:image/webp,${p1}`;
            });

            // LZSTR 형식 처리 - 기존 코드
            if (typeof window.LZString !== 'undefined') {
                html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
                    try {
                        const originalBase64 = window.LZString.decompressFromEncodedURIComponent(p1);
                        return `data:image/jpeg;base64,${originalBase64}`;
                    } catch (error) {
                        console.error('이미지 데이터 압축 해제 실패:', error);
                        return match; // 오류 시 원본 유지
                    }
                });
            }

            // 기타 압축 형식 처리 (이전 버전 호환성)
            html = html.replace(/data:[^,]+,(?:OPTIMIZE:|NOCOMPRESS:)([^"']+)/g, (match, p1) => {
                return `data:image/jpeg;base64,${p1}`;
            });

            return html;
        } catch (error) {
            console.error('HTML 내 이미지 압축 해제 중 오류:', error);
            return html; // 실패 시 원본 HTML 반환
        }
    },

    // 추가 LZ-String 압축 함수
    compressWithLZString: function (imageDataUrl) {
        // 이미 LZSTR: 형식이면 압축하지 않음
        if (imageDataUrl.includes('LZSTR:')) {
            return imageDataUrl;
        }

        try {
            // 헤더와 데이터 부분 분리
            const [header, base64Data] = imageDataUrl.split(',');

            // 이미 WebP 형식의 데이터인지 확인
            const isWebP = header.includes('image/webp');

            // WebP 표시 제거 (압축 전에 제거)
            const cleanData = base64Data.replace('WEBP:', '');

            // LZ-String으로 압축
            const compressedData = LZString.compressToEncodedURIComponent(cleanData);

            // 5KB 이상인 경우에만 압축 적용
            const originalSize = cleanData.length;
            const compressedSize = compressedData.length;

            if (compressedSize < originalSize * 0.95) {
                // 압축 식별자와 함께 압축된 데이터 반환
                const result = `${header},LZSTR:${compressedData}`;

                // 압축 결과 로깅
                console.log(`LZ-String 압축: ${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% 감소)`);

                return result;
            } else {
                // 압축 효과가 미미하면 원본 반환 (WebP 표시 유지)
                return imageDataUrl;
            }
        } catch (error) {
            console.error('LZ-String 압축 실패:', error);
            return imageDataUrl; // 압축 실패 시 원본 URL 반환
        }
    },

    // 모든 사용자 이미지 최적화 함수
    optimizeAllUserImages: async function (state) {
        if (!state || !state.userProfileImages) return;

        // 모듈 초기화 확인
        if (!this.initialized) this.init();

        const promises = [];
        let optimizedCount = 0;

        // 각 사용자 이미지 처리
        for (const [username, imageUrl] of Object.entries(state.userProfileImages)) {
            if (!imageUrl) continue;

            // 내 메시지 사용자는 중요도 높게 처리
            const isImportant = state.selectedUsers && state.selectedUsers.has(username);

            // 최적화 작업 추가
            const promise = this.optimizeImage(imageUrl, isImportant)
                .then(optimizedUrl => {
                    if (optimizedUrl !== imageUrl) {
                        optimizedCount++;
                    }
                    state.userProfileImages[username] = optimizedUrl;
                })
                .catch(error => {
                    console.error(`${username} 이미지 최적화 실패:`, error);
                });

            promises.push(promise);
        }

        // 모든 처리 완료 대기
        try {
            await Promise.all(promises);
            console.log(`이미지 최적화 완료: 총 ${promises.length}개 중 ${optimizedCount}개 최적화됨`);
        } catch (error) {
            console.error('이미지 일괄 최적화 중 오류 발생:', error);
        }
    },

    // 드래그 앤 드롭 설정 함수
    setupDragAndDrop(container, previewElement, onComplete) {
        if (!container) return;

        // 모듈 초기화 확인
        if (!this.initialized) this.init();

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

        // 드롭 이벤트 - 파일만 처리
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');

            // 파일 확인 (로컬 파일 드래그)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];

                // 이미지 파일 확인
                if (file.type.startsWith('image/')) {
                    // 이미지 처리 로직 호출
                    this.processUploadedImage(file, previewElement, onComplete);
                    return;
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                    return;
                }
            }

            // 외부 이미지 URL 처리 (사용자가 이미지를 직접 드래그하는 경우)
            const html = e.dataTransfer.getData('text/html');
            if (html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const img = tempDiv.querySelector('img');

                if (img && img.src) {
                    // 외부 이미지 URL을 사용
                    if (img.src.startsWith('http')) {
                        if (typeof onComplete === 'function') {
                            // 미리보기 표시
                            previewElement.innerHTML = '';
                            const previewImg = document.createElement('img');
                            previewImg.src = img.src;
                            previewElement.appendChild(previewImg);

                            // 외부 URL 그대로 사용
                            onComplete(img.src);
                            return;
                        }
                    }
                }
            }

            alert('이미지 파일을 드롭해주세요.');
        });
    },

    // 이미지 크기 계산 함수
    getDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;

        // Base64 부분만 추출
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;

        // Base64 디코딩 후 바이트 수 계산
        try {
            const decodedSize = atob(base64).length;
            // KB 단위로 변환 (소수점 1자리)
            return Math.round(decodedSize / 1024 * 10) / 10;
        } catch (error) {
            console.error('이미지 크기 계산 중 오류:', error);
            return 0;
        }
    },

    _imageCache: {},

    // 이미지의 해시값 생성
    _generateHash(imageUrl) {
        // 이미지 URL의 일부와 현재 타임스탬프를 결합
        const timestamp = Date.now();
        const urlPart = imageUrl.substring(0, 50); // URL의 일부만 사용

        // 더 복잡한 해시 생성
        const hash = btoa(urlPart + timestamp)
            .replace(/[^a-zA-Z0-9]/g, '') // 특수문자 제거
            .substring(0, 10); // 10자로 제한

        return `img_${hash}`;
    },

    _generateShortHash(imageUrl) {
        // 더 짧고 고유한 해시 생성
        const hash = this._simpleHash(imageUrl);
        return `i${hash.substr(0, 8)}`;
    },

    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    },

    cacheImage(imageUrl) {
        // 이미 캐시된 이미지 확인
        for (const [hash, cachedUrl] of Object.entries(this._imageCache)) {
            if (cachedUrl === imageUrl) {
                return hash;
            }
        }

        // 짧은 해시 생성
        const hash = this._generateShortHash(imageUrl);

        // 캐시에 저장
        this._imageCache[hash] = imageUrl;

        return hash;
    },

    getImageFromCache(hash) {
        return this._imageCache[hash] || hash;
    },


    // 이미지 최적화 및 캐싱 함수
    async processAndCacheImage(imageUrl) {
        // 이미 최적화된 이미지인지 확인
        if (imageUrl.startsWith('img_')) {
            return imageUrl;
        }

        // 캐시에서 기존 이미지 확인
        for (const [id, cachedUrl] of Object.entries(this._imageCache)) {
            if (cachedUrl === imageUrl) {
                return id;
            }
        }

        // 동기적 최적화
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = imageUrl;

        // 이미지 크기 및 품질 조정 (동기적 처리)
        const size = Math.min(img.width, img.height);
        canvas.width = this.settings.profileImageSize;
        canvas.height = this.settings.profileImageSize;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = this.settings.antialias;
        ctx.imageSmoothingQuality = 'high';

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        ctx.drawImage(
            img,
            offsetX, offsetY, size, size,
            0, 0, canvas.width, canvas.height
        );

        // JPEG로 압축
        const optimizedUrl = canvas.toDataURL('image/jpeg', this.settings.quality);

        // 새로운 고유 식별자 생성
        const id = `img_${Object.keys(this._imageCache).length + 1}`;
        this._imageCache[id] = optimizedUrl;

        return id;
    },

    processAndCacheImageSync(imageUrl) {
        // 이미 최적화된 이미지인지 확인
        if (imageUrl.startsWith('img_')) {
            return imageUrl;
        }

        // 캐시에서 기존 이미지 확인
        if (!this._imageCache) {
            this._imageCache = {};
        }

        for (const [id, cachedUrl] of Object.entries(this._imageCache)) {
            if (cachedUrl === imageUrl) {
                return id;
            }
        }

        // 동기적 최적화 (크기 조정)
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = imageUrl;

        // 동기적으로 이미지 크기 조정
        const size = Math.min(img.width, img.height);
        canvas.width = this.settings.profileImageSize;
        canvas.height = this.settings.profileImageSize;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = this.settings.antialias;
        ctx.imageSmoothingQuality = 'high';

        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        ctx.drawImage(
            img,
            offsetX, offsetY, size, size,
            0, 0, canvas.width, canvas.height
        );

        // JPEG로 압축
        const optimizedUrl = canvas.toDataURL('image/jpeg', this.settings.quality);

        // 새로운 고유 식별자 생성
        const id = `img_${Object.keys(this._imageCache).length + 1}`;
        this._imageCache[id] = optimizedUrl;

        return id;
    }



};


// 모듈 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ImageHandler.init();
    });
} else {
    ImageHandler.init();
}

// 전역 변수로 노출
window.ImageHandler = ImageHandler;

// 기존 최적화 모듈과의 호환성 유지
window.OptimizedImageProcessor = ImageHandler;
window.AspectRatioOptimizer = ImageHandler;

console.log('통합 이미지 처리 모듈이 로드되었습니다.');