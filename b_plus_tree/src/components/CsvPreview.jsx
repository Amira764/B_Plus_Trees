import { useState } from 'react';
import styles from '../styles/CsvHandler.module.css';

const CsvPreview = ({ data, onRecordSelect, onAddCsvRecord, onDeleteCsvRecord }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordNumInput, setRecordNumInput] = useState("");

  const handleAddRecord = () => {
    const num = parseInt(recordNumInput, 10);
    if (Number.isNaN(num)) {
      alert("Enter a valid record number (1-based).");
      return;
    }
    if (num < 1 || num > data.length) {
      alert(`Enter a record number between 1 and ${data.length} (1-based).`);
      return;
    }
    onAddCsvRecord(num - 1);
  };

  const handleDeleteRecord = () => {
    const num = parseInt(recordNumInput, 10);
    if (Number.isNaN(num)) {
      alert("Enter a valid record number (1-based).");
      return;
    }
    if (num < 1 || num > data.length) {
      alert(`Enter a record number between 1 and ${data.length} (1-based).`);
      return;
    }
    onDeleteCsvRecord(num);
  };

  const onRowClick = (index) => {
    setSelectedRecord(index);
    setRecordNumInput(String(index + 1));
    onRecordSelect?.(index);
  };

  if (!data?.length) return null;

  return (
    <>
      <div className={styles.actionButtons}>
        <input
          type="number"
          className={styles.recordInput}
          placeholder="Record # (1-based)"
          value={recordNumInput}
          onChange={(e) => setRecordNumInput(e.target.value)}
        />
        <button className={styles.actionButton} onClick={handleAddRecord}>
          Add CSV Record
        </button>
        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDeleteRecord}>
          Delete Record
        </button>
      </div>

      <button
        className={styles.previewButton}
        onClick={() => setPreviewVisible((v) => !v)}
      >
        {previewVisible ? "Hide Preview" : "Show Preview"}
      </button>

      {previewVisible && (
        <div className={styles.dataPreview}>
          <h3>CSV Data Preview</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.recordNum}>#</th>
                {Object.keys(data[0] || {}).map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick(idx)}
                  className={selectedRecord === idx ? styles.selected : ""}
                >
                  <td className={styles.recordNum}>{idx + 1}</td>
                  {Object.values(row).map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default CsvPreview;