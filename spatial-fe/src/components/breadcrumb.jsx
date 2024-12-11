import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function Breadcrumb() {
    const { exhibitId } = useParams();
    const [selectedExhibit, setSelectedExhibit] = useState(null);
    const [error, setError] = useState(null);

    // Fetch the exhibit details
    const fetchArtworks = async () => {
        try {
            const response = await fetch(`http://localhost:5000/exhibits/${exhibitId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch exhibit: ${response.status}`);
            }
            const data = await response.json();

            setSelectedExhibit(data);
        } catch (err) {
            setError('Error fetching exhibit');
        }
    };

    useEffect(() => {
        if (exhibitId) {
            fetchArtworks();
        }
    }, [exhibitId]);

    // Handle error case
    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <nav className="text-brand my-4 capitalize" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {/* Home link */}
                <li className="flex items-center space-x-2">
                    <Link to="/" className="text-brand hover:underline">
                        Home
                    </Link>
                    <span className="text-gray-500">/</span>
                </li>
                {/* Exhibit Title */}
                {selectedExhibit && (
                    <li className="flex items-center space-x-2">
                        <span className="text-gray-500">{selectedExhibit.exhibit_title || 'Untitled Exhibition'}</span>
                    </li>
                )}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
