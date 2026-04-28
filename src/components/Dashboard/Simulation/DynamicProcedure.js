import React from 'react';
import { getExperimentContent } from '../../../data/experimentContent';

const StepList = ({ title, steps, accent }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <section className="mb-6">
      <h3 className={`font-display text-lg font-bold ${accent || 'text-brand-900'}`}>{title}</h3>
      <ol className="mt-3 space-y-2">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-base leading-relaxed text-gray-800 shadow-sm"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
              {idx + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
};

const DynamicProcedure = ({ simulation }) => {
  const content = getExperimentContent(simulation?.id);

  if (!content) {
    return (
      <div className="px-5 py-6 font-body text-base text-gray-700">
        Procedure content for this experiment is being prepared.
      </div>
    );
  }

  const { procedure, name } = content;

  return (
    <div className="px-5 py-6 font-body text-gray-900">
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-cyan-50 to-indigo-50 p-5">
        <h2 className="font-display text-2xl font-bold text-brand-900">
          Procedure: {name}
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Follow the real-lab procedure to understand the workflow, then practise
          the same steps inside the simulator before moving to the observation tab.
        </p>
      </div>

      {procedure.apparatus?.length ? (
        <section className="mb-6">
          <h3 className="font-display text-lg font-bold text-brand-900">Apparatus & Materials</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {procedure.apparatus.map((item) => (
              <span
                key={item}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-brand-900"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <StepList title="Real Lab Procedure" steps={procedure.realLab} />
      <StepList title="Simulator Procedure" steps={procedure.simulator} accent="text-indigo-700" />

      {procedure.safety?.length ? (
        <section className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-display text-lg font-bold text-amber-800">Safety & Precautions</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-900">
            {procedure.safety.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default DynamicProcedure;
