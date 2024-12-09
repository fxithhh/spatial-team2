// src/components/Graph.js

import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import './Graph.css'; // Optional: Create this file for additional styling

function Graph() {
  const networkRef = useRef(null);
  const networkInstanceRef = useRef(null); // Use useRef to store the network instance
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [minVisual, setMinVisual] = useState(0);
  const [maxVisual, setMaxVisual] = useState(10);
  const [minNarrative, setMinNarrative] = useState(0);
  const [maxNarrative, setMaxNarrative] = useState(10);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // State variables for sliders
  const [visualThreshold, setVisualThreshold] = useState(4.0);
  const [narrativeThreshold, setNarrativeThreshold] = useState(6.0);
  const [springLengthModulator, setSpringLengthModulator] = useState(1.0);
  const [springStiffnessModulator, setSpringStiffnessModulator] = useState(1.0);
  const [repulsionStrength, setRepulsionStrength] = useState(50);

  // Fetch graph data on component mount
  useEffect(() => {
    fetch('http://localhost:5000/get_graph') // Adjust the URL if your backend is hosted elsewhere
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }

        const nodesData = data.nodes.map(node => ({
          id: node.id,
          label: node.id.toString(),
          title: `<b>${node.name}</b><br>Artist: ${node.artist}<br>Description: ${node.description}`,
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

        // Determine min and max scores
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

  // Initialize the network when nodes are loaded
  useEffect(() => {
    if (networkRef.current && allNodes.length > 0 && !networkInstanceRef.current) {
      const nodes = new DataSet(allNodes);
      const edges = new DataSet();

      const data = {
        nodes,
        edges
      };

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
          stabilization: {
            iterations: 50
          }
        },
        edges: {
          smooth: false
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          multiselect: false,
          selectConnectedEdges: false
        },
        nodes: {
          font: {
            size: 12
          },
          borderWidth: 1
        }
      };

      networkInstanceRef.current = new Network(networkRef.current, data, options);

      // Add event listeners
      networkInstanceRef.current.on('click', params => {
        if (params.nodes.length > 0) {
          setSelectedNodeId(params.nodes[0]);
          highlightSelectedNode(networkInstanceRef.current, params.nodes[0]);
        } else {
          setSelectedNodeId(null);
          clearNodeHighlights(networkInstanceRef.current);
        }
      });

      // Keydown event listener
      const handleKeyDown = event => {
        if ((event.key === 'f' || event.key === 'F') && selectedNodeId !== null) {
          toggleNodeFixed(selectedNodeId, networkInstanceRef.current);
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Clean up event listeners on unmount
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      };
    }
  }, [allNodes]); // Only run this effect when allNodes change

  // Update network when sliders change
  useEffect(() => {
    if (networkInstanceRef.current && allEdges.length > 0) {
      filterAndUpdateEdges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualThreshold, narrativeThreshold, springLengthModulator, allEdges]);

  // Update physics settings when sliders change
  useEffect(() => {
    if (networkInstanceRef.current) {
      updatePhysicsSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springStiffnessModulator, repulsionStrength]);

  // Function to compute overall score
  function computeOverallScore(visualScore, narrativeScore) {
    const visualWeight = 0.5;
    const narrativeWeight = 0.5;
    return (visualWeight * visualScore) + (narrativeWeight * narrativeScore);
  }

  // Function to get color based on overall score
  function getColorFromScore(score) {
    const red = Math.round(255 * score);
    const blue = Math.round(255 * (1 - score));
    return `rgb(${red}, 0, ${blue})`;
  }

  // Function to highlight the selected node
  function highlightSelectedNode(network, nodeId) {
    network.body.data.nodes.update({ id: nodeId, borderWidth: 3, borderColor: 'orange' });
  }

  // Function to clear highlights from all nodes
  function clearNodeHighlights(network) {
    network.body.data.nodes.forEach(node => {
      network.body.data.nodes.update({ id: node.id, borderWidth: 1, borderColor: undefined });
    });
  }

  // Function to toggle the fixed state of a node
  function toggleNodeFixed(nodeId, network) {
    const node = network.body.data.nodes.get(nodeId);
    if (node) {
      const isFixed = node.fixed || false;
      const isFullyFixed = (typeof isFixed === 'object') ? (node.fixed.x && node.fixed.y) : isFixed;

      network.body.data.nodes.update({
        id: nodeId,
        fixed: !isFullyFixed ? { x: true, y: true } : false,
        color: !isFullyFixed ? 'orange' : 'lightgreen'
      });
    }
  }

  // Function to filter and update edges based on slider values
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

  // Function to update physics settings based on slider values
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
        stabilization: {
          iterations: 50
        }
      }
    };
    networkInstanceRef.current.setOptions(newPhysicsOptions);
    networkInstanceRef.current.stopSimulation();
    networkInstanceRef.current.startSimulation();
  }

  return (
    <div>
      {/* Instructions */}
      <div id="instructions">
        <strong>Instructions:</strong> Click on a node to select it, then press the <strong>F</strong> key to fix/unfix its position. You can drag fixed nodes by clicking and dragging; they will be temporarily unfixed during the drag and fixed again once you release.
      </div>

      {/* Network Graph Container */}
      <div id="network" ref={networkRef} style={{ width: '100%', height: '750px', border: '1px solid lightgray', overflow: 'hidden' }}></div>

      <h2>Artworks Connectivity Graph</h2>

      {/* Sliders for interactivity */}
      <div className="sliders-section">
        <div className="slider-container">
          <label htmlFor="visualThreshold" className="slider-label">Visual Connectivity Threshold:</label>
          <input
            type="range"
            id="visualThreshold"
            name="visualThreshold"
            min="0"
            max="10"
            value={visualThreshold}
            step="0.1"
            onChange={e => setVisualThreshold(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span className="slider-value">{visualThreshold.toFixed(1)}</span>
        </div>

        <div className="slider-container">
          <label htmlFor="narrativeThreshold" className="slider-label">Narrative Connectivity Threshold:</label>
          <input
            type="range"
            id="narrativeThreshold"
            name="narrativeThreshold"
            min="0"
            max="10"
            value={narrativeThreshold}
            step="0.1"
            onChange={e => setNarrativeThreshold(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span className="slider-value">{narrativeThreshold.toFixed(1)}</span>
        </div>

        <div className="slider-container">
          <label htmlFor="springLengthModulator" className="slider-label">Spring Length Modulator:</label>
          <input
            type="range"
            id="springLengthModulator"
            name="springLengthModulator"
            min="0"
            max="3.0"
            value={springLengthModulator}
            step="0.1"
            onChange={e => setSpringLengthModulator(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span className="slider-value">{springLengthModulator.toFixed(1)}</span>
        </div>

        <div className="slider-container">
          <label htmlFor="springStiffnessModulator" className="slider-label">Spring Stiffness Modulator:</label>
          <input
            type="range"
            id="springStiffnessModulator"
            name="springStiffnessModulator"
            min="0.01"
            max="3.01"
            value={springStiffnessModulator}
            step="0.1"
            onChange={e => setSpringStiffnessModulator(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span className="slider-value">{springStiffnessModulator.toFixed(1)}</span>
        </div>

        <div className="slider-container">
          <label htmlFor="repulsionStrength" className="slider-label">Repulsion Strength:</label>
          <input
            type="range"
            id="repulsionStrength"
            name="repulsionStrength"
            min="0"
            max="200"
            value={repulsionStrength}
            step="1"
            onChange={e => setRepulsionStrength(parseInt(e.target.value))}
            style={{ width: '300px' }}
          />
          <span className="slider-value">{repulsionStrength}</span>
        </div>
      </div>
    </div>
  );
}

export default Graph;
