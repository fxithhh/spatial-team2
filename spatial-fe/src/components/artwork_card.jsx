import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ArtworkCard = ({ artwork }) => {
  const [sections, setSections] = useState({
    details: true,
    conservation: false,
    taxonomy: false,
    additionalDetails: false, // State to toggle additional details
  });

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullConservation, setShowFullConservation] = useState(false);

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

  // Toggle conservation guidelines visibility
  const toggleConservation = () => {
    setShowFullConservation(!showFullConservation);
  };

  // A helper to render sections with common structure
  const renderSection = (title, content) => (
    <div className="mb-4">
      <span className="font-bold text-gray-400 mr-8 w-32">{title}</span>
      <p className="text-lg line-clamp-3 overflow-hidden text-ellipsis">{content}</p>
    </div>
  );

  // A helper to render conservation guidelines as a list, with optional "See more" functionality
  const renderConservationGuidelines = (guidelines) => {
    const guidelinesToShow = showFullConservation ? guidelines : guidelines.slice(0, 2);
    return (
      <div>
        <ul className="list-inside list-disc text-gray-600">
          {guidelinesToShow.map((guideline, index) => (
            <li key={index} className="mb-2">{guideline}</li>
          ))}
        </ul>
        {!showFullConservation && (
          <button
            onClick={toggleConservation}
            className="text-brand text-sm hover:underline mt-2">
            See more
          </button>
        )}
        {showFullConservation && (
          <button
            onClick={toggleConservation}
            className="text-brand text-sm hover:underline mt-2">
            See less
          </button>
        )}
      </div>
    );
  };

  const renderTaxonomy = (taxonomy) => {
    return taxonomy.map((entry, index) => (
      <div key={index} className="mb-4">
        {/* Show button only if there are subheadings */}
        {entry.subHeadings && entry.subHeadings.length > 0 && (
          <button
            onClick={() => toggleSection(`taxonomy-${index}`)}
            className="w-full flex justify-start items-center text-left font-bold text-gray-400"
          >
            {/* Triangle toggle symbol */}
            <span
              className={`mr-2 text-xl ${sections[`taxonomy-${index}`] ? '-rotate-90' : ''
                }`}
              style={{
                display: 'inline-block',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid gray',
              }}
            ></span>
            {entry.heading}
          </button>
        )}

        {/* Render content with subheadings only if it's toggled on */}
        {sections[`taxonomy-${index}`] && (
          <div className="mt-2">
            {entry.subHeadings.map((subHeading, subIndex) => (
              <div key={subIndex} className="ml-5">
                {subHeading.subHeading ? (
                  <div className='flex flex-col my-2'>
                    <span className="font-semibold text-gray-600">{subHeading.subHeading}:</span>
                    <p className="text-gray-500">{subHeading.content}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">{subHeading.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };


  return (
    <div className="flex flex-col">
      {/* Title and Basic Info */}
      <div className='flex justify-between'>
        <span className="font-semibold text-2xl text-black mr-4 font-['Roboto_Condensed']">{artwork.title}</span>
        <button
          onClick={() => alert('Placeholder: Clicked to add to canvas!')}
          className="flex items-center justify-center w-8 h-8 bg-brand text-white hover:bg-brandhover transition-colors"
          title="Click to add to canvas"
        >
          +
        </button>
      </div>
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

        {/* Additional Details Section */}
        <div className="mb-4 border border-gray-300 rounded p-4">
          <button
            onClick={() => toggleSection('additionalDetails')}
            className="w-full flex justify-between items-center text-left font-bold text-gray-800"
          >
            Additional Details
            {sections.additionalDetails ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
          {sections.additionalDetails && (
            <div className="mt-4">
              {renderSection('Historical Significance', artwork.historical_significance)}
              {renderSection('Style Significance', artwork.style_significance)}
              {renderSection('Exhibition Utilization', artwork.exhibition_utilisation)}
            </div>
          )}
        </div>

        {/* Conservation Guidelines Section */}
        <div className="mb-4 mt-2 border border-gray-300 rounded p-4">
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
            <div className="mt-4">
              {renderConservationGuidelines(artwork.conservation_guidelines)}
            </div>
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
            <div className="mt-2">
              {renderTaxonomy(artwork.taxonomy || [])}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
