import React, { Fragment, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { ModalContext } from '../App';
import ActivationInstitutionModal from '../components/Authentication/ActivationInstitutionModal';
import Features from '../components/HomePage/Features/Features';
import Footer from '../components/HomePage/Footer/Footer';
import Hero from '../components/HomePage/Header/Hero';
import Nav from '../components/HomePage/Header/Nav';
import Simulation from '../components/HomePage/Simulation/Simulation';
import useWindowDimensions from '../utils/useWindowDimensions';

const Home = () => {
  document.title = 'ZeroLab - Virtual Science Lab';
  const modalData = useContext(ModalContext);
  // get device width from custom hooks
  const { width } = useWindowDimensions();

  let notificationWidth =
    width > 500 ? '480px' : width > 400 ? '390px' : '370px';

  return (
    <Fragment>
      {/* For Toast Notification */}
      <Toaster
        toastOptions={{
          duration: 7000,
          style: {
            minWidth: `${notificationWidth}`,
            fontFamily: 'Hind Siliguri',
            zIndex: 999,
          },
        }}
      />
      {/* For Background Image */}
      <div
        className="min-h-auto lg:min-h-screen bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(https://i.ibb.co/bz7Tqf3/header-bg.png)`,
        }}
      >
        <Nav />
        <Hero />
      </div>
      <Features />
      <Simulation />
      <Footer />

      {/* Login Modal Component */}
      {modalData.showActivationUserModal ? (
        <ActivationInstitutionModal />
      ) : null}
    </Fragment>
  );
};

export default Home;
