import { LeafNode } from './LeafNode.js';
import { InternalNode } from './InternalNode.js';

const TreeMode = {
  CSV: 'csv',
  MANUAL: 'manual'
};

class TreeVisualizer {
  static buildNodeLabel(node) {
    return node instanceof LeafNode
      ? `[Leaf: ${node.keys.join(", ")}]`
      : `[Internal: ${node.keys.join(", ")}]`;
  }

  static collectLevels(root) {
    const levels = [];
    
    function collect(node, level) {
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);

      if (node instanceof InternalNode) {
        for (const child of node.children) {
          collect(child, level + 1);
        }
      }
    }

    collect(root, 0);
    return levels;
  }
}

class RecordManager {
  constructor() {
    this.recordMap = new Map();
  }

  storeRecord(record) {
    if (record?.originalLineNumber !== undefined) {
      this.recordMap.set(record.originalLineNumber, record);
      return Number(record.ssn);
    }
    return null;
  }

  getRecordSSN(recordNum) {
    const record = this.recordMap.get(recordNum);
    return record ? Number(record.ssn) : null;
  }

  getRecord(recordNum) {
    return this.recordMap.get(recordNum);
  }

  deleteRecord(recordNum) {
    this.recordMap.delete(recordNum);
  }
}

export class BPlusTree {
  constructor(orderInternal = 3, orderLeaf = 2, mode = TreeMode.MANUAL) {
    this.orderInternal = orderInternal;
    this.orderLeaf = orderLeaf;
    this.root = new LeafNode(orderLeaf);
    this.mode = mode;
    this.recordManager = new RecordManager();
  }

  validateKey(key) {
    const numericKey = Number(key);
    if (numericKey === null || isNaN(numericKey)) {
      throw new Error('Invalid key value');
    }
    return numericKey;
  }

  getKeyFromRecord(recordOrKey) {
    // If it's a CSV mode and a record object is passed
    if (this.mode === TreeMode.CSV && typeof recordOrKey === 'object') {
      this.recordManager.storeRecord(recordOrKey);
      // Strip "EG-" prefix and convert to number
      const numericSSN = Number(recordOrKey.ssn.replace('EG-', ''));
      console.log(`Processing record SSN: ${recordOrKey.ssn} -> ${numericSSN}`);
      return numericSSN;
    }
    
    // If it's a number (either mode)
    if (typeof recordOrKey === 'number') {
      if (this.mode === TreeMode.CSV) {
        // Try to get the record by line number first
        const record = this.recordManager.getRecord(recordOrKey);
        if (!record) {
          // If no record found, treat the number as an SSN
          return recordOrKey;
        }
        // Strip "EG-" prefix and convert to number for CSV mode
        const numericSSN = Number(record.ssn.replace('EG-', ''));
        console.log(`Processing record number ${recordOrKey} -> SSN: ${numericSSN}`);
        return numericSSN;
      }
      return this.validateKey(recordOrKey);
    }
    
    // For direct key values in manual mode
    if (typeof recordOrKey === 'string' && recordOrKey.startsWith('EG-')) {
      return Number(recordOrKey.replace('EG-', ''));
    }
    return this.validateKey(recordOrKey);
  }

  getPointerFromRecord(keyOrRecord) {
    if (this.mode === TreeMode.CSV) {
      if (typeof keyOrRecord === 'number') {
        return keyOrRecord;  // Return record number as pointer
      }
      return keyOrRecord.originalLineNumber;  // Return line number as pointer for record objects
    }
    return null;  // Manual mode doesn't use pointers
  }

  createNewRoot(key, oldRoot, newNode) {
    const newRoot = new InternalNode(this.orderInternal);
    newRoot.keys = [key];
    newRoot.children = [oldRoot, newNode];
    return newRoot;
  }

  insert(keyOrRecord, pointer = null) {
    try {
      const key = this.getKeyFromRecord(keyOrRecord);
      if (key === null) {
        throw new Error('Invalid key or record');
      }

      // Get pointer from record in CSV mode if not provided
      pointer = pointer || this.getPointerFromRecord(keyOrRecord);

      const result = this.root.insert(key, pointer);
      if (result) {
        this.root = this.createNewRoot(result.newKey, this.root, result.newNode);
      }
    } catch (error) {
      console.error('Insert failed:', error.message);
      throw error;
    }
  }

  adjustEmptyRoot() {
    if (this.root instanceof InternalNode) {
      if (this.root.keys.length === 0) {
        this.root = this.root.children.length > 0 ? 
          this.root.children[0] : new LeafNode(this.orderLeaf);
      }
    } else if (this.root instanceof LeafNode && this.root.keys.length === 0) {
      this.root = new LeafNode(this.orderLeaf);
    }
  }

  delete(keyOrRecordNum) {
    try {
      const key = this.getKeyFromRecord(keyOrRecordNum);
      if (key === null) {
        throw new Error('Invalid key or record number');
      }

      const result = this.root.delete(key);
      const deletedKey = result?.needsMerge ? result.deletedKey : result;
      
      this.adjustEmptyRoot();

      if (this.mode === TreeMode.CSV && typeof keyOrRecordNum === 'number') {
        this.recordManager.deleteRecord(keyOrRecordNum);
      }
      
      return deletedKey;
    } catch (error) {
      console.error('Delete failed:', error.message);
      throw error;
    }
  }

  search(keyOrRecordNum) {
    try {
      const key = this.getKeyFromRecord(keyOrRecordNum);
      if (key === null) {
        throw new Error('Invalid key or record number');
      }

      const result = this.root.search(key);
      
      if (this.mode === TreeMode.CSV && result !== null) {
        return this.recordManager.getRecord(result) || result;
      }
      
      return result;
    } catch (error) {
      console.error('Search failed:', error.message);
      throw error;
    }
  }

  visualize() {
    console.log("\n🌳 B+ TREE VISUALIZATION");
    const levels = TreeVisualizer.collectLevels(this.root);
    
    levels.forEach((level, i) => {
      const label = i === 0 ? "ROOT" : `LEVEL ${i}`;
      console.log(`\n${label}:`);
      const line = level
        .map(node => TreeVisualizer.buildNodeLabel(node))
        .join("  →  ");
      console.log(line);
    });
  }

  print(node = this.root, level = 0) {
    const indent = "  ".repeat(level);
    if (node instanceof LeafNode) {
      console.log(`${indent}Leaf → [${node.keys.join(", ")}]`);
    } else {
      console.log(`${indent}Internal → [${node.keys.join(", ")}]`);
      for (const child of node.children) {
        this.print(child, level + 1);
      }
    }
  }
}