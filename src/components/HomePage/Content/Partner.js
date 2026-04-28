import React from "react";
import Fade from "react-reveal/Fade";
import SwiperCore, { A11y, Autoplay, Pagination, Scrollbar } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/swiper-bundle.min.css";
import bgBannerPartner from "../../../assets/images/background/biography-bg.png";
import SectionTitle from "../MicroComponent/SectionTitle";

// install Swiper components
SwiperCore.use([Pagination, Scrollbar, A11y, Autoplay]);

const partnerData = [
  {
    image: require("../../../assets/images/partner/partner1.png"),
  },
  {
    image: require("../../../assets/images/partner/partner2.png"),
  },
  {
    image: require("../../../assets/images/partner/partner3.png"),
  },
  {
    image: require("../../../assets/images/partner/partner4.png"),
  },
  {
    image: require("../../../assets/images/partner/partner5.png"),
  },
  {
    image: require("../../../assets/images/partner/partner6.png"),
  },
  {
    image: require("../../../assets/images/partner/partner7.png"),
  },
  {
    image: require("../../../assets/images/partner/partner8.png"),
  },
  {
    image: require("../../../assets/images/partner/partner9.png"),
  },
  {
    image: require("../../../assets/images/partner/partner10.png"),
  },
  {
    image: require("../../../assets/images/partner/partner11.png"),
  },
  {
    image: require("../../../assets/images/partner/partner12.png"),
  },
  {
    image: require("../../../assets/images/partner/partner13.png"),
  },
  {
    image: require("../../../assets/images/partner/partner14.png"),
  },
  {
    image: require("../../../assets/images/partner/partner15.png"),
  },
];

const Partner = () => {
  return (
    <section
      className="min-h-full bg-cover bg-no-repeat bg-center"
      id="features"
      data-aos="fade-up"
      style={{
        backgroundImage: `url(${bgBannerPartner})`,
      }}
    >
      <div className="px-4 pt-0 sm:pt-14 pb-14 mx-auto max-w-7xl">
        <SectionTitle
          title="Educational Institutions Registered on Our Platform"
          description="Educational institutions using ZeroLab to support interactive science learning experiences for students and teachers."
          space="mb-12"
        />
        <Fade bottom>
          <Swiper
            key={partnerData.length}
            tag="section"
            wrapperTag="ul"
            spaceBetween={0}
            centeredSlides={false}
            autoplay={{ delay: 1800 }}
            slidesPerView={"auto"}
            pagination={{ clickable: false }}
          >
            {/* Getting All Patterns Logo */}
            <div className="grid grid-cols-2 gap-10 text-center lg:grid-cols-8">
              {partnerData &&
                partnerData.map((item, index) => (
                  <div className="flex items-center justify-center" key={index}>
                    <SwiperSlide
                      tag="li"
                      key={index}
                      style={{ width: "180px" }}
                    >
                      <img
                        src={item.image.default}
                        alt="Logo"
                        className="block object-contain h-32 mb-6"
                      />
                    </SwiperSlide>
                  </div>
                ))}
            </div>
          </Swiper>
        </Fade>
      </div>
    </section>
  );
};

export default Partner;
