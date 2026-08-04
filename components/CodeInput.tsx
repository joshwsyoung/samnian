"use client";

import { useRef } from "react";

/** Four single-digit boxes that auto-advance, joined into one hidden `name` field on submit. */
export default function CodeInput({ name, length = 4 }: { name: string; length?: number }) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  function sync() {
    if (hiddenRef.current) {
      hiddenRef.current.value = boxRefs.current.map((b) => b?.value ?? "").join("");
    }
  }

  return (
    <div className="mb-3">
      <label className="form-label">Verification Code</label>
      <div className="d-flex gap-2 code-input">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="form-control text-center"
            required
            autoFocus={i === 0}
            ref={(el) => {
              boxRefs.current[i] = el;
            }}
            onChange={(e) => {
              sync();
              if (e.target.value.length === 1 && i < length - 1) {
                boxRefs.current[i + 1]?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !boxRefs.current[i]?.value && i > 0) {
                boxRefs.current[i - 1]?.focus();
              }
            }}
          />
        ))}
      </div>
      <input type="hidden" name={name} ref={hiddenRef} />
    </div>
  );
}
