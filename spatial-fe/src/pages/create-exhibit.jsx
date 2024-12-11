import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import 'reactjs-popup/dist/index.css';
import { toast, ToastContainer } from "react-toastify";
import { XMarkIcon } from '@heroicons/react/24/outline';

function CreateExhibit() {

    const [formData, setFormData] = useState({
        exhibit_title: "",
        description: "",
        concept: "",
        subsections: [],
        floor_plan: null
    });
    const [fileName, setFileName] = useState('');
    const [imgFileName, setImgFileName] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const navigate = useNavigate();
    const [newSubsection, setNewSubsection] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileExtension = file.name.split(".").pop().toLowerCase();
            if (fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg") {
                toast.error("Invalid file type! Please upload a JPG or PNG file.");
                e.target.value = ""; // Clear invalid file input
                return;
            }
            setFormData((prevFormData) => ({
                ...prevFormData,
                floor_plan: file,
            }));
            setPreviewImage(URL.createObjectURL(file)); // Generate preview URL
            setImgFileName(file.name);
        }
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const validExtensions = ["csv", "xlsx", "xls"]; // Allowed extensions
        if (file) {
            const fileExtension = file.name.split(".").pop().toLowerCase();
            if (!validExtensions.includes(fileExtension)) {
                toast.error("Invalid file type! Please upload a CSV, XLSX, or XLS file.");
                e.target.value = ""; // Clear invalid file input
                return;
            }
            setFileName(file.name); // Store the valid file name in state
        }
    };

    // Handle new subsection input change
    const handleNewSubsectionChange = (e) => {
        setNewSubsection(e.target.value);
    };

    // Handle adding subsection tags
    const handleSubsectionKeyPress = (e) => {
        if (e.key === 'Enter' && newSubsection.trim()) {
            e.preventDefault(); // Prevent default enter behavior (new line in textarea)
            if (!formData.subsections.includes(newSubsection)) {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    subsections: [...prevFormData.subsections, newSubsection], // Add new subsection to array
                }));
            }
            setNewSubsection(""); // Clear the input after adding
        }
    };

    // Handle removal of subsection tag
    const handleRemoveSubsection = (index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            subsections: prevFormData.subsections.filter((_, i) => i !== index),
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log(formData);
        console.log("Title:", formData.exhibit_title);
        console.log("Concept:", formData.concept);
        console.log("Floor Plan:", formData.floor_plan);

        // Validate required fields
        if (!formData.exhibit_title || !formData.concept || !formData.subsections || !formData.floor_plan || !fileName) {
            toast.error("Please fill in all required fields and upload necessary files.");
            return;
        }

        // Validate file inputs
        const artworkInput = document.getElementById("file-upload");
        if (!artworkInput || !artworkInput.files[0]) {
            toast.error("Please upload an artwork file.");
            return;
        }

        if (!(formData.floor_plan instanceof File)) {
            toast.error("Invalid floor plan file. Please re-upload.");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("exhibit_title", formData.exhibit_title);
            formDataToSend.append("concept", formData.concept);
            formDataToSend.append("subsections", JSON.stringify(formData.subsections));
            formDataToSend.append("floor_plan", formData.floor_plan);
            formDataToSend.append("artwork_list", artworkInput.files[0]);

            // Debug FormData
            for (let pair of formDataToSend.entries()) {
                console.log(`${pair[0]}:`, pair[1]);
            }

            const response = await fetch("http://localhost:5000/create_exhibit", {
                method: 'POST',
                body: formDataToSend, // Let the browser handle multipart/form-data
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Exhibit created successfully!');
                setLoading(true);
                setTimeout(() => {
                    setLoading(false);
                    navigate(`/exhibitions/${result.exhibitId}`);
                }, 1000);
            } else {
                const errorText = await response.text();
                console.error('Failed to create exhibit:', errorText, 'Status Code:', response.status);
                toast.error(`Error ${response.status}: Failed to create exhibit. Please try again.`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('An unexpected error occurred. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 rounded-full text-brand"></div>
                <p className="ml-4 text-lg font-semibold text-gray-700">Loading... Please wait.</p>
            </div>
        );
    }

    return (
        <div className="my-12 mx-auto w-1/2 font-['Roboto_Condensed']">
            <div className="px-12 py-2 mb-8 font-['Roboto_Condensed']">
                <h1 className="text-5xl font-semibold mb-4">Create New Exhibition</h1>

                {/* Form */}
                <div className="my-8">
                    <form onSubmit={handleSubmit}>

                        {/* Exhibit Title Input */}
                        <div className='my-8 pb-4'>
                            <div className='flex flex-col'>
                                <label className="font-semibold text-black text-xl">
                                    Exhibition Title <span className='text-brand'>*</span>
                                </label>
                                <span className="font-normal text-gray-400 text-m">
                                    Provide the name of your exhibition
                                </span>
                            </div>
                            <input
                                type="text"
                                id="exhibit_title"
                                name="exhibit_title"
                                value={formData.exhibit_title}
                                onChange={handleInputChange}
                                className="w-full h-10 border-b-2 outline-none px-1"
                                required
                            />
                        </div>

                        {/* Concept Input */}
                        <div className='my-8 pb-4'>
                            <div className='flex flex-col'>
                                <label className="font-semibold text-black text-xl">
                                    Exhibition Concept <span className='text-brand'>*</span>
                                </label>
                                <span className="font-normal text-gray-400 text-m">
                                    Describe the idea and vision behind your exhibition.
                                </span>
                            </div>
                            <textarea
                                id="concept"
                                name="concept"
                                value={formData.concept}
                                onChange={handleInputChange}
                                className="w-full h-20 border-2 outline-none px-1"
                                required
                            />
                        </div>

                        {/* Exhibition Subsections Input */}
                        <div className='my-8 pb-4'>
                            <div className='flex flex-col'>
                                <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Subsections <span className='text-brand'>*</span></label>
                                <label className="font-normal text-gray-400 text-m">Provide the key subthemes of your exhibition.</label>
                            </div>
                            <div className="mb-2 flex flex-wrap gap-2">
                                {formData.subsections.map((subsection, index) => (
                                    <div key={index} className="bg-brand text-white py-1 px-3 rounded-0 flex items-center">
                                        <span className="text-sm">{subsection}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubsection(index)}
                                            className="ml-2 text-white"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <textarea
                                type="text"
                                id="subsections"
                                name="subsections"
                                value={newSubsection}
                                onChange={handleNewSubsectionChange}
                                onKeyPress={handleSubsectionKeyPress}
                                className="w-full h-20 border-2 outline-none px-1"
                                placeholder="Press Enter to add subsection"
                            />
                        </div>

                        {/* Artwork Input */}
                        <div className='pb-4'>
                            <div className='flex flex-col'>
                                <label className="font-semibold text-black text-xl">
                                    Artworks Used in Exhibition <span className='text-brand'>*</span>
                                </label>
                                <span className="font-normal text-gray-400 text-m">
                                    Upload the list of artworks to be featured. Accepted formats: CSV or XLSX.
                                </span>
                                <a
                                    href={`${process.env.PUBLIC_URL}/assets/Artworks_Bulk_Upload_Template.xlsx`}
                                    download="Artworks_Bulk_Upload_Template.xlsx"
                                    className="font-normal text-brand text-m underline cursor-pointer hover:text-black"
                                >
                                    Click here to download template file.
                                </a>
                                <label
                                    htmlFor="file-upload"
                                    className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit"
                                >
                                    Upload Artwork List
                                </label>
                                <input
                                    id='file-upload'
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept=".csv, .xlsx, .xls"
                                    className="hidden"
                                    required
                                />
                                {fileName && (
                                    <p className="mt-2 text-gray-700">{fileName}</p>
                                )}
                            </div>
                        </div>

                        {/* Floor Plan Upload */}
                        <div className='my-8 pb-4'>
                            <div className='flex flex-col'>
                                <label className="font-semibold text-black text-xl">
                                    Floor Plan <span className='text-brand'>*</span>
                                </label>
                                <span className="font-normal text-gray-400 text-m">
                                    Upload the floor plan for your exhibition layout. Accepted format: PNG, JPG, JPEG.
                                </span>
                                <label
                                    htmlFor="floor-plan-upload"
                                    className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit">
                                    Upload Floor Plan
                                </label>
                                <input
                                    id='floor-plan-upload'
                                    type="file"
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                    required
                                />
                            </div>

                            {/* Image Preview */}
                            {previewImage && imgFileName && (
                                <div className="my-4">
                                    <p className="font-semibold text-brand text-lg">Image Preview:</p>
                                    <p className="mt-2 text-gray-700">{imgFileName}</p>
                                    <img src={previewImage} alt="Preview" className="w-full h-auto mt-2" />
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className='mx-auto flex justify-center'>
                            <button
                                type="submit"
                                className="bg-brand text-white py-2 px-8 hover:bg-brandhover flex items-center"
                            >
                                Create Exhibit
                            </button>
                        </div>

                    </form>
                    <ToastContainer position="bottom-right" autoClose={3000} />
                </div>
            </div>
        </div>
    );
}

export default CreateExhibit;
