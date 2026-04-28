import React, { useEffect, useMemo, useState } from 'react';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const MODEL = process.env.REACT_APP_GEMINI_MODEL || 'gemini-3.1-pro-preview';
const STORAGE_KEY = 'savedPromptSimulations';

const examples = [
  'Show projectile motion with angle and speed sliders',
  'Create an acid-base titration simulation with color change',
  'Show how light refracts through a glass block',
  'Simulate Ohm law with voltage, resistance, and current',
];

const cleanGeneratedHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/^```html/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();
};

const buildPrompt = (topic) => `
Create a complete, self-contained interactive educational lab simulation as a single HTML document.

Topic from the student: "${topic}"

Requirements:
- Return ONLY the HTML document. Do not include markdown fences or explanations.
- Use inline CSS and vanilla JavaScript only. Do not load external libraries, fonts, scripts, or images.
- The simulation must be interactive with controls such as sliders, buttons, toggles, or draggable elements.
- Include an animated visual area using Canvas, SVG, or CSS animation.
- Include concise labels, a short concept explanation, live changing values, and a reset button.
- Make it visually polished, responsive, and suitable for a science learning dashboard.
- Keep all text in simple English.
- Do not mention any AI model, API, or generation system.
`;

const formatTimestamp = (iso) => {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return '';
  }
};

const truncate = (text, length = 90) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
};

const loadSavedSimulations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const persistSavedSimulations = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    /* ignore quota errors */
  }
};

const PromptSimulator = () => {
  const [prompt, setPrompt] = useState('');
  const [latestHtml, setLatestHtml] = useState('');
  const [latestPrompt, setLatestPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [savedSimulations, setSavedSimulations] = useState(() => loadSavedSimulations());
  const [activeSavedId, setActiveSavedId] = useState(null);

  const canGenerate = useMemo(
    () => prompt.trim().length > 4 && !isGenerating,
    [prompt, isGenerating]
  );

  useEffect(() => {
    persistSavedSimulations(savedSimulations);
  }, [savedSimulations]);

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (!canGenerate) return;

    if (!API_KEY) {
      setError(
        'Simulation service is not configured. Please contact the administrator.'
      );
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: buildPrompt(prompt.trim()) }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Unable to generate the simulation right now.');
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const html = cleanGeneratedHtml(generatedText);

      if (!html || !html.toLowerCase().includes('<html')) {
        throw new Error('The generated simulation was incomplete. Try a clearer prompt.');
      }

      const newEntry = {
        id: `sim-${Date.now()}`,
        title: prompt.trim().slice(0, 80),
        prompt: prompt.trim(),
        html,
        createdAt: new Date().toISOString(),
      };

      setSavedSimulations((prev) => [newEntry, ...prev].slice(0, 25));
      setLatestHtml(html);
      setLatestPrompt(prompt.trim());
      setActiveSavedId(newEntry.id);
    } catch (err) {
      setError(err.message || 'Something went wrong while generating the simulation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenSaved = (item) => {
    setLatestHtml(item.html);
    setLatestPrompt(item.prompt);
    setActiveSavedId(item.id);
  };

  const handleDeleteSaved = (id) => {
    setSavedSimulations((prev) => prev.filter((item) => item.id !== id));
    if (activeSavedId === id) {
      setLatestHtml('');
      setLatestPrompt('');
      setActiveSavedId(null);
    }
  };

  const handleDownload = () => {
    if (!latestHtml) return;
    const blob = new Blob([latestHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (latestPrompt || 'simulation')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
    link.download = `${safeName || 'simulation'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    setSavedSimulations([]);
    setLatestHtml('');
    setLatestPrompt('');
    setActiveSavedId(null);
  };

  return (
    <section className="font-body">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-dark-brand-900 via-brand-900 to-indigo-700 p-6 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">
          Lab Animation Builder
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
          Generate an interactive science simulation from a simple prompt
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-indigo-50">
          Describe any science topic in simple English and create a visual, animated,
          hands-on lab simulation that students can interact with instantly. Every
          simulation you generate is saved automatically so you can revisit it later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm xl:col-span-5">
          <form onSubmit={handleGenerate}>
            <label
              htmlFor="simulationPrompt"
              className="block text-sm font-semibold uppercase tracking-wide text-gray-600"
            >
              Simulation Prompt
            </label>
            <textarea
              id="simulationPrompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              className="mt-3 w-full rounded-xl border border-gray-300 p-4 text-base text-gray-800 shadow-sm focus:border-brand-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Example: Create an interactive simulation showing how a pendulum changes with length and gravity."
            />

            {error ? (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canGenerate}
              className={`mt-4 w-full rounded-xl px-5 py-3 text-base font-bold text-white shadow-sm transition ${
                canGenerate
                  ? 'bg-brand-900 hover:bg-deep-purple-accent-700'
                  : 'cursor-not-allowed bg-gray-400'
              }`}
            >
              {isGenerating ? 'Generating Simulation...' : 'Generate Simulation'}
            </button>
          </form>

          {/* Generated simulation preview directly below the generate button */}
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-inner">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
              <div>
                <h2 className="font-display text-lg font-bold text-brand-900">
                  Live Generated Simulation
                </h2>
                {latestPrompt ? (
                  <p className="text-xs text-gray-600">
                    Prompt: <span className="font-medium">{truncate(latestPrompt, 70)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Your generated simulation will appear here and is saved automatically.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Sandboxed
                </span>
                {latestHtml ? (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-full bg-brand-900 px-3 py-1 text-xs font-semibold text-white hover:bg-deep-purple-accent-700"
                  >
                    Download HTML
                  </button>
                ) : null}
              </div>
            </div>
            <iframe
              title="Generated Lab Simulation"
              srcDoc={
                latestHtml ||
                `<!doctype html><html><body style="margin:0;display:grid;place-items:center;height:100%;font-family:Arial;background:#0f172a;color:#cbd5e1;text-align:center;padding:24px;">
                  <div>
                    <div style="font-size:48px;line-height:1;margin-bottom:12px;">&#9678;</div>
                    <h2 style="margin:0 0 8px;color:#f8fafc;">No simulation yet</h2>
                    <p style="max-width:520px;margin:0 auto;line-height:1.6;">Type a prompt above and click Generate Simulation. Your interactive animation will appear here and be saved automatically.</p>
                  </div>
                </body></html>`
              }
              sandbox="allow-scripts"
              className="h-[520px] w-full rounded-xl border border-gray-200 bg-gray-900"
            />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              Prompt Ideas
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {examples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  className="block w-full rounded-lg bg-indigo-50 px-4 py-3 text-left text-sm font-medium text-brand-900 transition hover:bg-indigo-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-brand-900">
                Saved Simulations
              </h2>
              <p className="text-sm text-gray-600">
                {savedSimulations.length > 0
                  ? `${savedSimulations.length} saved simulation${
                      savedSimulations.length > 1 ? 's' : ''
                    }. Click any item to load it in the preview.`
                  : 'Generated simulations will be listed here automatically.'}
              </p>
            </div>
            {savedSimulations.length > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                Clear all
              </button>
            ) : null}
          </div>

          {savedSimulations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-sm text-indigo-700">
              No saved simulations yet. Generate one to start your library.
            </div>
          ) : (
            <ul className="space-y-3">
              {savedSimulations.map((item) => {
                const isActive = item.id === activeSavedId;
                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-4 transition ${
                      isActive
                        ? 'border-brand-900 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {formatTimestamp(item.createdAt)}
                        </p>
                        <p className="mt-1 font-display text-base font-bold text-brand-900">
                          {truncate(item.title || 'Untitled simulation', 80)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {truncate(item.prompt, 140)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSaved(item)}
                          className="rounded-lg bg-brand-900 px-3 py-2 text-xs font-semibold text-white hover:bg-deep-purple-accent-700"
                        >
                          {isActive ? 'Showing' : 'Open'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(item.id)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-red-300 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default PromptSimulator;
