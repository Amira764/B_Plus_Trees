import { useState } from 'react';
import styles from '../styles/CsvHandler.module.css';

const RecordForm = ({ onAddRecord, onDeleteRecord }) => {
  const [newRecord, setNewRecord] = useState({SSN: ""});
  const [ssnToDelete, setSsnToDelete] = useState("");

  const handleAdd = () => {
    if (!newRecord.SSN.trim()) {
      alert("SSN is required");
      return;
    }
    onAddRecord(newRecord);
    setNewRecord(prev => ({ ...prev, SSN: "" }));
  };

  const handleDelete = () => {
    const ssn = ssnToDelete.trim();
    if (!ssn) {
      alert("Enter an SSN to delete");
      return;
    }
    onDeleteRecord(ssn);
    setSsnToDelete("");
  };

  return (
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
        <button className={styles.actionButton} onClick={handleAdd}>
          Add New Record
        </button>
      </div>
      <div className={styles.formFields}>
        <input
          type="text"
          className={styles.recordInput}
          placeholder="SSN to delete"
          value={ssnToDelete}
          onChange={(e) => setSsnToDelete(e.target.value)}
        />
        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete}>
          Delete by SSN
        </button>
      </div>
    </div>
  );
};

export default RecordForm;