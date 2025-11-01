import CsvHandler from './components/CsvHandler';

function App()
{
  return (
    <div>
      <div style=
      {{
        padding: '1rem',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
          🌳 B+ Tree Visualizer - CSV Mode
        </h1>
      </div>
      <CsvHandler />
    </div>
  );
}

export default App;