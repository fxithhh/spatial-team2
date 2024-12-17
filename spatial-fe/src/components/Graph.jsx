// src/components/Graph.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import './Graph.css';

function Graph({
  visualThreshold,
  narrativeThreshold,
  springLengthModulator,
  springStiffnessModulator,
  repulsionStrength,
  centralGravity
}) {
  const { exhibitId } = useParams();
  const networkRef = useRef(null);
  const networkInstanceRef = useRef(null);

  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [minVisual, setMinVisual] = useState(0);
  const [maxVisual, setMaxVisual] = useState(10);
  const [minNarrative, setMinNarrative] = useState(0);
  const [maxNarrative, setMaxNarrative] = useState(10);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hiddenNodes, setHiddenNodes] = useState([]);
  const [useImageNodes, setUseImageNodes] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [originalNodes, setOriginalNodes] = useState([]);



  const [loading, setLoading] = useState(false);
  const [pairCount, setPairCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressInterval, setProgressInterval] = useState(null);

  const getColorFromScore = (score) => {
    const red = Math.round(255 * score);
    const blue = Math.round(255 * (1 - score));
    return `rgb(${red}, 0, ${blue})`;
  };

  const stopProgressInterval = useCallback(() => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  }, [progressInterval]);

  const startProgressInterval = useCallback((totalPairs) => {
    // Clear any existing interval
    stopProgressInterval();
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        const newVal = prev + 1;
        if (newVal >= totalPairs) {
          clearInterval(interval);
        }
        return newVal;
      });
    }, 4000); // increment every 4.5 seconds
    setProgressInterval(interval);
  }, [stopProgressInterval]);

  const fetchPairCount = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/exhibits/${exhibitId}/pair_count`);
      const data = await response.json();
      if (response.ok) {
        setPairCount(data.pair_count);
        startProgressInterval(data.pair_count);
      } else {
        console.error('Error fetching pair count:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pair count:', error);
    }
  };

  const fetchGraphData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/get_graph/${exhibitId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Graph not found, try to compute it
          console.log("Graph not found, computing...");
          setLoading(true);
          const computeResponse = await fetch(`http://localhost:5000/api/exhibits/${exhibitId}/compute_pairwise`, {
            method: 'POST'
          });
          const computeData = await computeResponse.json();
          if (!computeResponse.ok) {
            alert(`Error computing pairwise: ${computeData.error || 'Unknown error'}`);
            setLoading(false);
            return;
          }

          if (computeData.status === "in progress") {
            fetchPairCount(); // fetch pair count and start progress
            pollStatus();
          } else if (computeData.status === "complete") {
            setLoading(false);
            fetchGraphData();
          }
          return;
        } else {
          const err = await response.json();
          alert(`Error fetching graph: ${err.error || 'Unknown error'}`);
          return;
        }
      }

      const data = await response.json();

      var nodesData = data.nodes.map(node => ({
        id: node.id,
        label: `${node.name}\n ${node.artist}`,
        color: 'lightgreen',
        size: ['0', '1', '3', '10', '11'].includes(node.id) ? 50 : 20, // Correct and scalable
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
        title: `Visual Score: ${link.visual_connectivity_score}\nNarrative Score: ${link.narrative_connectivity_score}`
      }));

      // Update min/max scores
      if (edgesData.length > 0) {
        setMinVisual(Math.min(...edgesData.map(e => e.visual_connectivity_score)));
        setMaxVisual(Math.max(...edgesData.map(e => e.visual_connectivity_score)));
        setMinNarrative(Math.min(...edgesData.map(e => e.narrative_connectivity_score)));
        setMaxNarrative(Math.max(...edgesData.map(e => e.narrative_connectivity_score)));
      }

      setAllNodes(nodesData);
      setOriginalNodes(nodesData); // Save a backup of the nodes
      setAllEdges(edgesData);
      setLoading(false);
      stopProgressInterval(); // Stop the progress if it was running
      setProgress(0);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/exhibits/${exhibitId}/status`);
      const data = await response.json();
      if (data.status === 'in progress') {
        // Still computing, wait 4 seconds then poll again
        setTimeout(pollStatus, 4000);
      } else if (data.status === 'complete') {
        // Done computing, fetch the graph again
        fetchGraphData();
      } else if (data.status === 'not started') {
        setLoading(false);
        stopProgressInterval();
      }
    } catch (error) {
      console.error('Error polling status:', error);
      setLoading(false);
      stopProgressInterval();
    }
  };

  // Inside your Graph component, add this function
  const handleUnhideNode = (nodeId) => {
    const nodeToUnhide = hiddenNodes.find(node => node.id === nodeId);
    if (nodeToUnhide && networkInstanceRef.current) {
      // Add the node back to the network
      networkInstanceRef.current.body.data.nodes.add(nodeToUnhide);
      // Remove the node from hiddenNodes state
      setHiddenNodes(hiddenNodes.filter(node => node.id !== nodeId));
    }
  };

  const calculateAverageSpringEnergy = () => {
    if (!networkInstanceRef.current) return;

    const nodes = networkInstanceRef.current.body.nodes;
    const edges = networkInstanceRef.current.body.edges;

    let totalEnergy = 0;
    let edgeCount = 0;

    Object.values(edges).forEach(edge => {
      const fromNode = nodes[edge.fromId];
      const toNode = nodes[edge.toId];

      if (fromNode && toNode) {
        // Get positions of the nodes
        const x1 = fromNode.x, y1 = fromNode.y;
        const x2 = toNode.x, y2 = toNode.y;

        // Calculate Euclidean distance (actual length of the spring)
        const actualLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        // Retrieve the target spring length and spring constant
        const springLength = edge.options.length || 100; // Default spring length
        const springConstant = 0.1 * springStiffnessModulator;

        // Calculate spring displacement (Delta L)
        const deltaL = actualLength - springLength;

        // Calculate energy for this edge and add to total energy
        const energy = 0.5 * springConstant * deltaL * deltaL;
        totalEnergy += energy;
        edgeCount++;
      }
    });

    const averageEnergy = edgeCount > 0 ? totalEnergy / edgeCount : 0;

    console.log(`Total Spring Energy: ${totalEnergy.toFixed(2)}`);
    console.log(`Average Spring Energy: ${averageEnergy.toFixed(2)}`);
    alert(`Total Spring Energy: ${totalEnergy.toFixed(2)}\nAverage Spring Energy: ${averageEnergy.toFixed(2)}`);
  };



  useEffect(() => {
    fetchGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exhibitId]);

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.key === 'i' || event.key === 'I')) {
        setUseImageNodes(prev => !prev);
        if (networkInstanceRef.current) {
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [useImageNodes]);

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.key === 'h' || event.key === 'H') && selectedNodeId !== null && networkInstanceRef.current) {
        const node = networkInstanceRef.current.body.data.nodes.get(selectedNodeId);
        if (node) {
          if (hiddenNodes.some(n => n.id === selectedNodeId)) {
            setHiddenNodes(hiddenNodes.filter(n => n.id !== selectedNodeId));
            networkInstanceRef.current.body.data.nodes.add(node);
          } else {
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
      if ((event.key === 'f' || event.key === 'F') && selectedNodeId !== null && networkInstanceRef.current) {
        toggleNodeFixed(selectedNodeId, networkInstanceRef.current);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId]);

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
            centralGravity: 0.001,
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
  }, [allNodes, allEdges, repulsionStrength, springStiffnessModulator]);

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
          if (node && node.color === 'orange') {
            networkInstanceRef.current.body.data.nodes.update({ id: nodeId, fixed: { x: true, y: true } });
          }
        }
      });
    }
  }, [selectedNodeId]);

  useEffect(() => {
    if (networkInstanceRef.current && allEdges.length > 0) {
      filterAndUpdateEdges();
    }
  }, [visualThreshold, narrativeThreshold, springLengthModulator, allEdges, minVisual, maxVisual, minNarrative, maxNarrative]);

  useEffect(() => {
    if (networkInstanceRef.current) {
      updatePhysicsSettings();
    }
  }, [springStiffnessModulator, repulsionStrength, centralGravity]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedNodeId !== null && networkInstanceRef.current) {
        const node = networkInstanceRef.current.body.data.nodes.get(selectedNodeId);
        if (node) {
          let newSize = node.size || 20; // Default size
          if (event.key === '=') {
            newSize = Math.min(newSize + 4, 100); // Increment by 4, max 100
          } else if (event.key === '-') {
            newSize = Math.max(newSize - 4, 2); // Decrement by 4, min 0
          }
          // Update the node with the new size
          networkInstanceRef.current.body.data.nodes.update({
            id: selectedNodeId,
            size: newSize,
          });
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId]);
  

  function computeOverallScore(visualScore, narrativeScore) {
    const visualWeight = 0.5;
    const narrativeWeight = 0.5;
    return (visualWeight * visualScore) + (narrativeWeight * narrativeScore);
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

    const filteredEdges = allEdges
      .filter(edge =>
        edge.visual_connectivity_score >= visualThreshold &&
        edge.narrative_connectivity_score >= narrativeThreshold
      )
      .map(edge => {
        const overall_score = computeOverallScore(
          (edge.visual_connectivity_score - minVisual) / (maxVisual - minVisual || 1),
          (edge.narrative_connectivity_score - minNarrative) / (maxNarrative - minNarrative || 1)
        );
        const capped_score = Math.min(overall_score, 1.0);
        const newWidth = 1 + capped_score * 5;
        const newColor = getColorFromScore(capped_score);
        const baseLength = 300 * (1 - capped_score) + 100;
        const newLength = baseLength * springLengthModulator;

        const isOnThreshold =
          Math.abs(edge.visual_connectivity_score - visualThreshold) < 1e-10 ||
          Math.abs(edge.narrative_connectivity_score - narrativeThreshold) < 1e-10;

        return {
          from: edge.from,
          to: edge.to,
          width: newWidth,
          color: isOnThreshold ? 'silver' : newColor,
          title: edge.title,
          length: isOnThreshold ? (newLength * 1.5) : newLength,
          physics: !isOnThreshold
        };
      });

    edges.add(filteredEdges);
  }

  function updatePhysicsSettings() {
    const newPhysicsOptions = {
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -repulsionStrength,
          centralGravity: centralGravity,
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

  const progressPercentage = pairCount > 0 ? Math.min((progress / pairCount) * 100, 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1.2rem' }}>
          <div>Computing pairwise connectivity...</div>
          <div style={{ width: '50%', margin: '20px auto', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercentage}%`,
              background: '#76c7c0',
              height: '20px',
              transition: 'width 0.5s ease'
            }}>
            </div>
          </div>
          <div>{Math.floor(progressPercentage)}%</div>
        </div>
      )}
      {!loading && (
        <div style={{ width: '100%', height: '90vh', position: 'relative', marginBottom: '4rem' }}>
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
              <strong>Instructions:</strong> Click on a node to select it, then press <strong>F</strong> to fix/unfix its position.
              Drag fixed nodes to temporarily unfix them. Press <strong>H</strong> to hide a node, and <strong>I</strong> to toggle image mode.
            </div>
          )}

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
      )}
          <div className="flex justify-center gap-4">
            <button
              onClick={calculateAverageSpringEnergy}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors duration-150"
            >
              Calculate Total and Average Spring Energy
            </button>
            <button
  onClick={() => {
    setShowLabels((prev) => !prev); // Toggle the state
    if (networkInstanceRef.current) {
      const updatedNodes = showLabels
        ? allNodes.map((node) => ({ id: node.id, label: "" })) // Hide labels
        : originalNodes.map((node) => ({ id: node.id, label: node.label })); // Restore labels
      networkInstanceRef.current.body.data.nodes.update(updatedNodes);
    }
  }}
  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors duration-150"
>
  {showLabels ? "Hide Names" : "Show Names"}
</button>

          </div>
      {/* Hidden Nodes Section */}
      {hiddenNodes.length > 0 && (
        <div className="hidden-nodes-container p-4 border border-gray-200 rounded-md mt-6">

          <h3 className="text-sm font-semibold text-gray-800 mb-3">Hidden Nodes</h3>
          <div className="flex flex-wrap gap-2">
            {hiddenNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => handleUnhideNode(node.id)}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-150"
              >
                {node.label} {/* Display only the node name */}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Graph;
