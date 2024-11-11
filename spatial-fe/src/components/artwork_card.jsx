// ArtworkDetails.jsx
import React from 'react';

const ArtworkCard = ({ artwork }) => {
  return (
    <div className="mt-4 p-4 border-t-2 border-gray-300">
      <p><strong>Image:</strong> <img src={artwork.image} alt={artwork.title} className="w-48 mt-2" /></p>
      <h3 className="text-xl font-semibold mb-2">{artwork.title}</h3>
      <p><strong>Dimensions:</strong> {artwork.dimensions}</p>
      <p><strong>Description:</strong> {artwork.description}</p>
    </div>
  );
};

export default ArtworkCard;
