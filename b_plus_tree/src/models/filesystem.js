// filesystem.js
import { Record } from "./record.js";
import { Block } from "./block.js";
import { BPlusTree } from "./bplus/BPlusTree.js";

/**
 * FileIndexManager
 * ----------------
 * Simulates a simple file storage system that manages:
 *  - Disk blocks
 *  - Fixed-length records
 *  - A B+ Tree index on the SSN field
 */
export class FileIndexManager {
  constructor() {
    this.blocks = [new Block(0)];
    this.allRecords = [];
    this.bPlusTree = this.initialize_tree();
    this.nextRecordNumber = 1;
  }

  /**
   * Creates a new record with the given fields
   * @param {Object} fields - Record fields (NAME, SSN, etc.)
   * @returns {Record} The created record
   */
  create_record(fields) {
    // Ensure SSN is provided
    if (!fields.SSN) {
      throw new Error("SSN is required");
    }

    // Ensure SSN has EG- prefix
    const ssn = fields.SSN.startsWith('EG-') ? fields.SSN : `EG-${fields.SSN}`;

    // Fill in missing fields with defaults
    const recordData = {
      NAME: fields.NAME || "",
      SSN: ssn,
      DEPARTMENTCODE: fields.DEPARTMENTCODE || "",
      ADDRESS: fields.ADDRESS || "",
      PHONE: fields.PHONE || "",
      BIRTHDATE: fields.BIRTHDATE || "",
      SEX: fields.SEX || "",
      JOBCODE: fields.JOBCODE || "",
      SALARY: fields.SALARY || "0"
    };

    const record = new Record(recordData, this.nextRecordNumber++);
    this.allRecords.push(record);
    return record;
  }

  /**
   * Loads a CSV file containing employee records into memory.
   * Each record is wrapped as a Record instance.
   */
  load_csv(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      console.error("CSV file is empty or has no data.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    let loadedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, "") : "";
        });
        try {
          this.create_record(row);
          loadedCount++;
        } catch (error) {
          console.error(`Error loading record at line ${i}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Loaded ${loadedCount} records from CSV.`);
  }

  /**
   * Initializes the B+ Tree in CSV mode
   */
  initialize_tree() {
    return new BPlusTree(3, 2, 'csv'); // internal=3, leaf=2, csv mode
  }

  /**
   * Inserts a new record into the file blocks and B+ Tree.
   * @param {Record|Object|number} recordOrFields - Record instance, field values, or record number (1-based)
   * @returns {Record} The inserted record
   */
  insert_record(recordOrFields) {
    let record;
    
    if (typeof recordOrFields === 'number') {
      // If it's a record number (1-based), get the record from allRecords
      const recordIndex = recordOrFields - 1;
      if (recordIndex < 0 || recordIndex >= this.allRecords.length) {
        throw new Error(`Invalid record number: ${recordOrFields}`);
      }
      record = this.allRecords[recordIndex];
      
      // Check if this record is already in a block
      for (const block of this.blocks) {
        const existingRecord = block.records.find(r => r && r.originalLineNumber === record.originalLineNumber);
        if (existingRecord) {
          console.log(`Record ${recordOrFields} is already in the B+ tree`);
          return record;
        }
      }
    } else if (recordOrFields instanceof Record) {
      record = recordOrFields;
    } else {
      record = this.create_record(recordOrFields);
    }

    // find a block that isn't full
    let blockToInsert = this.blocks.find((b) => !b.is_full());
    if (!blockToInsert) {
      blockToInsert = new Block(this.blocks.length);
      this.blocks.push(blockToInsert);
    }

    blockToInsert.add_record(record);

    const pointer = {
      blockId: blockToInsert.blockId,
      recordIndex: blockToInsert.records.length - 1,
    };

    // Insert into B+ Tree using SSN in both modes
    if (this.bPlusTree) {
      // Strip "EG-" prefix and convert to number
      const numericSSN = Number(record.ssn.replace('EG-', ''));
      if (isNaN(numericSSN)) {
        throw new Error('Invalid SSN: must be a number after removing EG- prefix');
      }
      this.bPlusTree.insert(numericSSN, record.originalLineNumber);
      console.log(
        `Inserted record (SSN: ${numericSSN}, Line: ${record.originalLineNumber}) into B+ Tree → Block ${pointer.blockId}, Slot ${pointer.recordIndex}`
      );
    } else {
      console.warn("B+ Tree not initialized yet.");
    }

    return record;
  }

  /**
   * Deletes a record by SSN or record number.
   * @param {string|number} identifier - SSN or record number to delete
   * @returns {boolean} Whether the deletion was successful
   */
  delete_record(identifier) {
    // If identifier is a string (SSN), strip EG- prefix
    let searchIdentifier = identifier;
    if (typeof identifier === 'string' && identifier.startsWith('EG-')) {
      searchIdentifier = Number(identifier.replace('EG-', ''));
    }

    const numericIdentifier = Number(searchIdentifier);
    const isSSN = !isNaN(numericIdentifier);

    // First find the record
    let recordToDelete = null;
    for (const block of this.blocks) {
      for (const rec of block.records) {
        const numericSSN = Number(rec.ssn.replace('EG-', ''));
        if ((isSSN && numericSSN === numericIdentifier) || 
            (!isSSN && rec.originalLineNumber === identifier)) {
          recordToDelete = rec;
          block.mark_deleted(rec.originalLineNumber);
          console.log(`Marked record with SSN ${rec.ssn} as deleted.`);
          break;
        }
      }
      if (recordToDelete) break;
    }

    if (recordToDelete && this.bPlusTree) {
      // Delete using record number in CSV mode
      this.bPlusTree.delete(recordToDelete.originalLineNumber);
      console.log(`Deleted record ${recordToDelete.originalLineNumber} (SSN: ${recordToDelete.ssn}) from B+ Tree index.`);
      return true;
    } 
    
    console.log(`Record ${identifier} not found for deletion.`);
    return false;
  }

  /**
   * Displays all file blocks and their record contents.
   */
  show_blocks() {
    console.log("\n📦 --- Current File Blocks State ---");
    for (const block of this.blocks) {
      block.display();
    }
  }

  /**
   * Prints the current B+ Tree structure.
   */
  show_tree() {
    console.log("\n🌳 --- Current B+ Tree Structure ---");
    if (this.bPlusTree) {
      this.bPlusTree.visualize();
    } else {
      console.log("No B+ Tree initialized yet.");
    }
  }
}
