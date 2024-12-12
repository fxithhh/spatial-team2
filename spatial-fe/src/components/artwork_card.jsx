import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ArtworkCard = ({ artwork }) => {
  const [sections, setSections] = useState({
    details: true,
    conservation: false,
    taxonomy: false,
    additionalDetails: false,
    visualContext: false,
  });

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullMedium, setShowFullMedium] = useState(false);
  const [showFullHistoricalSignificance, setShowFullHistoricalSignificance] = useState(false);
  const [showFullStyleSignificance, setShowFullStyleSignificance] = useState(false);
  const [showFullExhibitionUtilization, setShowFullExhibitionUtilization] = useState(false);

  const toggleSection = (section) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (title, content, toggleFunc, showFullState) => (
    <div className="mb-4">
      <span className="font-bold text-gray-400 mr-8 w-32">{title}</span>
      <p className="text-lg">
        {showFullState
          ? content
          : content
          ? content.slice(0, 100)
          : 'No content available'}
      </p>
      {content && content.length > 100 && (
        <button
          onClick={toggleFunc}
          className="text-brand text-sm hover:underline mt-2"
        >
          {showFullState ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );

  const renderTaxonomy = (taxonomy) => {
    if (!taxonomy || Object.keys(taxonomy).length === 0) {
      return <p className="text-red-500">No taxonomy available</p>;
    }

    return (
      <div>
        {Object.entries(taxonomy).map(([key, value]) => (
          <div key={key} className="mb-4">
            <p className="font-bold text-gray-700">{key}:</p>
            {Array.isArray(value) ? (
              <ul className="list-disc list-inside">
                {value.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{value || 'N/A'}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderConservationGuidelines = (guidelines) => {
    if (!Array.isArray(guidelines) || guidelines.length === 0) {
      return <p className="text-red-500">No conservation guidelines available</p>;
    }

    return (
      <ul className="list-inside list-disc text-gray-500">
        {guidelines.map((guideline, index) => (
          <li key={index} className="mb-2">
            {guideline}
          </li>
        ))}
      </ul>
    );
  };

  const renderVisualContext = (visualContext) => {
    if (!Array.isArray(visualContext) || visualContext.length === 0) {
      return <p className="text-red-500">No visual context available</p>;
    }

    return (
      <ul className="list-inside list-disc text-gray-500">
        {visualContext.map((item, index) => (
          <li key={index} className="mb-2">
            {item}
          </li>
        ))}
      </ul>
    );
  };

  if (!artwork) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Title and Basic Info */}
      <div className="flex justify-between">
        <h1 className="font-semibold text-2xl text-black mr-4 font-['Roboto_Condensed']">
          {artwork.title || 'Untitled Artwork'}
        </h1>
      </div>
      <p className="font-normal text-lg text-brand mr-4 font-['Roboto']">
        {artwork.artist || 'Unknown Artist'}
      </p>
      <p className="font-normal text-lg text-gray-400 mr-4 font-['Roboto']">
        {artwork.geographical_association || 'Unknown Location'}
      </p>

      {/* Artwork Image */}
      <img
        src={artwork.image}
        alt={artwork.title || "Untitled Artwork"}
        className="w-full max-w-[400px] mb-4 mx-auto"
      />

      {/* Scrollable Content Section */}
      <div className="h-full overflow-y-auto mb-4">
        {/* Material */}
        {renderSection(
          'Material',
          artwork.material || 'Unknown Material',
          () => setShowFullMedium(!showFullMedium),
          showFullMedium
        )}

        {/* Dimensions */}
        {renderSection('Dimensions', artwork.dimension || 'N/A')}

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
              {renderSection(
                'Description',
                artwork.description || 'N/A',
                () => setShowFullDescription(!showFullDescription),
                showFullDescription
              )}
              {renderSection('Display Type', artwork.display_type || 'N/A')}
              {renderSection('Acquisition Type', artwork.acquisition_type || 'N/A')}
              {renderSection(
                'Historical Significance',
                artwork.historical_significance || 'N/A',
                () => setShowFullHistoricalSignificance(!showFullHistoricalSignificance),
                showFullHistoricalSignificance
              )}
              {renderSection(
                'Style Significance',
                artwork.style_significance || 'N/A',
                () => setShowFullStyleSignificance(!showFullStyleSignificance),
                showFullStyleSignificance
              )}
              {renderSection(
                'Exhibition Utilization',
                artwork.exhibition_utilization || 'N/A',
                () => setShowFullExhibitionUtilization(!showFullExhibitionUtilization),
                showFullExhibitionUtilization
              )}
            </div>
          )}
        </div>

        {/* Conservation Guidelines Section */}
        <div className="mb-4 border border-gray-300 rounded p-4">
          <button
            onClick={() => toggleSection('conservation')}
            className="w-full flex justify-between items-center text-left font-bold text-gray-800"
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

        {/* Visual Context Section */}
        <div className="mb-4 border border-gray-300 rounded p-4">
          <button
            onClick={() => toggleSection('visualContext')}
            className="w-full flex justify-between items-center text-left font-bold text-gray-800"
          >
            Visual Context
            {sections.visualContext ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
          {sections.visualContext && (
            <div className="mt-4">
              {renderVisualContext(artwork.visual_context)}
            </div>
          )}
        </div>

        {/* Taxonomy Section */}
        <div className="mb-4 border border-gray-300 rounded p-4">
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
            <div className="mt-4">{renderTaxonomy(artwork.taxonomy)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;
