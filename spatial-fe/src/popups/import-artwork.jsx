import React from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css'; // Import styles
import { ImCross } from 'react-icons/im';

function ImportArtWork({ isOpen, closeAddArtwork }) {
    // Style popup
    const contentStyle = {
        borderRadius: '0.5em',
        maxHeight: '50em',
        overflowY: 'auto',
    };

    const overlayStyle = {
        background: 'rgba(0,0,0,0.7)',
    };

    return (
        <div>
            <Popup open={isOpen} onClose={closeAddArtwork} contentStyle={contentStyle} overlayStyle={overlayStyle}>
                {/* Close button inside the popup */}
                <ImCross
                    className="text-brand-gray1 ml-auto mr-8 mt-6 cursor-pointer"
                    onClick={closeAddArtwork} // Close the popup when the icon is clicked
                />
                <div className="px-12 py-2 mb-8">
                    <h3 className="font-semibold text-2xl">Import Artwork</h3>
                    {/* Your content for the artwork form goes here */}
                    <p>Form or artwork details can be added here...</p>
                </div>
            </Popup>
        </div>
    );
}

export default ImportArtWork;
