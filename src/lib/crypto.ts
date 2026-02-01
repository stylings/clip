"use client";

export interface EncryptedPaste {
  iv: string;
  ciphertext: string;
  salt: string;
}

export interface PasteResult {
  id: string;
  key: string;
  url: string;
}

export function generateKey(length: number = 22): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptContent(
  plaintext: string,
  key: string,
): Promise<EncryptedPaste> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await deriveKey(key, salt.buffer);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    stringToBuffer(plaintext),
  );

  return {
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertext),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decryptContent(
  encrypted: EncryptedPaste,
  key: string,
): Promise<string> {
  try {
    const salt = base64ToBuffer(encrypted.salt);
    const iv = base64ToBuffer(encrypted.iv);
    const ciphertext = base64ToBuffer(encrypted.ciphertext);
    const cryptoKey = await deriveKey(key, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext,
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("Failed to decrypt - invalid key or corrupted data");
  }
}

export function createPasteUrl(id: string, key: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/${id}#${key}`;
}

export function parsePasteUrl(hash: string): {
  id: string | null;
  key: string | null;
} {
  if (!hash || !hash.startsWith("#")) {
    return { id: null, key: null };
  }

  const parts = hash.slice(1).split("#");
  if (parts.length === 2) {
    return { id: parts[0], key: parts[1] };
  }

  const decoded = atob(hash.slice(1));
  const match = decoded.match(/^(.+):(.+)$/);
  if (match) {
    return { id: match[1], key: match[2] };
  }

  return { id: null, key: null };
}
