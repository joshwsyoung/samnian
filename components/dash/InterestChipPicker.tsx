"use client";

import { useRef } from "react";

/** Multi-select chips (checkboxes under the hood) that mirror their selection into one hidden field. */
export default function InterestChipPicker({
  interests,
  defaultSelected,
  fieldName,
}: {
  interests: { id: number; name: string }[];
  defaultSelected: string[];
  fieldName: string;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function sync() {
    if (!containerRef.current || !hiddenRef.current) return;
    const checked = Array.from(
      containerRef.current.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked")
    ).map((el) => el.value);
    hiddenRef.current.value = checked.join(",");
  }

  return (
    <div>
      <div className="sm-chip-group" ref={containerRef} onChange={sync}>
        {interests.map((interest) => (
          <label key={interest.id} className="sm-chip-check">
            <input
              type="checkbox"
              value={interest.name}
              defaultChecked={defaultSelected.includes(interest.name)}
            />
            <span>{interest.name}</span>
          </label>
        ))}
      </div>
      <input type="hidden" name={fieldName} ref={hiddenRef} defaultValue={defaultSelected.join(",")} />
    </div>
  );
}
