import React from 'react';

function buildLevels(snapshot) {
  if (!snapshot) return [];
  const map = new Map();
  for (const n of snapshot.nodes) map.set(n.id, n);
  const levels = [];
  const q = [{ id: snapshot.rootId, lvl: 0 }];
  const seen = new Set();
  while (q.length) {
    const { id, lvl } = q.shift();
    if (!map.has(id) || seen.has(id)) continue;
    seen.add(id);
    const node = map.get(id);
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(node);
    if (!node.isLeaf) {
      for (const cid of node.children) q.push({ id: cid, lvl: lvl + 1 });
    }
  }
  return levels;
}

export default function TreeVisualizer({ snapshot }) {
  const levels = buildLevels(snapshot);

  // layout: each node gets x = idx * 180 + 20, y = level*140 + 20
  const nodePos = new Map();
  levels.forEach((lvl, li) => {
    lvl.forEach((n, i) => {
      nodePos.set(n.id, { x: i * 180 + 20, y: li * 140 + 20 });
    });
  });

  const svgLines = [];
  for (const lvl of levels) {
    for (const n of lvl) {
      if (!n.isLeaf) {
        for (const cid of n.children) {
          const a = nodePos.get(n.id);
          const b = nodePos.get(cid);
          if (a && b) svgLines.push({ x1: a.x + 60, y1: a.y + 40, x2: b.x + 60, y2: b.y + 10 });
        }
      }
    }
  }

  return (
    <div className="tree-visualiser" style={{ position: 'relative', minHeight: '320px' }}>
      <svg className="links" style={{ position: 'absolute', inset: 0 }}>
        {svgLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#00e5ff" strokeWidth={2} markerEnd="url(#arrow)" />
        ))}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#00e5ff" />
          </marker>
        </defs>
      </svg>

      {levels.map((lvl, li) => (
        <div className="level" key={li} style={{ position: 'absolute', left: 0, top: li * 140 + 10, height: 120, width: '100%' }}>
          {lvl.map((n) => {
            const pos = nodePos.get(n.id);
            return (
              <div className={`node ${n.isLeaf ? 'leaf' : 'internal'}`} key={n.id} style={{ left: pos.x, top: pos.y, position: 'absolute' }}>
                <div className="node-id">#{n.id}</div>
                <div className="keys">{n.keys.join(' | ')}</div>
                {n.isLeaf && <div className="vals">{(n.values || []).join(', ')}</div>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
