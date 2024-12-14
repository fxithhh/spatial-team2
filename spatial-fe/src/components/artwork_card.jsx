import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ArtworkCard = ({ artwork }) => {
  const [sections, setSections] = useState({
    details: true,
    conservation: false,
    taxonomy: false,
    additionalDetails: false,
    visualContext: false,
  });

  const [expandedFields, setExpandedFields] = useState({
    description: false,
    medium: false,
    historicalSignificance: false,
    styleSignificance: false,
    exhibitionUtilization: false,
  });

  // Toggle the visibility of a section
  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle expanded content for specific fields
  const toggleField = (field) => {
    setExpandedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Render a general section with expandable content
  const renderSection = (title, content, field) => (
    <div className="mb-4">
      <span className="font-bold text-gray-400 mr-8 w-32">{title}</span>
      <p className="text-lg">
        {expandedFields[field] ? content : content?.slice(0, 100) || 'No content available'}
      </p>
      {content?.length > 100 && (
        <button
          onClick={() => toggleField(field)}
          className="text-brand text-sm hover:underline mt-2"
        >
          {expandedFields[field] ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );

  // Render taxonomy details dynamically
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
              <ul className="list-disc list-inside text-gray-500">
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

  // Render guidelines or visual context as a list
  const renderList = (items, emptyMessage) => {
    if (!Array.isArray(items) || items.length === 0) {
      return <p className="text-red-500">{emptyMessage}</p>;
    }

    return (
      <ul className="list-disc list-inside text-gray-500">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  // Render Excel images from the backend
  const renderExcelImages = (images) => {
    if (!images || images.length === 0) {
      return <p className="text-lg text-gray-500">No Additional Images Available</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {images.slice(1).map((img, index) => (
          <div key={index} className="border rounded shadow-sm p-2">
            <img
              src={img}
              alt={`Excel Image ${index + 1}`}
              className="w-full h-auto object-cover"
              onError={(e) => {
                console.error(`Error loading excel image ${index + 1}:`, img, e.target.error);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Handle empty artwork data
  if (!artwork) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Artwork Title and Basic Info */}
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

      {/* Main Artwork Image */}
      {artwork.excel_images && artwork.excel_images.length > 0 ? (
        <img
          src={artwork.excel_images[0]} // Use the first image in excel_images as the main image
          alt={artwork.title || 'Artwork'}
          className="max-w-full h-auto mb-4"
          onError={(e) => {
            console.error('Error loading main artwork image:', artwork.excel_images[0], e.target.error);
          }}
        />
      ) : (
        <p className="text-lg">No Main Image Available</p>
      )}

      {/* Additional Excel Images */}
      <h2 className="font-semibold text-lg text-gray-800 mb-2">Additional Images</h2>
      {renderExcelImages(artwork.excel_images)}

      {/* Scrollable Content Section */}
      <div className="h-full overflow-y-auto mb-4">
        {renderSection('Material', artwork.material || 'Unknown Material', 'medium')}
        {renderSection('Dimensions', artwork.dimension || 'N/A')}

        {/* Additional Details Section */}
        <div className="mb-4 border border-gray-300 rounded p-4">
          <button
            onClick={() => toggleSection('additionalDetails')}
            className="w-full flex justify-between items-center text-left font-bold text-gray-800"
          >
            Additional Details
            {sections.additionalDetails ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {sections.additionalDetails && (
            <div className="mt-4">
              {renderSection('Description', artwork.description || 'N/A', 'description')}
              {renderSection('Display Type', artwork.display_type || 'N/A')}
              {renderSection('Acquisition Type', artwork.acquisition_type || 'N/A')}
              {renderSection('Historical Significance', artwork.historical_significance || 'N/A', 'historicalSignificance')}
              {renderSection('Style Significance', artwork.style_significance || 'N/A', 'styleSignificance')}
              {renderSection('Exhibition Utilization', artwork.exhibition_utilization || 'N/A', 'exhibitionUtilization')}
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
            {sections.conservation ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {sections.conservation && (
            <div className="mt-4">
              {artwork.conservation_guidelines ? (
                <ReactMarkdown
                  children={Array.isArray(artwork.conservation_guidelines)
                    ? artwork.conservation_guidelines.join("\n\n") // Join array elements with newline
                    : artwork.conservation_guidelines // Use string as-is
                  }
                  remarkPlugins={[remarkGfm]}
                />
              ) : (
                'No conservation guidelines available'
              )}
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
            {sections.visualContext ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {sections.visualContext && (
            <div className="mt-4">
              {renderList(artwork.visual_context, 'No visual context available')}
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
            {sections.taxonomy ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
          {sections.taxonomy && <div className="mt-4">{renderTaxonomy(artwork.taxonomy)}</div>}
        </div>
      </div>
    </div>
  );
};

export default ArtworkCard;