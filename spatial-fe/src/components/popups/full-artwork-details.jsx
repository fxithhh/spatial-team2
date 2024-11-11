import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css'; // Import styles
import { ImCross } from 'react-icons/im';

function FullArtworkDetails({ isOpen, closeArtworkDetails, artwork }) {
    // Style popup
    const contentStyle = {
        borderRadius: '0.5em',
        maxHeight: '50em',
        overflowY: 'auto',
    };

    const overlayStyle = {
        background: 'rgba(0,0,0,0.7)',
    };

    // tabs
    const tabs = [
        { id: 1, label: "artwork details" },
        { id: 2, label: "conservation guidelines" },
    ];

    const [activeTab, setActiveTab] = useState("artwork details");
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div>
            <Popup open={isOpen} onClose={closeArtworkDetails} contentStyle={contentStyle} overlayStyle={overlayStyle}>
                {/* Close button inside the popup */}
                <ImCross
                    className="text-brand-gray1 ml-auto mr-8 mt-6 cursor-pointer"
                    onClick={closeArtworkDetails} // Close the popup when the icon is clicked
                />
                <div className="font-['Roboto_Condensed'] px-12 py-2 mb-8">
                    {artwork ? (
                        <>
                            <h2 className="font-semibold text-4xl">{artwork.title}</h2>
                            <p className='text-brand text-2xl my-2'>{artwork.artist_name}</p>
                            <p className='text-gray-400 text-xl my-2'>{artwork.date_of_creation}, {artwork.geographical_association}</p>
                            <img src={artwork.image} alt={artwork.title} className="w-full my-8" />

                            <div className="flex justify-around mt-4 ">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            handleTabClick(tab.label)
                                            console.log(`${tab.label}`)
                                        }
                                        }
                                        className={`w-full uppercase text-xl ${activeTab === tab.label ? "border-b-4 border-brand" : "border-b-2 border-gray-500 text-gray-500"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}

                            </div>

                            {/* content if on artwork details */}
                            {activeTab === "artwork details" && (
                                <div className="mt-4">
                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Display Setting</span>
                                        <p className="capitalize">{artwork.display_type}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Material of Artwork</span>
                                        <p className="capitalize">{artwork.material}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Acquisition Type</span>
                                        <p className="capitalize">{artwork.acquisition_type}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Historical Significance</span>
                                        <p className="capitalize">{artwork.historical_significance}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Style Significance</span>
                                        <p className="capitalize">{artwork.style_significance}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Exhibition Utilisation</span>
                                        <p className="capitalize">{artwork.exhibition_utilisation}</p>
                                    </div>

                                </div>
                            )}

                            {/* content if on conservation guidelines */}
                            {activeTab === "conservation guidelines" && (

                                <div className="mt-4">
                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Optimal Temperature</span>
                                        <p className="capitalize">{artwork.conservation_guidelines.optimal_temperature}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Optimal Humidity</span>
                                        <p className="capitalize">{artwork.conservation_guidelines.optimal_humidity}</p>
                                    </div>

                                    <div className="flex mb-4 text-xl">
                                        <span className="text-gray-400 mr-8 w-60">Light Levels</span>
                                        <p className="capitalize">{artwork.conservation_guidelines.light_levels}</p>
                                    </div>
                                </div>
                            )}
                        </>

                    ) : (
                        <p className="text-xl text-red-500">
                            Select an artwork to display its information.
                        </p>
                    )}

                </div>
            </Popup>
        </div>
    );
}

export default FullArtworkDetails;
