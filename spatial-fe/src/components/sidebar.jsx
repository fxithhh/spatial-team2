import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';
import config from '../data/config.json';

function Sidebar() {
  //State change for upload file
    const [file, setFile] = useState(null);

  // Handle file input change
  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('jsonFile', file);

    fetch('http://localhost:5000/upload_json', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Upload Success:', data);
        alert('File uploaded successfully');
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('File upload failed');
      });
  };
  
  
  return (
    <div className="pt-[50px] px-[40px] bg-[#FFFFFF] h-[calc(100vh-78px)] w-[355px] font-roboto ease-in-out duration-300">
      <div className='space-y-4'>
      <Button
        size={{ width: '275px', height: '75px' }}
        text="Create New Exhibit"
        
      />
      {/*Temp button to call API and upload JSON file to DB*/}
      <Button
        size={{ width: '275px', height: '75px' }}
        text="Import Artworks "
        onClick={() => document.getElementById('fileInput').click()}
      />
      {/* Hidden file input element */}
      <input
          type="file"
          id="fileInput"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      {/* Button to trigger the upload */}
      {file && (
          <Button
            size={{ width: '275px', height: '75px' }}
            text="Upload Artwork"
            onClick={handleUpload}
          />
        )}
      </div>
      {/*==========================================================*/}
      <div className="flex items-center justify-between mb-[30px] pt-[50px]">
        <h3 className="text-lg font-['Roboto'] font-bold">Recent Exhibits</h3>
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
      </div>
      <ul className="space-y-2 flex flex-col items-center">
        {config.exhibits.map((exhibit) => (
          <li
            key={exhibit.id}
            className="w-[275px] h-[75px] border-b border-gray-300 flex items-center justify-center transition duration-300 hover:border-b-4 hover:border-brand"
          >
            <Link
              to={`/exhibitions/${exhibit.id}`}
              className="text-black text-2xl font-500 tracking-wider uppercase text-center font-['Roboto_Condensed']"
            >
              {exhibit.title}
            </Link>
          </li>
        ))}
        <li>
          <Link
            to="/exhibitions"
            className="text-gray-500 text-center font-['Roboto'] text-lg font-medium mt-[15px] flex items-center justify-center"
          >
            See all
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
