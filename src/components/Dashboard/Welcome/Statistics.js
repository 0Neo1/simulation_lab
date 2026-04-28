import React from 'react';

const stats = [
  { label: 'Academic Subjects', value: '2', detail: 'Physics and Chemistry' },
  { label: 'Interactive Simulations', value: '44', detail: 'Standalone visual labs' },
  { label: 'Academic Experiments', value: '28', detail: 'Class 9-12 workflows' },
  { label: 'Learning Modes', value: '4', detail: 'Theory, procedure, simulator, observation' },
];

const Statistics = () => {
  return (
    <section className="my-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
          >
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-gray-500">
              {item.label}
            </p>
            <p className="mt-3 font-display text-4xl font-bold text-brand-900">
              {item.value}
            </p>
            <p className="mt-2 font-body text-sm text-gray-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Statistics;
