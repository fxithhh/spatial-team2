import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../components/buttons';

function Sidebar() {
    const [exhibits, setExhibits] = useState([]);
    const [visibleExhibits, setVisibleExhibits] = useState(3);
    const navigate = useNavigate();

    // // Function to fetch all exhibit IDs dynamically
    // const fetchExhibitIds = async () => {
    //     try {
    //         const response = await fetch('http://localhost:5000/api/exhibit-ids'); // Endpoint returning IDs
    //         const ids = await response.json();
    //         return ids; // E.g., ['id1', 'id2', 'id3']
    //     } catch (error) {
    //         console.error('Error fetching exhibit IDs:', error);
    //         return [];
    //     }
    // };

    // // Function to fetch an exhibit's details by its ID
    // const fetchExhibitById = async (id) => {
    //     try {
    //         const response = await fetch(`http://localhost:5000/api/exhibit/${id}`);
    //         const exhibit = await response.json();
    //         return exhibit;
    //     } catch (error) {
    //         console.error(`Error fetching exhibit with ID ${id}:`, error);
    //         return null;
    //     }
    // };

    // // Fetch exhibits dynamically
    // const fetchExhibits = async () => {
    //     try {
    //         const exhibitIds = await fetchExhibitIds(); // Fetch the list of IDs
    //         const exhibitPromises = exhibitIds.map(fetchExhibitById); // Fetch details for each ID
    //         const fetchedExhibits = await Promise.all(exhibitPromises);

    //         // Filter out null responses in case some requests fail
    //         setExhibits(fetchedExhibits.filter(Boolean));
    //     } catch (error) {
    //         console.error('Error fetching exhibits:', error);
    //     }
    // };

    // useEffect(() => {
    //     fetchExhibits();
    // }, []);

    const handleShowMore = () => {
        setVisibleExhibits((prev) => prev + 3);
    };

    const handleCreateExhibit = () => {
        navigate('/create-exhibit');
    };

    const hasMoreExhibits = visibleExhibits < exhibits.length;

    return (
        <div className="p-8 bg-white h-[calc(100vh-64px)] w-[355px] font-roboto overflow-y-auto">
            <Button
                size={{ width: '20em', height: '3em' }}
                text="Create New Exhibit"
                onClick={handleCreateExhibit}
            />
            <div className="flex items-center justify-between mb-[30px] pt-[50px]">
                <h3 className="text-lg font-bold">Recent Exhibits</h3>
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-700 cursor-pointer" />
            </div>
            <ul className="space-y-2 flex flex-col items-center">
                {exhibits.slice(0, visibleExhibits).map((exhibit) => (
                    <li
                        key={exhibit._id}
                        className="w-[275px] h-[75px] border-b border-gray-300 flex items-center justify-center transition duration-300 hover:border-b-4 hover:border-brand"
                    >
                        <Link
                            to={`/exhibitions/${exhibit._id}`}
                            className="text-black text-2xl font-500 tracking-wider uppercase text-center font-['Roboto_Condensed']"
                        >
                            {exhibit.title}
                        </Link>
                    </li>
                ))}
                {hasMoreExhibits && (
                    <li>
                        <button
                            onClick={handleShowMore}
                            className="text-gray-500 text-center text-lg font-medium mt-[15px]"
                        >
                            See more
                        </button>
                    </li>
                )}
            </ul>
        </div>
    );
}

export default Sidebar;
