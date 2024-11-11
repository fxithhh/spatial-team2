import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css'; // Import styles
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ImCross } from 'react-icons/im';
import { AiOutlineDown } from "react-icons/ai";
import { AiOutlineUp } from "react-icons/ai";

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

    const [formData, setFormData] = useState({
        title: "",
        dimensions: "",
        description: "",
        artist_name: "",
        date_of_creation: "",
        material: [],
        display_type: [],
        geographical_association: "",
        acquisition_type: "",
        historical_significance: "",
        style_significance: "",
        exhibition_utilisation: "",
    });

    const materialOptions = ["Painting", "Sculpture", "Photography", "Digital Art", "Mixed Media", "Canvas"];
    const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

    const displayOptions = ["Wall Hanging", "Floor", "Ceiling Hanging", "Screen",];
    const [isDisplayDropdownOpen, setIsDisplayDropdownOpen] = useState(false);

    // Handle multi-select dropdown toggle for material
    const toggleMaterialDropdown = () => {
        setIsMaterialDropdownOpen((prevState) => !prevState);
    };

    // Handle multi-select dropdown toggle for display type
    const toggleDisplayDropdown = () => {
        setIsDisplayDropdownOpen((prevState) => !prevState);
    };

    // Handle multi-select dropdown for material
    const handleMaterialSelect = (option) => {
        setFormData((prevFormData) => {
            // Check if option is already selected, if so, remove it; otherwise, add it
            const updatedMaterials = prevFormData.material.includes(option)
                ? prevFormData.material.filter(item => item !== option)
                : [...prevFormData.material, option];
            return {
                ...prevFormData,
                material: updatedMaterials,
            };
        });
    };

    // Handle multi-select dropdown for display type
    const handleDisplaySelect = (option) => {
        setFormData((prevFormData) => {
            // Check if option is already selected, if so, remove it; otherwise, add it
            const updatedDisplay = prevFormData.display_type.includes(option)
                ? prevFormData.display_type.filter(item => item !== option)
                : [...prevFormData.display_type, option];
            return {
                ...prevFormData,
                display_type: updatedDisplay,
            };
        });
    };

    // Handle tag removal for material
    const handleRemoveMaterialTag = (option) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            material: prevFormData.material.filter(item => item !== option),
        }));
    };

    // Handle tag removal for display
    const handleRemoveDisplayTag = (option) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            display_type: prevFormData.display_type.filter(item => item !== option),
        }));
    };

    // Handle input changes dynamically
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        // Process formData or send it to an API
    };

    return (
        <div>
            <Popup open={isOpen} onClose={closeAddArtwork} contentStyle={contentStyle} overlayStyle={overlayStyle}>
                {/* Close button inside the popup */}
                <ImCross
                    className="text-brand-gray1 ml-auto mr-8 mt-6 cursor-pointer"
                    onClick={closeAddArtwork} // Close the popup when the icon is clicked
                />
                <div className="px-12 py-2 mb-8 font-['Roboto_Condensed']">
                    <h2 className="font-semibold text-3xl">Import Artwork</h2>

                    {/* form */}
                    <div className="my-8">
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Artwork Title Input */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Title of Artwork <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Artist Name Input */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Artist Name <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="artist_name"
                                    name="artist_name"
                                    value={formData.artist_name}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Date of Creation Input */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Date of Creation <span className='text-brand'>*</span></label>
                                <input
                                    type="date"
                                    id="date_of_creation"
                                    name="date_of_creation"
                                    value={formData.date_of_creation}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Material of Artwork Input */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Material of Artwork <span className='text-brand'>*</span></label>
                                <div className="border-b-2 outline-none py-2 flex items-center gap-2">
                                    {formData.material.map((option) => (
                                        <span key={option} className="bg-brand text-white px-2 py-1 flex items-center">
                                            {option}
                                            <ImCross
                                                onClick={() => handleRemoveMaterialTag(option)}
                                                className="ml-2 text-sm cursor-pointer"
                                            />
                                        </span>
                                    ))}
                                    <span className="ml-auto text-gray-400 cursor-pointer" onClick={toggleMaterialDropdown}>
                                        {isMaterialDropdownOpen ? <AiOutlineUp /> : <AiOutlineDown />}

                                    </span>

                                </div>
                                {isMaterialDropdownOpen && (
                                    <div className="relative w-full bg-white border rounded-md shadow-md z-10">
                                        {materialOptions.map((option) => (
                                            <div
                                                key={option}
                                                className="p-2 cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleMaterialSelect(option)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.material.includes(option)}
                                                    readOnly
                                                />
                                                <span className="ml-2">{option}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dimensions of Artwork */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Dimensions of Artwork <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="dimensions"
                                    name="dimensions"
                                    value={formData.dimensions}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Display Type Input */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Display Type <span className='text-brand'>*</span></label>
                                <div className="border-b-2 outline-none py-2 flex items-center gap-2">
                                    {formData.display_type.map((option) => (
                                        <span key={option} className="bg-brand text-white px-2 py-1 flex items-center">
                                            {option}
                                            <ImCross
                                                onClick={() => handleRemoveDisplayTag(option)}
                                                className="ml-2 text-sm cursor-pointer"
                                            />
                                        </span>
                                    ))}
                                    <span className="ml-auto text-gray-400 cursor-pointer" onClick={toggleDisplayDropdown}>
                                        {isDisplayDropdownOpen ? <AiOutlineUp /> : <AiOutlineDown />}

                                    </span>

                                </div>
                                {isDisplayDropdownOpen && (
                                    <div className="relative w-full bg-white border rounded-md shadow-md z-10">
                                        {displayOptions.map((option) => (
                                            <div
                                                key={option}
                                                className="p-2 cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleDisplaySelect(option)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.display_type.includes(option)}
                                                    readOnly
                                                />
                                                <span className="ml-2">{option}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Geographical Association */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Geographical Association <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="geographical_association"
                                    name="geographical_association"
                                    value={formData.geographical_association}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Acquisition Type */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Acquisition Type <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="acquisition_type"
                                    name="acquisition_type"
                                    value={formData.acquisition_type}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Historical Significance */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Historical Significance <span className='text-sm text-gray-300'>(Optional)</span></label>
                                <input
                                    type="text"
                                    id="historical_significance"
                                    name="historical_significance"
                                    value={formData.historical_significance}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                />
                            </div>

                            {/* Style Significance */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Style Significance <span className='text-sm text-gray-300'>(Optional)</span></label>
                                <input
                                    type="text"
                                    id="style_significance"
                                    name="style_significance"
                                    value={formData.style_significance}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                />
                            </div>

                            {/* Exhibition Utilisation */}
                            <div className='my-8'>
                                <label className="font-semibold text-gray-400 text-xl">Exhibition Utilisation <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="exhibition_utilisation"
                                    name="exhibition_utilisation"
                                    value={formData.exhibition_utilisation}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <div className='mx-auto flex justify-center'>
                                <button
                                    type="submit"
                                    className="bg-brand text-white py-2 px-8 rounded hover:bg-brandhover"
                                >
                                    Save Artwork
                                </button>
                            </div>
                        </form>
                        <ToastContainer />
                    </div>

                </div>
            </Popup>
        </div>
    );
}

export default ImportArtWork;
