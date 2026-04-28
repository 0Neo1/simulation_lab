import React from 'react';
import Image9 from '../../../assets/images/simulation/che/12/01/che9.jpg';

const CheProcedureTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5">
      {/* Main Content */}
      <div className="mb-1">
        <h2 className="font-semibold"> Required Equipment:: </h2>
        <img src={Image9} alt="simulation-theory" className="py-1" />
      </div>

      {/* Procedure 1 */}
      <div className="mb-2 mt-6">
        <h2 className="font-semibold mb-2"> Lab Procedure </h2>
        <p className="mb-2">
          {' '}
          Preparation of standard oxalic acid solution [250 ml M/10 (0.1 M)
          solution]{' '}
        </p>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Using an electronic balance, first weigh out exactly 3.15 g of oxalic acid crystals in a weighing bottle.
          </li>
          <li>Transfer these to a 250 ml beaker.</li>
          <li>
            Then wash the weighing bottle 2 or 3 times with distilled water and transfer all the washings to the beaker.
          </li>
          <li>
            Dissolve the oxalic acid crystals in the beaker by stirring gently with a clean glass rod.
          </li>
          <li>
            When the oxalic acid crystals in the beaker are completely dissolved, transfer the entire solution from the beaker to a 250ml standard flask through a funnel and a glass rod.
          </li>
          <li>
            Wash the beaker 2 to 3 times with distilled water and transfer all the washings to the standard flask.
          </li>
          <li>
            Finally wash the funnel thoroughly with distilled water to transfer the drops of solution on the side of the funnel to the standard flask.
          </li>
          <li>
            Add sufficient distilled water to the standard flask so that the level is just below its calibration mark.
          </li>
          <li>
            Add the last few drops of distilled water with a pipette until the bottom level of the meniscus touches the mark of the standard flask.
          </li>
          <li>
            Close the measuring flask and gently shake the solution to make it uniform throughout.
          </li>
        </ul>
      </div>
      {/* Procedure 2 */}
      <div className="mb-12 mt-8">
        <h2 className="font-semibold mb-1">Determine the strength of given KMnO4</h2>
        <ul className="list-inside leading-loose list-disc">
          <li>Take a burette and wash it with distilled water.</li>
          <li>
            Wash and fill the burette with the given KMnO4 solution and
            set the initial burette reading as zero.
          </li>
          <li>Clamp it vertically on the burette stand.</li>
          <li>
            Rinse the pipette with water and then with the given oxalic acid solution and
            wash it.
          </li>
          <li>
            Then pipette 20 ml of the given oxalic acid solution into a conical
            flask and dilute it with a test tube (~20ml) full of H2SO4
            add.
          </li>
          <li>
            Heat the contents of the conical flask to 60-70°C. Titrate it
            against the KMnO4 solution taken in the burette until the conical
            flask solution color changes from colorless to light pink.
          </li>
          <li>Note the final burette reading.</li>
          <li>
            Repeat the titration until consistent values are obtained.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CheProcedureTemplate;
