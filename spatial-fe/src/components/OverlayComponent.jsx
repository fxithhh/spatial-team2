import React, { useState } from 'react';
import Canvas from './Canvas';
import Graph from './Graph';

function OverlayComponent() {
    // 0: Floorplan Only
    // 1: Graph Over Floorplan
    // 2: Graph Only (default)
    const [viewMode, setViewMode] = useState(2);

    const hideFloorplan = viewMode === 2;
    const showGraphOnTop = viewMode >= 1;

    const states = [
        "Floorplan Only",
        "Graph Over Floorplan",
        "Graph Only"
    ];

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Floorplan Canvas */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: (showGraphOnTop || hideFloorplan) ? 'none' : 'auto',
                    visibility: hideFloorplan ? 'hidden' : 'visible'
                }}
            >
                <Canvas disabled={hideFloorplan || showGraphOnTop} />
            </div>

            {/* Translucent overlay (only visible when graph is on top and floorplan is visible) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    background: (showGraphOnTop && !hideFloorplan) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    pointerEvents: 'none'
                }}
            />

            {/* Graph Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    opacity: (hideFloorplan || showGraphOnTop) ? 1 : 0,
                    pointerEvents: (hideFloorplan || showGraphOnTop) ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease-in-out'
                }}
            >
                <Graph />
            </div>

            {/* 3-State Segmented Control */}
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 999,
                    width: '300px',
                    height: '40px',
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
                        left: `${(viewMode * 100) / 3}%`,
                        width: `${100/3}%`,
                        height: '100%',
                        background: '#007bff',
                        borderRadius: '20px',
                        transition: 'left 0.3s'
                    }}
                />

                {/* State Labels - now clickable individually */}
                {states.map((label, i) => (
                    <div
                        key={i}
                        style={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            color: i === viewMode ? '#fff' : '#000', 
                            fontWeight: i === viewMode ? 'bold' : 'normal',
                            textAlign: 'center', 
                            width: `${100/3}%`,
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
