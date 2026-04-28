import React from 'react';

const InteractiveSimulations = () => {
  return (
    <section className="font-body">
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-dark-brand-900 via-brand-900 to-indigo-700 p-6 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">
          Interactive Simulations
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
          Explore 40+ hands-on Physics and Chemistry simulations
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-indigo-50">
          Use the embedded simulation library to experiment with motion, waves, optics,
          electricity, atomic structure, bonding, pH, titration, gas laws, and more.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
        <iframe
          title="Interactive Science Simulations"
          src="/interactive-simulations/index.html"
          className="h-screen min-h-[760px] w-full rounded-xl border-0"
        />
      </div>
    </section>
  );
};

export default InteractiveSimulations;
