import React, { useState, useRef } from 'react';
import EnhancedBPlusTreeVisualizer from './BPlusTreeVisualizer';
import { FileIndexManager } from '../models/filesystem';
import styles from '../styles/ManualMode.module.css';

const ManualMode = () =>
{
  const [treeVersion, setTreeVersion] = useState(0);
  const [newRecord, setNewRecord] = useState({ SSN: "" });
  const fileIndexRef = useRef(null);

  const initializeManager = () =>
  {
    if (!fileIndexRef.current) {
      fileIndexRef.current = new FileIndexManager();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.recordForm}>
        <h3>Add New Record</h3>
        <div className={styles.formFields}>
          <input
            type="text"
            className={styles.recordInput}
            placeholder="SSN (required)"
            value={newRecord.SSN}
            onChange={(e) => setNewRecord(prev => ({ ...prev, SSN: e.target.value }))}
          />
          <button 
            className={styles.actionButton} 
            onClick={() => {
              initializeManager();
              if (!newRecord.SSN.trim()) {
                alert("SSN is required");
                return;
              }
              fileIndexRef.current.insert_record(newRecord);
              setNewRecord(prev => ({ ...prev, SSN: "" }));
              setTreeVersion(v => v + 1);
            }}
          >
            Add New Record
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => {
              initializeManager();
              if (!newRecord.SSN.trim()) {
                alert("SSN is required");
                return;
              }
              fileIndexRef.current.delete_record(newRecord.SSN);
              setNewRecord(prev => ({ ...prev, SSN: "" }));
              setTreeVersion(v => v + 1);
            }}
          >
            Delete Record
          </button>
        </div>
      </div>

      {fileIndexRef.current?.bPlusTree && (
        <EnhancedBPlusTreeVisualizer
          key={treeVersion}
          tree={fileIndexRef.current.bPlusTree}
        />
      )}
    </div>
  );
}

export default ManualMode;