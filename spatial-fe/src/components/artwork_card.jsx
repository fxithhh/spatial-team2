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
    if (!taxonomy) {
      return <p className="text-red-500">No taxonomy available</p>;
    }

    return (
      <div>
        {taxonomy.artistic_movement && (
          <p><strong>Artistic Movement:</strong> {taxonomy.artistic_movement}</p>
        )}
        {taxonomy.object_type && (
          <p><strong>Object Type:</strong> {taxonomy.object_type}</p>
        )}
        {taxonomy.medium && taxonomy.medium.length > 0 && (
          <div>
            <strong>Medium:</strong>
            <ul className="list-inside list-disc text-gray-500">
              {taxonomy.medium.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
        {taxonomy.associated_geography && taxonomy.associated_geography.length > 0 && (
          <div>
            <strong>Associated Geography:</strong>
            <ul className="list-inside list-disc text-gray-500">
              {taxonomy.associated_geography.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
        {taxonomy.theme && taxonomy.theme.length > 0 && (
          <div>
            <strong>Theme:</strong>
            <ul className="list-inside list-disc text-gray-500">
              {taxonomy.theme.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
        {taxonomy.exhibition_history && taxonomy.exhibition_history.length > 0 && (
          <div>
            <strong>Exhibition History:</strong>
            <ul className="list-inside list-disc text-gray-500">
              {taxonomy.exhibition_history.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
        {taxonomy.style && taxonomy.style.length > 0 && (
          <div>
            <strong>Style:</strong>
            <ul className="list-inside list-disc text-gray-500">
              {taxonomy.style.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        )}
        {taxonomy.artist && (
          <p><strong>Artist:</strong> {taxonomy.artist}</p>
        )}
        {taxonomy.year && (
          <p><strong>Year:</strong> {taxonomy.year}</p>
        )}
      </div>
    );
  };

  const renderConservationGuidelines = (guidelines) => {
    if (!guidelines || guidelines.length === 0) {
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
        src={artwork.image || 'placeholder-image-url.jpg'}
        alt={artwork.title || 'Untitled Artwork'}
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
            <div className="mt-4">
              {renderTaxonomy(artwork.taxonomy)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtworkCard;
