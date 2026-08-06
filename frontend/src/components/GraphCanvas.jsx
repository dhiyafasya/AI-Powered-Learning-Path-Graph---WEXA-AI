import { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { layeredPositions } from '../lib/layout.js';
import { levelColor } from '../lib/format.js';

function TopicNode({ data, selected }) {
  const t = data.topic;
  const classes = ['rf-topic-node'];
  if (selected) classes.push('selected');
  if (data.status === 'done') classes.push('done');
  if (data.status === 'target') classes.push('target');

  return (
    <div className={classes.join(' ')}>
      <Handle type="source" position={Position.Left} style={{ background: '#cbd5e1' }} />
      <div className="rf-node-top">
        <span className="dot" style={{ background: levelColor(t.level) }} />
        <span className="rf-node-title">{t.name}</span>
      </div>
      <div className="rf-node-meta">
        <span className={`pill pill-${t.level}`}>{t.level}</span>
        <span className="rf-node-hours">{t.estHours != null ? `${t.estHours}h` : ''}</span>
        {data.unlockScore != null && (
          <span className="rf-unlock">· unlocks {data.unlockScore}</span>
        )}
      </div>
      <Handle type="target" position={Position.Right} style={{ background: '#cbd5e1' }} />
    </div>
  );
}

/**
 * Interactive graph canvas.
 * @param {Array<{id,name,level,estHours}>} nodes
 * @param {Array<{source,target}>} edges  source REQUIRES target
 * @param {Object<string,string>} statusBy id -> 'done' | 'target'
 * @param {Object<string,number>} unlockBy id -> unlock count
 */
export default function GraphCanvas({
  nodes = [],
  edges = [],
  statusBy = {},
  unlockBy = {},
  selectedId = null,
  onSelect,
  height = 420,
}) {
  const { rfNodes, rfEdges } = useMemo(() => {
    const positions = layeredPositions(nodes, edges);

    const rfNodes = nodes.map((n) => ({
      id: n.id,
      type: 'topic',
      position: positions[n.id] || { x: 0, y: 0 },
      data: {
        topic: n,
        status: statusBy[n.id],
        unlockScore: unlockBy[n.id],
      },
    }));

    const rfEdges = edges.map((e, i) => ({
      id: `e-${i}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    }));

    return { rfNodes, rfEdges };
  }, [nodes, edges, statusBy, unlockBy]);

  const nodeTypes = useMemo(() => ({ topic: TopicNode }), []);

  return (
    <div className="graph-wrap" style={{ height }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={18} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor="#c7c9f5" maskColor="rgba(244,245,250,0.7)" />
      </ReactFlow>
    </div>
  );
}
