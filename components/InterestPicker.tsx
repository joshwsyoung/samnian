"use client";

import { useState } from "react";

export default function InterestPicker({
  interests,
  defaultSelected,
  fieldName,
}: {
  interests: { id: number; name: string }[];
  defaultSelected: string[];
  fieldName: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div>
      <div id="interest-cards">
        {interests.map((interest) => (
          <div
            key={interest.id}
            className={`card-option ${selected.has(interest.name) ? "selected" : ""}`}
            onClick={() => toggle(interest.name)}
            role="button"
          >
            {interest.name}
          </div>
        ))}
      </div>
      <input type="hidden" name={fieldName} value={Array.from(selected).join(",")} />
    </div>
  );
}
