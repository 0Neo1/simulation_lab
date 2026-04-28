import React from 'react';
import Image01 from '../../../assets/images/simulation/che/12/01/che1.png';
import Image02 from '../../../assets/images/simulation/che/12/01/che2.png';
import Image03 from '../../../assets/images/simulation/che/12/01/che3.png';
import Image04 from '../../../assets/images/simulation/che/12/01/che4.png';
import Image05 from '../../../assets/images/simulation/che/12/01/che5.png';
import Image06 from '../../../assets/images/simulation/che/12/01/che6.png';
import Image07 from '../../../assets/images/simulation/che/12/01/che7.png';
import Image08 from '../../../assets/images/simulation/che/12/01/che8.png';

const CheTheoryTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5 ">
      {/* Content 1 */}
      <div className="mb-2 ">
        <h2 className="font-semibold"> Experiment Name: </h2>
        <p>
          {' '}
          Determination of the amount of ferrous ion in a solution of unknown concentration using KMnO₄ solution.{' '}
        </p>
      </div>

      <div className="mb-2">
        <h2 className="font-semibold"> Objective: </h2>
        <p>
          To determine the strength of KMnO₄ solution by titrating it against a standard solution of:
        </p>
        <ul className="list-inside leading-loose list-disc">
          <li>Oxalic acid</li>
          <li>Ferrous ammonium sulfate (Mohr's salt)</li>
        </ul>
      </div>
      {/* Content 2 */}
      <div className="mb-4">
        <h2 className="font-semibold"> Theory: </h2>
        <p> What is Titration?</p>

        <p>
          Titration is a common laboratory method of quantitative chemical analysis
          that can be used to determine the unknown concentration of a solution (analyte).
          The basis of this process is the reaction between the analyte and a solution of
          known concentration (standard solution). The analyte is taken in a conical flask
          using a pipette, and the solution of known concentration is taken in a calibrated
          burette (titrant).
        </p>
      </div>
      {/* Content 3 */}
      <div className="mb-2 mt-2">
        <h2 className="font-semibold">
          Oxidation-Reduction Titration and Redox Titration{' '}
        </h2>
        <p>
          Titration based on oxidation and reduction reactions between titrant and analyte
          is called redox titration. Oxidation is the process of addition of oxygen or
          removal of hydrogen/electrons, and reduction involves the addition of
          hydrogen/electrons or removal of oxygen. Oxidizing agents are substances that gain
          one or more electrons and are reduced. Reducing agents are substances that lose
          one or more electrons and are oxidized. That is, the oxidizing agent is the electron
          acceptor, and the reducing agent is the electron donor.
        </p>
        <p className="mt-2">
          In a redox system, the titration method can be adapted to determine the strength of
          a reductant/oxidant using a redox-sensitive indicator. Redox titration involving
          potassium permanganate is called permanganometric titration. In these reactions,
          MnO4- ions act as a self-indicator.
        </p>
      </div>
      {/* Content 4 */}
      <div className="mb-2 mt-2">
        <h2 className="font-semibold">
          Titration of KMnO₄ against Oxalic Acid
        </h2>
        <p>
          Preparation of Standard Solution of Oxalic Acid [250 ml M/10 (0.1 M) solution] <br />
          Molecular mass of crystalline oxalic acid is, H2C2O4.2H2O = 126 <br />
          Weight of oxalic acid crystal to prepare 1000 ml of 1 M solution = 126 g
        </p>
        <div className="mt-1 flex flex-wrap">
          <p>
            Therefore, weight of oxalic acid required to prepare 250 ml of 0.1 M solution ={' '}
          </p>
          <img src={Image01} alt="simulation-theory" className="-mt-4 ml-1" />
        </div>
        <p className="mt-2">
          Determination of the strength of KMnO₄ using a standard solution of Oxalic Acid
          <br />
          In this titration, KMnO₄ is the titrant and oxalic acid is the analyte. Here,
          potassium permanganate is the oxidizing agent and oxalic acid is the reducing agent.
          The reaction between potassium permanganate and oxalic acid takes place in an acidic
          medium because the permanganate ion in an acidic medium is a very strong oxidizing
          agent. Acidity is introduced by adding dilute sulfuric acid.
        </p>
        <img src={Image02} alt="simulation-theory" className="py-2" />
        <p>
          No other indicator is used to determine the endpoint because KMnO₄ itself acts as
          an indicator. The permanganate (MnO4-) ion has a dark purple color. In an acidic
          medium, MnO4- is reduced to colorless manganous (Mn2+) ions. After reaching the
          endpoint, adding the final single drop of permanganate introduces a light pink
          color to the solution. The chemical reaction that occurs during the titration can
          be represented by chemical equations.
        </p>
      </div>
      {/* Content 5 */}
      <div className="mb-4">
        <p className="my-1">Molecular Equation</p>
        <img src={Image03} alt="simulation-theory" className="py-2" />
        <div className="mt-1 flex flex-wrap">
          <p>Overall reaction : </p>
          <img src={Image04} alt="simulation-theory" className="ml-1" />
        </div>
      </div>
      {/* Content 6 */}
      <div className="mb-4">
        <p className="my-1">Ionic Equation</p>
        <img src={Image05} alt="simulation-theory" className="py-2" />
        <div className="mt-1 flex flex-wrap">
          <p>Overall reaction : </p>
          <img src={Image06} alt="simulation-theory" className="ml-1" />
        </div>
      </div>
      {/* Content 7 */}
      <div className="pb-5">
        <h2 className="font-semibold mb-1"> Balanced Chemical Equation </h2>
        <p>
          From the balanced chemical equation, it is evident that 2 moles of KMnO₄
          react with 5 moles of oxalic acid.
          <br />
          According to the molarity equation,
        </p>
        <img src={Image07} alt="simulation-theory" className="mt-2" />
        <div className="mt-4 flex flex-wrap">
          <p>Therefore, molarity of KMnO₄ = </p>
          <img src={Image08} alt="simulation-theory" className="ml-1 -mt-4" />
        </div>
        <p>
          If oxalic acid is to be titrated, add the required amount of dilute
          sulfuric acid and heat the flask to 60°-70°C. The purpose of heating
          is to increase the rate of reaction, which is otherwise slow at room temperature.
        </p>
      </div>

      {/* Content 9 */}
      <div className="pb-5">
        <h2 className="font-semibold mb-1"> Learning Outcomes: </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Students will understand the terms - volumetric analysis, molarity,
            molality, normality, and redox titration.
          </li>
          <li>
            Students will acquire knowledge to calculate the strength of KMnO₄
            using the molarity equation.
          </li>
          <li>
            Students will understand the purpose of adding dilute sulfuric acid
            and heating the oxalic acid before titration.
          </li>
          <li>
            Students will acquire skills in preparing standard solutions of
            oxalic acid and Mohr's salt.
          </li>
          <li> Students will understand the apparatus used for titration.</li>
          <li>
            Students will acquire skills to perform redox titration in a real lab
            after understanding the various steps.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CheTheoryTemplate;
