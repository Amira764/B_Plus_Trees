// filesystem.js
import { Record } from "./record.js";
import { Block } from "./block.js";
import { BPlusTree } from "../models/b_plus_tree.js";

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
  }

  /**
   * Loads a CSV file containing employee records into memory.
   * Each record is wrapped as a Record instance.
   */
  load_csv(csvText) {
    this.allRecords = [];

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      console.error("CSV file is empty or has no data.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, "") : "";
        });
        this.allRecords.push(new Record(row, i));
      }
    }

    console.log(`✅ Loaded ${this.allRecords.length} records from CSV.`);
  }

  /**
   * Initializes the B+ Tree and inserts the first 10 records.
   */
  initialize_tree() {
    return new BPlusTree(3, 2); // internal=3, leaf=2
  }

  /**
   * Inserts a record into the file blocks and the B+ Tree.
   * @param {number} recordNum - index of record in allRecords[]
   */
  insert_record(recordNum) {
    const record = this.allRecords[recordNum];
    if (!record) {
      console.error(`Record #${recordNum} not found.`);
      return;
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

    // Insert into B+ Tree
    if (this.bPlusTree) {
      this.bPlusTree.insert(record.ssn, pointer);
      console.log(
        `Inserted record (SSN: ${record.ssn}) into B+ Tree → Block ${pointer.blockId}, Slot ${pointer.recordIndex}`
      );
    } else {
      console.warn("B+ Tree not initialized yet.");
    }
  }

  /**
   * Deletes a record by its original CSV line number.
   * Marks the record deleted in its block and removes from B+ Tree.
   */
  delete_record(recordNum) {
    let deletedSSN = null;

    for (const block of this.blocks) {
      for (const rec of block.records) {
        if (rec.originalLineNumber === recordNum) {
          deletedSSN = rec.ssn;
          block.mark_deleted(recordNum);
          console.log(`Marked record with SSN ${rec.ssn} as deleted.`);
          break;
        }
      }
    }

    if (deletedSSN && this.bPlusTree) {
      this.bPlusTree.delete(deletedSSN);
      console.log(`Deleted SSN ${deletedSSN} from B+ Tree index.`);
    } else if (!deletedSSN) {
      console.log(`Record #${recordNum} not found for deletion.`);
    }
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
