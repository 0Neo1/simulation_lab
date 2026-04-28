import React from "react";
import Image02 from "../../../assets/images/simulation/phy/12/01/MeterBridgeTheory1.png";
import Image05 from "../../../assets/images/simulation/phy/12/01/MeterBridgeTheory3.png";
import Image06 from "../../../assets/images/simulation/phy/12/01/MeterBridgeTheory4.png";
import Image07 from "../../../assets/images/simulation/phy/12/01/MeterBridgeTheory5.png";
import Image03 from "../../../assets/images/simulation/phy/12/01/Untitled-1.jpg";
import Image04 from "../../../assets/images/simulation/phy/12/01/Untitled-2.jpg";
import Image01 from "../../../assets/images/simulation/phy/12/01/Wheatstone-Bridge.jpeg";

const TheoryTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5 ">
      {/* Content 1 */}
      <div className="mb-2 ">
        <h2 className="font-semibold"> Experiment Name: </h2>
        <p> Determine the specific resistance of a wire using a meter bridge. </p>
      </div>

      <div className="mb-2">
        <h2 className="font-semibold"> Objective: </h2>
        <p>
          To find the resistance of the given wire using a meter bridge and to determine the specific resistance of its material.
        </p>
      </div>
      {/* Content 2 */}
      <div className="mb-4">
        <h2 className="font-semibold"> Theory: </h2>
        <p> According to Wheatstone's Principle: </p>
        <img src={Image01} alt="simulation-theory" className="py-1" />
        <p>
          The meter bridge operates under Wheatstone's principle. Here, four
          resistors P, Q, R, and S are connected to form the network ABCD.
          Terminals A and C are connected to a battery, and C and D
          terminals are connected to a galvanometer through keys K1 and K2.
          In a balanced state, there is no deflection in the galvanometer. Therefore,
        </p>
        <img src={Image02} alt="simulation-theory" className="py-2 ml-2" />
      </div>
      {/* Content 3 */}
      <div className="mb-2 mt-2">
        <h2 className="font-semibold"> Meter Bridge Apparatus: </h2>
        <p>
          The meter bridge, also known as the slide wire bridge, consists of a
          one-meter long uniform cross-sectional wire fixed on a wooden board.
          A scale is attached to the board. Thick metal strips are used to create
          two gaps to form the Wheatstone bridge. The gaps and terminals are used
          to connect the galvanometer and jockey.
        </p>
        <div className="flex flex-wrap my-5">
          <img src={Image03} alt="simulation-theory" className="py-1 mr-5" />
          <img src={Image04} alt="simulation-theory" className="py-2" />
        </div>
        <p>
          A resistance wire is introduced in gap S and a resistance
          box is placed in gap R. When the jockey is slid over the wire AC, it
          shows a null point at the balance condition.
        </p>
      </div>
      {/* Content 4 */}
      <div className="mb-4">
        <p className="my-2">If the length AB is l, then length BC is (100-l).</p>
        <p>Then, according to Wheatstone's principle:</p>
        <img src={Image05} alt="simulation-theory" className="py-2" />
        <p className="mt-2">Now, the unknown resistance can be calculated as,</p>
        <img src={Image06} alt="simulation-theory" className="py-2" />
        <p className="mt-2">
          Specific resistance of the wire material can be calculated using the relation,
        </p>
        <img src={Image07} alt="simulation-theory" className="py-2" />
        <p className="mt-2">where L is the length and R is the radius. </p>
      </div>
      {/* Content 5 */}
      <div className="pb-5">
        <h2 className="font-semibold mb-1"> Learning Outcomes: </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Students will understand the Wheatstone bridge and its principle.
          </li>
          <li>Students will be able to verify Wheatstone's principle.</li>
          <li>
            Students will understand the application of Wheatstone's principle through the meter bridge experiment.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TheoryTemplate;
