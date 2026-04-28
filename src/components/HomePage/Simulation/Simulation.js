import React, { useState } from 'react';
import chemistry from '../../../assets/images/icon/chemistry.png';
import physics from '../../../assets/images/icon/physics.png';
import useWindowDimensions from '../../../utils/useWindowDimensions';
import ViewAllSimulation from './ViewAllSimulation';

const Simulation = () => {
  const [viewSimulation, setViewSimulation] = useState(false);
  const [selectTab, setSelectTab] = useState(0);
  const { width } = useWindowDimensions();

  let getHeight =
    width > 1280
      ? 2990
      : width > 1024
      ? 3200
      : width > 768
      ? 4200
      : width > 640
      ? 4400
      : width > 430
      ? 5000
      : 5200;

  function handleScroll() {
    window.scroll({
      top: getHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  return (
    <div>
      <section
        className="min-h-auto md:min-h-full bg-cover bg-no-repeat bg-center"
        id="simulation"
        style={{
          backgroundImage: `url(https://i.ibb.co/NtJMXt8/features-3.png)`,
        }}
      >
        <div className="px-8 pb-12 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:pt-16 lg:pb-10">
          <div className="flex flex-col items-center text-center">
            <div className="max-w-4xl mb-10">
              <h2 className="mb-5 font-display text-3xl font-extrabold tracking-wide text-dark-brand-900 leading-relaxed md:text-5xl md:leading-tight">
                Curiosity becomes mastery when you can experiment for yourself
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-700 font-body md:text-2xl">
                ZeroLab helps learners move beyond watching and guessing. Explore practical
                science through repeatable simulations, guided lab activities, and subject-wise
                experiments designed to make complex ideas feel clear.
              </p>
            </div>
            <div className="w-full flex flex-wrap justify-center my-5">
              {/* Simulation Buttons */}
              <div className="grid w-full max-w-5xl gap-4 sm:gap-8 row-gap-8 sm:grid-cols-2 font-body">
                  <div
                    className={`shadow-3xl m-3 cursor-pointer rounded-xl ${
                      selectTab === 1 ? 'bg-indigo-50' : 'bg-brand-accent-100'
                    }`}
                    onClick={() => {
                      setSelectTab(1);
                      setViewSimulation(true);
                      handleScroll();
                    }}
                  >
                    <div className="h-full p-4 sm:p-8 mx-auto text-center hover:bg-indigo-50 rounded-xl">
                      <img
                        className="object-cover w-36 h-36 mx-auto rounded sm:h-40 xl:h-48 sm:w-40 xl:w-48"
                        src={physics}
                        alt="Science-logo"
                      />
                      <h6 className="mt-6 font-bold leading-5 text-3xl text-brand-900">
                        Physics
                      </h6>
                    </div>
                  </div>
                  <div
                    className={`shadow-3xl m-3 cursor-pointer rounded-xl ${
                      selectTab === 2 ? 'bg-indigo-50' : 'bg-brand-accent-100'
                    }`}
                    onClick={() => {
                      setSelectTab(2);
                      setViewSimulation(true);
                      handleScroll();
                    }}
                  >
                    <div className="h-full p-4 sm:p-8 text-center hover:bg-indigo-50 rounded-xl">
                      <img
                        className="object-cover w-36 h-36 mx-auto rounded sm:h-40 xl:h-48 sm:w-40 xl:w-48"
                        src={chemistry}
                        alt="Science-logo"
                      />
                      <h6 className="mt-6 font-bold leading-5 text-3xl text-brand-900">
                        Chemistry
                      </h6>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* View simulation contents component */}
      <ViewAllSimulation
        viewSimulation={viewSimulation}
        selectTab={selectTab}
        setViewSimulation={setViewSimulation}
        setSelectTab={setSelectTab}
      />
    </div>
  );
};

export default Simulation;
