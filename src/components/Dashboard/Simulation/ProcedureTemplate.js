import React from "react";
import Image10 from "../../../assets/images/simulation/phy/12/01/MBridge.jpeg";
import Image11 from "../../../assets/images/simulation/phy/12/01/MeterBridgePro1.png";
import Image12 from "../../../assets/images/simulation/phy/12/01/MeterBridgePro2.png";

const ProcedureTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5">
      {/* Main Content */}
      <div className="mb-1">
        <h2 className="font-semibold"> Diagram: </h2>
        <img src={Image10} alt="simulation-theory" className="py-1" />
      </div>

      <div className="min-w-full mb-2">
        <h2 className="font-semibold mb-1"> Apparatus Required: </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>Meter bridge (slide wire bridge)</li>
          <li>Leclanche cell or Battery eliminator</li>
          <li>Galvanometer</li>
          <li>Resistance Box</li>
          <li>Jockey</li>
          <li>One-way key</li>
          <li>A resistance wire</li>
          <li>Screw gauge</li>
          <li>Meter scale</li>
          <li>Connecting wires</li>
        </ul>
      </div>
      {/* Procedure 1 */}
      <div className="mb-2 mt-4">
        <h2 className="font-semibold mb-1"> Real Lab Procedure: </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Arrange the required materials on a table and make the connections
            according to the circuit diagram.
          </li>
          <li>
            Introduce some resistance from the resistance box to the circuit.
          </li>
          <li>
            Plug the key. Touch the jockey at one end and then the other end, 
            and note the deflection of the galvanometer.
          </li>
          <li>
            If the galvanometer deflects in opposite directions, the connections are
            correct and the null point is between A and C.
          </li>
          <li>
            If not, change the resistance in the resistance box and repeat the process
            so that the null point is somewhere between A and C.
          </li>
          <li>
            Now, slowly slide the jockey along the wire from one end (say A) and
            note the deflection of the galvanometer. Continue until the 
            balancing point is reached.
          </li>
          <li>
            The balancing point is where the galvanometer shows zero deflection.
            Note the position of the jockey using the meter scale as the balance length (l).
          </li>
          <li>
            Repeat the process for different values of R and measure the balance
            length each time.
          </li>
          <li>
            Now, interchange the position of the resistance box and the unknown wire.
          </li>
          <li>
            Repeat the above steps to find the balance length for the same values of R.
          </li>
          <li>
            We can calculate the specific resistance value using the formula,
          </li>
          <img src={Image11} alt="simulation-theory" className="py-1" />
          <li>
            Measure the diameter of the given resistance wire using a screw gauge. 
            So, its radius (R) is found.
          </li>
          <li>Measure the length (L) of the wire using a meter scale.</li>
          <li>
            From the measured values, the specific resistance of the given wire can be calculated as,
          </li>
          <img src={Image12} alt="simulation-theory" className="py-1" />
        </ul>
      </div>
      {/* Procedure 2 */}
      <div className="mb-12 mt-8">
        <h2 className="font-semibold mb-1">
          Simulator Procedure (Online Lab):
        </h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            Your simulator will have a table, battery, resistance box, and meter bridge with wires.
          </li>
          <li>
            Click on the battery and resistance box displayed in the side menu to place them near the meter bridge.
          </li>
          <li>Drag the wire into the right gap of the meter bridge.</li>
          <li>Now, the "Start Experiment" button will be enabled.</li>
          <li>
            You can select your desired resistance from the resistance box by clicking on the box and selecting "Select Resistance" from the pop-up window. Close the window.
          </li>
          <li>Click the enabled button and "Insert Key".</li>
          <li>
            Now you can move the jockey over the wire by dragging your mouse or using the "Jockey Position" slider.
          </li>
          <li>
            Check galvanometer readings. Once the needle reaches zero, stop moving the jockey and note the length of the wire from the left side, say AB (l cm).
          </li>
          <li>
            Repeat the process moving from the right side and note the length from the right side as BC (100-l cm).
          </li>
          <li>
            Repeat the same procedure with a second wire and note the lengths.
          </li>
          <li>
            Take three readings for each wire and calculate its average resistance.
          </li>
          <li>
            Calculate the unknown resistance using the formula,
          </li>
          <img src={Image11} alt="simulation-theory" className="py-1" />
          <li>
            If L is the length and r is the radius, the specific resistance of the given resistance wire can be calculated as,
          </li>
          <img src={Image12} alt="simulation-theory" className="py-1" />
        </ul>
      </div>
    </div>
  );
};

export default ProcedureTemplate;
