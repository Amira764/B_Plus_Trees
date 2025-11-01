import { Record } from "./record.js";
import { Block } from "./block.js";
import { BPlusTree } from "./bplus/BPlusTree.js";

export class FileIndexManager
{
  constructor()
  {
    this.blocks = [new Block(0)];
    this.allRecords = [];
    this.bPlusTree = this.initialize_tree();
    this.nextRecordNumber = 1;
  }

  create_record(fields)
  {
    if (!fields.SSN)
    {
      throw new Error("SSN is required");
    }

    const ssn = fields.SSN.startsWith('EG-') ? fields.SSN : `EG-${fields.SSN}`;
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

  deep_copy_record(record)
  {
    if (!record.ssn)
    {
      throw new Error("SSN is required");
    }
    const ssn = record.ssn.startsWith('EG-') ? record.ssn : `EG-${record.ssn}`;

    const recordData = {
      NAME: record.name || "",
      SSN: ssn,
      DEPARTMENTCODE: record.department || "",
      ADDRESS: record.address || "",
      PHONE: record.phone || "",
      BIRTHDATE: record.birthdate || "",
      SEX: record.sex || "",
      JOBCODE: record.jobcode || "",
      SALARY: record.salary || "0"
    };

    const newRecord = new Record(recordData, record.originalLineNumber);
    return newRecord;
  }

  load_csv(csvText)
  {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2)
    {
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    let loadedCount = 0;

    for (let i = 1; i < lines.length; i++)
    {
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (values.length === headers.length)
      {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, "") : "";
        });
        try
        {
          this.create_record(row);
          loadedCount++;
        }
        catch (error)
        {
          console.error(`Error loading record at line ${i}: ${error.message}`);
        }
      }
    }
  }

  initialize_tree()
  {
    return new BPlusTree(3, 2, 'csv');
  }

  get_record_by_identifier(identifier)
  {
    let record = null;

    if (typeof identifier === 'number')
    {
      const recordIndex = identifier - 1;
      if (recordIndex >= 0 && recordIndex < this.allRecords.length)
      {
        record = this.allRecords[recordIndex];
      }
    }
    else if (typeof identifier === 'string')
    {
      const searchSSN = identifier.startsWith('EG-') ? identifier : `EG-${identifier}`;
      for (const block of this.blocks)
      {
        record = block.records.findLast((rec) => rec.ssn === searchSSN);
        if (record) break;
      }
    }

    return record;
  }

  insert_record(recordOrFields, mode = false)
  {
    let record;

    if (!mode)
    {
      record = this._handleInsertByIdentifier(recordOrFields);
    }
    else
    {
      record = this._handleInsertFromMasterList(recordOrFields);
    }

    if (!record)
    {
      return; // Duplicate was found and handled
    }

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

    if (this.bPlusTree)
    {
      const numericSSN = Number(record.ssn.replace('EG-', ''));
      if (isNaN(numericSSN)) throw new Error('Invalid SSN format');
      this.bPlusTree.insert(numericSSN, record.originalLineNumber, pointer);
    }
    return record;
  }

  _handleInsertByIdentifier(recordOrFields)
  {
    const record = this.get_record_by_identifier(recordOrFields);
    if (!record) throw new Error(`Invalid record number: ${recordOrFields}`);

    for (const block of this.blocks)
    {
      if (block.records.some(r => r && r.originalLineNumber === record.originalLineNumber))
      {
        alert(`Record ${recordOrFields + 1} is already in the B+ tree`);
        return null;
      }
    }
    return record;
  }

  _handleInsertFromMasterList(recordOrFields)
  {
    let record = this.allRecords[recordOrFields];

    for (const block of this.blocks)
    {
      if (block.records.some(r => r && r.originalLineNumber === record.originalLineNumber && record.deleted_flag === 0))
      {
        alert(`Record ${recordOrFields + 1} is already in the B+ tree`);
        return null;
      }
    }
    this.allRecords[recordOrFields].deleted_flag = 0;
    return this.deep_copy_record(record);
  }

  delete_record(identifier)
  {
    const recordToDelete = this.get_record_by_identifier(identifier);
    if (!recordToDelete)
    {
      return false;
    }

    this.allRecords[recordToDelete.originalLineNumber - 1].deleted_flag = 1;

    if (this.bPlusTree)
    {
      const numericSSN = Number(recordToDelete.ssn.replace('EG-', ''));
      const result = this.bPlusTree.delete(numericSSN);

      if (result?.pointer)
      {
        const { blockId, recordIndex } = result.pointer;
        const block = this.blocks[blockId];
        if (block && block.records[recordIndex])
        {
          block.records[recordIndex].deleted_flag = 1;
        }
      }
      else
      {
        alert(`Record with SSN ${recordToDelete.ssn} and record number ${recordToDelete.originalLineNumber} not found in any block.`);
      }
    }
    return true;
  }

  show_blocks()
  {
    console.log("\n📦 --- Current File Blocks State ---");
    for (const block of this.blocks)
    {
      block.display();
    }
  }
}