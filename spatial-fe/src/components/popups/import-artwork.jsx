import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css'; // Import styles
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ImCross } from 'react-icons/im';
import { FaAngleDown } from "react-icons/fa6";
import { FaAngleUp } from "react-icons/fa6";
import { XMarkIcon } from '@heroicons/react/24/outline';

function ImportArtWork({ isOpen, closeAddArtwork, exhibitionId }) {
    console.log("Exhibition ID passed to ImportArtWork:", exhibitionId);
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
        width: "",
        height: "",
        breadth: "",
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
        image: null,
    });

    const displayOptions = ["Wall Hanging", "Floor", "Ceiling Hanging", "Screen"];
    const [isDisplayDropdownOpen, setIsDisplayDropdownOpen] = useState(false);

    // Preview uploaded image
    const [previewImage, setPreviewImage] = useState(null);

    // Handle multi-select dropdown toggle for display type
    const toggleDisplayDropdown = () => {
        setIsDisplayDropdownOpen((prevState) => !prevState);
    };

    // Handle multi-select dropdown for display type
    const handleDisplaySelect = (option) => {
        setFormData((prevFormData) => {
            const updatedDisplay = prevFormData.display_type.includes(option)
                ? prevFormData.display_type.filter(item => item !== option)
                : [...prevFormData.display_type, option];
            return {
                ...prevFormData,
                display_type: updatedDisplay,
            };
        });
    };

    // Handle tag removal for display
    const handleRemoveDisplayTag = (option) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            display_type: prevFormData.display_type.filter(item => item !== option),
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
            if (allowedTypes.includes(file.type)) {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    image: file,
                }));
                setPreviewImage(URL.createObjectURL(file)); // Preview the uploaded image
            } else {
                // Show toast error for unsupported file types
                toast.error("Only PNG, JPG, and JPEG files are allowed.");
                e.target.value = ""; // Clear the input field
            }
        }
    };

    // Function to convert image to Base64 and strip MIME type
    const encodeImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(",")[1]; // Remove MIME type prefix
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file); // Encodes the File object
        });
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
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Add the exhibitionId to the form data
            const dataToSend = { ...formData, exhibition_id: exhibitionId };
            console.log("Payload sent to backend:", dataToSend);

            // Convert the image file to raw Base64 if it exists
            if (formData.image && formData.image instanceof File) {
                console.log("Processing image as File object:", formData.image);
                const base64Image = await encodeImage(formData.image); // Raw Base64 string
                dataToSend.image = base64Image; // Send only the raw Base64 string
            }

            // Submit the JSON data to the backend
            const response = await fetch("http://localhost:5000/add_artwork", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                toast.success("Artwork uploaded successfully!");
                console.log("Artwork uploaded successfully");
                closeAddArtwork(); // Close the popup on success
            } else {
                toast.error("Failed to upload artwork.");
                console.error("Failed to upload artwork");
            }
        } catch (error) {
            toast.error("Submission Error. Please try again.");
            console.error("Submission Error:", error);
        }
    }

    return (
        <div>
            <Popup open={isOpen} onClose={closeAddArtwork} contentStyle={contentStyle} overlayStyle={overlayStyle}>
                {/* Close button inside the popup */}
                <XMarkIcon
                    className="text-brand-gray1 ml-auto mr-8 mt-6 h-6 w-6 cursor-pointer"
                    onClick={closeAddArtwork} // Close the popup when the icon is clicked
                />
                <div className="px-12 py-2 mb-8 font-['Roboto_Condensed']">
                    <h2 className="font-semibold text-3xl">Import Artwork</h2>

                    {/* form */}
                    <div className="my-8">
                        <form onSubmit={handleSubmit} className="">

                            {/* Artwork Title Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Title of Artwork <span className='text-brand'>*</span></label>
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

                            {/* Artwork Description Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl  font-['Roboto']">Artwork Description <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Artist Name Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl  font-['Roboto']">Artist Name <span className='text-brand'>*</span></label>
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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Date of Creation <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="date_of_creation"
                                    name="date_of_creation"
                                    value={formData.date_of_creation}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Material of Artwork Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Material of Artwork <span className='text-brand'>*</span></label>
                                <input
                                    type="text"
                                    id="material"
                                    name="material"
                                    value={formData.material}
                                    onChange={handleInputChange}
                                    className="w-full mt-2 border-b-2 outline-none"
                                    required
                                />
                            </div>

                            {/* Dimensions of Artwork */}
                            <div className='my-8 pb-4'>
                                <label className="w-full font-medium text-gray-400 text-xl font-['Roboto']">Dimensions of Artwork <span className='text-brand'>*</span></label>
                                <br></br> <br></br>
                                {/* Width Input */}
                                <input
                                    type="number"
                                    id="width"
                                    name="width"
                                    value={formData.width}
                                    onChange={handleInputChange}
                                    className="w-30 p-2 mr-2 border-2 border-gray-300 outline-none"
                                    placeholder="Width"
                                    required
                                />
                                {/* "x" separator */}
                                <span className="text-gray-600"> x </span>

                                {/* Height Input */}
                                <input
                                    type="number"
                                    id="height"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                    className="w-30 p-2 mx-2 border-2 border-gray-300 outline-none"
                                    placeholder="Height"
                                    required
                                />
                                {/* "x" separator */}
                                <span className="text-gray-600"> x </span>

                                {/* Breadth Input */}
                                <input
                                    type="number"
                                    id="breadth"
                                    name="breadth"
                                    value={formData.breadth}
                                    onChange={handleInputChange}
                                    className="w-30 p-2 mx-2 border-2 border-gray-300 outline-none"
                                    placeholder="Breadth"
                                    required
                                />
                                {/* cm unit */}
                                <span className="text-gray-600">cm</span>
                            </div>

                            {/* Display Type Input */}
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Display Type <span className='text-brand'>*</span></label>
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
                                    <span className="ml-auto text-gray-400 cursor-pointer pr-2 pl-20" onClick={toggleDisplayDropdown}>
                                        {isDisplayDropdownOpen ? <FaAngleUp className='text-xl' /> : <FaAngleDown className='text-xl' />}

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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Geographical Association <span className='text-brand'>*</span></label>
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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Acquisition Type <span className='text-brand'>*</span></label>
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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Historical Significance <span className='text-sm text-gray-300'>(Optional)</span></label>
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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Style Significance <span className='text-sm text-gray-300'>(Optional)</span></label>
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
                            <div className='my-8 pb-4'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Exhibition Utilisation <span className='text-brand'>*</span></label>
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

                            {/* Artwork Image Upload */}
                            <div className='my-8 pb-4 flex flex-col'>
                                <label className="font-medium text-gray-400 text-xl font-['Roboto']">Artwork Image <span className='text-brand'>*</span></label>
                                <span className="font-normal text-gray-400 text-m">
                                    Upload the artwork image. Accepted format: JPG, JPEG, PNG.
                                </span>
                                <label
                                    htmlFor="artwork-image"
                                    className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit"
                                >
                                    Upload Artwork Image
                                </label>
                                <input
                                    id='artwork-image'
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/png"
                                    className="hidden"
                                />

                                {/* Image Preview */}
                                {previewImage && (
                                    <div className="my-4">
                                        <p className="font-medium text-brand text-lg">Image Preview:</p>
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
                                    Save Artwork
                                </button>
                            </div>
                        </form>
                        <ToastContainer position="bottom-right" autoClose={3000} />
                    </div>

                </div>
            </Popup>
        </div>
    );
}

export default ImportArtWork;
