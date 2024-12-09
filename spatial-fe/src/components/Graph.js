// src/components/Graph.js

import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import './Graph.css'; // Optional: Create this file for additional styling

function Graph({ width = '100%', height = '100%' }) {
  const networkRef = useRef(null);
  const networkInstanceRef = useRef(null);
  
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [minVisual, setMinVisual] = useState(0);
  const [maxVisual, setMaxVisual] = useState(10);
  const [minNarrative, setMinNarrative] = useState(0);
  const [maxNarrative, setMaxNarrative] = useState(10);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Slider states
  const [visualThreshold, setVisualThreshold] = useState(4.0);
  const [narrativeThreshold, setNarrativeThreshold] = useState(6.0);
  const [springLengthModulator, setSpringLengthModulator] = useState(1.0);
  const [springStiffnessModulator, setSpringStiffnessModulator] = useState(1.0);
  const [repulsionStrength, setRepulsionStrength] = useState(50);

  // Manage instructions visibility
  const containerRef = useRef(null);
  const [isHeightLarge, setIsHeightLarge] = useState(true);
  const isHeightLargeRef = useRef(true); // To track previous state
  const [hiddenNodes, setHiddenNodes] = useState([]);

useEffect(() => {
  const handleKeyDown = event => {
    if ((event.key === 'h' || event.key === 'H') && selectedNodeId !== null) {
      const node = networkInstanceRef.current.body.data.nodes.get(selectedNodeId);
      if (node) {
        // If already hidden, unhide
        if (hiddenNodes.some(n => n.id === selectedNodeId)) {
          setHiddenNodes(hiddenNodes.filter(n => n.id !== selectedNodeId));
          networkInstanceRef.current.body.data.nodes.add(node);
        } else {
          // Hide it
          setHiddenNodes([...hiddenNodes, node]);
          networkInstanceRef.current.body.data.nodes.remove(selectedNodeId);
        }
      }
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [selectedNodeId, hiddenNodes]);


  // Update ref when state changes
  useEffect(() => {
    isHeightLargeRef.current = isHeightLarge;
  }, [isHeightLarge]);

  // Fetch graph data on mount
  useEffect(() => {
    fetch('http://localhost:5000/get_graph') // Adjust as needed
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }

        const nodesData = data.nodes.map(node => ({
          id: node.id,
          label: `${node.artist}\n ${node.id.toString()}`,
          title: `Artist: ${node.artist}\nDescription: ${node.description}`,
          color: 'lightgreen',
          value: 10,
          shape: 'dot',
          fixed: false
        }));

        const edgesData = data.links.map(link => ({
          from: link.source,
          to: link.target,
          visual_connectivity_score: link.visual_connectivity_score,
          narrative_connectivity_score: link.narrative_connectivity_score,
          color: getColorFromScore(0),
          width: 1,
          title: `Visual Score: ${link.visual_connectivity_score}<br>Narrative Score: ${link.narrative_connectivity_score}`
        }));

        // Set min and max scores
        if (edgesData.length > 0) {
          setMinVisual(Math.min(...edgesData.map(e => e.visual_connectivity_score)));
          setMaxVisual(Math.max(...edgesData.map(e => e.visual_connectivity_score)));
          setMinNarrative(Math.min(...edgesData.map(e => e.narrative_connectivity_score)));
          setMaxNarrative(Math.max(...edgesData.map(e => e.narrative_connectivity_score)));
        }

        setAllNodes(nodesData);
        setAllEdges(edgesData);
      })
      .catch(error => {
        console.error('Error fetching graph data:', error);
      });
  }, []);

// Replace the existing initialization useEffect with one that only depends on allNodes and allEdges:

useEffect(() => {
  if (networkRef.current && allNodes.length > 0 && allEdges.length > 0 && !networkInstanceRef.current) {
    const nodes = new DataSet(allNodes);
    const edges = new DataSet();
    const data = { nodes, edges };

    const options = {
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -repulsionStrength,
          centralGravity: 0.0005,
          springLength: 100,
          springConstant: 0.1 * springStiffnessModulator,
          damping: 0.4
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 50 }
      },
      edges: { smooth: false },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        multiselect: false,
        selectConnectedEdges: false
      },
      nodes: { font: { size: 12 }, borderWidth: 1 }
    };

    networkInstanceRef.current = new Network(networkRef.current, data, options);

    networkInstanceRef.current.on('click', params => {
      if (params.nodes.length > 0) {
        setSelectedNodeId(params.nodes[0]);
        highlightSelectedNode(networkInstanceRef.current, params.nodes[0]);
      } else {
        setSelectedNodeId(null);
        clearNodeHighlights(networkInstanceRef.current);
      }
    });

    const handleKeyDown = event => {
      if ((event.key === 'f' || event.key === 'F') && selectedNodeId !== null) {
        toggleNodeFixed(selectedNodeId, networkInstanceRef.current);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }
    };
  }
}, [allNodes, allEdges]);

// Keep other effects for updating physics and edges separate and do not include all initialization dependencies there.

useEffect(() => {
  const handleKeyDown = event => {
    if ((event.key === 'f' || event.key === 'F') && selectedNodeId !== null) {
      toggleNodeFixed(selectedNodeId, networkInstanceRef.current);
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}, [selectedNodeId]);
useEffect(() => {
  if (networkInstanceRef.current) {
    networkInstanceRef.current.on('dragStart', params => {
      if (params.nodes.length === 1) {
        networkInstanceRef.current.body.data.nodes.update({ id: params.nodes[0], fixed: false });
      }
    });

    networkInstanceRef.current.on('dragEnd', params => {
      if (params.nodes.length === 1) {
        const nodeId = params.nodes[0];
        const node = networkInstanceRef.current.body.data.nodes.get(nodeId);
        // If node was fixed (orange), refix it after drag
        if (node && node.color === 'orange') {
          networkInstanceRef.current.body.data.nodes.update({ id: nodeId, fixed: { x: true, y: true } });
        }
      }
    });
  }
}, [selectedNodeId]);

  // Update edges based on sliders
  useEffect(() => {
    if (networkInstanceRef.current && allEdges.length > 0) {
      filterAndUpdateEdges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualThreshold, narrativeThreshold, springLengthModulator, allEdges]);

  // Update physics based on sliders
  useEffect(() => {
    if (networkInstanceRef.current) {
      updatePhysicsSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springStiffnessModulator, repulsionStrength]);

  // ResizeObserver setup
  useEffect(() => {
    const handleResize = entries => {
      for (let entry of entries) {
        const currentHeight = entry.contentRect.height;
        const shouldBeLarge = currentHeight >= 600;

        // Only update if there's a change
        if (shouldBeLarge !== isHeightLargeRef.current) {
          isHeightLargeRef.current = shouldBeLarge;

          // Schedule state update to prevent immediate layout changes
          setTimeout(() => setIsHeightLarge(shouldBeLarge), 0);
        }
      }
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial height check
    if (containerRef.current) {
      const height = containerRef.current.getBoundingClientRect().height;
      const shouldBeLarge = height >= 600;
      if (shouldBeLarge !== isHeightLargeRef.current) {
        isHeightLargeRef.current = shouldBeLarge;
        setIsHeightLarge(shouldBeLarge);
      }
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      observer.disconnect();
    };
  }, []); // Empty dependency array to run only once

  // Compute overall score
  function computeOverallScore(visualScore, narrativeScore) {
    const visualWeight = 0.5;
    const narrativeWeight = 0.5;
    return (visualWeight * visualScore) + (narrativeWeight * narrativeScore);
  }

  // Determine color based on score
  function getColorFromScore(score) {
    const red = Math.round(255 * score);
    const blue = Math.round(255 * (1 - score));
    return `rgb(${red}, 0, ${blue})`;
  }

  // Highlight selected node
  function highlightSelectedNode(network, nodeId) {
    network.body.data.nodes.update({ id: nodeId, borderWidth: 3, borderColor: 'orange' });
  }

  // Clear all node highlights
  function clearNodeHighlights(network) {
    network.body.data.nodes.forEach(node => {
      network.body.data.nodes.update({ id: node.id, borderWidth: 1, borderColor: undefined });
    });
  }

  // Toggle node fixed state
  function toggleNodeFixed(nodeId, network) {
    const node = network.body.data.nodes.get(nodeId);
    if (node) {
      const isFixed = node.fixed || false;
      const isFullyFixed = typeof isFixed === 'object' ? (node.fixed.x && node.fixed.y) : isFixed;

      network.body.data.nodes.update({
        id: nodeId,
        fixed: !isFullyFixed ? { x: true, y: true } : false,
        color: !isFullyFixed ? 'orange' : 'lightgreen'
      });
    }
  }

  // Filter and update edges based on slider values
  function filterAndUpdateEdges() {
    const edges = new DataSet();
    const filteredEdges = allEdges.filter(edge =>
      edge.visual_connectivity_score >= visualThreshold &&
      edge.narrative_connectivity_score >= narrativeThreshold
    );

    filteredEdges.forEach(edge => {
      const overall_score = computeOverallScore(
        (edge.visual_connectivity_score - minVisual) / (maxVisual - minVisual || 1),
        (edge.narrative_connectivity_score - minNarrative) / (maxNarrative - minNarrative || 1)
      );

      const capped_score = Math.min(overall_score, 1.0);

      const newWidth = 1 + capped_score * 5;
      const newColor = getColorFromScore(capped_score);
      const baseLength = 300 * (1 - capped_score) + 100;
      const newLength = baseLength * springLengthModulator;

      edges.add({
        from: edge.from,
        to: edge.to,
        width: newWidth,
        color: newColor,
        title: edge.title,
        length: newLength
      });
    });

    networkInstanceRef.current.setData({ nodes: networkInstanceRef.current.body.data.nodes, edges });
    networkInstanceRef.current.stopSimulation();
    networkInstanceRef.current.startSimulation();
  }

  // Update physics settings based on slider values
  function updatePhysicsSettings() {
    const newPhysicsOptions = {
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -repulsionStrength,
          centralGravity: 0.0005,
          springConstant: 0.1 * springStiffnessModulator,
          damping: 0.4
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 50 }
      }
    };
    networkInstanceRef.current.setOptions(newPhysicsOptions);
    networkInstanceRef.current.stopSimulation();
    networkInstanceRef.current.startSimulation();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div ref={containerRef} style={{ width, height, position: 'relative' }}>
        {/* Conditionally Render Instructions */}
        {isHeightLarge && (
          <div
            id="instructions"
            className="absolute top-0 left-0 right-0 p-4 bg-yellow-100 border border-yellow-300 rounded-b shadow-md z-10"
            style={{ pointerEvents: 'none' }} // Allows interactions with underlying elements
          >
            <strong>Instructions:</strong> Click on a node to select it, then press the <strong>F</strong> key to fix/unfix its position. You can drag fixed nodes by clicking and dragging; they will be temporarily unfixed during the drag and fixed again once you release.
          </div>
        )}

        {/* Network Graph Container */}
        <div
          id="network"
          ref={networkRef}
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid lightgray',
            overflow: 'hidden'
          }}
        ></div>
      </div>
      <div className="hidden-nodes-container">
  {hiddenNodes.map(node => (
    <button 
      key={node.id} 
      onClick={() => {
        setHiddenNodes(hiddenNodes.filter(n => n.id !== node.id));
        networkInstanceRef.current.body.data.nodes.add(node);
      }}
    >
      {node.label}
    </button>
  ))}
</div>



      <h2 className="text-xl font-semibold mt-4">Artworks Connectivity Graph</h2>

      {/* Sliders for interactivity */}
      <div className="sliders-section space-y-4">
        {/* Visual Connectivity Threshold */}
        <div className="slider-container flex items-center">
          <label htmlFor="visualThreshold" className="w-1/3 font-medium">
            Visual Connectivity Threshold:
          </label>
          <input
            type="range"
            id="visualThreshold"
            name="visualThreshold"
            min="0"
            max="10"
            value={visualThreshold}
            step="0.1"
            onChange={e => setVisualThreshold(parseFloat(e.target.value))}
            className="w-2/3 accent-brand"
          />
          <span className="ml-2 font-medium">{visualThreshold.toFixed(1)}</span>
        </div>

        {/* Narrative Connectivity Threshold */}
        <div className="slider-container flex items-center">
          <label htmlFor="narrativeThreshold" className="w-1/3 font-medium">
            Narrative Connectivity Threshold:
          </label>
          <input
            type="range"
            id="narrativeThreshold"
            name="narrativeThreshold"
            min="0"
            max="10"
            value={narrativeThreshold}
            step="0.1"
            onChange={e => setNarrativeThreshold(parseFloat(e.target.value))}
            className="w-2/3 accent-brand"
          />
          <span className="ml-2 font-medium">{narrativeThreshold.toFixed(1)}</span>
        </div>

        {/* Spring Length Modulator */}
        <div className="slider-container flex items-center">
          <label htmlFor="springLengthModulator" className="w-1/3 font-medium">
            Spring Length Modulator:
          </label>
          <input
            type="range"
            id="springLengthModulator"
            name="springLengthModulator"
            min="0"
            max="3.0"
            value={springLengthModulator}
            step="0.1"
            onChange={e => setSpringLengthModulator(parseFloat(e.target.value))}
            className="w-2/3 accent-brand"
          />
          <span className="ml-2 font-medium">{springLengthModulator.toFixed(1)}</span>
        </div>

        {/* Spring Stiffness Modulator */}
        <div className="slider-container flex items-center">
          <label htmlFor="springStiffnessModulator" className="w-1/3 font-medium">
            Spring Stiffness Modulator:
          </label>
          <input
            type="range"
            id="springStiffnessModulator"
            name="springStiffnessModulator"
            min="0.1"
            max="3.0"
            value={springStiffnessModulator}
            step="0.1"
            onChange={e => setSpringStiffnessModulator(parseFloat(e.target.value))}
            className="w-2/3 accent-brand"
          />
          <span className="ml-2 font-medium">{springStiffnessModulator.toFixed(1)}</span>
        </div>

        {/* Repulsion Strength */}
        <div className="slider-container flex items-center">
          <label htmlFor="repulsionStrength" className="w-1/3 font-medium">
            Repulsion Strength:
          </label>
          <input
            type="range"
            id="repulsionStrength"
            name="repulsionStrength"
            min="0"
            max="200"
            value={repulsionStrength}
            step="1"
            onChange={e => setRepulsionStrength(parseInt(e.target.value))}
            className="w-2/3 accent-brand"
          />
          <span className="ml-2 font-medium">{repulsionStrength}</span>
        </div>
      </div>
    </div>
  );
}

export default Graph;
