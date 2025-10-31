import React, { useRef, useState } from 'react';
// import './App.css';
import Controls from './components/Controls';
import TreeVisualizer from './components/TreeVisualizer';
import InfoPanel from './components/InfoPanel';
import BPlusTree from './bptree/BPlusTree';
import CsvHandler from './components/CsvHandler';


function App() {
  // persistent tree instance
  const treeRef = useRef(new BPlusTree({ leafOrder: 3, internalOrder: 3, unique: true }));

  const [snapshots, setSnapshots] = useState([treeRef.current.serialize()]);
  const [index, setIndex] = useState(0);
  const [unique, setUnique] = useState(true);

  function handleInsert(value) {
    const ops = treeRef.current.insert(value);
    // ops is an array of snapshots; append them
    setSnapshots((s) => {
      const base = s.slice(0, index + 1);
      const next = base.concat(ops);
      setIndex(next.length - 1);
      return next;
    });
  }

  function handleDelete(value) {
    const ops = treeRef.current.delete(value);
    setSnapshots((s) => {
      const base = s.slice(0, index + 1);
      const next = base.concat(ops);
      setIndex(next.length - 1);
      return next;
    });
  }

  function handleSearch(value) {
    const ops = treeRef.current.search(value);
    setSnapshots((s) => {
      const base = s.slice(0, index + 1);
      const next = base.concat(ops);
      setIndex(next.length - 1);
      return next;
    });
  }

  function handlePrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setIndex((i) => Math.min(snapshots.length - 1, i + 1));
  }

  function handleReset() {
    treeRef.current = new BPlusTree({ leafOrder: 3, internalOrder: 3, unique });
    const snap = treeRef.current.serialize();
    setSnapshots([snap]);
    setIndex(0);
  }

  function handleToggleUnique(u) {
    setUnique(u);
    // reset tree to apply unique mode
    treeRef.current = new BPlusTree({ leafOrder: 3, internalOrder: 3, unique: u });
    const snap = treeRef.current.serialize();
    setSnapshots([snap]);
    setIndex(0);
  }

  return (
    // Mimo csv
     <div>
      <h1>CSV File Handler</h1>
      <CsvHandler />
    </div>

    // Miro visualiser
    // <div className="App">
    //   <header className="App-header">
    //     <h1>B+ Tree Visualiser</h1>
    //   </header>

    //   <main className="App-main layout-split">
    //     <section className="left-col">
    //       <div className="visualiser-wrap">
    //         <TreeVisualizer snapshot={snapshots[index]} />
    //       </div>
    //     </section>

    //     <aside className="right-panel">
    //       <Controls
    //         onInsert={handleInsert}
    //         onDelete={handleDelete}
    //         onSearch={handleSearch}
    //         onPrev={handlePrev}
    //         onNext={handleNext}
    //         onReset={handleReset}
    //         onToggleUnique={handleToggleUnique}
    //         canPrev={index > 0}
    //         canNext={index < snapshots.length - 1}
    //       />

    //       <InfoPanel snapshot={snapshots[index]} />
    //     </aside>
    //   </main>
    // </div>
  );
}

export default App;


