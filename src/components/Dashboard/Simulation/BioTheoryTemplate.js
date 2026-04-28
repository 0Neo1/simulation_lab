import React from 'react';
import Image01 from '../../../assets/images/simulation/bio/12/01/bio1.png';
import Image02 from '../../../assets/images/simulation/bio/12/01/bio2.png';
import Image03 from '../../../assets/images/simulation/bio/12/01/bio3.png';

const BioTheoryTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5 ">
      {/* Content 1 */}
      <div className="mb-2 ">
        <h2 className="font-semibold"> Experiment Name: </h2>
        <p> Experiment to demonstrate the necessity of light and chlorophyll in photosynthesis. </p>
      </div>

      <div className="mb-2">
        <h2 className="font-semibold"> Objective: </h2>
        <p>
          Our objective is to show experimentally that light is necessary for photosynthesis.
        </p>
      </div>
      {/* Content 2 */}
      <div className="mb-4">
        <div className="flex flex-wrap">
          <h2 className="font-semibold pr-4"> Theory: </h2>
          <img src={Image01} alt="simulation-theory" className="py-1 pb-4" />
        </div>
        <p>
          Photosynthesis is the process in which light energy is converted into chemical energy.
          Using the energy of light, carbohydrates such as sugars are synthesized from carbon
          dioxide and water.
        </p>
        <p className="mt-2">
          The name photosynthesis comes from the Greek words: photo for 'light' and synthesis
          meaning 'putting together'. Oxygen is also released as a waste product. Light is a
          major factor in photosynthesis and by doing this experiment, we have to prove that
          light is necessary for photosynthesis.
        </p>
      </div>
      {/* Content 3 */}
      <div className="mt-3">
        <h2 className="font-semibold">Process of Photosynthesis: </h2>
        <p>
          The process of photosynthesis occurs when green plants use light energy to
          convert carbon dioxide (CO2) and water (H2O) into carbohydrates. Light
          energy is absorbed by chlorophyll, a photosynthetic pigment of the plant,
          while carbon dioxide and oxygenated air enter the plant through stomata.
          A very important byproduct of photosynthesis is oxygen, on which most organisms rely.
        </p>
        <p className="mt-2">
          Glucose, a carbohydrate processed during photosynthesis, is mostly used by plants
          as an energy source to produce leaves, flowers, fruits, and seeds. Glucose molecules
          later combine with each other to form more complex carbohydrates like starch and
          cellulose. Cellulose is the structural material used in plant cell walls.
          Photosynthesis is the fundamental energy source for practically all living organisms.
        </p>
        <p className="mt-2">
          We can express the overall reaction of photosynthesis like this:
        </p>
        <img src={Image02} alt="simulation-theory" className="py-2" />
        <img src={Image03} alt="simulation-theory" className="py-2" />
      </div>
      {/* Content 4 */}
      <div className="mt-3">
        <h2 className="font-semibold">
          Role of light color during photosynthesis:{' '}
        </h2>
        <p>
          Did you know the color of light plays an important role during photosynthesis?
          Yes, it does. Plants only use specific colors of light for the photosynthesis process.
          Chlorophyll absorbs blue, red, and violet light rays. Photosynthesis occurs more
          in blue and red light rays and less, or not at all, in green light rays.
        </p>
        <p className="mt-2">
          The best absorbed light is blue, showing the highest rate of photosynthesis,
          followed by red light. Green light cannot be absorbed by the plant and thus
          cannot be used for photosynthesis. Chlorophyll appears green because it absorbs
          red and blue light, making these colors invisible to our eyes. It is the green
          light that is not absorbed that eventually reaches our eyes, making chlorophyll look green.
        </p>
      </div>
      {/* Content 5 */}
      <div className="mt-5">
        <h2 className="font-semibold">Factors Affecting Photosynthesis: </h2>
        <p>
          For a constant rate of photosynthesis, several factors are required at their optimal levels.
          Here are some of the factors that affect photosynthesis.
        </p>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Light intensity: Increased light intensity leads to a higher rate of photosynthesis,
            and low intensity leads to a lower rate.
          </li>
          <li>
            CO2 concentration: Higher carbon dioxide concentration increases the rate of
            photosynthesis. Usually, 0.03 to 0.04 percent concentration is sufficient.
          </li>
          <li>
            Temperature: An optimal temperature range between 25 and 35°C is needed for
            efficient photosynthesis.
          </li>
          <li>
            Water: Water is an essential component for photosynthesis. Lack of water also
            causes issues with absorbing carbon dioxide. When water is deficient, leaves refuse
            to open their stomata to retain stored water.
          </li>
          <li>
            Polluted atmosphere: Pollutants and gases settle on leaves and block stomata,
            making it difficult to take in carbon dioxide. A polluted atmosphere can reduce
            the rate of photosynthesis by 15 percent.
          </li>
        </ul>
      </div>
      {/* Content 6 */}
      <div className="mt-5 pb-5">
        <h2 className="font-semibold mb-1"> Learning Outcomes: </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Students can understand the concept that light is essential for photosynthesis.
          </li>
          <li>
            Students understand the principles of photosynthesis and the factors affecting it.
          </li>
          <li>
            Students will be able to perform the experiment accurately in a real lab after
            understanding the steps via animation and simulation.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BioTheoryTemplate;
