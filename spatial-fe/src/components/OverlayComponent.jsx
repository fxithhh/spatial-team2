import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';
import Graph from './Graph';

function OverlayComponent({
    visualThreshold,
    narrativeThreshold,
    springLengthModulator,
    springStiffnessModulator,
    repulsionStrength,
    centralGravity
}) {
    // State order:
    // 0: Floorplan Only
    // 1: Graph Only
    // 2: Graph Over Floorplan
    // 3: Floorplan Over Graph
    const [viewMode, setViewMode] = useState(0);

    const states = [
        "1) Floorplan only",
        "2) Graph only",
        "3) Graph over Floorplan",
        "4) Floorplan over Graph"
    ];

    // Handle keyboard shortcuts: 1,2,3,4 to set states
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '1') setViewMode(0); // Floorplan Only
            if (e.key === '2') setViewMode(1); // Graph Only
            if (e.key === '3') setViewMode(2); // Graph Over Floorplan
            if (e.key === '4') setViewMode(3); // Floorplan Over Graph
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Floorplan visibility: hide in "Graph Only" mode
    const hideFloorplan = (viewMode === 1);

    // Graph visibility: hide in "Floorplan Only" mode
    const graphOpacity = (viewMode === 0) ? 0 : 1;

    // Graph interactivity: interactive in "Graph Only"(1) and "Graph Over Floorplan"(2)
    const graphPointerEvents = (viewMode === 1 || viewMode === 2) ? 'auto' : 'none';

    // Floorplan interactivity: interactive in "Floorplan Only"(0) and "Floorplan Over Graph"(3)
    const floorplanPointerEvents = (viewMode === 0 || viewMode === 3) ? 'auto' : 'none';

    // Translucent overlay: visible in "Graph Over Floorplan"(2) and "Floorplan Over Graph"(3)
    const showOverlay = (viewMode === 2 || viewMode === 3);

    // Determine cursors:
    // If floorplan is interactive: use crosshair
    // If graph is interactive: use grab
    // Otherwise: default
    const floorplanCursor = floorplanPointerEvents === 'auto' ? 'crosshair' : 'default';
    const graphCursor = graphPointerEvents === 'auto' ? 'grab' : 'default';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Floorplan Canvas */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: floorplanPointerEvents,
                    visibility: hideFloorplan ? 'hidden' : 'visible',
                    cursor: floorplanCursor
                }}
            >
                <Canvas disabled={hideFloorplan || (viewMode === 2)} />
            </div>

            {/* Translucent overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    background: showOverlay ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    pointerEvents: 'none'
                }}
            />

            {/* Graph Overlay (Always Mounted) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    opacity: graphOpacity,
                    pointerEvents: graphPointerEvents,
                    transition: 'opacity 0.3s ease-in-out',
                    cursor: graphCursor
                }}
            >
                <Graph
                    visualThreshold={visualThreshold}
                    narrativeThreshold={narrativeThreshold}
                    springLengthModulator={springLengthModulator}
                    springStiffnessModulator={springStiffnessModulator}
                    repulsionStrength={repulsionStrength}
                    centralGravity={centralGravity}
                />
            </div>

            {/* 4-State Segmented Control */}
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 999,
                    width: '400px',
                    height: '65px',
                    background: '#ccc',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    userSelect: 'none',
                    fontFamily: 'sans-serif',
                    fontSize: '0.9rem'
                }}
                title="Click a state to switch view mode"
            >
                {/* Highlight Slider */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: `${(viewMode * 100) / 4}%`,
                        width: `${100/4}%`,
                        height: '100%',
                        background: '#007bff',
                        borderRadius: '20px',
                        transition: 'left 0.3s'
                    }}
                />

                {/* State Labels */}
                {states.map((label, i) => (
                    <div
                        key={i}
                        style={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            color: i === viewMode ? '#fff' : '#000', 
                            fontWeight: i === viewMode ? 'bold' : 'normal',
                            textAlign: 'center', 
                            width: `${100/4}%`,
                            cursor: 'pointer',
                            padding: '0 5px'
                        }}
                        onClick={() => setViewMode(i)}
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OverlayComponent;
