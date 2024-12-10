import React, { useState } from 'react';
import Canvas from './Canvas';
import Graph from './Graph';

function OverlayComponent() {
    const [showGraphOnTop, setShowGraphOnTop] = useState(false);

    const toggleOverlay = () => {
        setShowGraphOnTop((prev) => !prev);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Canvas (Floorplan) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: showGraphOnTop ? 'none' : 'auto', // Disable interactions when graph is on top
                }}
            >
                <Canvas disabled={showGraphOnTop} />
            </div>

            {/* Transparent Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    background: showGraphOnTop ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                    pointerEvents: 'none', // Transparent overlay does not block interaction
                }}
            />

            {/* Graph Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    opacity: showGraphOnTop ? 1 : 0, // Toggle visibility
                    pointerEvents: showGraphOnTop ? 'auto' : 'none', // Disable interactions when hidden
                    transition: 'opacity 0.3s ease-in-out', // Smooth transition
                }}
            >
                <Graph />
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleOverlay}
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 999, // Always on top
                    padding: '10px 20px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Toggle Overlay
            </button>
        </div>
    );
}

export default OverlayComponent;
