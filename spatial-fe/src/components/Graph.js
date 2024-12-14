// src/components/Graph.js
import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import './Graph.css'; 
import { FaInfoCircle } from 'react-icons/fa';

function Graph() {
  const networkRef = useRef(null);
  const networkInstanceRef = useRef(null);

  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [minVisual, setMinVisual] = useState(0);
  const [maxVisual, setMaxVisual] = useState(10);
  const [minNarrative, setMinNarrative] = useState(0);
  const [maxNarrative, setMaxNarrative] = useState(10);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  const [visualThreshold, setVisualThreshold] = useState(4.0);
  const [narrativeThreshold, setNarrativeThreshold] = useState(6.0);
  const [springLengthModulator, setSpringLengthModulator] = useState(0.7);
  const [springStiffnessModulator, setSpringStiffnessModulator] = useState(0.7);
  const [repulsionStrength, setRepulsionStrength] = useState(25);

  const [hiddenNodes, setHiddenNodes] = useState([]);

  const [useImageNodes, setUseImageNodes] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Key listener for toggling image/dot nodes
    const handleKeyDown = event => {
      if ((event.key === 'i' || event.key === 'I')) {
        setUseImageNodes(prev => !prev);

        const updatedNodes = networkInstanceRef.current.body.data.nodes.getIds().map(id => {
          const node = networkInstanceRef.current.body.data.nodes.get(id);
          return {
            id: node.id,
            shape: !useImageNodes ? 'image' : 'dot',
            image: !useImageNodes ? node.imageurl : undefined
          };
        });
        networkInstanceRef.current.body.data.nodes.update(updatedNodes);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [useImageNodes]);

  useEffect(() => {
    // Key listener for hiding nodes
    const handleKeyDown = event => {
      if ((event.key === 'h' || event.key === 'H') && selectedNodeId !== null) {
        const node = networkInstanceRef.current.body.data.nodes.get(selectedNodeId);
        if (node) {
          if (hiddenNodes.some(n => n.id === selectedNodeId)) {
            // Unhide
            setHiddenNodes(hiddenNodes.filter(n => n.id !== selectedNodeId));
            networkInstanceRef.current.body.data.nodes.add(node);
          } else {
            // Hide
            setHiddenNodes([...hiddenNodes, node]);
            networkInstanceRef.current.body.data.nodes.remove(selectedNodeId);
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, hiddenNodes]);

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
    // Fetch initial graph data
    fetch('http://localhost:5000/get_graph')
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
          imageurl: node.imageurl,
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

        // Update min/max scores
        if (edgesData.length > 0) {
          setMinVisual(Math.min(...edgesData.map(e => e.visual_connectivity_score)));
          setMaxVisual(Math.max(...edgesData.map(e => e.visual_connectivity_score)));
          setMinNarrative(Math.min(...edgesData.map(e => e.narrative_connectivity_score)));
          setMaxNarrative(Math.max(...edgesData.map(e => e.narrative_connectivity_score)));
        }

        setAllNodes(nodesData);
        setAllEdges(edgesData);
      })
      .catch(error => console.error('Error fetching graph data:', error));
  }, []);

  useEffect(() => {
    // Initialize network once data is fetched
    if (networkRef.current && allNodes.length > 0 && allEdges.length > 0 && !networkInstanceRef.current) {
      const nodes = new DataSet(allNodes);
      const edges = new DataSet();
      const data = { nodes, edges };

      const options = {
        physics: {
          enabled: true,
          forceAtlas2Based: {
            gravitationalConstant: -repulsionStrength,
            centralGravity: 0,
            springLength: 100,
            springConstant: 0.1 * springStiffnessModulator,
            damping: 1
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
        nodes: { font: { size: 16 }, borderWidth: 1 }
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
    }
  }, [allNodes, allEdges]);

  useEffect(() => {
    // Handle drag events for refixing nodes if necessary
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
          // If node was fixed (orange), re-fix it
          if (node && node.color === 'orange') {
            networkInstanceRef.current.body.data.nodes.update({ id: nodeId, fixed: { x: true, y: true } });
          }
        }
      });
    }
  }, [selectedNodeId]);

  useEffect(() => {
    // Filter and update edges when thresholds or spring length modulator changes
    if (networkInstanceRef.current && allEdges.length > 0) {
      filterAndUpdateEdges();
    }
  }, [visualThreshold, narrativeThreshold, springLengthModulator, allEdges]);

  useEffect(() => {
    // Update physics when stiffness or repulsion changes
    if (networkInstanceRef.current) {
      updatePhysicsSettings();
    }
  }, [springStiffnessModulator, repulsionStrength]);

  function computeOverallScore(visualScore, narrativeScore) {
    const visualWeight = 0.5;
    const narrativeWeight = 0.5;
    return (visualWeight * visualScore) + (narrativeWeight * narrativeScore);
  }

  function getColorFromScore(score) {
    const red = Math.round(255 * score);
    const blue = Math.round(255 * (1 - score));
    return `rgb(${red}, 0, ${blue})`;
  }

function highlightSelectedNode(network, nodeId) {
  network.body.data.nodes.update({ id: nodeId, borderWidth: 3, borderColor: 'orange' });
}

function clearNodeHighlights(network) {
  network.body.data.nodes.forEach(node => {
    network.body.data.nodes.update({ id: node.id, borderWidth: 1, borderColor: undefined });
  });
}


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


  function filterAndUpdateEdges() {
    const edges = networkInstanceRef.current.body.data.edges;
    edges.clear();
  
    const filteredEdges = allEdges.filter(edge =>
      edge.visual_connectivity_score >= visualThreshold &&
      edge.narrative_connectivity_score >= narrativeThreshold
    ).map(edge => {
      const overall_score = computeOverallScore(
        (edge.visual_connectivity_score - minVisual) / (maxVisual - minVisual || 1),
        (edge.narrative_connectivity_score - minNarrative) / (maxNarrative - minNarrative || 1)
      );
      const capped_score = Math.min(overall_score, 1.0);
      const newWidth = 1 + capped_score * 5;
      const newColor = getColorFromScore(capped_score);
      const baseLength = 300 * (1 - capped_score) + 100;
      const newLength = baseLength * springLengthModulator;
  
      return {
        from: edge.from,
        to: edge.to,
        width: newWidth,
        color: newColor,
        title: edge.title,
        length: newLength
      };
    });
  
    edges.add(filteredEdges);
    // No need to call setData or restart simulation. 
    // The network will adjust automatically.
  }
  

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ width: '100%', height: '100vh', position: 'relative', marginBottom: '4rem' }}>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="info-button"
          aria-label="Toggle Instructions"
        >
          <FaInfoCircle size={24} />
        </button>

        {showInstructions && (
          <div
            id="instructions"
            className="instructions-panel"
            style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: '1px solid #ccc', padding: '1em', zIndex: 999 }}
          >
            <button
              onClick={() => setShowInstructions(false)}
              className="close-button"
              aria-label="Close Instructions"
            >
              &times;
            </button>
            <strong>Instructions:</strong> Click on a node to select it, then press <strong>F</strong> to fix/unfix its position. Drag fixed nodes to temporarily unfix them. Press <strong>H</strong> to hide a node, and <strong>I</strong> to toggle image mode.
          </div>
        )}

        <div
          id="network"
          ref={networkRef}
          style={{
            width: '100%',
            height: '100%',
            border: '0px solid lightgray',
            overflow: 'hidden'
          }}
        ></div>
      </div>
      <div className="hidden-nodes-container">
        Hidden Nodes (Click to Unhide):
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

      <div className="sliders-section space-y-4">
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
