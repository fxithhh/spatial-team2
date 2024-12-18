import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';
import Graph from './Graph';

function OverlayComponent({
    visualThreshold,
    narrativeThreshold,
    springLengthModulator,
    springStiffnessModulator,
    repulsionStrength,
    centralGravity,
    onViewModeChange,
    p
}) {
    // State order:
    // 0: Floorplan Only
    // 1: Graph Only
    // 2: Graph Over Floorplan
    // 3: Floorplan Over Graph
    const [viewMode, setViewMode] = useState(0);
    const [cursorColor, setCursorColor] = useState('default'); 
    // cursorColor will help determine which cursor to display.

    const states = [
        "1) Floorplan only",
        "2) Graph only",
        "3) Graph over Floorplan",
        "4) Floorplan over Graph"
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Handle viewMode changes
            if (e.key === '1') setViewMode(0); // Floorplan Only
            if (e.key === '2') setViewMode(1); // Graph Only
            if (e.key === '3') setViewMode(2); // Graph Over Floorplan
            if (e.key === '4') setViewMode(3); // Floorplan Over Graph

            // Handle cursor color changes if viewMode is 0 or 3
            if (viewMode === 0 || viewMode === 3) {
                if (e.key === 'F' || e.key === 'f') {
                    // Make cursor red
                    setCursorColor('red');
                }
                if (e.key === 'W' || e.key === 'w') {
                    // Make cursor black
                    setCursorColor('black');
                }
                if (e.key === 'E' || e.key === 'e') {
                    // Make cursor green
                    setCursorColor('green');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [viewMode]);

    // Call the onViewModeChange callback whenever viewMode changes, if provided
    useEffect(() => {
        if (onViewModeChange) {
            onViewModeChange(viewMode);
        }
    }, [viewMode, onViewModeChange]);

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

    // Determine the cursor appearance for the floorplan
    // We will choose the cursor image based on the cursorColor state.
    let floorplanCursor = 'default';

    // Only set custom cursors if floorplan is interactive
    if (floorplanPointerEvents === 'auto') {
        if (cursorColor === 'red') {
            // Replace 'redCursor.png' with an actual red cursor image (or a data URI)
            floorplanCursor = 'url(/CrosshairRed.cur), crosshair';
        } else if (cursorColor === 'black') {
            // Replace 'blackCursor.png' with an actual black cursor image
            floorplanCursor = 'url(blackCursor.png), crosshair';
        } else if (cursorColor === 'green') {
            // Replace 'greenCursor.png' with an actual green cursor image
            floorplanCursor = 'url(/CrosshairGreen.cur), crosshair';
        } else {
            // Default to crosshair if no custom color is set
            floorplanCursor = 'crosshair';
        }
    }

    // Graph cursor remains the same:
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
                    p={p}
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
