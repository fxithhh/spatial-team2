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
    const [formData, setFormData] = useState({
        exhibit_title: "",
        concept: "",
        subsections: [],
        floor_plan: null
    });
    const [fileName, setFileName] = useState('');
    const [imgFileName, setImgFileName] = useState('');
    const [fileName, setFileName] = useState('');
    const [imgFileName, setImgFileName] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    // handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                floor_plan: file,
            }));
            setPreviewImage(URL.createObjectURL(file)); // Generate preview URL
            setImgFileName(file.name);
        }
    };

    // Handle File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name); // Store the file name in state
            setImgFileName(file.name);
        }
    };

    // Handle File Upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name); // Store the file name in state
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

    return (
        <div className="my-12 mx-auto w-1/2 font-['Roboto_Condensed']">
            <div>
                <div className="px-12 py-2 mb-8 font-['Roboto_Condensed']">
                    <h1 className="text-5xl font-semibold mb-4">Create New Exhibition</h1>

                    {/* form */}
                    <div className="my-8">
                        <form onSubmit={handleSubmit} className="">

                            {/* Exhibit Title Input */}
                            <div className='my-8 pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Title <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Provide the name of your exhibition</label>
                                </div>
                                <input
                                    type="text"
                                    id="exhibit_title"
                                    name="exhibit_title"
                                    value={formData.exhibit_title}
                                    onChange={handleInputChange}
                                    className="w-full h-10 border-b-2 outline-none px-1"
                                    className="w-full h-10 border-b-2 outline-none px-1"
                                    required
                                />
                            </div>

                            {/* Concept Input */}
                            <div className='my-8 pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Concept <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Describe the idea and vision behind your exhibition.</label>
                                </div>
                            <div className='my-8 pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Concept <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Describe the idea and vision behind your exhibition.</label>
                                </div>
                                <textarea
                                    type="text"
                                    id="concept"
                                    name="concept"
                                    value={formData.concept}
                                    onChange={handleInputChange}
                                    className="w-full h-20 border-2 outline-none px-1"
                                    className="w-full h-20 border-2 outline-none px-1"
                                    required
                                />
                            </div>

                            {/* Exhibition Subsections Input */}
                            <div className='my-8 pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Subsections <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Provide the key subthemes of your exhibition.</label>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Exhibition Subsections <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Provide the key subthemes of your exhibition.</label>
                                </div>
                                <textarea
                                    type="text"
                                    id="subsections"
                                    name="subsections"
                                    value={formData.subsections}
                                    onChange={handleInputChange}
                                    className="w-full h-20 border-2 outline-none px-1"
                                    required
                                />
                            </div>

                            {/* Artwork Input */}
                            <div className='pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Artworks Used in Exhibition <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Upload the list of artworks to be featured. Accepted formats: CSV or XLSX.</label>
                                    <label
                                        htmlFor="file-upload"
                                        className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit"
                                    >
                                        Upload Artwork List
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Artworks Used in Exhibition <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Upload the list of artworks to be featured. Accepted formats: CSV or XLSX.</label>
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
                                    {fileName && (
                                        <p className="mt-2 text-gray-700">{fileName}</p>
                                    )}
                                </div>
                            </div>

                            {/* Floor Plan Upload */}
                            <div className='my-8 pb-4'>
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Floor Plan <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Upload the floor plan for your exhibition layout. Accepted format: PNG.</label>
                                    <label
                                        htmlFor="floor-plan-upload"
                                        className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit"
                                    >
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
                                <div className='flex flex-col'>
                                    <label className="font-semibold font-['Roboto'] text-black text-xl">Floor Plan <span className='text-brand'>*</span></label>
                                    <label className="font-normal text-gray-400 text-m">Upload the floor plan for your exhibition layout. Accepted format: PNG.</label>
                                    <label
                                        htmlFor="floor-plan-upload"
                                        className="mt-2 cursor-pointer bg-brand text-white px-4 py-2 hover:bg-brand-dark transition w-fit"
                                    >
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
                                    className="bg-brand text-white py-2 px-8 hover:bg-brandhover"
                                    className="bg-brand text-white py-2 px-8 hover:bg-brandhover"
                                >
                                    Create Exhibit
                                </button>
                            </div>
                        </form>
                        <ToastContainer position="bottom-right" autoClose={3000} />
                    </div>

                </div>
            </div>
        </div>
    );
}

export default CreateExhibit;
