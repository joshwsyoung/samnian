"use client";

import { Fragment, useState } from "react";
import { submitOceanTestAction } from "@/app/ocean-test/actions";

type Question = {
  id: number;
  question: string;
  options: { value: number; label: string }[];
};

export default function OceanTestForm({ questions, next }: { questions: Question[]; next?: string }) {
  const [current, setCurrent] = useState(0);

  const total = questions.length;
  const percent = Math.round((current / total) * 100);
  const allAnswered = current >= total;

  function onAnswer(index: number) {
    if (index === current) {
      setCurrent((c) => Math.min(c + 1, total));
    }
  }

  return (
    <form action={submitOceanTestAction}>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="sm-progress" style={{ marginBottom: 28 }}>
        <div className="sm-progress-bar" style={{ width: `${percent}%` }} />
      </div>

      {questions.map((q, index) => (
        <div key={q.id} style={{ display: index === current ? "block" : "none" }}>
          <p style={{ textAlign: "center", fontSize: "1.05rem", marginBottom: 20 }}>{q.question}</p>
          <div className="sm-chip-group" style={{ justifyContent: "center" }} role="group">
            {q.options.map((opt) => {
              const inputId = `q${q.id}_${opt.value}`;
              return (
                <Fragment key={opt.value}>
                  <label htmlFor={inputId} className="sm-chip-radio">
                    <input
                      type="radio"
                      name={`question_${q.id}`}
                      id={inputId}
                      value={opt.value}
                      required
                      onChange={() => onAnswer(index)}
                    />
                    <span>{opt.label}</span>
                  </label>
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}

      {allAnswered && (
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <button type="submit" className="sm-btn sm-btn-primary">Submit test</button>
        </div>
      )}
    </form>
  );
}
