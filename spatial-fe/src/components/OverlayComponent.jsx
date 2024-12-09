import React, { useState } from 'react';
import Canvas from './canvas';
import Graph from './Graph';

function OverlayComponent() {
    const [showGraphOnTop, setShowGraphOnTop] = useState(false);

    const toggleOverlay = () => {
        setShowGraphOnTop(!showGraphOnTop);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Base Floorplan */}
            <div style={{ position: 'absolute', inset: 0, zIndex: showGraphOnTop ? 1 : 2 }}>
                <Canvas />
            </div>
            
            {/* Graph Overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: showGraphOnTop ? 2 : 1 }}>
                <Graph />
            </div>

            {/* Toggle Button */}
            <button 
                onClick={toggleOverlay} 
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 999 }}
            >
                Toggle Overlay
            </button>
        </div>
    );
}

export default OverlayComponent;
