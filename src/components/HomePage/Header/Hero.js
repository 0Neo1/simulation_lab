import { motion } from "framer-motion";
import React, { useContext } from "react";
import { ModalContext } from "../../../App";

const Hero = () => {
  const modalData = useContext(ModalContext);

  const handleOpenAuth = () => {
    modalData.setShowHeader("hidden");
    modalData.setShowLoginModal(true);
    modalData.setNewUser(false);
  };

  return (
    <section className="px-5 pt-20 pb-10 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-16 lg:px-8 lg:pt-28 lg:pb-16">
      <motion.div
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <div className="max-w-7xl sm:mx-auto">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 xl:gap-16">
            <div className="text-center lg:text-left">
              <h1 className="mb-6 font-display text-5xl font-extrabold leading-tight tracking-normal text-gray-50 md:text-6xl xl:text-7xl">
                Master Science
                <span className="block text-cyan-200">By Doing It</span>
              </h1>
              <p className="max-w-2xl font-body text-lg leading-9 text-indigo-50 md:text-2xl">
                Step into interactive Physics, Chemistry, and Biology labs where every concept
                becomes something you can test, repeat, observe, and understand.
              </p>
              <div className="mt-8">
                <button onClick={handleOpenAuth} className="deep-button" type="button">
                  Explore Now
                </button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <motion.img
                src="https://i.ibb.co/YffvYk9/student.gif"
                alt="Hero simulation visual"
                className="w-full max-w-lg rounded-2xl shadow-3xl xl:max-w-xl"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
