import React from 'react';
import Fade from 'react-reveal/Fade';
import Slide from 'react-reveal/Slide';
import Zoom from 'react-reveal/Zoom';
import FeaturesImage1 from '../../../assets/images/features/features-img-1.png';
import FeaturesImage2 from '../../../assets/images/features/features-img-2.png';
import FeaturesImage3 from '../../../assets/images/features/features-img-3.png';
import FeaturesImage4 from '../../../assets/images/features/features-img-4.png';
import PathImage from '../../../assets/images/features/path.png';
import Card from '../MicroComponent/Card';
import SectionTitle from '../MicroComponent/SectionTitle';

function Features() {
  return (
    <section
      className="min-h-auto md:min-h-screen bg-cover bg-no-repeat bg-center"
      id="features"
      data-aos="fade-up"
      style={{
        backgroundImage: `url(https://i.ibb.co/vmk1BBv/features-2.png)`,
      }}
    >
      <div className="px-4 py-12 sm:py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
        {/* Main Content */}
        <Fade top>
          <SectionTitle
            title="Our Features"
            description="ZeroLab provides simulation-first learning for Physics, Chemistry, and Biology, with guided experimentation and classroom-ready workflows."
            space="mb-12"
          />
        </Fade>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 relative font-body">
          <div
            style={{ zIndex: '-1' }}
            className="hidden xl:block 2xl:hidden path absolute w-full"
          >
            <Zoom bottom>
              <img className="mx-auto" src={PathImage} alt="img" />
            </Zoom>
          </div>
          {/* Feature 1 */}
          <Slide bottom>
            <Card>
              <div className="text-center px-5 py-8">
                <img className="mx-auto" src={FeaturesImage1} alt="img" />
                <h4 className="font-bold text-dark-blue text-xl mt-10">
                  Simulation-driven science learning
                </h4>
                <p className="mt-4 text-gray-800">
                  Practice practical experiments for classes IX to XII across core science subjects from any device.
                </p>
              </div>
            </Card>
          </Slide>
          {/* Feature 2 */}
          <Slide bottom>
            <Card>
              <div className="text-center px-5 py-8 xl:mt-24">
                <img className="mx-auto" src={FeaturesImage2} alt="img" />
                <h4 className="font-bold text-dark-blue text-xl mt-10">
                  Repeatable virtual lab experience
                </h4>
                <p className="mt-4 text-gray-800">
                  Run experiments independently, revisit observations, and strengthen conceptual understanding with repeat practice.
                </p>
              </div>
            </Card>
          </Slide>
          {/* Feature 3 */}
          <Slide bottom>
            <Card>
              <div className="text-center px-5 py-8">
                <img className="mx-auto" src={FeaturesImage3} alt="img" />
                <h4 className="font-bold text-dark-blue text-xl mt-10">
                  Structured class and lab workflows
                </h4>
                <p className="mt-4 text-gray-800">
                  Teachers and students can use lab rooms, notices, and assignments to keep practical learning organized.
                </p>
              </div>
            </Card>
          </Slide>
          {/* Feature 4 */}
          <Slide bottom>
            <Card>
              <div className="text-center mb-24 lg:mb-16 px-5 py-8 xl:mt-24">
                <img className="mx-auto" src={FeaturesImage4} alt="img" />
                <h4 className="font-bold text-dark-blue text-xl mt-10">
                  One platform for practical science
                </h4>
                <p className="mt-4 text-gray-800">
                  Move from simulation to collaboration with integrated dashboard modules for profile, community, and workshops.
                </p>
              </div>
            </Card>
          </Slide>
        </div>
      </div>
    </section>
  );
}

export default Features;
