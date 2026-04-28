import {
  faBook,
  faDiceD6,
  faFlask,
  faTasks,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  chemistry09,
  chemistry10,
  chemistry11,
  chemistry12,
} from '../../../data/chemistrySimulation';
import DynamicObservation from './DynamicObservation';
import DynamicProcedure from './DynamicProcedure';
import DynamicTheory from './DynamicTheory';
import PlaySimulationTemplate from './PlaySimulationTemplate';

const CheSimulationTemplate = ({ simulationId }) => {
  const [openTab, setOpenTab] = React.useState(1);
  const simulations = [...chemistry12, ...chemistry11, ...chemistry10, ...chemistry09];
  const selectedSimulation =
    simulations.find((item) => item.id === simulationId) || chemistry12[0];
  document.title = selectedSimulation?.name || 'Chemistry Simulation';



  return (
    <section>
      <div className="flex flex-wrap">
        <div className="w-full">
          {/* For mobile view header */}
          <nav className="block md:hidden rounded font-body w-full mb-3">
            <ol className="list-reset flex flex-wrap tracking-wide text-lg">
              <li>
                <NavLink
                  exact
                  to="/simulation-che"
                  className="font-medium text-brand-900"
                >
                  Simulation
                </NavLink>
              </li>
              <li>
                <span className="mx-2 font-bold">&gt;</span>
              </li>
              <li>
                <NavLink
                  exact
                  to="/simulation-che"
                  className="font-medium text-brand-900"
                >
                  Chemistry
                </NavLink>
              </li>
              <li>
                <span className="mx-2 font-bold">&gt;</span>
              </li>
              <li>
                <span className="text-base">
                  {selectedSimulation?.name}
                </span>
              </li>
            </ol>
          </nav>
          {/* Tab Button List */}
          <ul
            className="flex mb-0 list-none flex-wrap pb-4 flex-row"
            role="tablist"
          >
            <li className="mb-2 mr-2 last:mr-0 flex-auto text-center">
              <a
                className={` simulation-template  
									${openTab === 1 ? 'text-white bg-brand-900' : 'text-brand-900 bg-white'}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(1);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <FontAwesomeIcon icon={faBook} className="mr-1" /> Theory
              </a>
            </li>
            <li className="mb-2 mr-2 last:mr-0 flex-auto text-center">
              <a
                className={` simulation-template  
                                ${
                                  openTab === 2
                                    ? 'text-white bg-brand-900'
                                    : 'text-brand-900 bg-white'
                                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(2);
                }}
                data-toggle="tab"
                href="#link2"
                role="tablist"
              >
                <FontAwesomeIcon icon={faTasks} className="mr-1" /> Procedure
              </a>
            </li>
            <li className="mb-2 mr-2 last:mr-0 flex-auto text-center">
              <a
                className={`simulation-template  
                                ${
                                  openTab === 3
                                    ? 'text-white bg-brand-900'
                                    : 'text-brand-900 bg-white'
                                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(3);
                }}
                data-toggle="tab"
                href="#link3"
                role="tablist"
              >
                <FontAwesomeIcon icon={faDiceD6} className="mr-1" /> Simulator
              </a>
            </li>
            <li className="mb-2 mr-2 last:mr-0 flex-auto text-center">
              <a
                className={`simulation-template  
                                ${
                                  openTab === 4
                                    ? 'text-white bg-brand-900'
                                    : 'text-brand-900 bg-white'
                                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(4);
                }}
                data-toggle="tab"
                href="#link4"
                role="tablist"
              >
                <FontAwesomeIcon icon={faFlask} className="mr-1" /> Observation
              </a>
            </li>
          </ul>
          {/* Tab Content Components */}
          <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-lg rounded">
            <div className="flex-auto">
              <div className="tab-content tab-space">
                <div
                  className={`mb-5 ${openTab === 1 ? 'block' : 'hidden'}`}
                  id="link1"
                >
                  <DynamicTheory simulation={selectedSimulation} />
                </div>
                <div className={openTab === 2 ? 'block' : 'hidden'} id="link2">
                  <DynamicProcedure simulation={selectedSimulation} />
                </div>
                <div className={openTab === 3 ? 'block' : 'hidden'} id="link3">
                  <PlaySimulationTemplate
                    simulationURL={`/simulations/${selectedSimulation?.id}.html`}
                  />
                </div>
                <div className={openTab === 4 ? 'block' : 'hidden'} id="link4">
                  <DynamicObservation simulation={selectedSimulation} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheSimulationTemplate;
