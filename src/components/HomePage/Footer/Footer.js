import React from 'react';
import Fade from 'react-reveal/Fade';

const Footer = () => {
  return (
    <footer
      className="min-h-auto bg-cover bg-no-repeat bg-center"
      data-aos="fade-up"
      style={{
        backgroundImage: `url(https://i.ibb.co/rckt4Tv/footer-bg.png)`,
      }}
    >
      <div className="px-4 pt-20 pb-4 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8">
        <Fade top>
          <div className="grid grid-cols-1 gap-8 mb-3 lg:grid-cols-12 lg:gap-20">
            {/* Brand */}
            <div className="col-span-8">
              <a
                href="/"
                aria-label="Go home"
                title="ZeroLab"
                className="inline-flex items-center"
              >
                <span className="ml-2 text-2xl font-display font-bold tracking-wide text-white uppercase">
                  ZeroLab
                </span>
              </a>
              <div className="mt-6 lg:max-w-sm font-body">
                <p className="text-sm text-indigo-50">
                  All lab experiments and science simulations for physics and chemistry from classes IX to XII are now always completely free.
                </p>
              </div>
            </div>

            {/* Credits */}
            <div className="col-span-4 mt-4 lg:mt-0">
              <span className="text-base font-semibold font-body tracking-wide text-white">
              </span>

              <p className="mt-4 font-body text-sm text-indigo-50">
                ZeroLab is focused on practical and accessible science learning through guided simulations.
              </p>
            </div>
          </div>
          {/* Down Footer */}
          <div className="flex flex-col-reverse justify-between pt-5 pb-10 border-t border-gray-50 lg:flex-row font-body">
            <p className="text-sm font-medium text-gray-400 tracking-wide">
              &copy; Copyright 2022 ZeroLab. All rights reserved.
            </p>
          </div>
        </Fade>
      </div>
    </footer>
  );
};

export default Footer;
