/**
 * 밴드 채팅 백업 도구 - 미디어 관리 클래스 (성능 최적화 강화)
 * 
 * 이 파일은 imageHandler.js, compressor.js의 기능을 통합합니다.
 */

class MediaManager {
    /**
     * 미디어 관리자 초기화
     * @param {ChatBackupApp} app - 메인 앱 인스턴스
     */
    constructor(app) {
      this.app = app;
      
      // 초기화 상태
      this.initialized = false;
      
      // 기본 설정
      this.settings = {
        profileImageSize: 250,    // 프로필 이미지 크기
        quality: 0.75,            // 이미지 품질
        compressImages: true,     // 이미지 압축 사용 여부
        useWebP: true,            // WebP 형식 사용 (지원 시)
        forceSquare: true,        // 정사각형 강제 적용
        antialias: true,          // 안티앨리어싱 적용
        supportsWebP: false,      // WebP 지원 여부 (초기화 시 검사)
        minSizeForCompression: 5  // 압축 적용 최소 크기 (KB)
      };
      
      // 이미지 캐시
      this._imageCache = {};
      this.imageCacheCounter = 0;
      
      // 초기화
      this.init();
    }
    
    /**
     * 초기화 함수
     */
    init() {
      if (this.initialized) return;
      
      // 고급 설정 불러오기
      const advancedSettings = this.app.dataManager.loadAdvancedSettings();
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
        if (advancedSettings.minSizeForCompression) {
          this.settings.minSizeForCompression = advancedSettings.minSizeForCompression;
        }
      }
      
      // WebP 지원 여부 확인
      this.settings.supportsWebP = this.checkWebPSupport();
      
      // Base85 인코더 초기화
      this.initBase85();
      
      this.initialized = true;
      console.log('미디어 관리자 초기화 완료:', this.settings);
    }
    
    /**
     * Base85 인코더 초기화
     */
    initBase85() {
      // Base85 인코딩용 문자셋 정의
      this.base85charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";
      
      // Base85 디코드 맵 초기화
      this.base85decodeMap = {};
      for (let i = 0; i < this.base85charset.length; i++) {
        this.base85decodeMap[this.base85charset[i]] = i;
      }
    }
    
    /**
     * WebP 지원 여부 확인
     * @returns {boolean} - WebP 지원 여부
     */
    checkWebPSupport() {
      const canvas = document.createElement('canvas');
      if (!canvas.toDataURL) return false;
      
      const dataURL = canvas.toDataURL('image/webp');
      return dataURL.indexOf('data:image/webp') === 0;
    }
    
    /**
     * 업로드된 이미지 처리
     * @param {File} file - 업로드된 이미지 파일
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @returns {Promise<string>} - 처리된 이미지 URL
     */
    async processUploadedImage(file, previewElement) {
      return new Promise((resolve, reject) => {
        // 이미지 타입 확인
        if (!file.type.startsWith('image/')) {
          reject(new Error('이미지 파일만 업로드 가능합니다.'));
          return;
        }
        
        // 로딩 표시
        this.app.uiManager.toggleLoadingOverlay(true, '이미지 처리 중...');
        
        const reader = new FileReader();
        
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
            const optimizedImageUrl = await this.optimizeImage(imageDataUrl, true);
            
            // 이미지 압축 (크기가 큰 경우)
            const compressedImageUrl = await this.compressImageWithLZString(optimizedImageUrl);
            
            // 로딩 표시 숨김
            this.app.uiManager.toggleLoadingOverlay(false);
            
            // 압축된 이미지 URL 반환
            resolve(compressedImageUrl);
          } catch (error) {
            this.app.uiManager.toggleLoadingOverlay(false);
            reject(error);
          }
        };
        
        reader.onerror = () => {
          this.app.uiManager.toggleLoadingOverlay(false);
          reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
        };
        
        // 파일 읽기 시작
        reader.readAsDataURL(file);
      });
    }
    
    /**
     * 이미지 최적화
     * @param {string} imageDataUrl - 이미지 데이터 URL
     * @param {boolean} isImportant - 중요 이미지 여부 (품질 유지)
     * @returns {Promise<string>} - 최적화된 이미지 URL
     */
    async optimizeImage(imageDataUrl, isImportant = false) {
      // 이미 압축된 이미지는 다시 압축하지 않음
      if (!imageDataUrl ||
          imageDataUrl.includes('LZSTR:') ||
          imageDataUrl.includes('OPTIMIZE:') ||
          imageDataUrl.includes('NOCOMPRESS:') ||
          imageDataUrl.includes('B85:') ||
          imageDataUrl.includes('WEBP:')) {
        return imageDataUrl;
      }
      
      // 외부 URL 처리
      if (imageDataUrl.startsWith('http')) {
        return imageDataUrl;
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
            
            // WebP 지원 시 WebP로 변환, 아니면 JPEG로 압축
            let optimizedUrl;
            if (this.settings.supportsWebP && this.settings.useWebP) {
              optimizedUrl = canvas.toDataURL('image/webp', quality);
              // WebP 식별자 추가 (압축 해제 시 필요)
              if (!optimizedUrl.includes('WEBP:')) {
                const [header, base64Data] = optimizedUrl.split(',');
                optimizedUrl = `${header},WEBP:${base64Data}`;
              }
            } else {
              optimizedUrl = canvas.toDataURL('image/jpeg', quality);
            }
            
            // 최적화 결과 로깅
            const originalSize = this.getDataUrlSize(imageDataUrl);
            const optimizedSize = this.getDataUrlSize(optimizedUrl);
            
            console.log('Optimization complete', {
              originalSize: originalSize + 'KB',
              optimizedSize: optimizedSize + 'KB',
              reduction: ((1 - optimizedSize / originalSize) * 100).toFixed(1) + '%'
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
        return imageDataUrl;
      }
    }
    
    // 이미지 처리 시 병렬화 개선 (추가)
async optimizeAllUserImages() {
    if (!this.app.state.userProfileImages) return;
    
    // 동시 처리할 최대 이미지 수 제한 (메모리 과부하 방지)
    const BATCH_SIZE = 5;
    const usernames = Object.keys(this.app.state.userProfileImages);
    let optimizedCount = 0;
    let compressedCount = 0;
    
    // 배치 처리 구현
    for (let i = 0; i < usernames.length; i += BATCH_SIZE) {
      const batch = usernames.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async username => {
        const imageUrl = this.app.state.userProfileImages[username];
        if (!imageUrl) return;
        
        try {
          // 이미지 최적화
          const optimizedUrl = await this.optimizeImage(
            imageUrl, 
            this.app.state.selectedUsers.has(username)
          );
          if (optimizedUrl !== imageUrl) {
            optimizedCount++;
          }
          
          // 이미지 압축
          const compressedUrl = await this.compressImageWithLZString(optimizedUrl);
          if (compressedUrl !== optimizedUrl) {
            compressedCount++;
          }
          
          this.app.state.userProfileImages[username] = compressedUrl;
        } catch (error) {
          console.error(`${username} 이미지 처리 실패:`, error);
        }
      });
      
      // 배치 완료 대기
      await Promise.all(promises);
      
      // 진행 상황 업데이트 (선택적)
      if (i + BATCH_SIZE < usernames.length && typeof this.app.uiManager !== 'undefined') {
        this.app.uiManager.showStatusMessage(
          `이미지 처리 중... (${i + BATCH_SIZE}/${usernames.length})`, 
          this.app.state.darkMode
        );
      }
    }
    
    console.log(`이미지 처리 완료: ${optimizedCount}개 최적화, ${compressedCount}개 압축됨`);
  }
    
    /**
     * LZString으로 이미지 압축
     * @param {string} imageDataUrl - 이미지 데이터 URL
     * @returns {Promise<string>} - 압축된 이미지 URL
     */
    async compressImageWithLZString(imageDataUrl) {
      // 이미 압축되었는지 확인
      if (!imageDataUrl || 
          imageDataUrl.includes('LZSTR:') || 
          imageDataUrl.includes('B85:')) {
        return imageDataUrl;
      }
      
      // 외부 URL은 압축하지 않음
      if (imageDataUrl.startsWith('http')) {
        return imageDataUrl;
      }
      
      try {
        // 헤더와 데이터 분리
        const [header, base64Data] = imageDataUrl.split(',');
        
        // WebP 표시 제거 (압축 전)
        let cleanData = base64Data;
        if (base64Data.startsWith('WEBP:')) {
          cleanData = base64Data.substring(5);
        }
        
        // 데이터 크기 계산 (KB)
        const originalSize = this.getDataUrlSize(imageDataUrl);
        
        // 최소 크기 미만이면 압축하지 않음
        if (originalSize < this.settings.minSizeForCompression) {
          return imageDataUrl;
        }
        
        // LZString 라이브러리 존재 여부 확인
        if (typeof LZString === 'undefined') {
          console.warn('LZString 라이브러리를 찾을 수 없어 압축을 건너뜁니다.');
          return imageDataUrl;
        }
        
        // LZString 압축
        const compressedData = LZString.compressToEncodedURIComponent(cleanData);
        
        // 압축 후 크기 계산
        const compressedSize = (compressedData.length * 3/4) / 1024; // Base64 → 바이트 변환 후 KB 단위
        
        // 압축 효율이 좋은 경우에만 압축 적용 (5% 이상 감소)
        if (compressedSize < originalSize * 0.95) {
          // 압축 데이터에 식별자 추가
          const result = `${header},LZSTR:${compressedData}`;
          
          console.log(`LZString 압축: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${(100 - compressedSize/originalSize*100).toFixed(1)}% 감소)`);
          
          return result;
        } else {
          // Base85 압축 시도 (더 효율적일 수 있음)
          return this.compressImageWithBase85(imageDataUrl);
        }
      } catch (error) {
        console.error('LZString 압축 중 오류:', error);
        return imageDataUrl;
      }
    }
    
    /**
     * Base85로 이미지 압축
     * @param {string} imageDataUrl - 이미지 데이터 URL
     * @returns {Promise<string>} - 압축된 이미지 URL
     */
    async compressImageWithBase85(imageDataUrl) {
      // 이미 압축되었는지 확인
      if (!imageDataUrl || 
          imageDataUrl.includes('LZSTR:') || 
          imageDataUrl.includes('B85:')) {
        return imageDataUrl;
      }
      
      // 외부 URL은 압축하지 않음
      if (imageDataUrl.startsWith('http')) {
        return imageDataUrl;
      }
      
      try {
        // 헤더와 데이터 분리
        const [header, base64Data] = imageDataUrl.split(',');
        
        // WebP 표시 제거 (압축 전)
        let cleanData = base64Data;
        if (base64Data.startsWith('WEBP:')) {
          cleanData = base64Data.substring(5);
        }
        
        // 데이터 크기 계산 (KB)
        const originalSize = this.getDataUrlSize(imageDataUrl);
        
        // 최소 크기 미만이면 압축하지 않음
        if (originalSize < this.settings.minSizeForCompression) {
          return imageDataUrl;
        }
        
        // Base64 → 바이너리 변환
        const binary = atob(cleanData);
        
        // 바이너리 → Base85 인코딩
        const base85Data = this.encodeBase85(binary);
        
        // 압축 후 크기 계산
        const compressedSize = (base85Data.length) / 1024; // KB 단위
        
        // 압축 효율이 좋은 경우에만 압축 적용 (5% 이상 감소)
        if (compressedSize < originalSize * 0.95) {
          // 압축 데이터에 식별자 추가
          const result = `${header},B85:${base85Data}`;
          
          console.log(`Base85 압축: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${(100 - compressedSize/originalSize*100).toFixed(1)}% 감소)`);
          
          return result;
        }
        
        // 압축 효과가 미미하면 원본 반환
        return imageDataUrl;
      } catch (error) {
        console.error('Base85 압축 중 오류:', error);
        return imageDataUrl;
      }
    }
    
    /**
     * Base85 인코딩
     * @param {string} data - 인코딩할 바이너리 데이터
     * @returns {string} - Base85 인코딩된 문자열
     */
    encodeBase85(data) {
      let result = '';
      const length = data.length;
      
      // 4바이트씩 처리
      for (let i = 0; i < length; i += 4) {
        // 4바이트를 32비트 정수로 변환
        let value = 0;
        for (let j = 0; j < 4; j++) {
          if (i + j < length) {
            value = (value << 8) | data.charCodeAt(i + j);
          } else {
            value = value << 8;
          }
        }
        
        // 5개의 Base85 문자로 인코딩
        if (i + 4 > length) {
          // 마지막 블록이 4바이트보다 작은 경우
          const fullBytes = length - i;
          const fullChars = Math.ceil(fullBytes * 8 / 5);
          
          // 필요한 문자 수만큼만 인코딩
          const chars = [];
          for (let j = 0; j < 5; j++) {
            chars.push(this.base85charset[value % 85]);
            value = Math.floor(value / 85);
          }
          
          // 필요한 문자만 추가 (역순)
          for (let j = 0; j < fullChars; j++) {
            result += chars[4 - j];
          }
        } else {
          // 일반적인 경우: 5개 문자 모두 인코딩
          const chars = [];
          for (let j = 0; j < 5; j++) {
            chars.push(this.base85charset[value % 85]);
            value = Math.floor(value / 85);
          }
          
          // 역순으로 문자 추가
          result += chars[4] + chars[3] + chars[2] + chars[1] + chars[0];
        }
      }
      
      return result;
    }
    
    /**
     * Base85 디코딩
     * @param {string} encoded - Base85 인코딩된 문자열
     * @returns {string} - 디코딩된 바이너리 데이터
     */
    decodeBase85(encoded) {
      let result = '';
      const length = encoded.length;
      
      // 5글자씩 처리
      for (let i = 0; i < length; i += 5) {
        // 남은 인코딩 데이터 길이
        const blockLen = Math.min(5, length - i);
        
        // 5글자를 32비트 정수로 변환
        let value = 0;
        for (let j = 0; j < blockLen; j++) {
          const charCode = this.base85decodeMap[encoded.charAt(i + j)] || 0;
          value = value * 85 + charCode;
        }
        
        // 4바이트로 변환
        const bytes = [];
        for (let j = 0; j < 4; j++) {
          bytes.unshift(value & 0xFF);
          value >>= 8;
        }
        
        // 출력 바이트 수 결정
        const outputBytes = Math.floor(blockLen * 4 / 5);
        
        // 바이트를 문자로 변환하여 결과에 추가
        for (let j = 0; j < outputBytes; j++) {
          result += String.fromCharCode(bytes[j]);
        }
      }
      
      return result;
    }
    
    /**
     * 이미지 URL 압축 해제
     * @param {string} compressedImageUrl - 압축된 이미지 URL
     * @returns {string} - 압축 해제된 이미지 URL
     */
    decompressImageUrl(compressedImageUrl) {
      if (!compressedImageUrl) return compressedImageUrl;
      
      try {
        // WebP 형식 처리
        if (compressedImageUrl.includes('WEBP:')) {
          // WebP 식별자 제거
          return compressedImageUrl.replace('WEBP:', '');
        }
        
        // Base85 형식 처리
        if (compressedImageUrl.includes('B85:')) {
          const [header, compressedData] = compressedImageUrl.split(',');
          const encodedData = compressedData.replace('B85:', '');
          
          // Base85 디코딩
          const binaryData = this.decodeBase85(encodedData);
          
          // 바이너리 → Base64 변환
          const base64Data = btoa(binaryData);
          
          return `${header},${base64Data}`;
        }
        
        // LZSTR 형식 처리
        if (compressedImageUrl.includes('LZSTR:')) {
          const [header, compressedData] = compressedImageUrl.split(',');
          const cleanCompressedData = compressedData.replace('LZSTR:', '');
          
          // LZString 라이브러리 사용 가능 여부 확인
          if (typeof LZString !== 'undefined') {
            const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
            return `${header},${originalBase64}`;
          }
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
    }
    
    /**
     * HTML 내 이미지 압축 해제
     * @param {string} html - 이미지가 포함된 HTML
     * @returns {string} - 이미지 압축 해제된 HTML
     */
    decompressAllImages(html) {
      if (!html) return html;
      
      try {
        // B85 형식 처리
        html = html.replace(/data:[^,]+,B85:([^"']+)/g, (match, p1) => {
          try {
            // Base85 디코딩
            const binaryData = this.decodeBase85(p1);
            // 바이너리 → Base64 변환
            const base64Data = btoa(binaryData);
            return `data:image/jpeg;base64,${base64Data}`;
          } catch (error) {
            console.error('Base85 이미지 데이터 압축 해제 실패:', error);
            return match; // 오류 시 원본 유지
          }
        });
        
        // WebP 형식 처리
        html = html.replace(/data:image\/webp,WEBP:([^"']+)/g, (match, p1) => {
          return `data:image/webp,${p1}`;
        });
        
        // LZSTR 형식 처리
        if (typeof LZString !== 'undefined') {
          html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
            try {
              const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
              return `data:image/jpeg;base64,${originalBase64}`;
            } catch (error) {
              console.error('LZString 이미지 데이터 압축 해제 실패:', error);
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
    }
    
    /**
     * 드래그 앤 드롭 설정
     * @param {HTMLElement} container - 드래그 앤 드롭 컨테이너
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @param {Function} onComplete - 완료 콜백 함수
     */
    setupDragAndDrop(container, previewElement, onComplete) {
      if (!container) return;
      
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
            this.processUploadedImage(file, previewElement)
              .then(processedImageUrl => {
                if (typeof onComplete === 'function') {
                  onComplete(processedImageUrl);
                }
              })
              .catch(error => {
                console.error('이미지 처리 중 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
              });
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
    }
    
    /**
     * 데이터 URL 크기 계산
     * @param {string} dataUrl - 데이터 URL
     * @returns {number} - 크기 (KB)
     */
    getDataUrlSize(dataUrl) {
      if (!dataUrl) return 0;
      
      // Base64 부분만 추출
      const base64 = dataUrl.split(',')[1];
      if (!base64) return 0;
      
      // 압축 식별자 제거
      let cleanBase64 = base64;
      if (base64.startsWith('WEBP:')) {
        cleanBase64 = base64.substring(5);
      } else if (base64.startsWith('LZSTR:')) {
        // LZSTR은 압축되어 있으므로 원래 크기를 정확히 계산하기 어려움
        // 근사치로 계산: 인코딩된 URL 컴포넌트는 실제 크기의 약 1.5배
        const compressedSize = cleanBase64.length;
        return compressedSize * 1.5 / 1024;
      } else if (base64.startsWith('B85:')) {
        // Base85은 원래 크기의 약 4/5
        const compressedSize = cleanBase64.length;
        return compressedSize * 1.25 / 1024;
      }
      
      // Base64 디코딩 후 바이트 수 계산
      try {
        // Base64 문자열은 실제 바이너리 크기의 약 4/3배
        const decodedSize = cleanBase64.length * 3/4;
        // KB 단위로 변환 (소수점 1자리)
        return decodedSize / 1024;
      } catch (error) {
        console.error('이미지 크기 계산 중 오류:', error);
        return 0;
      }
    }
    
    /**
     * 이미지 URL 해시 생성
     * @param {string} imageUrl - 이미지 URL
     * @returns {string} - 해시 문자열
     */
    _generateHash(imageUrl) {
      // 이미지 URL의 일부와 현재 타임스탬프를 결합
      const timestamp = Date.now();
      const urlPart = imageUrl.substring(0, 50); // URL의 일부만 사용
      
      // 해시 생성
      const hash = btoa(urlPart + timestamp)
        .replace(/[^a-zA-Z0-9]/g, '') // 특수문자 제거
        .substring(0, 10); // 10자로 제한
      
      return `img_${hash}`;
    }
    
    /**
     * 짧은 해시 생성
     * @param {string} imageUrl - 이미지 URL
     * @returns {string} - 짧은 해시 문자열
     */
    _generateShortHash(imageUrl) {
      // 더 짧고 고유한 해시 생성
      const hash = this._simpleHash(imageUrl);
      return `i${hash.substr(0, 8)}`;
    }
    
    /**
     * 간단한 해시 함수
     * @param {string} str - 해시할 문자열
     * @returns {string} - 해시 문자열
     */
    _simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
      }
      return Math.abs(hash).toString(36); // 36진수로 변환
    }
    
    /**
     * 이미지 캐싱
     * @param {string} imageUrl - 이미지 URL
     * @returns {string} - 캐시 ID
     */
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
    }
    
    /**
     * 캐시에서 이미지 가져오기
     * @param {string} hash - 캐시 ID
     * @returns {string} - 이미지 URL
     */
    getImageFromCache(hash) {
      return this._imageCache[hash] || hash;
    }
    
    /**
     * 이미지 최적화 및 캐싱
     * @param {string} imageUrl - 이미지 URL
     * @returns {Promise<string>} - 캐시 ID
     */
    async processAndCacheImage(imageUrl) {
      // 이미 최적화된 이미지인지 확인
      if (imageUrl.startsWith('img_') || imageUrl.startsWith('i')) {
        return imageUrl;
      }
      
      // 캐시에서 기존 이미지 확인
      for (const [id, cachedUrl] of Object.entries(this._imageCache)) {
        if (cachedUrl === imageUrl) {
          return id;
        }
      }
      
      try {
        // 이미지 최적화
        const optimizedUrl = await this.optimizeImage(imageUrl);
        
        // 이미지 압축
        const compressedUrl = await this.compressImageWithLZString(optimizedUrl);
        
        // 새로운 고유 식별자 생성
        const id = `img_${++this.imageCacheCounter}`;
        this._imageCache[id] = compressedUrl;
        
        return id;
      } catch (error) {
        console.error('이미지 처리 및 캐싱 중 오류:', error);
        
        // 오류 시 원본 반환
        const id = `img_${++this.imageCacheCounter}`;
        this._imageCache[id] = imageUrl;
        
        return id;
      }
    }
    
    /**
     * 이미지 최적화 및 캐싱 (동기 버전 - 비상용)
     * @param {string} imageUrl - 이미지 URL
     * @returns {string} - 캐시 ID
     */
    processAndCacheImageSync(imageUrl) {
      // 이미 최적화된 이미지인지 확인
      if (imageUrl.startsWith('img_') || imageUrl.startsWith('i')) {
        return imageUrl;
      }
      
      // 캐시에서 기존 이미지 확인
      for (const [id, cachedUrl] of Object.entries(this._imageCache)) {
        if (cachedUrl === imageUrl) {
          return id;
        }
      }
      
      // 동기적으로 이미지 처리 시도
      try {
        // 이미지 로드
        const img = new Image();
        img.src = imageUrl;
        
        // 최소한의 동기 처리 (위험함)
        const canvas = document.createElement('canvas');
        canvas.width = this.settings.profileImageSize;
        canvas.height = this.settings.profileImageSize;
        
        const ctx = canvas.getContext('2d');
        if (img.width > 0 && img.height > 0) {
          const size = Math.min(img.width, img.height);
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          
          ctx.drawImage(
            img,
            offsetX, offsetY, size, size,
            0, 0, canvas.width, canvas.height
          );
        }
        
        // ID 생성 및 캐싱
        const id = `img_${++this.imageCacheCounter}`;
        
        // 캔버스 미리 렌더링 여부 확인
        if (img.width > 0 && img.height > 0) {
          const optimizedUrl = canvas.toDataURL('image/jpeg', this.settings.quality);
          this._imageCache[id] = optimizedUrl;
        } else {
          // 이미지가 아직 로드되지 않은 경우 원본 URL 사용
          this._imageCache[id] = imageUrl;
        }
        
        return id;
      } catch (error) {
        console.error('동기 이미지 처리 실패:', error);
        
        // 오류 시 원본 URL 반환
        const id = `img_${++this.imageCacheCounter}`;
        this._imageCache[id] = imageUrl;
        
        return id;
      }
    }
    
    /**
     * 이미지 캐시 HTML 생성
     * @returns {string} - 이미지 캐시 HTML
     */
    generateImageCacheHTML() {
      // 캐시된 이미지가 없으면 빈 문자열 반환
      if (Object.keys(this._imageCache).length === 0) {
        return '';
      }
      
      // 캐시 HTML 생성
      const cacheHTML = Object.entries(this._imageCache)
        .map(([hash, imageUrl]) => {
          // 압축된 이미지 URL 복원
          const decompressedUrl = this.decompressImageUrl(imageUrl);
          return `<img id="${hash}" src="${decompressedUrl}" style="display:none;">`;
        })
        .join('');
      
      return `<div id="image-cache" style="display:none;">${cacheHTML}</div>`;
    }
  }