import React, { useState } from 'react';
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
    // States:
    // 0: Floorplan Only
    // 1: Graph Over Floorplan (interactive)
    // 2: Graph Only
    // 3: Graph Over Floorplan (No Interaction)
    const [viewMode, setViewMode] = useState(0);

    const states = [
        "Floorplan Only",
        "Interactive Graph > Floorplan ",
        "Graph Only",
        "Interactive Floorplan > Graph"
    ];

    // Visibility conditions
    // Floorplan is hidden only in state 2
    const hideFloorplan = (viewMode === 2);

    // Graph is always mounted now, but we control visibility via CSS.
    // Determine graph opacity and pointer events:
    // State 0: Graph invisible (opacity 0), no pointer events
    // State 1: Graph visible and interactive
    // State 2: Graph visible and interactive
    // State 3: Graph visible but not interactive
    let graphOpacity = 0;
    let graphPointerEvents = 'none';
    if (viewMode === 1 || viewMode === 2 || viewMode === 3) {
        graphOpacity = 1;
    }
    if (viewMode === 1 || viewMode === 2) {
        graphPointerEvents = 'auto';
    }

    // Floorplan pointer events:
    // States 0 and 3: floorplan interactive
    // States 1 and 2: floorplan not interactive
    const floorplanPointerEvents = (viewMode === 0 || viewMode === 3) ? 'auto' : 'none';

    // Translucent overlay visible if graph over floorplan and floorplan visible:
    // This occurs in states 1 and 3
    const showOverlay = ((viewMode === 1 || viewMode === 3) && !hideFloorplan);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Floorplan Canvas */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: floorplanPointerEvents,
                    visibility: hideFloorplan ? 'hidden' : 'visible'
                }}
            >
                <Canvas disabled={hideFloorplan || (viewMode === 1)} />
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
                    transition: 'opacity 0.3s ease-in-out'
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
                    fontSize: '0.9rem',
                    position: 'absolute'
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
