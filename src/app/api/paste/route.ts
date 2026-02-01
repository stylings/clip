import { NextRequest, NextResponse } from "next/server";
import { createStore, PasteStore } from "@/lib/stores";

const store: PasteStore = createStore();

function generateId(length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

async function generateUniqueId(): Promise<string> {
  let id: string;
  let exists: string | null;
  do {
    id = generateId(8);
    exists = await store.get(id);
  } while (exists);
  return id;
}

function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
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
    ["decrypt"],
  );
}

async function decryptContent(
  encrypted: { iv: string; ciphertext: string; salt: string },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encrypted } = body;

    if (!encrypted) {
      return NextResponse.json(
        { error: "Missing encrypted content" },
        { status: 400 },
      );
    }

    const id = await generateUniqueId();
    await store.set(id, JSON.stringify({ encrypted }));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to store paste:", error);
    return NextResponse.json(
      { error: "Failed to store paste" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const key = searchParams.get("key");
    const raw = searchParams.get("raw");

    if (!id) {
      return NextResponse.json({ error: "Missing paste ID" }, { status: 400 });
    }

    const data = await store.get(id);

    if (!data) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 });
    }

    const paste = JSON.parse(data);

    if (raw && key) {
      try {
        const decrypted = await decryptContent(
          paste.encrypted as { iv: string; ciphertext: string; salt: string },
          key,
        );
        return new NextResponse(decrypted, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `inline; filename="${id}.txt"`,
          },
        });
      } catch {
        return NextResponse.json(
          { error: "Decryption failed - invalid key" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(paste.encrypted);
  } catch (error) {
    console.error("Failed to retrieve paste:", error);
    return NextResponse.json(
      { error: "Failed to retrieve paste" },
      { status: 500 },
    );
  }
}
