// /js/compressor.js - 통합 압축 및 이미지 URL 최적화 모듈

const LZString = function() {
    // 라이브러리 코드는 최소화된 버전을 사용
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
        decompressFromBase64: function(r) {
          return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function(e) {
            return o(n, r.charAt(e));
          });
        },
        compressToUTF16: function(o) {
          return null == o ? "" : i._compress(o, 15, function(o) {
            return r(o + 32);
          }) + " ";
        },
        decompressFromUTF16: function(o) {
          return null == o ? "" : "" == o ? null : i._decompress(o.length, 16384, function(r) {
            return o.charCodeAt(r) - 32;
          });
        },
        compressToUint8Array: function(o) {
          for (var r = i.compress(o), n = new Uint8Array(2 * r.length), e = 0, t = r.length; e < t; e++) {
            var s = r.charCodeAt(e);
            n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256;
          }
          return n;
        },
        decompressFromUint8Array: function(o) {
          if (null == o) return i.decompress(o);
          for (var n = new Array(o.length / 2), e = 0, t = n.length; e < t; e++) n[e] = 256 * o[2 * e] + o[2 * e + 1];
          var s = [];
          return n.forEach(function(o) {
            s.push(r(o));
          }), i.decompress(s.join(""));
        },
        compressToEncodedURIComponent: function(o) {
          return null == o ? "" : i._compress(o, 6, function(o) {
            return e.charAt(o);
          });
        },
        decompressFromEncodedURIComponent: function(r) {
          return null == r ? "" : "" == r ? null : (r = r.replace(/ /g, "+"), i._decompress(r.length, 32, function(n) {
            return o(e, r.charAt(n));
          }));
        },
        compress: function(o) {
          return i._compress(o, 16, function(o) {
            return r(o);
          });
        },
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
          for (i = 0; i < o.length; i += 1)
            if (u = o.charAt(i), Object.prototype.hasOwnProperty.call(s, u) || (s[u] = f++, p[u] = !0), c = a + u, Object.prototype.hasOwnProperty.call(s, c)) a = c;
            else {
              if (Object.prototype.hasOwnProperty.call(p, a)) {
                if (a.charCodeAt(0) < 256) {
                  for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                  for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
                } else {
                  for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
                  for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
                }
                0 == --l && (l = Math.pow(2, h), h++), delete p[a];
              } else
                for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              0 == --l && (l = Math.pow(2, h), h++), s[c] = f++, a = String(u);
            }
          if ("" !== a) {
            if (Object.prototype.hasOwnProperty.call(p, a)) {
              if (a.charCodeAt(0) < 256) {
                for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              } else {
                for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
                for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              }
              0 == --l && (l = Math.pow(2, h), h++), delete p[a];
            } else
              for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
            0 == --l && (l = Math.pow(2, h), h++);
          }
          for (t = 2, e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
          for (;;) {
            if (m = m << 1, v == r - 1) {
              d.push(n(m));
              break;
            }
            v++;
          }
          return d.join("");
        },
        decompress: function(o) {
          return null == o ? "" : "" == o ? null : i._decompress(o.length, 32768, function(r) {
            return o.charCodeAt(r);
          });
        },
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
          for (t = 0; t < 3; t += 1) l[t] = t;
          for (s = 0, u = Math.pow(2, 2), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
          switch (s) {
            case 0:
              for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
              a = r(s);
              break;
            case 1:
              for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
              a = r(s);
              break;
            case 2:
              return "";
          }
          for (l[3] = a, i = a, v.push(a);;) {
            if (g.index > o) return "";
            for (s = 0, u = Math.pow(2, d), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
            switch (a = s) {
              case 0:
                for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
                l[h++] = r(s), a = h - 1, f--;
                break;
              case 1:
                for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
                l[h++] = r(s), a = h - 1, f--;
                break;
              case 2:
                return v.join("");
            }
            if (0 == f && (f = Math.pow(2, d), d++), l[a]) m = l[a];
            else {
              if (a !== h) return null;
              m = i + i.charAt(0);
            }
            v.push(m), l[h++] = i + m.charAt(0), i = m, 0 == --f && (f = Math.pow(2, d), d++);
          }
        }
      };
    return i;
  }();
  
  // Base85 인코딩 구현 - 더 효율적인 텍스트 인코딩
  const Base85 = {
    charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~",
  
    // 바이너리 데이터를 Base85로 인코딩
    encode: function(data) {
      if (typeof data === 'string') {
        // 문자열을 바이트 배열로 변환
        const bytes = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          bytes[i] = data.charCodeAt(i) & 0xff;
        }
        data = bytes;
      }
  
      let result = '';
      const length = data.length;
      
      // 4바이트씩 처리 (기본 방식으로 단순화)
      for (let i = 0; i < length; i += 4) {
        // 4바이트를 32비트 정수로 변환
        let value = 0;
        for (let j = 0; j < 4; j++) {
          if (i + j < length) {
            value = (value << 8) | data[i + j];
          }
        }
        
        // 5개의 문자로 인코딩
        const chars = [];
        for (let j = 0; j < 5; j++) {
          chars.push(this.charset[value % 85]);
          value = Math.floor(value / 85);
        }
        result += chars.reverse().join('');
      }
      
      return result;
    },
    
    // Base85로 인코딩된 문자열을 바이너리 데이터로 디코딩
    decode: function(text) {
      const bytes = [];
      
      // 5글자씩 처리
      for (let i = 0; i < text.length; i += 5) {
        const chunk = text.substr(i, 5).padEnd(5, 'u');
        
        // 5글자를 32비트 정수로 변환
        let value = 0;
        for (let j = 0; j < 5; j++) {
          const charIndex = this.charset.indexOf(chunk[j]);
          if (charIndex === -1) continue;
          value = value * 85 + charIndex;
        }
        
        // 4바이트로 변환
        for (let j = 3; j >= 0; j--) {
          if (i + j < text.length) {
            bytes.push((value >> (j * 8)) & 0xFF);
          }
        }
      }
      
      return new Uint8Array(bytes);
    }
  };
  
  // 이미지 URL 압축 및 해제 모듈
  const Compressor = {
  
    compressImageUrl: function(imageDataUrl) {
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
          return `${header},OPTIMIZE:${base64Data}`;
      } catch (error) {
          console.error('이미지 URL 압축 중 오류:', error);
          return imageDataUrl;
      }
  },
    
  // 이미지 URL 압축 및 해제 모듈
    decompressImageUrl: function(compressedImageUrl) {
      if (!compressedImageUrl) return compressedImageUrl;
      
      try {
          // LZSTR 형식 처리
          if (compressedImageUrl.includes('LZSTR:')) {
              const [header, compressedData] = compressedImageUrl.split(',');
              const cleanCompressedData = compressedData.replace('LZSTR:', '');
              const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
              
              // 디버깅용 로그 추가
              console.log('Decompressed image URL:', `${header},${originalBase64}`);
              
              return `${header},${originalBase64}`;
          }
          
          return compressedImageUrl;
      } catch (error) {
          console.error('이미지 URL 복원 중 오류:', error);
          return compressedImageUrl;
      }
  },
  
    // 이미지 URL 압축 및 해제 모듈
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
          
          // Base85로 디코딩 후 LZ-String으로 압축 해제
          const compressedBinary = Base85.decode(encodedData);
          const originalBinary = LZString.decompress(compressedBinary);
          
          // 바이너리를 Base64로 변환
          const base64Data = btoa(originalBinary);
          
          // 원본 Data URL 반환
          return `${header},${base64Data}`;
        }
        
        // 기존 LZ-String 형식 처리 (이전 버전 호환성)
        if (compressedImageUrl.includes('LZSTR:')) {
          const [header, compressedData] = compressedImageUrl.split(',');
          const cleanCompressedData = compressedData.replace('LZSTR:', '');
          const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
          return `${header},${originalBase64}`;
        }
        
        // 기타 압축 형식 처리 (이전 버전 호환성)
        if (compressedImageUrl.includes('OPTIMIZE:')) {
          const [header, compressedData] = compressedImageUrl.split(',');
          const cleanCompressedData = compressedData.replace('OPTIMIZE:', '');
          return `${header},${cleanCompressedData}`;
        }
        
        if (compressedImageUrl.includes('NOCOMPRESS:')) {
          return compressedImageUrl.replace('NOCOMPRESS:', '');
        }
        
        // 압축되지 않은 경우 원본 반환
        return compressedImageUrl;
      } catch (error) {
        console.error('이미지 URL 복원 중 오류 발생:', error);
        return compressedImageUrl; // 복원 실패 시 원본 반환
      }
    },
    
    // HTML 내 이미지 압축 해제
    decompressAllImages: function(html) {
      if (!html) return html;
      
      try {
        // Base85 형식 처리
        html = html.replace(/data:[^,]+,B85:([^"']+)/g, (match, p1) => {
          try {
            const compressedBinary = Base85.decode(p1);
            const originalBinary = LZString.decompress(compressedBinary);
            return `data:image/webp;base64,${btoa(originalBinary)}`;
          } catch (error) {
            console.error('Base85 이미지 압축 해제 실패:', error);
            return match; // 오류 시 원본 유지
          }
        });
        
        // 기존 LZ-String 형식 처리 (하위 호환성)
        html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
          try {
            const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
            return `data:image/jpeg;base64,${originalBase64}`;
          } catch (error) {
            console.error('이미지 데이터 압축 해제 실패:', error);
            return match; // 오류 시 원본 유지
          }
        });
        
        // 기타 압축 형식 처리 (이전 버전 호환성)
        html = html.replace(/data:[^,]+,OPTIMIZE:([^"']+)/g, (match, p1) => {
          return `data:image/jpeg;base64,${p1}`;
        });
        
        html = html.replace(/data:[^,]+,NOCOMPRESS:([^"']+)/g, (match, p1) => {
          return `data:image/jpeg;base64,${p1}`;
        });
        
        return html;
      } catch (error) {
        console.error('HTML 내 이미지 압축 해제 중 오류:', error);
        return html; // 실패 시 원본 HTML 반환
      }
    },
    
    // 이미지 URL 압축 여부 확인
    getDataUrlSize: function(dataUrl) {
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
  
  // 전역 변수로 노출 - 기존 호환성 유지
  window.LZString = LZString;
  window.Base85 = Base85;
  window.Compressor = Compressor;
  window.UrlCompressor = Compressor;
  window.ImageCompressor = Compressor;
  
  console.log('통합 압축 모듈이 성공적으로 로드되었습니다.');