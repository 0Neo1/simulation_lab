import React from 'react';
import Image4 from '../../../assets/images/simulation/bio/12/01/bio4.jpg';

const BioProcedureTemplate = () => {
  return (
    <div className="flex flex-wrap text-lg font-body text-gray-900 leading-relaxed tracking-wide px-4 py-5">
      {/* Main Content */}
      <div className="mb-1">
        <h2 className="font-semibold"> Apparatus Required: </h2>
        <img src={Image4} alt="simulation-theory" className="py-1" />
      </div>

      {/* Procedure 1 */}
      <div className="mt-5">
        <h2 className="font-semibold mb-2"> Lab Procedure </h2>
        <p className="mb-2">
          Take a healthy potted plant and keep it in a dark place for 2-3 days, to destarch the leaves.
        </p>
        <ul className="list-inside leading-loose list-disc">
          <li>Cut out two identical strips of black paper.</li>
          <li>
            Fix both ends of the black paper on the leaf using paper clips.
          </li>
          <li>Now, keep the potted plant in sunlight for the whole day.</li>
          <li>
            Pluck the covered leaf in the late afternoon and remove the black paper from it.
          </li>
          <li>
            Take a beaker containing distilled water and place it on a hot plate, then boil the water.
          </li>
          <li>
            Remove the beaker from the hot plate and let it cool for some time.
          </li>
          <li>
            Take another beaker containing distilled water, place it on the hot plate, and boil it at about 60°C.
          </li>
          <li>Pour some alcohol into a clean boiling tube.</li>
          <li>Place the boiling tube into the beaker containing the boiled water.</li>
          <li>Remove the leaf from the beaker using forceps.</li>
          <li>Place the leaf into the boiling tube containing alcohol.</li>
          <li>Keep the boiling tube in the beaker until the leaf becomes colorless.</li>
          <li>Remove the leaf from the boiling tube using forceps.</li>
          <li>Wash the leaf by dipping it into a beaker containing distilled water.</li>
          <li>Now place the leaf in a Petri dish.</li>
          <li>
            Take a few drops of iodine solution using a dropper and drop them onto the leaf.
          </li>
        </ul>
      </div>

      {/* Procedure 2 */}
      <div className="mt-5">
        <h2 className="font-semibold mb-1">Observation</h2>
        <ul className="list-inside leading-loose list-disc">
          <li>
            After iodine treatment, the exposed part of the leaf turns blue-black.
          </li>
          <li>The unexposed part of the leaf turns pale yellow-brown.</li>
        </ul>
      </div>

      {/* Procedure 3 */}
      <div className="mt-5">
        <h2 className="font-semibold mb-1">Conclusion</h2>
        <p>
          We know that starch is one of the end products of photosynthesis, and our observation
          shows that only the parts of the leaf exposed to sunlight turned blue-black with iodine.
          Since starch turns blue-black with iodine, the parts of the leaf that turned blue-black
          indicate photosynthetic activity, while the unexposed part shows the opposite. This clearly
          indicates that light is essential for photosynthesis.
        </p>
      </div>

      {/* Procedure 4 */}
      <div className="mb-6 mt-5">
        <h2 className="font-semibold mb-1">Precautions</h2>
        <ul className="list-inside leading-loose list-disc">
          <li>The experimental leaf must be healthy.</li>
          <li>
            Clip the black paper carefully on the leaf, so that the covered portion is not exposed to sunlight.
          </li>
          <li>After boiling the leaf in alcohol, wash it in water.</li>
        </ul>
      </div>
    </div>
  );
};

export default BioProcedureTemplate;
