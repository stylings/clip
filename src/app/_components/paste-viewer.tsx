"use client";

import { useState, useEffect } from "react";
import { decryptContent, EncryptedPaste } from "@/lib/crypto";

interface PasteViewerProps {
  pasteId: string;
}

function getKeyFromUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    window.location.hash.slice(1) ||
    new URL(window.location.href).searchParams.get("key") ||
    ""
  );
}

export function PasteViewer({ pasteId }: PasteViewerProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let checkAttempts = 0;
    const maxAttempts = 10;

    const loadPaste = async () => {
      const key = getKeyFromUrl();

      if (!key && checkAttempts < maxAttempts) {
        checkAttempts++;
        setTimeout(loadPaste, 50);
        return;
      }

      if (!key) {
        if (!cancelled) {
          setError("no decryption key");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/paste?id=${pasteId}`);

        if (response.status === 404) {
          if (!cancelled) {
            setError("paste not found");
            setIsLoading(false);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch paste");
        }

        const encrypted: EncryptedPaste = await response.json();
        const decrypted = await decryptContent(encrypted, key);

        if (!cancelled) {
          setDecryptedContent(decrypted);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("decryption failed");
          setIsLoading(false);
        }
      }
    };

    loadPaste();

    return () => {
      cancelled = true;
    };
  }, [pasteId]);

  useEffect(() => {
    if (!decryptedContent) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();

        const blob = new Blob([decryptedContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pasteId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [decryptedContent, pasteId]);

  if (isLoading) {
    return (
      <main className="h-screen w-full p-8">
        <p className="text-[#888888]">loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-screen w-full p-8">
        <p className="text-[#888888]">{error}</p>
      </main>
    );
  }

  if (!decryptedContent) {
    return null;
  }

  return (
    <main className="min-h-screen w-full p-8">
      <pre className="text-sm whitespace-pre-wrap">{decryptedContent}</pre>
    </main>
  );
}
