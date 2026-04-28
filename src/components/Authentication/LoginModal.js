import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faUniversity,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import Slide from 'react-reveal/Slide';
import { useHistory } from 'react-router-dom';
import { ModalContext } from '../../App';
import Institution from '../../data/Institution';
import { GLOBALTYPES } from '../../redux/actions/globalTypes';
import RegistrationModal from './RegistrationModal';

const LoginModal = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const modalData = useContext(ModalContext);
  // initial states
  const [institutionUser, setInstitutionUser] = useState(null);
  const [institutionName, setInstitutionName] = useState(null);
  const [forgetPassword, setForgetPassword] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [institutionList, setInstitutionList] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [typePass, setTypePass] = useState(false);

  // show notification
  useEffect(() => {
    modalData.newUser &&
      toast(
        `Please at this moment "Register independently and" can use the entire application! 😊`,
        {
          icon: '🙏',
          position: 'bottom-left',
        }
      );
  }, [modalData.newUser]);

  // search institution name
  useEffect(() => {
    searchValue === ''
      ? setInstitutionList(Institution)
      : setInstitutionList(
          Institution.filter((item) =>
            item.name.toLowerCase().includes(searchValue.toLowerCase())
          )
        );
  }, [searchValue]);

  // all modal handlers
  const handleCloseLoginModal = () => {
    modalData.setShowHeader('block');
    modalData.setShowLoginModal(false);
  };

  const handleSearchBox = () => {
    setShowSearchBox(true);
  };

  const institutionFilterChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleOpenRegistrationModal = () => {
    modalData.setShowHeader('hidden');
    modalData.setShowRegistrationModal(true);
  };

  const handleSetInstitution = (value) => {
    setInstitutionUser(true);
    setInstitutionName(value);
    handleOpenRegistrationModal();
  };

  const handleRegistrationModal = () => {
    setInstitutionUser(false);
    handleOpenRegistrationModal();
  };

  // login form data states
  const [formData, setFormData] = useState({
    email: 'Demo',
    password1: 'Demo@123',
    textChange: 'Login',
  });
  const { email, password1, textChange } = formData;
  // login from data handler
  const handleChange = (text) => (e) => {
    setFormData({ ...formData, [text]: e.target.value });
  };

  // manual login handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === 'Demo' && password1 === 'Demo@123') {
      const loading = toast.loading('Logging in as demo user...⏳');
      setFormData({ ...formData, textChange: 'Logging in...' });
      
      setTimeout(() => {
        const fakeUser = {
          _id: 'demo_12345',
          name: 'demo',
          email: 'demo@zerolab.local',
          role: 'student',
          avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
        };
        const fakeToken = 'dummy_demo_jwt_token_123';

        setFormData({
          ...formData,
          email: '',
          password1: '',
          textChange: 'Logged In',
        });

        dispatch({
          type: GLOBALTYPES.AUTH,
          payload: {
            token: fakeToken,
            user: fakeUser,
          },
        });

        localStorage.setItem('jwtToken', fakeToken);
        localStorage.setItem('user', JSON.stringify(fakeUser));

        toast.dismiss(loading);
        handleCloseLoginModal();
        history.push('/dashboard');
        toast.success(`Welcome back ${fakeUser.name}! ❤️`);
      }, 500);

    } else {
      toast.error('Invalid credentials. Please use Demo / Demo@123');
    }
  };

  // forget password form data states
  const [forgetPasswordData, setForgetPasswordData] = useState({
    forgetEmail: '',
    forgetTextChange: 'Submit',
  });
  const { forgetEmail, forgetTextChange } = forgetPasswordData;
  // forget password data
  const handleForgetChange = (text) => (e) => {
    setForgetPasswordData({ ...forgetPasswordData, [text]: e.target.value });
  };

  // forget password handler
  const handleForgetPasswordSubmit = (e) => {
    e.preventDefault();

    const loading = toast.loading('Please wait...⏳');
    if (forgetEmail) {
      setForgetPasswordData({
        ...forgetPasswordData,
        forgetTextChange: 'Submitting...',
      });

      axios
        .put(`${process.env.REACT_APP_API_URL}/forgotpassword`, {
          forgetEmail,
        })
        .then((res) => {
          setForgetPasswordData({
            ...forgetPasswordData,
            forgetEmail: '',
            textChange: 'Submitted',
          });
          // close login modal
          setForgetPassword(false);
          handleCloseLoginModal();
          toast.dismiss(loading);
          toast.success(res.data.message);
        })
        .catch((err) => {
          setForgetPasswordData({
            ...forgetPasswordData,
            forgetEmail: '',
            forgetTextChange: 'Submit',
          });
          toast.dismiss(loading);
          toast.error(err?.response?.data?.errors);
        });
    } else {
      toast.error('Please fill in the information! 😒');
    }
  };

  return (
    <Fragment>
      {!modalData.showRegistrationModal && (
        <div>
          <div className="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none backdrop-filter saturate-150 backdrop-blur-sm">
            <div
              className={`relative w-full mt-12 mb-24 sm:mb-4 ${
                !modalData.newUser
                  ? !forgetPassword
                    ? 'lg:mt-8 2xl:mt-10'
                    : 'lg:mt-18 2xl:mt-20'
                  : 'lg:mt-4 2xl:mt-6'
              } flex max-w-sm md:max-w-lg lg:max-w-4xl 2xl:max-w-5xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl`}
            >
              {/* Left Side Animations */}
              <div className="hidden lg:block lg:w-1/2 bg-brand-900">
                {!modalData.newUser ? (
                  <img
                    src="https://cdn.dribbble.com/users/535360/screenshots/2583480/scientists_2.gif"
                    alt="login-loader"
                    className="min-h-auto md:min-h-full bg-cover bg-no-repeat bg-center"
                  />
                ) : (
                  <img
                    src="https://i.ibb.co/GWdPsJ9/signIn.gif"
                    alt="signIn-loader"
                    className="min-h-auto md:min-h-full bg-cover bg-no-repeat bg-center"
                  />
                )}
              </div>
              {/* Right Side Forms */}
              <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
                {/* Close Button */}
                <button
                  className="close-button absolute top-0 right-0 m-7"
                  type="button"
                  onClick={handleCloseLoginModal}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-circle-x"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <circle cx="12" cy="12" r="9" />
                    <path d="M10 10l4 4m0 -4l-4 4" />
                  </svg>
                </button>

                {!modalData.newUser ? (
                  // Login Form
                  <Fragment>
                    {/* LogIn Header */}
                    <div>
                      <h2 className="text-2xl ml-4 mb-2 font-display text-center font-bold text-brand-900">
                        ZeroLab
                      </h2>
                      <p className="text-lg font-body text-center text-gray-600 ">
                        Welcome back!
                      </p>
                    </div>

                    {!forgetPassword ? (
                      <Fragment>
                        {/* Common Login */}
                        <form onSubmit={handleSubmit}>
                          <Slide bottom>
                            <div className="flex items-center justify-between mt-4">
                              <span className="w-1/5 border-b lg:w-1/4" />
                              <span className="text-xs text-center text-gray-600 font-medium font-body tracking-wider uppercase">
                                Login Form
                              </span>
                              <span className="w-1/5 border-b lg:w-1/4" />
                            </div>
                            <p className="my-3 rounded bg-indigo-50 px-3 py-2 text-sm font-medium text-brand-900">
                              Demo Login: ID <strong>Demo</strong> and Password <strong>Demo@123</strong>
                            </p>

                            {/* LogIn Form */}
                            <div className="mt-4 font-body">
                              <label
                                className="block mb-2 text-base font-medium text-gray-700"
                                htmlFor="LoggingEmailAddress"
                              >
                                Username
                              </label>
                              <div className="relative flex w-full flex-wrap items-stretch mb-3">
                                <span className="login-icon">
                                  <FontAwesomeIcon
                                    icon={faEnvelope}
                                    className="text-gray-500"
                                  />
                                </span>
                                <input
                                  id="LoggingEmailAddress"
                                  name="email"
                                  type="text"
                                  className="login-input"
                                  placeholder="Enter your username"
                                  onChange={handleChange('email')}
                                  value={email}
                                />
                              </div>
                            </div>
                            <div className="mt-4 font-body">
                              <div className="flex justify-between">
                                <label
                                  className="block mb-2 text-base font-medium text-gray-700"
                                  htmlFor="loggingPassword"
                                >
                                  Password
                                </label>
                                <span
                                  className="text-sm text-gray-700 cursor-pointer hover:text-deep-purple-accent-700 tracking-wide"
                                  onClick={() => setForgetPassword(true)}
                                >
                                  Forgot Password?
                                </span>
                              </div>
                              <div className="relative flex w-full flex-wrap items-stretch mb-3">
                                <span className="login-icon">
                                  <FontAwesomeIcon
                                    icon={faLock}
                                    className="text-gray-500"
                                  />
                                </span>
                                <input
                                  id="loggingPassword"
                                  name="password"
                                  type={typePass ? 'text' : 'password'}
                                  className="login-input"
                                  placeholder="Enter your password"
                                  onChange={handleChange('password1')}
                                  value={password1}
                                />
                                <span class="absolute inset-y-0 right-0 pr-3 flex items-center text-base leading-5 cursor-pointer">
                                  <FontAwesomeIcon
                                    icon={typePass ? faEyeSlash : faEye}
                                    className="text-gray-500"
                                    onClick={() => setTypePass(!typePass)}
                                  />
                                </span>
                              </div>
                            </div>
                            <div className="mt-8">
                              {/* Manual Login Button */}
                              <button
                                className="w-full px-4 py-2 font-semibold font-body text-base tracking-wide text-gray-50 focus-within:transition-colors duration-200 bg-brand-900 rounded hover:bg-deep-purple-accent-700 focus:outline-none focus:bg-deep-purple-900"
                                type="submit"
                              >
                                {textChange}
                              </button>
                            </div>
                          </Slide>
                        </form>

                      </Fragment>
                    ) : (
                      // Forget Password Form
                      <Fragment>
                        <form onSubmit={handleForgetPasswordSubmit}>
                          <Slide bottom>
                            <div className="flex items-center justify-between mt-4">
                              <span className="w-1/5 border-b lg:w-1/4" />
                              <span className="mt-1 text-lg text-center text-gray-700 font-normal font-body tracking-wider uppercase">
                                Forgot Password?
                              </span>
                              <span className="w-1/5 border-b lg:w-1/4" />
                            </div>

                            <div className="mt-3 font-body">
                              <label
                                className="block mb-2 text-base font-medium text-gray-700"
                                htmlFor="ForgetEmailAddress"
                              >
                                Email
                              </label>
                              <div className="relative flex w-full flex-wrap items-stretch mb-3">
                                <span className="login-icon">
                                  <FontAwesomeIcon
                                    icon={faEnvelope}
                                    className="text-gray-500"
                                  />
                                </span>
                                <input
                                  id="ForgetEmailAddress"
                                  name="email"
                                  type="email"
                                  className="login-input"
                                  placeholder="Enter your email"
                                  onChange={handleForgetChange('forgetEmail')}
                                  value={forgetEmail}
                                />
                              </div>
                            </div>
                            {/* Forget Password Send Button */}
                            <div className="mt-8">
                              <button className="w-full px-4 py-2 font-semibold font-body text-base tracking-wide text-gray-50 focus-within:transition-colors duration-200 bg-brand-900 rounded hover:bg-deep-purple-accent-700 focus:outline-none focus:bg-deep-purple-900">
                                {forgetTextChange}
                              </button>
                            </div>
                          </Slide>
                        </form>

                        <Slide bottom>
                          <div className="flex items-center justify-between mt-4">
                            <span className="w-1/5 border-b  md:w-1/4" />
                            <span
                              className="text-base text-brand-900 font-semibold font-body uppercase cursor-pointer hover:text-deep-purple-accent-700"
                              onClick={() => setForgetPassword(false)}
                            >
                              Or Login
                            </span>
                            <span className="w-1/5 border-b md:w-1/4" />
                          </div>
                        </Slide>
                      </Fragment>
                    )}
                  </Fragment>
                ) : (
                  // Registration Form
                  <Fragment>
                    <Slide bottom>
                      <div>
                        {/* Registration Header*/}
                        <h2 className="text-2xl ml-4 mb-2 font-display text-center font-bold text-brand-900">
                          ZeroLab
                        </h2>
                        <p className="text-lg font-body text-center text-gray-600 ">
                          Register as a new user
                        </p>
                      </div>

                      <div className="mt-3 mb-0 font-body flex flex-wrap justify-center items-center">
                        <label className="inline-flex items-center">
                          <span className="text-lg text-brand-900 font-body mr-3 font-medium">
                            Register through your educational institution
                          </span>
                        </label>
                      </div>

                      <div className="mt-5 font-body">
                        <label
                          className="block mb-2 text-base font-medium text-gray-700"
                          htmlFor="SearchInstitutionName"
                        >
                          Your Institution Name
                        </label>
                        <div className="relative flex w-full flex-wrap items-stretch mb-3">
                          <span className="login-icon">
                            <FontAwesomeIcon
                              icon={faUniversity}
                              className="text-gray-500"
                            />
                          </span>
                          <input
                            id="SearchInstitutionName"
                            type="text"
                            className="login-input"
                            onChange={institutionFilterChange}
                            onFocus={handleSearchBox}
                            placeholder="Enter your institution name"
                          />
                        </div>
                      </div>
                    </Slide>
                    {/* Show Search Box */}
                    {showSearchBox ? (
                      <div className="inline-flex flex-col justify-center relative text-gray-600 font-body w-full">
                        <h3 className="mt-2 text-sm">Search Results:</h3>
                        <ul className="bg-white border border-gray-100  overflow-y-scroll h-48 mt-2 ">
                          {/* If not found any Institution */}
                          {institutionList.length === 0 && (
                            <li className="pl-2 pr-2 py-2 border-b-2 border-gray-100 relative hover:bg-indigo-50 hover:text-gray-900">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 inline mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                                />
                              </svg>
                              Institution name not found!
                            </li>
                          )}

                          {/* If Institution Found */}
                          {institutionList &&
                            institutionList.map((item, index) => (
                              <li
                                className="pl-2 pr-2 py-2 border-b-2 border-gray-100 relative cursor-pointer hover:bg-indigo-50 hover:text-gray-900"
                                key={index}
                                onClick={() => handleSetInstitution(item.name)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 inline mr-2 text-gray-400"
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
                                {item.name}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : (
                      // Hide Search Box
                      <div className="inline-flex flex-col justify-center relative text-gray-600 font-body bg-gray-100 rounded-lg px-3 py-4 mt-3">
                        <Slide bottom cascade>
                          <div>
                            <p className="pl-2 pr-2 py-2 border-b-2 border-gray-100 relative ">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 inline mr-2"
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
                              Search and register your institution to access all benefits.
                            </p>
                          </div>
                          <div>
                            <p className="pl-2 pr-2 py-2.5 border-gray-100 relative ">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 inline mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              Alternatively, you can register individually without an institution.
                            </p>
                          </div>
                        </Slide>
                      </div>
                    )}

                    <Slide bottom>
                      {/* Registration for Individual  */}
                      <div className="flex items-center justify-between mt-6">
                        <span className="w-1/6 border-b " />
                        <span className="text-base lg:textlg text-gray-700 font-body mx-3 font-medium">
                          Or register individually
                        </span>
                        <span className="w-1/6 border-b " />
                      </div>

                      <div className="mt-5">
                        <button
                          className="w-full px-4 py-2 font-semibold font-body text-base tracking-wide text-gray-50 focus-within:transition-colors duration-200 bg-brand-900 rounded hover:bg-deep-purple-accent-700 focus:outline-none focus:bg-deep-purple-900"
                          onClick={handleRegistrationModal}
                        >
                          Register individually
                        </button>
                      </div>
                    </Slide>
                  </Fragment>
                )}
              </div>
            </div>
          </div>
          {/* Background Modal Opacity */}
          <div className="opacity-25 fixed inset-0 z-40 bg-brand-900" />
        </div>
      )}

      {/* Login Modal Component */}
      {modalData.showRegistrationModal ? (
        <RegistrationModal
          institutionUser={institutionUser}
          institutionName={institutionName}
        />
      ) : null}
    </Fragment>
  );
};

export default LoginModal;
