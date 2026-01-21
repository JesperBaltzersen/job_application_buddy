/**
 * Utility functions for OpenRouter Client
 */

/**
 * Decode base64 string to ArrayBuffer
 * Works in both browser-like and Node runtimes without importing Node builtins
 * 
 * @param b64 Base64 encoded string
 * @returns ArrayBuffer containing decoded data
 * @throws Error if base64 decoding is not supported in the environment
 */
export function decodeBase64ToArrayBuffer(b64: string): ArrayBuffer {
  // Try browser-like atob first
  if (typeof (globalThis as unknown as { atob?: (data: string) => string }).atob === "function") {
    const binary = (globalThis as unknown as { atob: (data: string) => string }).atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  // Try Node.js Buffer
  const maybeBuffer = (globalThis as unknown as { 
    Buffer?: { 
      from: (s: string, enc: string) => { 
        buffer: ArrayBuffer; 
        byteOffset: number; 
        byteLength: number 
      } 
    } 
  }).Buffer;
  
  if (maybeBuffer) {
    const buf = maybeBuffer.from(b64, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  
  throw new Error("Base64 decoding not supported in this environment");
}
