import { useState, useRef } from "react";
import Papa from "papaparse";
import { FileIndexManager } from "../models/filesystem.js";
import styles from "../styles/CsvHandler.module.css";
import EnhancedBPlusTreeVisualizer from "./BPlusTreeVisualizer.jsx";

const CsvHandler = () =>
{
  const [showDetails, setshowDetails] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [detailsText, setDetailsText] = useState("");
  const [treeVersion, setTreeVersion] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordNumInput, setRecordNumInput] = useState("");
  const fileIndexRef = useRef(null);

  const handleFileUpload = (e) =>
  {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      fileIndexRef.current = new FileIndexManager();
      fileIndexRef.current.load_csv(text);

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewRows(results.data || []);
          setPreviewVisible(false);
          setSelectedRecord(null);
          setRecordNumInput("");
          setDetailsText("");
          setTreeVersion(v => v + 1);
        },
      });
    };
    reader.readAsText(file);
  };

  const parseAndValidateRecord = () => {
    if (!fileIndexRef.current) {
      return { ok: false, message: "No CSV loaded." };
    }
    const num = parseInt(recordNumInput, 10);
    if (Number.isNaN(num)) {
      return { ok: false, message: "Enter a valid record number (1-based)." };
    }
    if (num < 1 || num > previewRows.length) {
      return {
        ok: false,
        message: `Enter a record number between 1 and ${previewRows.length} (1-based).`,
      };
    }
    return { ok: true, index: num - 1, original: num };
  };

  const handleAddRecord = () => {
    const res = parseAndValidateRecord();
    if (!res.ok) {
      alert(res.message);
      return;
    }
    try
    {
      // Pass the actual record data instead of just the record number
      fileIndexRef.current.insert_record(res.index, true);
      setTreeVersion((v) => v + 1); // 🔄 refresh visualization
    } catch (error) {
      alert(`Error adding record: ${error.message}`);
    }
  };

  const handleDeleteRecord = () => {
    const res = parseAndValidateRecord();
    if (!res.ok) {
      alert(res.message);
      return;
    }
    fileIndexRef.current.delete_record(res.original);
    setTreeVersion((v) => v + 1); // 🔄 refresh visualization
  };

  const handleDisplayDetails = () =>
  {
    setshowDetails(!showDetails);
    if (!fileIndexRef.current) {
      alert("No CSV loaded.");
      return;
    }
    fileIndexRef.current.show_blocks();
    const summary = (fileIndexRef.current.blocks || []).map((b, i) => {
      const id = b?.blockId ?? i;
      const recs = (b?.records ?? []).map((r) => {
        if (!r) return null;
        return r.row ?? r.data ?? r.fields ?? r.record ?? r;
      });
      return { blockId: id, records: recs };
    });
    setDetailsText(JSON.stringify(summary, null, 2));
  };

  const onRowClick = (index) => {
    setSelectedRecord(index);
    setRecordNumInput(String(index + 1));
  };

  return (
    <div className={styles.csvHandler}>
      <div className={styles.uploadSection}>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <label htmlFor="csv-upload" className={styles.uploadButton}>
          Upload CSV
        </label>
      </div>

      {previewRows.length > 0 && (
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
          <button
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={handleDeleteRecord}
          >
            Delete Record
          </button>
          <button className={styles.actionButton} onClick={handleDisplayDetails}>
            Display Details
          </button>
        </div>
      )}

      {previewRows.length > 0 && (
        <>
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
                    {Object.keys(previewRows[0] || {}).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
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
      )}

      {detailsText && showDetails && (
        <div className={styles.detailsArea}>
          <h4>Filesystem Blocks Summary</h4>
          <pre>{detailsText}</pre>
        </div>
      )}
      {fileIndexRef.current?.bPlusTree && (
        <EnhancedBPlusTreeVisualizer
          key={treeVersion}
          tree={fileIndexRef.current.bPlusTree}
        />
      )}
    </div>
  );
};

export default CsvHandler;
