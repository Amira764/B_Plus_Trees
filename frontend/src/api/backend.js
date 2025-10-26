// frontend/src/api/backend.js
// Lightweight client helpers for talking to a future backend that performs
// B+ tree operations and returns snapshots (or step lists) for visualization.
//
// Usage:
//   import backend from './api/backend';
//   const snapshot = await backend.insert({ key: 5 });
//
// Expected server endpoints (examples):
// POST /api/insert  { key: <any> } -> { snapshots: [ { rootId, nodes, meta }, ... ] }
// POST /api/delete  { key: <any> } -> { snapshots: [...] }
// POST /api/search  { key: <any> } -> { snapshots: [...] }
// GET  /api/snapshot -> { snapshot: { rootId, nodes, meta } }
//
// Snapshot shape (same format used in the frontend model):
// {
//   rootId: number,
//   nodes: [ { id, isLeaf, keys:[], children:[], values:[], parent, next, meta? }, ... ],
//   meta: { action: 'insert'|'split-leaf'|'search'|'delete'..., key: any, found?: boolean }
// }
//
// Server should return `snapshots` (array) when an operation produces several steps.

const defaultHeaders = { 'Content-Type': 'application/json' };

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text}`);
  }
  return res.json();
}

export default {
  // Insert key -> returns snapshots array (or single snapshot under `snapshot`)
  async insert({ key }) {
    const data = await postJson('/api/insert', { key });
    // prefer `snapshots` array; if server returns single `snapshot`, normalize
    return data.snapshots || (data.snapshot ? [data.snapshot] : []);
  },

  async delete({ key }) {
    const data = await postJson('/api/delete', { key });
    return data.snapshots || (data.snapshot ? [data.snapshot] : []);
  },

  async search({ key }) {
    const data = await postJson('/api/search', { key });
    return data.snapshots || (data.snapshot ? [data.snapshot] : []);
  },

  // Get current full snapshot (useful for initial load / polling)
  async getSnapshot() {
    const res = await fetch('/api/snapshot');
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    return data.snapshot;
  },

  // Real-time streaming (recommended): server can offer an event-stream or websocket.
  // Example helper to subscribe to server-sent events (SSE):
  subscribeToSteps(onSnapshot) {
    if (typeof EventSource === 'undefined') return () => {};
    const es = new EventSource('/api/steps/stream');
    es.addEventListener('snapshot', (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        onSnapshot(payload.snapshot);
      } catch (err) { console.warn('invalid snapshot from SSE', err); }
    });
    es.onerror = (e) => console.warn('SSE error', e);
    return () => es.close();
  }
};
