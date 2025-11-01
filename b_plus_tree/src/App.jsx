import { useState } from 'react';
import CsvHandler from './components/CsvHandler';
import ManualMode from './components/ManualMode';
import LandingPage from './components/LandingPage';

function App()
{
  const [mode, setMode] = useState(null);

  if (!mode)
  {
    return <LandingPage onModeSelect={setMode} />;
  }

  return (
    <div>
      <div style= 
      {{ 
        padding: '1rem', 
        background: '#f8fafc', 
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
          🌳 B+ Tree Visualizer - {mode === 'csv' ? 'CSV Mode' : 'Manual Mode'}
        </h1>
        <button 
          onClick={() => setMode(null)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            color: '#64748b',
            fontWeight: '500'
          }}
        >
          Change Mode
        </button>
      </div>
      {
        mode === 'csv' ? <CsvHandler /> : <ManualMode />
      }
    </div>
  );
}

export default App;
