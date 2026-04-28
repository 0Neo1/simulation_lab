import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ModalContext } from '../../../App';

function SideBar() {
  const location = useLocation();
  const { pathname } = location;
  const page = pathname.split('/')[1];
  const { sidebarOpen, setSidebarOpen } = useContext(ModalContext);
  const [viewAcademicLabs, setViewAcademicLabs] = useState(true);

  return (
    <div className="lg:w-60">
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-dark-brand-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <div
        id="sidebar"
        className={`absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-60 flex-shrink-0 bg-dark-brand-800 p-4 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex justify-between mb-10 pr-12 sm:pr-0">
          {/* Close button */}
          <button
            className="lg:hidden text-gray-500 hover:text-dark-brand-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* Logo */}
          <NavLink exact to="/" className="block mt-3 mx-auto">
            <span className="nav-link-light text-2xl font-display font-black tracking-wider cursor-pointer hover:text-purple-700">
              ZeroLab
            </span>
          </NavLink>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-body text-sm uppercase text-gray-500 font-medium pl-3">
            Pages
          </h3>
          <ul className="mt-4">
            {/* Dashboard */}
            <li
              className={`px-3 py-2 rounded-sm mb-3 last:mb-0 ${
                page === 'dashboard' && 'bg-dark-brand-900'
              }`}
            >
              <NavLink
                exact
                to="/dashboard"
                className={`block transition duration-150 ${
                  page === 'dashboard'
                    ? 'text-indigo-200 hover:text-gray-200'
                    : 'text-gray-200 hover:text-indigo-200'
                }`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className="flex flex-grow">
                  <svg
                    className="flex-shrink-0 h-6 w-6 mr-4"
                    viewBox="0 0 24 24"
                  >
                    <path
                      className={`fill-current  ${
                        page === 'dashboard'
                          ? 'text-indigo-300'
                          : 'text-dark-brand-400'
                      }`}
                      d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z"
                    />
                    <path
                      className={`fill-current ${
                        page === 'dashboard'
                          ? 'text-indigo-600'
                          : 'text-dark-brand-600'
                      }`}
                      d="M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"
                    />
                    <path
                      className={`fill-current  ${
                        page === 'dashboard'
                          ? 'text-indigo-200'
                          : 'text-dark-brand-400'
                      }`}
                      d="M12 15c-1.654 0-3-1.346-3-3 0-.462.113-.894.3-1.285L6 6l4.714 3.301A2.973 2.973 0 0112 9c1.654 0 3 1.346 3 3s-1.346 3-3 3z"
                    />
                  </svg>
                  <span className="font-body text-base font-medium tracking-wider">
                    Dashboard
                  </span>
                </div>
              </NavLink>
            </li>
          </ul>

          {/* Academic Labs */}
          <h3 className="font-body text-sm uppercase text-gray-500 font-medium pl-3 mt-6">
            Academic Labs
          </h3>
          <ul className="mt-4">
            <li
              className={`px-3 py-2 rounded-sm mb-3 last:mb-0 ${
                (page === 'simulation-phy' || page === 'simulation-che' || page === 'meter-bridge' || page === 'kmno4-titration') && 'bg-dark-brand-900'
              }`}
            >
              <div
                onClick={() => setViewAcademicLabs(!viewAcademicLabs)}
                className="block cursor-pointer text-gray-200 hover:text-indigo-200 transition duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-grow">
                    <svg
                      className="flex-shrink-0 h-6 w-6 mr-4"
                      viewBox="0 0 24 24"
                    >
                      <path
                        className={`fill-current ${
                          (page === 'simulation-phy' || page === 'simulation-che')
                            ? 'text-indigo-300'
                            : 'text-dark-brand-400'
                        }`}
                        d="M13 15l11-7L11.504.136a1 1 0 00-1.019.007L0 7l13 8z"
                      />
                      <path
                        className={`fill-current ${
                          (page === 'simulation-phy' || page === 'simulation-che')
                            ? 'text-indigo-500'
                            : 'text-dark-brand-700'
                        }`}
                        d="M13 15L0 7v9c0 .355.189.685.496.864L13 24v-9z"
                      />
                      <path
                        className={`fill-current ${
                          (page === 'simulation-phy' || page === 'simulation-che')
                            ? 'text-indigo-400'
                            : 'text-dark-brand-600'
                        }`}
                        d="M13 15.047V24l10.573-7.181A.999.999 0 0024 16V8l-11 7.047z"
                      />
                    </svg>
                    <span
                      className={`font-body text-base font-medium tracking-wider block transition duration-150 ${
                        (page === 'simulation-phy' || page === 'simulation-che')
                          ? 'text-indigo-200 hover:text-gray-200'
                          : 'text-gray-200 hover:text-indigo-200'
                      }`}
                    >
                      Subjects
                    </span>
                  </div>
                  {/* Icon */}
                  <div className="flex flex-shrink-0 ml-2">
                    {viewAcademicLabs ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-chevron-up text-gray-400"
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <polyline points="6 15 12 9 18 15" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-chevron-down text-gray-400"
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              {viewAcademicLabs && (
                <ul className="pl-9 mt-3">
                  <li className="mb-2 last:mb-0">
                    <NavLink
                      exact
                      to="/simulation-phy"
                      className={`block text-gray-200 hover:text-indigo-200 transition duration-150 ${
                        (page === 'simulation-phy' || page === 'meter-bridge') &&
                        'text-indigo-300 hover:text-indigo-400'
                      }`}
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      <span className="font-body text-sm font-medium">
                        Physics
                      </span>
                    </NavLink>
                  </li>
                  <li className="mb-2 last:mb-0">
                    <NavLink
                      exact
                      to="/simulation-che"
                      className={`block text-gray-200 hover:text-indigo-200 transition duration-150 ${
                        (page === 'simulation-che' || page === 'kmno4-titration') &&
                        'text-indigo-300 hover:text-indigo-400'
                      }`}
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                      <span className="font-body text-sm font-medium">
                        Chemistry
                      </span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          {/* Interactive Simulations */}
          <h3 className="font-body text-sm uppercase text-gray-500 font-medium pl-3 mt-6">
            Interactive Simulations
          </h3>
          <ul className="mt-4">
            <li
              className={`px-3 py-2 rounded-sm mb-3 last:mb-0 ${
                page === 'interactive-simulations' && 'bg-dark-brand-900'
              }`}
            >
              <NavLink
                exact
                to="/interactive-simulations"
                className={`block transition duration-150 ${
                  page === 'interactive-simulations'
                    ? 'text-indigo-200 hover:text-gray-200'
                    : 'text-gray-200 hover:text-indigo-200'
                }`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className="flex flex-grow">
                  <svg className="flex-shrink-0 h-6 w-6 mr-4" viewBox="0 0 24 24">
                    <path
                      className={`fill-current ${
                        page === 'interactive-simulations'
                          ? 'text-indigo-300'
                          : 'text-dark-brand-400'
                      }`}
                      d="M4 4h16v12H4z"
                    />
                    <path
                      className={`fill-current ${
                        page === 'interactive-simulations'
                          ? 'text-indigo-500'
                          : 'text-dark-brand-600'
                      }`}
                      d="M8 20h8l-1-2H9z"
                    />
                  </svg>
                  <span className="font-body text-base font-medium tracking-wider">
                    Simulation Library
                  </span>
                </div>
              </NavLink>
            </li>
          </ul>

          {/* Simulator */}
          <h3 className="font-body text-sm uppercase text-gray-500 font-medium pl-3 mt-6">
            Simulator
          </h3>
          <ul className="mt-4">
            <li
              className={`px-3 py-2 rounded-sm mb-3 last:mb-0 ${
                page === 'simulator' && 'bg-dark-brand-900'
              }`}
            >
              <NavLink
                exact
                to="/simulator"
                className={`block transition duration-150 ${
                  page === 'simulator'
                    ? 'text-indigo-200 hover:text-gray-200'
                    : 'text-gray-200 hover:text-indigo-200'
                }`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <div className="flex flex-grow">
                  <svg className="flex-shrink-0 h-6 w-6 mr-4" viewBox="0 0 24 24">
                    <path
                      className={`fill-current ${
                        page === 'simulator' ? 'text-indigo-300' : 'text-dark-brand-400'
                      }`}
                      d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6z"
                    />
                    <path
                      className={`fill-current ${
                        page === 'simulator' ? 'text-indigo-500' : 'text-dark-brand-600'
                      }`}
                      d="M8 11h8v2H8zm2-4h4v2h-4zm0 8h4v2h-4z"
                    />
                  </svg>
                  <span className="font-body text-base font-medium tracking-wider">
                    Prompt Simulator
                  </span>
                </div>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
