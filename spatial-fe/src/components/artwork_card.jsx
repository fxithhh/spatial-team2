import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ArtworkCard = ({ artwork }) => {
  const [sections, setSections] = useState({
    details: true,
    conservation: false,
    taxonomy: false,
  });

  const [showFullDescription, setShowFullDescription] = useState(false); // State to manage description toggle

  // Toggle individual sections
  const toggleSection = (section) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle description visibility
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  // A helper to render sections with common structure
  const renderSection = (title, content) => (
    <div className="mb-4">
      <span className="font-semibold text-gray-400 mr-8 w-32">{title}</span>
      <p className="text-lg line-clamp-3 overflow-hidden text-ellipsis">{content}</p>
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Title and Basic Info */}
      <span className="font-semibold text-2xl text-black mr-4 font-['Roboto_Condensed']">{artwork.title}</span>
      <span className="font-normal text-lg text-brand mr-4 font-['Roboto']">{artwork.artist_name}</span>
      <span className="font-normal text-lg text-gray-400 mr-4 font-['Roboto']">
        {artwork.date_of_creation}, {artwork.geographical_association}
      </span>

      {/* Artwork Image */}
      <img src={artwork.image} alt={artwork.title} className="w-full max-w-[400px] mb-4 mx-auto" />

      {/* Scrollable Content Section */}
      <div className="h-full overflow-y-auto mb-4">
        {/* Description with See More toggle */}
        <div className="mb-4">
          <span className="font-semibold text-gray-400 mr-8 w-32">Description</span>
          <p className="text-lg">
            {showFullDescription ? artwork.description : `${artwork.description.slice(0, 100)}...`}
          </p>
          <button
            onClick={toggleDescription}
            className="text-brand text-sm hover:underline">
            {showFullDescription ? 'See less' : 'See more'}
          </button>
        </div>

        {renderSection('Medium of Artwork', artwork.material)}
        {renderSection('Dimensions of Artwork', artwork.dimensions)}
        {renderSection('Display Type', artwork.display_type)}
        {renderSection('Geographical Association', artwork.geographical_association)}
        {renderSection('Acquisition Type', artwork.acquisition_type)}
        {renderSection('Historical Significance', artwork.historical_significance)}
        {renderSection('Style Significance', artwork.style_significance)}
        {renderSection('Exhibition Utilization', artwork.exhibition_utilisation)}

        {/* Conservation Guidelines Section */}
        <div className="mb-4 mt-2 border border-gray-300 rounded p-4 pb-0">
          <button
            onClick={() => toggleSection('conservation')}
            className="w-full h-fit flex justify-between items-center text-left font-bold text-gray-800"
          >
            Conservation Guidelines
            {sections.conservation ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
          {sections.conservation && (
            <>
              {renderSection(
                'Optimal Temperature',
                artwork.conservation_guidelines?.optimal_temperature || 'No optimal temperature available.'
              )}
              {renderSection(
                'Optimal Humidity',
                artwork.conservation_guidelines?.optimal_humidity || 'No optimal humidity available.'
              )}
              {renderSection(
                'Light Levels',
                artwork.conservation_guidelines?.light_levels || 'No light levels available.'
              )}
            </>
          )}
        </div>

        {/* Taxonomy Section */}
        <div className="border border-gray-300 rounded p-4">
          <button
            onClick={() => toggleSection('taxonomy')}
            className="w-full flex justify-between items-center text-left font-bold text-gray-800"
          >
            Taxonomy
            {sections.taxonomy ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
          {sections.taxonomy && (
            <p className="mt-2 text-gray-600">{artwork.taxonomy || 'No taxonomy details available.'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
