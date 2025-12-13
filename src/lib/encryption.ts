// Simple but effective encryption for gesture-based data transfer
// Uses Web Crypto API for secure encryption

export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exportedKey);
}

export async function encryptData(data: string, keyBase64: string): Promise<string> {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

export async function decryptData(encryptedBase64: string, keyBase64: string): Promise<string> {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const combined = new Uint8Array(base64ToArrayBuffer(encryptedBase64));
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedBuffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a unique session ID
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Hash the gesture for matching (deterministic)
export function hashGesture(gesturePoints: { x: number; y: number }[]): string {
  if (gesturePoints.length < 10) return '';
  
  // Normalize points to 0-1 range
  const minX = Math.min(...gesturePoints.map(p => p.x));
  const maxX = Math.max(...gesturePoints.map(p => p.x));
  const minY = Math.min(...gesturePoints.map(p => p.y));
  const maxY = Math.max(...gesturePoints.map(p => p.y));
  
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  
  const normalized = gesturePoints.map(p => ({
    x: (p.x - minX) / rangeX,
    y: (p.y - minY) / rangeY,
  }));
  
  // Sample points to create consistent signature
  const sampleSize = 16;
  const step = Math.floor(normalized.length / sampleSize);
  const sampled = normalized.filter((_, i) => i % step === 0).slice(0, sampleSize);
  
  // Create direction vectors with tolerance
  const directions: number[] = [];
  for (let i = 1; i < sampled.length; i++) {
    const angle = Math.atan2(
      sampled[i].y - sampled[i - 1].y,
      sampled[i].x - sampled[i - 1].x
    );
    // Quantize to 8 directions for tolerance
    const quantized = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
    directions.push(quantized);
  }
  
  // Create hash from directions
  return directions.join('');
}
