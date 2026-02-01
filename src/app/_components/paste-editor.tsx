"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { encryptContent, generateKey } from "@/lib/crypto";

export function PasteEditor() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const isEncryptingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();

        if (!content.trim() || isEncryptingRef.current) return;

        isEncryptingRef.current = true;

        const createPaste = async () => {
          try {
            const key = generateKey(22);
            const encrypted = await encryptContent(content, key);

            const response = await fetch("/api/paste", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ encrypted }),
            });

            if (!response.ok) {
              throw new Error("Failed to create paste");
            }

            const { id } = await response.json();
            router.push(`/${id}#${key}`);
          } catch (error) {
            console.error("Failed to create paste:", error);
            isEncryptingRef.current = false;
          }
        };

        createPaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, router]);

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="[ paste text - ctrl+s to save ]"
      className="h-screen w-full bg-transparent p-8 text-base resize-none outline-none"
      spellCheck={false}
      autoFocus
    />
  );
}
