// /js/compressor.js - 통합 압축 및 이미지 URL 최적화 모듈


const LZString = function() {
  // 디코딩 함수
  function o(o, r) {
    if (!t[o]) {
      t[o] = {};
      for (var n = 0; n < o.length; n++) t[o][o.charAt(n)] = n;
    }
    return t[o][r];
  }
  
  var r = String.fromCharCode,
    n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",
    t = {},
    i = {
      // Base64 압축
      compressToBase64: function(o) {
        if (null == o) return "";
        var r = i._compress(o, 6, function(o) {
          return n.charAt(o);
        });
        switch (r.length % 4) {
          default:
          case 0:
            return r;
          case 1:
            return r + "===";
          case 2:
            return r + "==";
          case 3:
            return r + "=";
        }
      },
      
      // Base64 압축 해제
      decompressFromBase64: function(r) {
        return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function(e) {
          return o(n, r.charAt(e));
        });
      },
      
      // UTF16 압축
      compressToUTF16: function(o) {
        return null == o ? "" : i._compress(o, 15, function(o) {
          return r(o + 32);
        }) + " ";
      },
      
      // UTF16 압축 해제
      decompressFromUTF16: function(o) {
        return null == o ? "" : "" == o ? null : i._decompress(o.length, 16384, function(r) {
          return o.charCodeAt(r) - 32;
        });
      },
      
      // Uint8Array 압축
      compressToUint8Array: function(o) {
        for (var r = i.compress(o), n = new Uint8Array(2 * r.length), e = 0, t = r.length; e < t; e++) {
          var s = r.charCodeAt(e);
          n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256;
        }
        return n;
      },
      
      // Uint8Array 압축 해제
      decompressFromUint8Array: function(o) {
        if (null == o) return i.decompress(o);
        for (var n = new Array(o.length / 2), e = 0, t = n.length; e < t; e++) n[e] = 256 * o[2 * e] + o[2 * e + 1];
        var s = [];
        return n.forEach(function(o) {
          s.push(r(o));
        }), i.decompress(s.join(""));
      },
      
      // URI 컴포넌트 압축 (이미지 데이터에 주로 사용)
      compressToEncodedURIComponent: function(o) {
        return null == o ? "" : i._compress(o, 6, function(o) {
          return e.charAt(o);
        });
      },
      
      // URI 컴포넌트 압축 해제
      decompressFromEncodedURIComponent: function(r) {
        if (null == r) return "";
        if ("" == r) return null;
        // '+' 문자 처리 (URL 인코딩에서 공백으로 변환됨)
        r = r.replace(/ /g, "+");
        return i._decompress(r.length, 32, function(n) {
          return o(e, r.charAt(n));
        });
      },
      
      // 일반 압축
      compress: function(o) {
        return i._compress(o, 16, function(o) {
          return r(o);
        });
      },
      
      // 내부 압축 알고리즘
      _compress: function(o, r, n) {
        if (null == o) return "";
        var e, t, i, s = {},
          p = {},
          u = "",
          c = "",
          a = "",
          l = 2,
          f = 3,
          h = 2,
          d = [],
          m = 0,
          v = 0;
          
        // 문자열을 압축 알고리즘으로 처리
        for (i = 0; i < o.length; i += 1) {
          u = o.charAt(i);
          Object.prototype.hasOwnProperty.call(s, u) || (s[u] = f++, p[u] = !0);
          c = a + u;
          if (Object.prototype.hasOwnProperty.call(s, c)) {
            a = c;
          } else {
            if (Object.prototype.hasOwnProperty.call(p, a)) {
              if (a.charCodeAt(0) < 256) {
                for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              } else {
                for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
                for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              }
              0 == --l && (l = Math.pow(2, h), h++);
              delete p[a];
            } else {
              for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
            }
            0 == --l && (l = Math.pow(2, h), h++);
            s[c] = f++;
            a = String(u);
          }
        }
        
        // 마지막 문자 처리
        if ("" !== a) {
          if (Object.prototype.hasOwnProperty.call(p, a)) {
            if (a.charCodeAt(0) < 256) {
              for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
              for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
            } else {
              for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
              for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
            }
            0 == --l && (l = Math.pow(2, h), h++);
            delete p[a];
          } else {
            for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
          }
          0 == --l && (l = Math.pow(2, h), h++);
        }
        
        // 종료 시퀀스 추가
        for (t = 2, e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
        
        // 남은 비트 처리
        for (;;) {
          if (m = m << 1, v == r - 1) {
            d.push(n(m));
            break;
          }
          v++;
        }
        
        return d.join("");
      },
      
      // 압축 해제
      decompress: function(o) {
        return null == o ? "" : "" == o ? null : i._decompress(o.length, 32768, function(r) {
          return o.charCodeAt(r);
        });
      },
      
      // 내부 압축 해제 알고리즘
      _decompress: function(o, n, e) {
        var t, i, s, p, u, c, a, l = [],
          f = 4,
          h = 4,
          d = 3,
          m = "",
          v = [],
          g = {
            val: e(0),
            position: n,
            index: 1
          };
          
        // 초기 상태 설정
        for (t = 0; t < 3; t += 1) l[t] = t;
        
        // 첫 시퀀스 디코딩
        for (s = 0, u = Math.pow(2, 2), c = 1; c != u;) {
          p = g.val & g.position;
          g.position >>= 1;
          
          if (0 == g.position) {
            g.position = n;
            g.val = e(g.index++);
          }
          
          s |= (p > 0 ? 1 : 0) * c;
          c <<= 1;
        }
        
        // 시퀀스에 따른 처리
        switch (s) {
          case 0:
            for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) {
              p = g.val & g.position;
              g.position >>= 1;
              
              if (0 == g.position) {
                g.position = n;
                g.val = e(g.index++);
              }
              
              s |= (p > 0 ? 1 : 0) * c;
              c <<= 1;
            }
            a = r(s);
            break;
          case 1:
            for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) {
              p = g.val & g.position;
              g.position >>= 1;
              
              if (0 == g.position) {
                g.position = n;
                g.val = e(g.index++);
              }
              
              s |= (p > 0 ? 1 : 0) * c;
              c <<= 1;
            }
            a = r(s);
            break;
          case 2:
            return "";
        }
        
        // 나머지 시퀀스 처리 및 결과 생성
        for (l[3] = a, i = a, v.push(a);;) {
          if (g.index > o) return "";
          
          for (s = 0, u = Math.pow(2, d), c = 1; c != u;) {
            p = g.val & g.position;
            g.position >>= 1;
            
            if (0 == g.position) {
              g.position = n;
              g.val = e(g.index++);
            }
            
            s |= (p > 0 ? 1 : 0) * c;
            c <<= 1;
          }
          
          switch (a = s) {
            case 0:
              for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) {
                p = g.val & g.position;
                g.position >>= 1;
                
                if (0 == g.position) {
                  g.position = n;
                  g.val = e(g.index++);
                }
                
                s |= (p > 0 ? 1 : 0) * c;
                c <<= 1;
              }
              l[h++] = r(s);
              a = h - 1;
              f--;
              break;
            case 1:
              for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) {
                p = g.val & g.position;
                g.position >>= 1;
                
                if (0 == g.position) {
                  g.position = n;
                  g.val = e(g.index++);
                }
                
                s |= (p > 0 ? 1 : 0) * c;
                c <<= 1;
              }
              l[h++] = r(s);
              a = h - 1;
              f--;
              break;
            case 2:
              return v.join("");
          }
          
          // 다음 문자 처리
          if (0 == f && (f = Math.pow(2, d), d++), l[a]) m = l[a];
          else {
            if (a !== h) return null;
            m = i + i.charAt(0);
          }
          
          v.push(m);
          l[h++] = i + m.charAt(0);
          i = m;
          
          0 == --f && (f = Math.pow(2, d), d++);
        }
      }
    };
  return i;
}();

/**
* Base85 인코딩/디코딩 클래스
* - 텍스트보다 효율적인 이진 데이터 인코딩 제공
* - 이미지 데이터 압축률 향상에 활용
*/
const Base85 = {
  // 인코딩에 사용할 문자셋
  charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~",
  
  // 디코딩용 역참조 맵
  _decodeMap: null,
  
  // 디코딩 맵 초기화
  _initDecodeMap: function() {
    if (this._decodeMap) return;
    
    this._decodeMap = {};
    for (let i = 0; i < this.charset.length; i++) {
      this._decodeMap[this.charset[i]] = i;
    }
  },

  /**
   * 바이너리 데이터를 Base85로 인코딩
   * @param {string|Uint8Array} data - 인코딩할 데이터
   * @returns {string} - Base85 인코딩된 문자열
   */
  encode: function(data) {
    // 문자열을 바이트 배열로 변환
    if (typeof data === 'string') {
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i) & 0xff;
      }
      data = bytes;
    }

    let result = '';
    const length = data.length;
    
    // 4바이트 블록 단위로 인코딩
    for (let i = 0; i < length; i += 4) {
      // 4바이트를 32비트 정수로 변환
      let value = 0;
      for (let j = 0; j < 4; j++) {
        if (i + j < length) {
          value = (value << 8) | data[i + j];
        } else {
          value = value << 8;
        }
      }
      
      // 5개의 Base85 문자로 인코딩
      const chars = [];
      for (let j = 4; j >= 0; j--) {
        const charIdx = Math.floor(value / Math.pow(85, j)) % 85;
        chars.push(this.charset[charIdx]);
      }
      
      // 마지막 블록 처리 - 부분 블록일 경우 필요한 만큼만 문자 추가
      if (i + 4 > length) {
        const extraBytes = (i + 4) - length;
        const charsToKeep = 5 - Math.ceil(extraBytes * 5 / 4);
        result += chars.slice(0, charsToKeep).join('');
      } else {
        result += chars.join('');
      }
    }
    
    return result;
  },
  
  /**
   * Base85로 인코딩된 문자열을 바이너리 데이터로 디코딩
   * @param {string} text - Base85 인코딩된 문자열
   * @returns {string} - 디코딩된 바이너리 문자열
   */
  decode: function(text) {
    // 디코딩 맵 초기화
    this._initDecodeMap();
    
    let result = '';
    const length = text.length;
    
    // 5글자 블록 단위로 디코딩
    for (let i = 0; i < length; i += 5) {
      // 마지막 블록 처리
      const chunkLen = Math.min(5, length - i);
      const chunk = text.substr(i, chunkLen).padEnd(5, 'u');
      
      // 5글자를 32비트 정수로 변환
      let value = 0;
      for (let j = 0; j < 5; j++) {
        const charIndex = this._decodeMap[chunk[j]] || 0;
        value = value * 85 + charIndex;
      }
      
      // 4바이트로 변환
      const bytesToWrite = Math.floor(chunkLen * 4 / 5);
      for (let j = 3; j >= 4 - bytesToWrite; j--) {
        const byte = (value >> (j * 8)) & 0xFF;
        result += String.fromCharCode(byte);
      }
    }
    
    return result;
  },
  
  /**
   * Base85 인코딩된 문자열을 Uint8Array로 디코딩
   * @param {string} text - Base85 인코딩된 문자열
   * @returns {Uint8Array} - 디코딩된 바이너리 데이터
   */
  decodeToUint8Array: function(text) {
    const binaryString = this.decode(text);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }
};

/**
* 이미지 URL 압축 및 해제 모듈
* - 이미지 데이터의 효율적인 압축 및 복원 기능 제공
* - 영속성을 보장하는 안전한 압축 알고리즘 적용
*/
const Compressor = {
  /**
   * 이미지 URL 압축
   * - 영속성을 최대한 보장하면서 데이터 크기 감소
   * @param {string} imageDataUrl - 압축할 이미지 Data URL
   * @returns {string} - 압축된 이미지 URL
   */
  compressImageUrl: function(imageDataUrl) {
      // 유효성 검사
      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
          return imageDataUrl;
      }

      try {
          const [header, base64Data] = imageDataUrl.split(',');
          
          if (!base64Data) {
              console.warn('유효하지 않은 이미지 데이터 URL');
              return imageDataUrl;
          }
          
          // LZ-String으로 압축하는 대신 간단한 식별자 추가
          // 실제 압축은 MediaManager에서 수행
          return `${header},OPTIMIZE:${base64Data}`;
      } catch (error) {
          console.error('이미지 URL 압축 중 오류:', error);
          // 압축 실패 시 원본 유지 (영속성 보장)
          return imageDataUrl;
      }
  },
  
  /**
   * 압축된 이미지 URL 복원
   * - 다양한 압축 방식 지원 (LZString, Base85, WebP 등)
   * @param {string} compressedImageUrl - 압축된 이미지 URL
   * @returns {string} - 복원된 이미지 URL
   */
  decompressImageUrl: function(compressedImageUrl) {
      if (!compressedImageUrl) {
          return compressedImageUrl;
      }
      
      try {
          // Base85 형식 처리
          if (compressedImageUrl.includes('B85:')) {
              // 헤더와 압축된 데이터 부분 분리
              const [header, compressedData] = compressedImageUrl.split(',');
              
              // 압축 식별자 제거
              const encodedData = compressedData.replace('B85:', '');
              
              // Base85로 디코딩
              const binaryData = Base85.decode(encodedData);
              
              // 바이너리를 Base64로 변환
              const base64Data = btoa(binaryData);
              
              // 원본 Data URL 반환
              return `${header},${base64Data}`;
          }
          
          // LZSTR 형식 처리
          if (compressedImageUrl.includes('LZSTR:')) {
              const [header, compressedData] = compressedImageUrl.split(',');
              const cleanCompressedData = compressedData.replace('LZSTR:', '');
              
              try {
                  // LZString 라이브러리로 압축 해제
                  const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
                  if (!originalBase64) {
                      console.warn('LZString 압축 해제 실패, 원본 반환');
                      return compressedImageUrl;
                  }
                  return `${header},${originalBase64}`;
              } catch (lzError) {
                  console.error('LZString 압축 해제 중 오류:', lzError);
                  return compressedImageUrl; // 오류 시 원본 유지 (영속성 보장)
              }
          }
          
          // WebP 형식 처리
          if (compressedImageUrl.includes('WEBP:')) {
              return compressedImageUrl.replace('WEBP:', '');
          }
          
          // 기타 압축 형식 처리 (이전 버전 호환성)
          if (compressedImageUrl.includes('OPTIMIZE:')) {
              return compressedImageUrl.replace('OPTIMIZE:', '');
          }
          
          if (compressedImageUrl.includes('NOCOMPRESS:')) {
              return compressedImageUrl.replace('NOCOMPRESS:', '');
          }
          
          // 압축되지 않은 경우 원본 반환
          return compressedImageUrl;
      } catch (error) {
          console.error('이미지 URL 복원 중 오류 발생:', error);
          return compressedImageUrl; // 복원 실패 시 원본 반환 (영속성 보장)
      }
  },
  
  /**
   * HTML 내 모든 이미지 압축 해제
   * - 다양한 압축 형식을 감지하고 적절히 복원
   * @param {string} html - 이미지가 포함된 HTML
   * @returns {string} - 이미지 압축 해제된 HTML
   */
  decompressAllImages: function(html) {
      if (!html) return html;
      
      try {
          // Base85 형식 처리
          html = html.replace(/data:[^,]+,B85:([^"']+)/g, (match, p1) => {
              try {
                  // Base85 디코딩
                  const binaryData = Base85.decode(p1);
                  // 바이너리를 Base64로 변환
                  const base64Data = btoa(binaryData);
                  return `data:image/jpeg;base64,${base64Data}`;
              } catch (error) {
                  console.warn('Base85 이미지 데이터 압축 해제 실패:', error);
                  return match; // 오류 시 원본 유지 (영속성 보장)
              }
          });
          
          // WebP 형식 처리
          html = html.replace(/data:image\/webp,WEBP:([^"']+)/g, (match, p1) => {
              return `data:image/webp,${p1}`;
          });
          
          // LZSTR 형식 처리
          html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
              try {
                  if (typeof LZString !== 'undefined') {
                      const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
                      if (originalBase64) {
                          return `data:image/jpeg;base64,${originalBase64}`;
                      }
                  }
                  return match; // LZString이 없거나 압축 해제 실패 시 원본 유지
              } catch (error) {
                  console.warn('이미지 데이터 압축 해제 실패:', error);
                  return match; // 오류 시 원본 유지 (영속성 보장)
              }
          });
          
          // 기타 압축 형식 처리 (이전 버전 호환성)
          html = html.replace(/data:[^,]+,(?:OPTIMIZE:|NOCOMPRESS:)([^"']+)/g, (match, p1) => {
              return `data:image/jpeg;base64,${p1}`;
          });
          
          return html;
      } catch (error) {
          console.error('HTML 내 이미지 압축 해제 중 오류:', error);
          return html; // 복원 실패 시 원본 HTML 반환 (영속성 보장)
      }
  },
  
  /**
   * 이미지 URL의 크기 계산
   * @param {string} dataUrl - 데이터 URL
   * @returns {number} - 크기 (KB 단위)
   */
  getDataUrlSize: function(dataUrl) {
      if (!dataUrl) return 0;
      
      try {
          // Base64 부분만 추출
          const base64 = dataUrl.split(',')[1];
          if (!base64) return 0;
          
          // 압축 마커가 있는 경우 처리
          if (base64.startsWith('LZSTR:')) {
              // LZSTR은 압축되어 있으므로 실제 크기의 대략 1.5배로 추정
              const compressedData = base64.substring(6);
              return (compressedData.length * 3/4) * 1.5 / 1024;
          }
          
          if (base64.startsWith('B85:')) {
              // Base85는 실제 크기의 약 1.25배로 추정
              const compressedData = base64.substring(4);
              return compressedData.length * 1.25 / 1024;
          }
          
          if (base64.startsWith('WEBP:') || base64.startsWith('OPTIMIZE:') || base64.startsWith('NOCOMPRESS:')) {
              const actualData = base64.split(':')[1];
              return (actualData.length * 3/4) / 1024;
          }
          
          // 일반 Base64 처리
          return (base64.length * 3/4) / 1024;
      } catch (error) {
          console.error('데이터 URL 크기 계산 중 오류:', error);
          return 0;
      }
  }
};

// 전역 객체 노출 - 다른 모듈에서 접근 가능하도록
window.LZString = LZString;
window.Base85 = Base85;
window.Compressor = Compressor;

// 레거시 호환성 유지
window.UrlCompressor = Compressor;
window.ImageCompressor = Compressor;

console.log('통합 압축 모듈이 성공적으로 로드되었습니다.');