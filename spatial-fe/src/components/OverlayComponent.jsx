import React, { useState } from 'react';
import Canvas from './Canvas';
import Graph from './Graph';

function OverlayComponent() {
    const [showGraphOnTop, setShowGraphOnTop] = useState(false);
    const [hideFloorplan, setHideFloorplan] = useState(false);

    const toggleOverlayOrder = () => {
        // If we are hiding the floorplan, graph is on top anyway, so just ignore toggle?
        // Or allow toggling if floorplan is visible:
        if (!hideFloorplan) {
            setShowGraphOnTop((prev) => !prev);
        }
    };

    const toggleFloorplanVisibility = () => {
        setHideFloorplan((prev) => {
            const newVal = !prev;
            if (newVal) {
                // If we are now hiding the floorplan, ensure the graph is on top.
                setShowGraphOnTop(true);
            }
            return newVal;
        });
    };

    // Determine button labels based on current state:
    const overlayOrderButtonLabel = hideFloorplan
        ? 'Graph Only (No Floorplan)'
        : showGraphOnTop 
            ? 'Switch to Floorplan Only'
            : 'Switch to Graph Over Floorplan';

    const floorplanButtonLabel = hideFloorplan ? 'Show Floorplan' : 'Hide Floorplan';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Floorplan Canvas */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    // If the graph is on top or floorplan is hidden, interactions with floorplan may be disabled:
                    pointerEvents: (showGraphOnTop || hideFloorplan) ? 'none' : 'auto',
                    visibility: hideFloorplan ? 'hidden' : 'visible'
                }}
            >
                <Canvas disabled={hideFloorplan || showGraphOnTop} />
            </div>

            {/* No need for a solid white overlay now, since we're hiding the floorplan via visibility. */}
            {/* If you prefer a solid overlay to cover the floorplan instead of visibility, 
                you could use a solid div here. But per the instructions, we now just hide it. */}

            {/* Translucent overlay (only visible when graph is on top and floorplan is visible) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 2,
                    // If graph is on top and floorplan is not hidden, show translucent overlay:
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
                    // If hideFloorplan is true or showGraphOnTop is true, graph is visible:
                    opacity: (hideFloorplan || showGraphOnTop) ? 1 : 0,
                    pointerEvents: (hideFloorplan || showGraphOnTop) ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease-in-out'
                }}
            >
                <Graph />
            </div>

            {/* Toggle Button for Overlay Order */}
            <button
                onClick={toggleOverlayOrder}
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 999,
                    padding: '10px 20px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    opacity: hideFloorplan ? 0.6 : 1,
                    pointerEvents: hideFloorplan ? 'none' : 'auto'
                }}
                title="Toggle which layer is on top"
            >
                {overlayOrderButtonLabel}
            </button>

            {/* Toggle Button for Floorplan Visibility */}
            <button
                onClick={toggleFloorplanVisibility}
                style={{
                    position: 'absolute',
                    top: 50,
                    right: 10,
                    zIndex: 999,
                    padding: '10px 20px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
                title="Show or hide the floorplan"
            >
                {floorplanButtonLabel}
            </button>
        </div>
    );
}

export default OverlayComponent;
