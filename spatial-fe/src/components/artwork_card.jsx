// ArtworkDetails.jsx
import React from 'react';

const ArtworkCard = ({ artwork }) => {
  return (
    <div className="font-['Roboto_Condensed']">
      <img src={artwork.image} alt={artwork.title} className="w-full" />

      <div className="mt-4">
        {/* Title and Dimensions container */}
        <div className="flex mb-2 text-xl">
          <span className="font-semibold text-gray-400 mr-8 w-32">Name</span>
          <p className="">{artwork.title}</p>
        </div>

        <div className="flex mb-2 text-xl">
          <span className="font-semibold text-gray-400 mr-8 w-32">Dimensions</span>
          <p className="">{artwork.dimensions}</p>
        </div>

        {/* Description container */}
        <div className="text-xl">
          <span className="font-semibold text-gray-400 mr-8 w-32">Description</span>
          <p className="text-xl">{artwork.description}</p>
        </div>
      </div>
    </div>

  );
};

export default ArtworkCard;
