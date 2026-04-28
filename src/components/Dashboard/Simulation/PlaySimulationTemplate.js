import React, { useEffect, useRef, useState } from 'react';

const PlaySimulationTemplate = ({ simulationURL }) => {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setLoadError(false);
    const timeout = setTimeout(() => {
      // If iframe never fires onLoad (e.g. blocked), allow user to continue
      setLoaded(true);
    }, 4500);
    return () => clearTimeout(timeout);
  }, [simulationURL]);

  const handleOpenInNewTab = () => {
    if (simulationURL) window.open(simulationURL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="px-4 py-4 font-body">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-brand-900">
            Interactive Lab Simulation
          </h3>
          <p className="text-xs text-gray-600">
            Use the controls in the simulation to perform the experiment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loaded ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Loading...
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              Ready
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-brand-900 hover:text-brand-900"
          >
            Open Fullscreen
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-lg">
        {!loaded ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/95 text-white">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent"></div>
            <p className="mt-4 text-sm font-semibold">Loading simulation...</p>
          </div>
        ) : null}

        {loadError ? (
          <div className="flex h-[560px] w-full items-center justify-center bg-gray-900 text-center text-white">
            <div>
              <p className="font-display text-lg font-bold text-red-300">
                Could not load this simulation
              </p>
              <p className="mt-2 text-sm text-gray-300">
                Please refresh the page or open in a new tab.
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={simulationURL}
            title="Interactive Lab Simulation"
            className="block h-[640px] w-full border-0 bg-gray-900 sm:h-[720px]"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(true);
              setLoadError(true);
            }}
            allow="fullscreen; gyroscope; accelerometer"
          />
        )}
      </div>
    </div>
  );
};

export default PlaySimulationTemplate;
