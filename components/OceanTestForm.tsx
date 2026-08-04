"use client";

import { Fragment, useState } from "react";
import { submitOceanTestAction } from "@/app/ocean-test/actions";

type Question = {
  id: number;
  question: string;
  options: { value: number; label: string }[];
};

export default function OceanTestForm({ questions }: { questions: Question[] }) {
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
      <div id="progressBarContainer" className="mb-4">
        <div className="progress">
          <div className="progress-bar" role="progressbar" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {questions.map((q, index) => (
        <div
          key={q.id}
          className="question-block mb-5"
          style={{ display: index === current ? "block" : "none" }}
        >
          <p className="lead fw-lighter text-center mb-3">{q.question}</p>
          <div className="btn-group d-flex justify-content-center" role="group">
            {q.options.map((opt) => {
              const inputId = `q${q.id}_${opt.value}`;
              return (
                <Fragment key={opt.value}>
                  <input
                    type="radio"
                    className="btn-check"
                    name={`question_${q.id}`}
                    id={inputId}
                    value={opt.value}
                    required
                    onChange={() => onAnswer(index)}
                  />
                  <label className="btn" htmlFor={inputId}>{opt.label}</label>
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}

      {allAnswered && (
        <div className="mt-4 text-center">
          <button type="submit" className="btn btn-primary">Submit Test</button>
        </div>
      )}
    </form>
  );
}
