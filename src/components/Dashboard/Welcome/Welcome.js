import React, { Fragment, useMemo } from 'react';
import DashboardFooter from './DashboardFooter';
import Statistics from './Statistics';
import WelcomeBanner from './WelcomeBanner';

const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch (error) {
    return 'Unknown time';
  }
};

const Welcome = () => {
  const activity = useMemo(() => {
    const raw = localStorage.getItem('experimentActivity');
    return raw ? JSON.parse(raw) : [];
  }, []);

  const latestExperiments = activity.slice(0, 5);
  const pastExperiments = activity.slice(5, 15);

  return (
    <Fragment>
      <WelcomeBanner />
      <Statistics />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="font-display text-2xl font-bold text-brand-900">
            Continue Learning
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Jump back into your recent experiments, review past activity, or launch the
            interactive simulation library for quick concept exploration.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <a
              href="/simulation-phy"
              className="rounded-xl bg-indigo-50 p-4 transition hover:bg-indigo-100"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Academic Lab
              </p>
              <p className="mt-2 text-lg font-bold text-brand-900">Physics</p>
              <p className="mt-1 text-sm text-gray-600">Open guided Physics experiments.</p>
            </a>
            <a
              href="/simulation-che"
              className="rounded-xl bg-cyan-50 p-4 transition hover:bg-cyan-100"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Academic Lab
              </p>
              <p className="mt-2 text-lg font-bold text-brand-900">Chemistry</p>
              <p className="mt-1 text-sm text-gray-600">Practice Chemistry workflows.</p>
            </a>
            <a
              href="/interactive-simulations"
              className="rounded-xl bg-purple-50 p-4 transition hover:bg-purple-100"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Library
              </p>
              <p className="mt-2 text-lg font-bold text-brand-900">Interactive Simulations</p>
              <p className="mt-1 text-sm text-gray-600">Explore 44 visual simulations.</p>
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-brand-900 to-dark-brand-900 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">
            Session Summary
          </p>
          <p className="mt-4 font-display text-5xl font-bold">{activity.length}</p>
          <p className="mt-2 text-sm leading-6 text-indigo-100">
            Total experiment openings tracked on this device. Your learning trail updates
            automatically whenever you open an experiment.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm font-body">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-900">
              Experiment Activity Overview
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              A professional view of recently opened and historical experiment sessions.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-brand-900">
            Local activity history
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <h3 className="text-lg font-semibold text-brand-900">
              Latest Opened Experiments
            </h3>
            {latestExperiments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No experiments opened yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {latestExperiments.map((item, index) => (
                  <div
                    key={`${item.id}-${item.openedAt}-${index}`}
                    className="rounded-md bg-white p-3 shadow-sm"
                  >
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.name}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Opened: {formatDateTime(item.openedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-indigo-100 bg-white p-4">
            <h3 className="text-lg font-semibold text-brand-900">Past Experiment Activity</h3>
            {pastExperiments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No past activity available.</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Experiment
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">
                        Opened At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pastExperiments.map((item, index) => (
                      <tr key={`${item.id}-${item.openedAt}-past-${index}`}>
                        <td className="px-3 py-2 text-gray-700">{item.title}</td>
                        <td className="px-3 py-2 text-gray-600">
                          {formatDateTime(item.openedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <DashboardFooter />
    </Fragment>
  );
};

export default Welcome;
