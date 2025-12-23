"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
  className?: string;
};

/**
 * Renders LLM text (Markdown) safely with GitHub-flavored Markdown (GFM):
 * - **bold**, _italic_, bullet/numbered lists, tables, line breaks
 * - No raw HTML execution (safer)
 */
export default function Markdown({ children, className }: Props) {
  const base = "prose prose-zinc max-w-none"; // Tailwind 'prose' styles; adjust to your theme if needed
  const cls = className ? `${base} ${className}` : base;

  return (
    <div className={cls}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // We do NOT enable 'rehype-raw' so any HTML in model output won't execute
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-3 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-3" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-3" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold mt-5 mb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse" {...props} />
            </div>
          ),
        }}
      >
        {/* Normalize Windows newlines so lists render correctly */}
        {(children ?? "").replace(/\r\n/g, "\n")}
      </ReactMarkdown>
    </div>
  );
}
