import {
  faEnvelope,
  faLock,
  faMapMarkedAlt,
  faRegistered,
  faUniversity,
  faUnlock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import toast from 'react-hot-toast';
import Slide from 'react-reveal/Slide';
import { useHistory } from 'react-router-dom';

const Registration = () => {
  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    history.push('/');
    toast.error(
      'Sorry, institution registration is closed at the moment! 😓'
    );
  };

  return (
    <section
      className="min-h-auto lg:min-h-screen bg-cover bg-no-repeat bg-center"
      style={{
        backgroundImage: ` linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://i.ibb.co/Dk3Yr9N/astronaut.jpg)`,
      }}
    >
      <div className="w-full h-screen font-sans bg-cover bg-landscape">
        <div className="container flex items-center justify-center flex-1 h-full mx-auto">
          <div className="w-full max-w-lg">
            <div className="leading-loose">
              <form className="max-w-lg px-10 py-6 m-auto bg-white bg-opacity-25 rounded shadow-xl font-body">
                <p className="mb-6 text-2xl text-center text-white font-semibold">
                  Register Institution
                </p>
                {/* Registration Form*/}
                <Slide bottom cascade>
                  <div className="mt-4 font-body">
                    <div class="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faUniversity}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationInstitutionName"
                        name="InstitutionName"
                        type="text"
                        className="registration-input"
                        placeholder="Provide your institution's name"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div class="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faMapMarkedAlt}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationInstitutionAddress"
                        name="InstitutionAddress"
                        type="text"
                        className="registration-input"
                        placeholder="Provide your institution's full address"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div className="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faRegistered}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationInstitutionTIN"
                        name="InstitutionTI"
                        type="text"
                        className="registration-input"
                        placeholder="Provide your institution's TIN number"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div className="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationUserName"
                        name="name"
                        type="text"
                        className="registration-input"
                        placeholder="Provide your name"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div className="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationEmailAddress"
                        name="email"
                        type="email"
                        className="registration-input"
                        placeholder="Provide your email"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div className="flex justify-between" />
                    <div className="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faLock}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationPassword"
                        name="password"
                        type="password"
                        className="registration-input"
                        placeholder="Provide your password"
                      />
                    </div>
                  </div>

                  <div className="mt-4 font-body">
                    <div className="flex justify-between" />
                    <div className="relative flex w-full flex-wrap items-stretch mb-3">
                      <span className="login-icon">
                        <FontAwesomeIcon
                          icon={faUnlock}
                          className="text-gray-700"
                        />
                      </span>
                      <input
                        id="RegistrationPasswordAgain"
                        name="password"
                        type="password"
                        className="registration-input"
                        placeholder="Provide your password again"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      className="w-full px-4 py-2 font-semibold font-body text-base tracking-wide text-gray-50 focus-within:transition-colors duration-200 bg-brand-900 rounded hover:bg-dark-brand-900 focus:outline-none focus:bg-deep-purple-900"
                      onClick={handleSubmit}
                    >
                      Register
                    </button>
                  </div>
                </Slide>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Registration;
