"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't trigger if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;

      switch (e.key) {
        case "/":
          if (!e.shiftKey) {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
          }
          break;
        case "d":
          router.push("/");
          break;
        case "o":
          router.push("/domains");
          break;
        case "w":
          router.push("/wallet");
          break;
        case "t":
          router.push("/trades");
          break;
        case "h":
          router.push("/whales");
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);
}
