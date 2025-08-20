import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Turn off if you ever want to allow * */
  stripStars?: boolean;
  /** Provide your own sanitizer if needed */
  sanitize?: (s: string) => string;
};

const defaultSanitize = (s: string) => s.replace(/\*/g, "");

function Textarea({
  className,
  value,
  defaultValue,
  onChange,
  stripStars = true,
  sanitize = defaultSanitize,
  ...props
}: TextareaProps) {
  const clean = (v: unknown) =>
    typeof v === "string" && stripStars ? sanitize(v) : (v as any);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (stripStars) {
      const el = e.currentTarget;
      const original = el.value;
      const cleaned = sanitize(original);

      // Mutate the DOM value so it works even when uncontrolled (defaultValue)
      if (cleaned !== original) {
        const caret = el.selectionStart ?? cleaned.length;
        const delta = original.length - cleaned.length;
        el.value = cleaned;
        try {
          const newPos = Math.max(0, caret - delta);
          el.setSelectionRange(newPos, newPos);
        } catch {
          /* ignore caret issues in older browsers */
        }
      }
    }
    onChange?.(e); // parent still receives the event
  };

  return (
    <textarea
      data-slot="textarea"
      value={clean(value)}
      defaultValue={clean(defaultValue)}
      onChange={handleChange}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
