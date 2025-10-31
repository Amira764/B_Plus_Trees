import { RECORD_SIZE } from './record.js';

// from the PDF
const BLOCK_SIZE = 512;
const BLOCKING_FACTOR = Math.floor(BLOCK_SIZE / RECORD_SIZE); // 4

export class Block {
  constructor(blockId) {
    this.blockId = blockId;
    this.records = []; 
    this.maxRecords = BLOCKING_FACTOR;
  }

  is_full() {
    return this.records.length >= this.maxRecords;
  }

  add_record(record) {
    if (this.is_full()) {
      return false;
    }
    this.records.push(record);
    return true;
  }


  mark_deleted(recordNum) {
    let found = false;
    for (const record of this.records) {
      if (record.originalLineNumber === recordNum) {
        record.deleted_flag = 1;
        found = true;
      }
    }
    return found;
  }


  display() {
    console.log(`--- Block ${this.blockId} ---`);
    if (this.records.length === 0) {
      console.log("  [Empty]");
      return;
    }
    for (let i = 0; i < this.records.length; i++) {
      console.log(`  Slot ${i}:`);
      this.records[i].display();
    }
  }
}
