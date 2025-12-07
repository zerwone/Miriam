"use client";

import { useState } from "react";
import { TEMPLATES, type Template } from "@/lib/templates";

interface TemplateSelectorProps {
  mode: "miriam" | "compare" | "judge" | "research";
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ mode, onSelect }: TemplateSelectorProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = TEMPLATES.filter((t) => t.mode === mode);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className="px-4 py-2 bg-miriam-bgSoft text-miriam-text rounded-lg hover:bg-miriam-bgSoft/80 transition-colors text-sm font-medium flex items-center gap-2 border border-miriam-gray/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Templates
      </button>

      {showTemplates && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowTemplates(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-miriam-bgSoft rounded-lg shadow-lg border border-miriam-gray/30 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template);
                    setShowTemplates(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-miriam-bg transition-colors mb-2"
                >
                  <div className="font-semibold text-miriam-text mb-1">
                    {template.name}
                  </div>
                  <div className="text-sm text-miriam-text/70">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
