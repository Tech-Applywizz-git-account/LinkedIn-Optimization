"use client";

import React, { useCallback, useMemo, useState } from "react";
import Markdown from "@/components/ui/Markdown";

type ExperienceInput = {
  id: string;
  title?: string;
  targetRole: string;
  resumeText: string;
  jobDescriptionText: string;
};

type ItemState = {
  status: "idle" | "generating" | "generated" | "approved" | "error";
  output?: string;
  error?: string;
};

type Props = {
  experiences: ExperienceInput[];     // one item per step
  genEndpoint?: string;               // defaults to /api/generate-section
};

export default function StepwiseExperience({
  experiences,
  genEndpoint = "/api/generate-section",
}: Props) {
  const [states, setStates] = useState<ItemState[]>(
    () => experiences.map(() => ({ status: "idle" }))
  );
  const [index, setIndex] = useState(0);

  const total = experiences.length;
  const isLast = index === total - 1;

  const current = useMemo(
    () => ({ entry: experiences[index], state: states[index] }),
    [experiences, states, index]
  );

  const setStateAt = useCallback((i: number, next: Partial<ItemState>) => {
    setStates((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...next };
      return copy;
    });
  }, []);

  const generate = useCallback(async () => {
    const e = experiences[index];
    if (!e) return;

    setStateAt(index, { status: "generating", error: undefined });

    try {
      // Matches your Resume API integration payload
      const body = {
        section: "experience",
        targetRole: e.targetRole,
        resumeText: e.resumeText,
        jobDescriptionText: e.jobDescriptionText,
        itemIndex: index, // optional, safe if server ignores it
      };

      const res = await fetch(genEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Generation failed: ${res.status}`);
      }

      const json = (await res.json()) as { content: string };
      setStateAt(index, { status: "generated", output: json.content });
    } catch (err: any) {
      setStateAt(index, { status: "error", error: err?.message || "Failed" });
    }
  }, [experiences, genEndpoint, index, setStateAt]);

  const regenerate = useCallback(async () => {
    await generate();
  }, [generate]);

  const approveAndNext = useCallback(() => {
    setStateAt(index, { status: "approved" });
    if (!isLast) setIndex((i) => i + 1); // do NOT auto-generate next
  }, [index, isLast, setStateAt]);

  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const skip = useCallback(
    () => setIndex((i) => Math.min(total - 1, i + 1)),
    [total]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Experience Generator</h3>
        <span className="text-xs text-gray-600">
          Step {index + 1} of {total}
        </span>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2">
          <div className="text-sm font-medium">
            {current.entry?.title || `Experience ${index + 1}`}
          </div>
          <div className="text-xs text-gray-500">
            Generate this item. Approve & Next to move forward.
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {current.state?.status === "idle" && (
            <button onClick={generate} className="rounded-md bg-black px-3 py-2 text-white">
              Generate
            </button>
          )}

          {current.state?.status === "generating" && (
            <button disabled className="cursor-wait rounded-md bg-gray-800 px-3 py-2 text-white">
              Generating…
            </button>
          )}

          {current.state?.status === "generated" && (
            <>
              <button onClick={regenerate} className="rounded-md border px-3 py-2">
                Regenerate
              </button>
              <button onClick={approveAndNext} className="rounded-md bg-emerald-600 px-3 py-2 text-white">
                Approve & Next
              </button>
            </>
          )}

          {current.state?.status === "approved" && (
            <span className="text-sm text-emerald-700">
              {isLast ? "All done." : "Approved. Go next and click Generate."}
            </span>
          )}

          {current.state?.status === "error" && (
            <>
              <span className="text-sm text-red-600">{current.state.error}</span>
              <button onClick={regenerate} className="rounded-md border px-3 py-2">
                Try Again
              </button>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <button onClick={back} disabled={index === 0} className="rounded-md border px-3 py-2 disabled:opacity-50">
              Back
            </button>
            <button onClick={skip} disabled={isLast} className="rounded-md border px-3 py-2 disabled:opacity-50">
              Skip
            </button>
          </div>
        </div>

        <div className="rounded-md border bg-white p-3">
          {current.state?.status === "idle" && (
            <div className="text-sm text-gray-600">Ready. Click Generate.</div>
          )}
          {current.state?.status === "generating" && (
            <div className="text-sm text-gray-600">Creating content…</div>
          )}
          {!!current.state?.output && (
            // <pre className="whitespace-pre-wrap text-sm leading-6">
            //   {current.state.output}
            // </pre>
            <Markdown className="text-sm leading-6">
              {current.state.output}
            </Markdown>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {states.map((s, i) => (
          <div
            key={experiences[i].id}
            className={[
              "h-2 rounded",
              i === index
                ? "bg-blue-500"
                : s.status === "approved"
                  ? "bg-emerald-500"
                  : s.status === "generated"
                    ? "bg-gray-500"
                    : "bg-gray-300",
            ].join(" ")}
            title={`Item ${i + 1}: ${s.status}`}
          />
        ))}
      </div>
    </div>
  );
}
