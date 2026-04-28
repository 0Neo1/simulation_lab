import React from 'react';
import { getExperimentContent } from '../../../data/experimentContent';

const DynamicTheory = ({ simulation }) => {
  const content = getExperimentContent(simulation?.id);

  if (!content) {
    return (
      <div className="px-5 py-6 font-body text-base text-gray-700">
        Theory content for this experiment is being prepared. Please open the
        Simulator tab to begin practising.
      </div>
    );
  }

  const { theory, classLevel, subject, name } = content;

  return (
    <div className="px-5 py-6 font-body text-gray-900">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-900">
          {subject} · {classLevel}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-brand-900">
          {name}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          <span className="font-semibold text-brand-900">Aim:</span> {theory.aim}
        </p>
      </div>

      <section className="mb-6">
        <h3 className="font-display text-lg font-bold text-brand-900">Theory & Principle</h3>
        <div className="mt-2 space-y-3 text-base leading-relaxed text-gray-800">
          {theory.principle.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </section>

      {theory.keyConcepts?.length ? (
        <section className="mb-6">
          <h3 className="font-display text-lg font-bold text-brand-900">Key Concepts</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {theory.keyConcepts.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-indigo-100 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {theory.formulae?.length ? (
        <section className="mb-6">
          <h3 className="font-display text-lg font-bold text-brand-900">Important Formulae</h3>
          <div className="mt-3 space-y-3">
            {theory.formulae.map((f) => (
              <div
                key={f.expression}
                className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-brand-900">{f.label}</p>
                <p className="mt-1 font-mono text-base text-gray-900">{f.expression}</p>
                {f.description ? (
                  <p className="mt-1 text-xs text-gray-700">{f.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {theory.learningOutcomes?.length ? (
        <section className="mb-2">
          <h3 className="font-display text-lg font-bold text-brand-900">Learning Outcomes</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-base text-gray-800">
            {theory.learningOutcomes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default DynamicTheory;
