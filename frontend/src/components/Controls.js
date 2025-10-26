import React, { useState, useEffect } from 'react';

export default function Controls({
  onInsert,
  onDelete,
  onSearch,
  onPrev,
  onNext,
  onReset,
  onToggleUnique,
  canPrev,
  canNext,
}) {
  const [value, setValue] = useState('');
  const [unique, setUnique] = useState(true);

  useEffect(() => {
    onToggleUnique && onToggleUnique(unique);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unique]);

  return (
    <div className="controls">
      <div className="input-row">
        <input
          aria-label="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter key (number or text)"
        />
      </div>

      <div className="buttons-column">
        <button className="primary" onClick={() => { onInsert(value); setValue(''); }}>Insert</button>
        <button className="primary" onClick={() => { onDelete(value); setValue(''); }}>Delete</button>
        <button className="primary" onClick={() => { onSearch(value); }}>Search</button>
        <button onClick={onPrev} disabled={!canPrev}>Previous</button>
        <button onClick={onNext} disabled={!canNext}>Next</button>
        <button onClick={onReset}>Reset</button>
        <label className="toggle">
          <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          Unique
        </label>
      </div>
    </div>
  );
}
