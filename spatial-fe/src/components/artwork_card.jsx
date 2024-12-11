import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ArtworkCard = ({ artwork }) => {
  const [sections, setSections] = useState({
    details: true,
    conservation: false,
    taxonomy: false,
    additionalDetails: false,
  });

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullConservation, setShowFullConservation] = useState(false);
  const [showFullMedium, setShowFullMedium] = useState(false);
  const [showFullHistoricalSignificance, setShowFullHistoricalSignificance] = useState(false);
  const [showFullStyleSignificance, setShowFullStyleSignificance] = useState(false);
  const [showFullExhibitionUtilization, setShowFullExhibitionUtilization] = useState(false);
  const [showFullDimension, setShowFullDimension] = useState(false);


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

  const toggleMedium = () => {
    setShowFullMedium(!showFullMedium);
  };

  const toggleHistoricalSignificance = () => {
    setShowFullHistoricalSignificance(!showFullHistoricalSignificance);
  };

  const toggleStyleSignificance = () => {
    setShowFullStyleSignificance(!showFullStyleSignificance);
  };

  const toggleExhibitionUtilization = () => {
    setShowFullExhibitionUtilization(!showFullExhibitionUtilization);
  };

  const toggleDimension = () => {
    setShowFullDimension(!showFullDimension);
  };

  const renderSection = (title, content, toggleFunc, showFullState) => (
    <div className="mb-4">
      <span className="font-bold text-gray-400 mr-8 w-32">{title}</span>
      <p className="text-lg">
        {showFullState
          ? content
          : content ? content.slice(0, 100) : "No content available"}
      </p>
      {content && content.length > 100 && (
        <button onClick={toggleFunc} className="text-brand text-sm hover:underline mt-2">
          {showFullState ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );

  const renderConservationGuidelines = (guidelines) => {
    if (!guidelines || guidelines.length === 0) {
      return <p className="text-red-500">No conservation guidelines available</p>;
    }

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
    if (!taxonomy || taxonomy.length === 0) {
      return <p className="text-red-500">No taxonomy available</p>;
    }

    return taxonomy.map((entry, index) => (
      <div key={index} className="mb-4">
        {entry.subHeadings && entry.subHeadings.length > 0 && (
          <button
            onClick={() => toggleSection(`taxonomy-${index}`)}
            className="w-full flex justify-start items-center text-left font-bold text-gray-400"
          >
            <span
              className={`mr-2 text-xl ${sections[`taxonomy-${index}`] ? '-rotate-90' : ''}`}
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


  if (!artwork) {
    return <div>Loading...</div>; // Or some other loading indicator
  }

  return (
    <div className="flex flex-col">
      {/* Title and Basic Info */}
      <div className="flex justify-between">
        <span className="font-semibold text-2xl text-black mr-4 font-['Roboto_Condensed']">{artwork["Artwork Title"] || "Untitled"}</span>
      </div>
      <span className="font-normal text-lg text-brand mr-4 font-['Roboto']">{artwork["Artist Name"] || "Unknown Artist"}</span>
      <span className="font-normal text-lg text-gray-400 mr-4 font-['Roboto']">
        {artwork[" Dating"] || "Unknown Date"}, {artwork["Geographical Association "] || "Unknown Location"}
      </span>

      {/* Artwork Image */}
      <img
        src={artwork.Image !== "#VALUE!" ? artwork.Image : "placeholder-image-url.jpg"}
        alt={artwork["Artwork Title"] || "Untitled Artwork"}
        className="w-full max-w-[400px] mb-4 mx-auto"
      />

      {/* Scrollable Content Section */}
      <div className="h-full overflow-y-auto mb-4">
        {/* Description with See More toggle */}
        <div className="mb-4">
          <span className="font-semibold text-gray-400 mr-8 w-32">Description</span>
          <p className="text-lg">
            {showFullDescription
              ? (artwork["Artwork Description "] || "No description available.")
              : (artwork["Artwork Description "] ? artwork["Artwork Description "].slice(0, 100) : "No description available.")
            }
          </p>
          <button
            onClick={toggleDescription}
            className="text-brand text-sm hover:underline">
            {showFullDescription ? 'See less' : 'See more'}
          </button>
        </div>

        {/* Render sections with "See More" toggle */}
        {renderSection('Medium of Artwork', artwork["Material"] || "Unknown Material", toggleMedium, showFullMedium)}
        {renderSection('Dimensions of Artwork', artwork["Dimension"] || "N/A", toggleDimension, showFullDimension)}
        {renderSection('Display Type', artwork["Display Type"] || "N/A")}
        {renderSection('Geographical Association', artwork["Geographical Association"] || "N/A")}
        {renderSection('Acquisition Type', artwork["Acquisition Type"] || "N/A")}

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
              {renderSection('Historical Significance', artwork["Historical Significance"] || "N/A", toggleHistoricalSignificance, showFullHistoricalSignificance)}
              {renderSection('Style Significance', artwork["Style Significance"] || "N/A", toggleStyleSignificance, showFullStyleSignificance)}
              {renderSection('Exhibition Utilization', artwork["Exhibition Utilisation "] || "N/A", toggleExhibitionUtilization, showFullExhibitionUtilization)}
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
              {renderConservationGuidelines(artwork.conservation_guidelines || [])}
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
