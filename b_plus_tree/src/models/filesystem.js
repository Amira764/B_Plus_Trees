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
   * Fetch a record by either SSN or record number.
   * @param {string|number} identifier - SSN ("EG-1234") or record number (4)
   * @returns {Record|null} Found record or null
   */
  get_record_by_identifier(identifier) {
    let record = null;

    // If it's a number, assume it's a record number
    if (typeof identifier === 'number') {
      const recordIndex = identifier - 1;
      if (recordIndex >= 0 && recordIndex < this.allRecords.length) {
        record = this.allRecords[recordIndex];
      }
    } else if (typeof identifier === 'string') {
      // Try to find by SSN
      const searchSSN = identifier.startsWith('EG-') ? identifier : `EG-${identifier}`;
      for (const block of this.blocks) {
        record = block.records.find((rec) => rec.ssn === searchSSN);
        if (record) break;
      }
    }

    return record;
  }

  /**
   * Inserts a record into a block and updates B+ Tree.
   */
  insert_record(recordOrFields, mode = false)
  {

    let record;

    if (!mode)
    {
      record = this.get_record_by_identifier(recordOrFields);
      if (!record) throw new Error(`Invalid record number: ${recordOrFields}`);

      // Prevent duplicates
      for (const block of this.blocks) {
        if (block.records.some(r => r && r.originalLineNumber === record.originalLineNumber)) {
          console.log(`Record ${recordOrFields} is already in the B+ tree`);
          return record;
        }
      }
    }
    else
    {
      record = structuredClone(this.allRecords[recordOrFields]);
      // Prevent duplicates
      for (const block of this.blocks)
      {
        if (block.records.some(r => r && r.originalLineNumber === record.originalLineNumber) && record.deleted_flag === 0)
        {
          console.log(`Record ${recordOrFields} is already in the B+ tree`);
          return record;
        }
      }
    }

    // find or create block
    let blockToInsert = this.blocks.find(b => !b.is_full());
    if (!blockToInsert)
    {
      blockToInsert = new Block(this.blocks.length);
      this.blocks.push(blockToInsert);
    }

    blockToInsert.add_record(record);

    const pointer = {
      blockId: blockToInsert.blockId,
      recordIndex: blockToInsert.records.length - 1,
    };

    // Insert into B+ Tree using numeric SSN
    if (this.bPlusTree) {
      const numericSSN = Number(record.ssn.replace('EG-', ''));
      if (isNaN(numericSSN)) throw new Error('Invalid SSN format');
      this.bPlusTree.insert(numericSSN, record.originalLineNumber);
      console.log(
        `Inserted record (SSN: ${numericSSN}, Line: ${record.originalLineNumber}) into B+ Tree → Block ${pointer.blockId}, Slot ${pointer.recordIndex}`
      );
    }
    console.log(`Inserting record: ${record}`, typeof(record));
    return record;
  }

  /**
   * Deletes a record by SSN or record number.
   * @param {string|number} identifier - SSN or record number
   * @returns {boolean} Whether deletion succeeded
   */
  delete_record(identifier)
  {
    console.log(`Attempting to delete record: ${identifier}`);
    const recordToDelete = this.get_record_by_identifier(identifier);

    if (!recordToDelete)
    {
      console.log(`Record ${identifier} not found for deletion.`);
      return false;
    }

    for (const block of this.blocks)
    {
      const found = block.records.find(
        (r) => r.originalLineNumber === recordToDelete.originalLineNumber
      );
      if (found)
      {
        block.mark_deleted(recordToDelete.originalLineNumber);
        console.log(`Marked record with SSN ${recordToDelete.ssn} as deleted.`);
        break;
      }
    }

    if (this.bPlusTree)
    {
      const numericSSN = Number(recordToDelete.ssn.replace('EG-', ''));
      this.bPlusTree.delete(numericSSN);
      console.log(
        `Deleted record ${recordToDelete.originalLineNumber} (SSN: ${recordToDelete.ssn}) from B+ Tree index.`
      );
    }

    return true;
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
