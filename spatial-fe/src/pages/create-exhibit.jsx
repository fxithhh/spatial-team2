import React, { useState } from 'react';
import "react-toastify/dist/ReactToastify.css";
import Button from '../components/buttons';
import 'reactjs-popup/dist/index.css'; // Import styles
import { toast, ToastContainer } from "react-toastify";
import ImportArtWork from '../components/popups/import-artwork';

import { ImCross } from 'react-icons/im';
import { FaAngleDown } from "react-icons/fa6";
import { FaAngleUp } from "react-icons/fa6";


function CreateExhibit() {

    const [isAddArtworkOpen, setIsAddArtworkOpen] = useState(false); // add artwork popup

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
        exhibit_title: "",
        concept: "",
        subsections: [],
        floor_plan: null
    });

    const subsectionsOptions = ["Painting", "Sculpture", "Photography", "Digital Art", "Mixed Media", "Canvas"];
    const [isSubsectionsDropdownOpen, setIsSubsectionsDropdownOpen] = useState(false);

    // preview uploaded image
    const [previewImage, setPreviewImage] = useState(null);

    // Handle multi-select dropdown toggle for Subsections
    const toggleSubsectionsDropdown = () => {
        setIsSubsectionsDropdownOpen((prevState) => !prevState);
    };

    // Handle multi-select dropdown for subsections
    const handleSubsectionsSelect = (option) => {
        setFormData((prevFormData) => {
            // Check if option is already selected, if so, remove it; otherwise, add it
            const updatedSubsections = prevFormData.subsections.includes(option)
                ? prevFormData.subsections.filter(item => item !== option)
                : [...prevFormData.subsections, option];
            return {
                ...prevFormData,
                subsections: updatedSubsections,
            };
        });
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

    // Handle tag removal for subsections
    const handleRemoveSubsectionsTag = (option) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            subsections: prevFormData.subsections.filter(item => item !== option),
        }));
    };

    // handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                floor_plan: file,
            }));
            setPreviewImage(URL.createObjectURL(file)); // Generate preview URL
        }
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
        try {
            console.log('Form Data:', formData);
            toast.success("Form submitted successfully!");
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error("An error occurred while submitting the form. Please try again.");
        }
    };

    const materialOptions = ["Painting", "Sculpture", "Photography", "Digital Art", "Mixed Media", "Canvas"];
    const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

    // Handle multi-select dropdown toggle for material
    const toggleMaterialDropdown = () => {
        setIsMaterialDropdownOpen((prevState) => !prevState);
    };

    // Handle tag removal for material
    const handleRemoveMaterialTag = (option) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            material: prevFormData.material.filter(item => item !== option),
        }));
    };

    // open and close add artwork popup
    const openAddArtwork = () => {
        setIsAddArtworkOpen(true);
    };

    const closeAddArtwork = () => {
        setIsAddArtworkOpen(false);
    };

    return (
        <div className="my-12 mx-auto w-1/2 font-['Roboto_Condensed']">
            <div>
                <div className="px-12 py-2 mb-8 font-['Roboto_Condensed']">
                    <h1 className="text-5xl font-semibold mb-4">Create New Exhibition</h1>

                    {/* form */}
                    <div className="my-8">
                        <form onSubmit={handleSubmit} className="">

                            {/* Exhibit Title Input */}
                            <div className='my-8 pb-4 grid grid-row-6'>
                                <label className="font-semibold text-gray-400 text-xl col-span-2">Title of Exhibition <span className='text-brand'>*</span></label>
                                <textarea
                                    type="text"
                                    id="exhibit_title"
                                    name="exhibit_title"
                                    value={formData.exhibit_title}
                                    onChange={handleInputChange}
                                    className="col-span-4 h-20 border-2 border-gray-400 outline-none px-1"
                                    required
                                />
                            </div>

                            {/* Concept Input */}
                            <div className='my-8 pb-4 grid grid-row-6'>
                                <label className="font-semibold text-gray-400 text-xl col-span-2 pr-4">What is your conceptual design in exhibition is about? <span className='text-brand'>*</span></label>
                                <textarea
                                    type="text"
                                    id="concept"
                                    name="concept"
                                    value={formData.concept}
                                    onChange={handleInputChange}
                                    className="col-span-4 h-20 border-2 border-gray-400 outline-none px-1"
                                    required
                                />
                            </div>

                            {/* Exhibition Subsections Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-semibold text-gray-400 text-xl">Exhibition Subsections <span className='text-brand'>*</span></label>
                                <div className="border-b-2 outline-none py-2 flex items-center gap-2">
                                    {formData.material && formData.material.map((option) => (
                                        <span key={option} className="bg-brand text-white px-2 py-1 flex items-center">
                                            {option}
                                            <ImCross
                                                onClick={() => handleRemoveMaterialTag(option)}
                                                className="ml-2 text-sm cursor-pointer"
                                            />
                                        </span>
                                    ))}
                                    <span className="ml-auto text-gray-400 cursor-pointer pr-2 pl-20" onClick={toggleSubsectionsDropdown}>
                                        {isSubsectionsDropdownOpen ? <FaAngleUp className='text-xl' /> : <FaAngleDown className='text-xl' n />}

                                    </span>

                                </div>
                                {isSubsectionsDropdownOpen && (
                                    <div className="relative w-full bg-white border rounded-md shadow-md z-10">
                                        {subsectionsOptions.map((option) => (
                                            <div
                                                key={option}
                                                className="p-2 cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSubsectionsSelect(option)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.subsections.includes(option)}
                                                    readOnly
                                                />
                                                <span className="ml-2">{option}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Artwork Input */}
                            <div className='pb-4'>
                                <div className="flex items-center justify-between">
                                    <label className="font-semibold text-gray-400 text-xl">
                                        Artworks Used in Exhibition <span className="text-brand">*</span>
                                    </label>
                                    <Button
                                        size={{ width: '10em', height: '2em' }}
                                        text="+ Add Artwork"
                                        onClick={openAddArtwork}
                                    />
                                </div>
                                <div className="mt-8 h-[200px] border-2 border-gray-400 overflow-y-auto outline-none px-1">

                                </div>
                            </div>

                            {/* Floor Plan Upload */}
                            <div className='my-8 pb-4'>
                                <label className="font-semibold text-gray-400 text-xl">Floor Plan <span className='text-brand'>*</span></label>
                                <input
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="w-full mt-2"
                                />

                                {/* Image Preview */}
                                {previewImage && (
                                    <div className="my-4">
                                        <p className="font-semibold text-brand text-lg">Image Preview:</p>
                                        <img src={previewImage} alt="Preview" className="w-full h-auto mt-2" />
                                    </div>
                                )}
                            </div>


                            {/* Submit Button */}
                            <div className='mx-auto flex justify-center'>
                                <button
                                    type="submit"
                                    className="bg-brand text-white py-2 px-8 rounded hover:bg-brandhover"
                                >
                                    Create Exhibit
                                </button>
                            </div>
                        </form>
                        <ToastContainer position="bottom-right" autoClose={3000} />
                    </div>

                </div>
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
            {isAddArtworkOpen && (<ImportArtWork isOpen={isAddArtworkOpen} closeAddArtwork={closeAddArtwork} />)}
        </div>
    );
}

export default CreateExhibit;
