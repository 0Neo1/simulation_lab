import React from 'react';
import Fade from 'react-reveal/Fade';

const About = () => {
  return (
    <section id="about">
      <div className="px-8 pt-16 pb-10 sm:pb-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:pt-20 lg:pb-20">
        <div className="grid gap-12 row-gap-8 lg:grid-cols-2">
          {/* Left Side */}
          <div className="flex flex-col justify-center">
            <div className="max-w-xl mb-6">
              <Fade bottom>
                <h2 className="max-w-xl mb-6 font-display text-2xl font-semibold tracking-wider text-dark-brand-900 leading-relaxed md:text-3xl md:leading-normal">
                  Learn lab experiments more efficiently and cost-effectively using the internet with
                  <span className="text-brand-900 md:ml-1"> ZeroLab</span>
                </h2>
              </Fade>
              <Fade bottom>
                <p className="text-base text-gray-700 font-body md:text-lg">
                  This is a web-based platform that provides a safe and interactive lab environment for school and college students, designed to improve the learning process.
                </p>
              </Fade>
            </div>
            {/* Small Content */}
            <div className="grid gap-8 row-gap-8 sm:grid-cols-2 font-body">
              <div>
                <Fade bottom>
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-indigo-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-9 h-9 text-brand-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      />
                    </svg>
                  </div>
                  <h6 className="mb-2 font-semibold leading-5 text-gray-900">
                    A web-based science learning platform
                  </h6>
                  <p className="text-sm text-gray-800">
                    This virtual lab was created as an alternative to traditional science labs for school and college students to improve the science teaching process.
                  </p>
                </Fade>
              </div>
              <div>
                <Fade bottom>
                  <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-indigo-50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 text-brand-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <h6 className="mb-2 font-semibold leading-5 text-gray-900">
                    A fun, helpful, and enjoyable learning environment
                  </h6>
                  <p className="text-sm text-gray-800">
                    This virtual science lab was created to help students conduct laboratory experiments in a safe and interactive way.
                  </p>
                </Fade>
              </div>
            </div>
          </div>
          {/* Right Side */}
          <div>
            <Fade bottom>
              <img
                className="object-cover w-4/5 h-34 mx-auto sm:w-full sm:h-full rounded shadow-lg "
                src="https://i.ibb.co/LtcWyvR/logo-banner.png"
                alt="logo-banner"
              />
            </Fade>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
