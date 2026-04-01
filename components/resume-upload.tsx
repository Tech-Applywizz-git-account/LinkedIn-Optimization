"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { ParsedResume } from "@/lib/resumeParser";
import { parseResumeText } from "@/lib/resumeParser";
import { createWorker } from "tesseract.js";
import { sanitizeLLMText } from "@/lib/sanitize";

interface ResumeUploadProps {
  onParsed: (data: { text: string; parsed: ParsedResume }) => void;
}

/** Load PDF.js from CDN (avoids local module resolution issues entirely). */
async function loadPdfJsFromCdn(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).pdfjsLib) {
    const pdfjsLib = (window as any).pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return pdfjsLib;
  }

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load pdf.js from CDN."));
    document.head.appendChild(s);
  });

  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("pdf.js did not load correctly from CDN.");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return pdfjsLib;
}

function ResumeUpload({ onParsed }: ResumeUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "parsing" | "ocr">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);

  // 1) Fast client-side PDF text extraction using pdfjs getTextContent()
  const extractPdfTextInBrowser = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJsFromCdn();
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str ?? "")
        .join(" ");
      fullText += pageText + "\n";
    }
    return fullText.replace(/\n{3,}/g, "\n\n").trim();
  };

  // 2) Server parse for DOCX / TXT / RTF / HTML
  const parseViaApi = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/parse-resume", { method: "POST", body: form });
    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch {}
    if (!res.ok) {
      const message = (data && (data.error || data.message)) || raw || `HTTP ${res.status}`;
      throw new Error(message);
    }
    const cleanedText = sanitizeLLMText(data.text as string);
    return { text: cleanedText, parsed: data.parsed as ParsedResume };
  };

  // 3) OCR fallback (Tesseract) for scanned/image-only PDFs
  const ocrPdfInBrowser = async (file: File) => {
    setPhase("ocr");
    const pdfjsLib = await loadPdfJsFromCdn();
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const worker: any = await createWorker("eng");
    let out = "";
    const maxPages = Math.min(pdf.numPages, 15);
    for (let p = 1; p <= maxPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx!, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");
      const { data } = await worker.recognize(dataUrl);
      out += "\n" + (data?.text || "");
    }
    await worker.terminate();
    const cleaned = out.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!cleaned) throw new Error("OCR found no readable text. Try exporting a searchable PDF.");
    return sanitizeLLMText(cleaned);
  };

  const handleSubmit = async (file: File) => {
    try {
      setError(null);
      setLoading(true);
      setPhase("parsing");
      setFileName(file.name);

      const isPdf = file.type?.toLowerCase().includes("pdf") || file.name?.toLowerCase().endsWith(".pdf");

      let rawText = "";

      if (isPdf) {
        // Step 1: Try fast client-side pdfjs extraction (no server needed)
        try {
          rawText = await extractPdfTextInBrowser(file);
        } catch (_e) {
          rawText = "";
        }

        // Step 2: If client extraction failed or returned empty, try OCR
        if (!rawText || rawText.trim().length < 50) {
          rawText = await ocrPdfInBrowser(file);
        }

        // Apply misread fixes to extracted PDF text
        const cleanedText = sanitizeLLMText(rawText);
        const structured = parseResumeText(cleanedText);
        setResumeText(cleanedText);
        onParsed({ text: cleanedText, parsed: structured as ParsedResume });
        setPhase("idle");
        return;
      }

      // For DOCX / TXT / HTML / RTF — use server API
      const { text, parsed } = await parseViaApi(file);
      setResumeText(text);
      onParsed({ text, parsed });
      setPhase("idle");

    } catch (e: any) {
      console.error("Client parse error:", e);
      setError(e?.message || "Failed to parse resume");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) handleSubmit(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt", ".md", ".markdown", ".json"],
      "text/rtf": [".rtf"],
      "text/html": [".html", ".htm"],
    },
  });
  

  return (
    <div className="p-6 border rounded-xl shadow bg-white">
      <h2 className="text-xl font-bold mb-4">Upload Your Resume</h2>

      <div
        {...getRootProps()}
        suppressHydrationWarning
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} suppressHydrationWarning />
        {isDragActive ? (
          <p>Drop your resume here…</p>
        ) : (
          <p>
            Drag & drop your resume, or <span className="text-blue-600">click to select</span>.
            <br />
            (PDF, DOCX, TXT, RTF, HTML, MD, JSON supported)
          </p>
        )}
      </div>

      {fileName && <p className="mt-3 text-gray-600 text-sm">Uploaded: {fileName}</p>}
      {loading && (
        <p className="mt-3">
          {phase === "parsing" ? "Reading file…" : "Running OCR (can take a bit)…"}
        </p>
      )}
      {error && <p className="mt-3 text-red-600">Error: {error}</p>}

      {resumeText && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Extracted Resume Text:</h3>
          <textarea className="w-full h-48 border rounded p-2 text-sm" readOnly value={resumeText} />
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
export { ResumeUpload };