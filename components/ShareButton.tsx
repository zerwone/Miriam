"use client";

import { useState } from "react";

interface ShareButtonProps {
  mode: "compare" | "judge" | "research";
  results: any;
}

export function ShareButton({ mode, results }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: `${mode} result`,
          resultData: results,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const { url } = await response.json();
      setShareUrl(url);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard!");
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="px-3 py-2 border border-miriam-gray/30 rounded-lg bg-miriam-bgSoft text-miriam-text text-sm"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            alert("Link copied!");
          }}
          className="px-4 py-2 bg-miriam-bgSoft text-miriam-text rounded-lg hover:bg-miriam-bgSoft/80 text-sm transition-colors"
        >
          Copy
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="px-4 py-2 bg-miriam-purple text-white rounded-lg hover:bg-miriam-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Sharing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
