import { faChartLine, faClipboardCheck, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Fade from 'react-reveal/Fade';
import { useReactToPrint } from 'react-to-print';
import { getExperimentContent } from '../../../data/experimentContent';

const STORAGE_PREFIX = 'experimentObservations:';

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return NaN;
  const n = parseFloat(value);
  return Number.isNaN(n) ? NaN : n;
};

const formatNumber = (n, digits = 4) => {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '';
  if (Math.abs(n) > 0 && (Math.abs(n) < 1e-3 || Math.abs(n) > 1e6)) {
    return n.toExponential(3);
  }
  return Number(n.toFixed(digits)).toString();
};

const computeRowDerived = (row, columns) => {
  const next = { ...row };

  if (columns.find((c) => c.key === 'X' && c.label.includes('R(100-l)/l'))) {
    const R = toNumber(row.R);
    const l = toNumber(row.l);
    if (!Number.isNaN(R) && !Number.isNaN(l) && l !== 0) {
      next.X = formatNumber((R * (100 - l)) / l);
    }
  }

  if (columns.find((c) => c.key === 'f' && (c.formula || '').includes('uv'))) {
    const u = toNumber(row.u);
    const v = toNumber(row.v);
    if (!Number.isNaN(u) && !Number.isNaN(v) && u + v !== 0) {
      next.f = formatNumber((u * v) / (u + v));
    }
  }

  if (columns.find((c) => c.key === 'ratio' && (c.label || '').includes('l₁ / l₂'))) {
    const l1 = toNumber(row.l1);
    const l2 = toNumber(row.l2);
    if (!Number.isNaN(l1) && !Number.isNaN(l2) && l2 !== 0) {
      next.ratio = formatNumber(l1 / l2);
    }
  }

  if (columns.find((c) => c.key === 'R' && (c.label || '').includes('V / I'))) {
    const V = toNumber(row.V);
    const I = toNumber(row.I);
    if (!Number.isNaN(V) && !Number.isNaN(I) && I !== 0) {
      next.R = formatNumber(V / I);
    }
  }

  if (columns.find((c) => c.key === 'R' && (c.label || '').includes('l²/(6h)'))) {
    const h = toNumber(row.h);
    const l = toNumber(row.l);
    if (!Number.isNaN(h) && !Number.isNaN(l) && h !== 0) {
      next.R = formatNumber((l * l) / (6 * h) + h / 2);
    }
  }

  if (columns.find((c) => c.key === 'ratio' && (c.label || '').includes('M / ΔL'))) {
    const M = toNumber(row.M);
    const dL = toNumber(row.dL);
    if (!Number.isNaN(M) && !Number.isNaN(dL) && dL !== 0) {
      next.ratio = formatNumber(M / dL);
    }
  }

  if (columns.find((c) => c.key === 'k' && (c.label || '').includes('F/x'))) {
    const F = toNumber(row.F);
    const x = toNumber(row.x);
    if (!Number.isNaN(F) && !Number.isNaN(x) && x !== 0) {
      next.k = formatNumber((F * 100) / x); // x in cm -> N/m
    }
  }

  if (columns.find((c) => c.key === 'f' && (c.label || '').includes('Frequency'))) {
    const T = toNumber(row.T);
    const L = toNumber(row.L);
    const p = toNumber(row.p);
    const muInput = toNumber(row.__mu);
    if (!Number.isNaN(T) && !Number.isNaN(L) && !Number.isNaN(p) && !Number.isNaN(muInput) && L > 0 && muInput > 0) {
      const f = (p / (2 * L)) * Math.sqrt(T / muInput);
      next.f = formatNumber(f);
    }
  }

  if (columns.find((c) => c.key === 'a' && (c.label || '').includes('2s/t²'))) {
    const s = toNumber(row.s);
    const t = toNumber(row.t);
    if (!Number.isNaN(s) && !Number.isNaN(t) && t !== 0) {
      next.a = formatNumber((2 * s) / (t * t));
    }
  }

  if (columns.find((c) => c.key === 'V_KMnO4' && (c.label || '').includes('used'))) {
    const init = toNumber(row.init);
    const final = toNumber(row.final);
    if (!Number.isNaN(init) && !Number.isNaN(final)) {
      next.V_KMnO4 = formatNumber(final - init);
    }
  }

  if (columns.find((c) => c.key === 'V_HCl' && (c.label || '').includes('used'))) {
    const init = toNumber(row.init);
    const final = toNumber(row.final);
    if (!Number.isNaN(init) && !Number.isNaN(final)) {
      next.V_HCl = formatNumber(final - init);
    }
  }

  if (columns.find((c) => c.key === 'V_NaOH' && (c.label || '').includes('used'))) {
    const init = toNumber(row.init);
    const final = toNumber(row.final);
    if (!Number.isNaN(init) && !Number.isNaN(final)) {
      next.V_NaOH = formatNumber(final - init);
    }
  }

  if (columns.find((c) => c.key === 'Rf')) {
    const dc = toNumber(row.d_c);
    const ds = toNumber(row.d_s);
    if (!Number.isNaN(dc) && !Number.isNaN(ds) && ds !== 0) {
      next.Rf = formatNumber(dc / ds);
    }
  }

  if (columns.find((c) => c.key === 'yield')) {
    const a = toNumber(row.m_impure);
    const b = toNumber(row.m_pure);
    if (!Number.isNaN(a) && !Number.isNaN(b) && a !== 0) {
      next.yield = formatNumber((b / a) * 100, 2);
    }
  }

  if (columns.find((c) => c.key === 'm' && (c.label || '').includes('v/u'))) {
    const u = toNumber(row.u);
    const v = toNumber(row.v);
    if (!Number.isNaN(u) && !Number.isNaN(v) && u !== 0) {
      next.m = formatNumber(v / u);
    }
  }

  return next;
};

const computeMetrics = (rows, metrics, columns, metricInputs) => {
  if (!metrics || metrics.length === 0) return [];

  const numericRows = rows.map((r) => {
    const out = {};
    Object.keys(r).forEach((k) => {
      out[k] = toNumber(r[k]);
    });
    return out;
  });

  const meanOf = (key) => {
    const valid = numericRows.map((r) => r[key]).filter((v) => !Number.isNaN(v));
    if (valid.length === 0) return NaN;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  };

  return metrics.map((m) => {
    if (m.isInput) {
      return {
        ...m,
        value: metricInputs[m.key] ?? '',
      };
    }
    let value = NaN;

    if (m.key === 'X_avg') value = meanOf('X');
    else if (m.key === 'f_mean') value = meanOf('f');
    else if (m.key === 'k_mean') value = meanOf('k');
    else if (m.key === 'R_mean') value = meanOf('R');
    else if (m.key === 'V_avg') {
      // pick whichever volume column exists
      const target = ['V_KMnO4', 'V_HCl', 'V_NaOH'].find((k) =>
        columns.find((c) => c.key === k)
      );
      if (target) value = meanOf(target);
    } else if (m.key === 'd_mean') value = meanOf('d');
    else if (m.key === 'v_mean') value = meanOf('v');
    else if (m.key === 'ratio_mean') value = meanOf('ratio');
    else if (m.key === 'V') {
      const l = meanOf('l');
      const b = meanOf('b');
      const h = meanOf('h');
      if (![l, b, h].some(Number.isNaN)) value = l * b * h;
    } else if (m.key === 'A' && m.label.includes('Surface')) {
      const l = meanOf('l');
      const b = meanOf('b');
      const h = meanOf('h');
      if (![l, b, h].some(Number.isNaN)) value = 2 * (l * b + b * h + h * l);
    } else if (m.key === 'A' && m.label.includes('Cross')) {
      const dMean = meanOf('d');
      if (!Number.isNaN(dMean)) value = (Math.PI * dMean * dMean) / 4;
    } else if (m.key === 'P') {
      const fMean = meanOf('f');
      if (!Number.isNaN(fMean) && fMean !== 0) value = 100 / fMean;
    } else if (m.key === 'rho') {
      const X = meanOf('X');
      const dInput = toNumber(metricInputs.d);
      const Linput = toNumber(metricInputs.L);
      if (![X, dInput, Linput].some(Number.isNaN) && Linput !== 0) {
        const r_m = dInput / 2 / 1000; // mm -> m
        const L_m = Linput / 100; // cm -> m
        value = (X * Math.PI * r_m * r_m) / L_m;
      }
    } else if (m.key === 'Y') {
      const ratio = meanOf('ratio'); // M / ΔL
      const Linput = toNumber(metricInputs.L);
      const rInput = toNumber(metricInputs.r);
      if (![ratio, Linput, rInput].some(Number.isNaN) && rInput !== 0) {
        // ratio = M / ΔL  (kg/mm)
        const ratioSI = ratio * 1000; // kg/m
        const r_m = rInput / 1000; // mm -> m
        value = (ratioSI * 9.8 * Linput) / (Math.PI * r_m * r_m);
      }
    } else if (m.key === 'M_Fe') {
      const VKM = meanOf('V_KMnO4');
      const VFe = meanOf('V_Fe');
      const M_KM = toNumber(metricInputs.M_KMnO4);
      if (![VKM, VFe, M_KM].some(Number.isNaN) && VFe !== 0) {
        value = (5 * M_KM * VKM) / VFe;
      }
    } else if (m.key === 'g_Fe_per_L') {
      const VKM = meanOf('V_KMnO4');
      const VFe = meanOf('V_Fe');
      const M_KM = toNumber(metricInputs.M_KMnO4);
      if (![VKM, VFe, M_KM].some(Number.isNaN) && VFe !== 0) {
        const M_Fe = (5 * M_KM * VKM) / VFe;
        value = M_Fe * 55.85;
      }
    } else if (m.key === 'M_HCl') {
      const VH = meanOf('V_HCl');
      const VN = meanOf('V_Na2CO3');
      if (![VH, VN].some(Number.isNaN) && VH !== 0) {
        value = (2 * 0.1 * VN) / VH;
      }
    } else if (m.key === 'M_NaOH') {
      const VN = meanOf('V_NaOH');
      const VOx = meanOf('V_Ox');
      if (![VN, VOx].some(Number.isNaN) && VN !== 0) {
        value = (2 * 0.5 * VOx) / VN;
      }
    } else if (m.key === 'm') {
      const F = meanOf('F');
      const a = meanOf('a');
      if (![F, a].some(Number.isNaN) && a !== 0) value = F / a;
    }

    return { ...m, value: formatNumber(value) };
  });
};

const DynamicObservation = ({ simulation }) => {
  const { auth } = useSelector((state) => state);
  const content = getExperimentContent(simulation?.id);

  const storageKey = `${STORAGE_PREFIX}${simulation?.id || 'unknown'}`;

  const [showModal, setShowModal] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const initialState = useMemo(() => {
    if (!content) {
      return { rows: [], metricInputs: {} };
    }
    const rows = Array.from({ length: content.observation.rows }, () => {
      const row = {};
      content.observation.columns.forEach((c) => {
        row[c.key] = '';
      });
      return row;
    });
    const metricInputs = {};
    (content.observation.metrics || []).forEach((m) => {
      if (m.isInput) metricInputs[m.key] = '';
    });
    return { rows, metricInputs };
  }, [content]);

  const [rows, setRows] = useState(initialState.rows);
  const [metricInputs, setMetricInputs] = useState(initialState.metricInputs);
  const [savedAt, setSavedAt] = useState(null);

  // Restore saved progress when the experiment changes
  useEffect(() => {
    setRows(initialState.rows);
    setMetricInputs(initialState.metricInputs);
    setSavedAt(null);

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rows?.length === initialState.rows.length) {
          setRows(parsed.rows);
        }
        if (parsed?.metricInputs) {
          setMetricInputs((prev) => ({ ...prev, ...parsed.metricInputs }));
        }
        if (parsed?.savedAt) setSavedAt(parsed.savedAt);
      }
    } catch (err) {
      /* ignore corrupt storage */
    }
  }, [storageKey, initialState]);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  if (!content) {
    return (
      <div className="px-5 py-6 font-body text-base text-gray-700">
        Observation table for this experiment is being prepared.
      </div>
    );
  }

  document.title = `${content.name} - ${auth?.user?.name || 'Student'}`;

  const { observation, name } = content;

  const handleCellChange = (rowIdx, key, value) => {
    setRows((prev) => {
      const next = prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const updated = { ...r, [key]: value };
        return computeRowDerived(updated, observation.columns);
      });
      return next;
    });
  };

  // For the Melde experiment we also need linear mass density input on each row
  const handleMuChange = (value) => {
    setMetricInputs((prev) => ({ ...prev, mu: value }));
    setRows((prev) =>
      prev.map((r) => computeRowDerived({ ...r, __mu: value }, observation.columns))
    );
  };

  const handleMetricInputChange = (key, value) => {
    setMetricInputs((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'mu') handleMuChange(value);
      return next;
    });
  };

  const handleSave = (event) => {
    event?.preventDefault?.();
    try {
      const payload = {
        rows,
        metricInputs,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedAt(payload.savedAt);
      setShowModal(true);
    } catch (err) {
      setShowModal(true);
    }
  };

  const handleReset = () => {
    setRows(initialState.rows);
    setMetricInputs(initialState.metricInputs);
    localStorage.removeItem(storageKey);
    setSavedAt(null);
  };

  const computedMetrics = computeMetrics(rows, observation.metrics, observation.columns, metricInputs);

  return (
    <React.Fragment>
      <form onSubmit={handleSave}>
        <div
          ref={componentRef}
          className="px-5 py-6 font-body text-gray-900"
        >
          <div className="mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-cyan-50 p-5">
            <h2 className="font-display text-2xl font-bold text-brand-900">
              Observation: {name}
            </h2>
            <p className="mt-2 text-sm text-gray-700">{observation.intro}</p>
            {savedAt ? (
              <p className="mt-2 text-xs font-semibold text-green-700">
                Saved at {new Date(savedAt).toLocaleString()}. Your data is restored automatically.
              </p>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full table-auto text-left text-sm">
              <thead className="bg-indigo-50 text-brand-900">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-3 text-center font-display text-sm font-bold">
                    #
                  </th>
                  {observation.columns.map((col) => (
                    <th
                      key={col.key}
                      className="border-b border-gray-200 px-3 py-3 font-display text-sm font-bold"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="even:bg-gray-50">
                    <td className="border-b border-gray-100 px-3 py-2 text-center font-bold text-brand-900">
                      {rIdx + 1}
                    </td>
                    {observation.columns.map((col) => (
                      <td key={col.key} className="border-b border-gray-100 px-3 py-2">
                        <input
                          type={col.isText ? 'text' : 'number'}
                          step="any"
                          name={`${col.key}-${rIdx}`}
                          value={row[col.key] ?? ''}
                          placeholder={col.placeholder}
                          onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {observation.metrics?.length ? (
            <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
              <h3 className="font-display text-lg font-bold text-brand-900">
                Computed Metrics & Result
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {computedMetrics.map((m) => (
                  <div
                    key={m.key}
                    className="rounded-xl border border-white bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {m.label}
                    </p>
                    {m.isInput ? (
                      <input
                        type="number"
                        step="any"
                        value={metricInputs[m.key] ?? ''}
                        placeholder={m.placeholder || ''}
                        onChange={(e) => handleMetricInputChange(m.key, e.target.value)}
                        className="mt-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-base font-semibold text-brand-900 focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      />
                    ) : (
                      <p className="mt-1 font-display text-xl font-bold text-brand-900">
                        {m.value !== '' && m.value !== undefined ? m.value : '—'}{' '}
                        <span className="text-sm font-medium text-gray-600">{m.unit}</span>
                      </p>
                    )}
                    {m.formula ? (
                      <p className="mt-1 text-xs text-gray-500">{m.formula}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Result
                </p>
                <p className="mt-1 text-base font-medium text-gray-800">
                  {observation.resultStatement}
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 px-5 pb-8">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-red-300 hover:text-red-700"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowChart(true)}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-indigo-100"
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Summary
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-900 px-5 py-2 text-sm font-bold text-white hover:bg-deep-purple-accent-700"
          >
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            Save Progress
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-dark-brand-900 px-5 py-2 text-sm font-bold text-white hover:bg-brand-900"
          >
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-2" />
            Download Report
          </button>
        </div>
      </form>

      {showModal ? (
        <div>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowModal(false)}
          >
            <div className="relative mx-auto my-6 w-auto max-w-sm">
              <div className="m-auto w-64 rounded-2xl bg-white p-6 shadow-2xl sm:w-96">
                <Fade top>
                  <div className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="m-auto mt-2 h-12 w-12 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="mt-3 px-4 font-body text-base text-brand-900">
                      Your observation data has been saved on this device.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="mt-4 w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-deep-purple-accent-700"
                    >
                      Continue
                    </button>
                  </div>
                </Fade>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-30" />
        </div>
      ) : null}

      {showChart ? (
        <div>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowChart(false)}
          >
            <div className="relative mx-auto my-6 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="font-display text-xl font-bold text-brand-900">
                Experiment Summary
              </h3>
              <div className="mt-4 space-y-2">
                {computedMetrics.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700">{m.label}</span>
                    <span className="font-display font-bold text-brand-900">
                      {m.isInput ? metricInputs[m.key] : m.value || '—'}{' '}
                      <span className="text-xs text-gray-500">{m.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowChart(false)}
                className="mt-5 w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-deep-purple-accent-700"
              >
                Close
              </button>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black opacity-30" />
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default DynamicObservation;
