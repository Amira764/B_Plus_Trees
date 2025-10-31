import { Record } from './record.js';
import { Block } from './block.js';


export class FileIndexManager {
  constructor() {
    this.blocks = [new Block(0)]; 
    this.allRecords = []; 
    this.bPlusTree = null; 
  }

  load_csv(csvText) {
    this.allRecords = [];
    
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      console.error("CSV file is empty or has no data.");
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, '') : '';
        });
        this.allRecords.push(new Record(row, i));
      }
    }
    console.log(`Loaded ${this.allRecords.length} records from CSV.`);
  }


  // TODO: Actually initialize B+ Tree
  initialize_tree() {
    // console.log("Initializing B+ Tree (STUB)...");
    // // this.bPlusTree = new BPlusTree(); // This will be uncommented later

    // // As per assignment, load the first 10 records
    // const initialRecords = this.allRecords.slice(0, 10);
    // for (const record of initialRecords) {
    //   this.insert_record(record);
    // }
  }


  // TODO: Implement actual insertion in B+ Tree
  insert_record(recordNum) {
    // hasa we push 3la a5r wa7d adam feh delete marker, wla do we actually remove at some point to be seen lama azkrha
    let blockToInsert = this.blocks.find(b => !b.is_full());

    if (!blockToInsert) {
      blockToInsert = new Block(this.blocks.length);
      this.blocks.push(blockToInsert);
    }
    
    blockToInsert.add_record(this.allRecords[recordNum]);
    
    // add it to the b+ tree
    // const dataPointer = {
    //   blockId: blockToInsert.blockId,
    //   recordIndex: blockToInsert.records.length - 1
    // };

    // // Update the index (STUBBED)
    // if (this.bPlusTree) {
    //   // this.bPlusTree.insert(record.ssn, dataPointer);
    // } else {
    //   console.log(`  [Index STUB] Would insert (SSN: ${record.ssn}, Pointer: B${dataPointer.blockId}, S${dataPointer.recordIndex}) into B+ Tree.`);
    // }
  }


  // TODO: Implement actual deletion in B+ Tree
  delete_record(recordNum) {
    let recordFound = false;
    for (const block of this.blocks) {
      if (block.mark_deleted(recordNum)) {
        recordFound = true;
        break;
      }
    }

    // if (recordFound) {
    //   // Update the index (STUBBED)
    //   if (this.bPlusTree) {
    //     // this.bPlusTree.delete(ssn);
    //   } else {
    //     console.log(`  [Index STUB] Would delete (SSN: ${ssn}) from B+ Tree.`);
    //   }
    // } else {
    //   console.log(`Record with SSN ${ssn} not found for deletion.`);
    // }
  }


  show_blocks() {
    console.log("\n--- Current File Blocks State ---");
    for (const block of this.blocks) {
      block.display();
    }
  }


  // TODO: Implement B+ Tree visualization
  show_tree() {
  }
}
