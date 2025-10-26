import React from 'react';

function computeStats(snapshot) {
  if (!snapshot) return { height: 0, nodes: 0, leaves: 0 };
  const idMap = new Map(snapshot.nodes.map(n => [n.id, n]));
  // compute levels
  const levels = [];
  const q = [{ id: snapshot.rootId, lvl: 0 }];
  const seen = new Set();
  while (q.length) {
    const { id, lvl } = q.shift();
    if (!idMap.has(id) || seen.has(id)) continue;
    seen.add(id);
    const n = idMap.get(id);
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(n);
    if (!n.isLeaf) {
      for (const cid of n.children) q.push({ id: cid, lvl: lvl + 1 });
    }
  }
  const height = levels.length;
  const nodes = snapshot.nodes.length;
  const leaves = snapshot.nodes.filter(n => n.isLeaf).length;
  return { height, nodes, leaves };
}

export default function InfoPanel({ snapshot }) {
  const meta = (snapshot && snapshot.meta) || {};
  const stats = computeStats(snapshot);

  return (
    <div className="info-panel">
      <div className="info-card">
        <div className="info-title">Current Transformation</div>
        <div className="info-body">
          <div className="info-row"><strong>Action:</strong> {meta.action || 'idle'}</div>
          {meta.key !== undefined && <div className="info-row"><strong>Key:</strong> {String(meta.key)}</div>}
          {meta.found !== undefined && <div className="info-row"><strong>Found:</strong> {String(meta.found)}</div>}
        </div>
      </div>

      <div className="info-card">
        <div className="info-title">Tree Info</div>
        <div className="info-body">
          <div className="info-row"><strong>Height:</strong> {stats.height}</div>
          <div className="info-row"><strong>Nodes:</strong> {stats.nodes}</div>
          <div className="info-row"><strong>Leaves:</strong> {stats.leaves}</div>
        </div>
      </div>
    </div>
  );
}
