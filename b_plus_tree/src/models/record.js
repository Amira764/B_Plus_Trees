// Field lengths from the PDF
const FIELD_LENGTHS = {
  NAME: 30,
  SSN: 9,
  DEPARTMENTCODE: 9,
  ADDRESS: 40,
  PHONE: 9,
  BIRTHDATE: 8,
  SEX: 1,
  JOBCODE: 4,
  SALARY: 4, 
  DELETED_FLAG: 1,
};

export const RECORD_SIZE = Object.values(FIELD_LENGTHS).reduce((a, b) => a + b, 0);

export class Record
{
  constructor(row, originalLineNumber)
  {
    this.name = row.NAME;
    this.ssn = row.SSN;
    this.department = row.DEPARTMENTCODE;
    this.address = row.ADDRESS;
    this.phone = String(row.PHONE);
    this.birthdate = String(row.BIRTHDATE);
    this.sex = row.SEX;
    this.jobcode = row.JOBCODE;
    this.salary = String(row.SALARY);
    
    this.deleted_flag = 0; // 0 = active, 1 = deleted
    this.originalLineNumber = originalLineNumber;
  }

  to_bytes()
  {
    const pad = (str, len) => String(str || '').padEnd(len).substring(0, len);

    return (
      pad(this.name, FIELD_LENGTHS.NAME) +
      pad(this.ssn, FIELD_LENGTHS.SSN) +
      pad(this.department, FIELD_LENGTHS.DEPARTMENTCODE) +
      pad(this.address, FIELD_LENGTHS.ADDRESS) +
      pad(this.phone, FIELD_LENGTHS.PHONE) +
      pad(this.birthdate, FIELD_LENGTHS.BIRTHDATE) +
      pad(this.sex, FIELD_LENGTHS.SEX) +
      pad(this.jobcode, FIELD_LENGTHS.JOBCODE) +
      pad(this.salary, FIELD_LENGTHS.SALARY) +
      pad(this.deleted_flag, FIELD_LENGTHS.DELETED_FLAG)
    );
  }

  static from_bytes(byteString)
  {
    if (byteString.length !== RECORD_SIZE)
    {
      console.error("Invalid byte string length.");
      return null;
    }

    let offset = 0;
    const record = {};

    for (const [key, len] of Object.entries(FIELD_LENGTHS))
    {
      record[key] = byteString.substring(offset, offset + len).trim();
      offset += len;
    }

    record.SALARY = Number(record.SALARY) || 0;
    record.DELETED_FLAG = Number(record.DELETED_FLAG) || 0;

    return record;
  }

  display()
  {
    const status = this.deleted_flag ? "[DELETED]" : "[Active]";
    console.log(`    ${status}
    SSN: ${this.ssn}
    Name: ${this.name}
    Department: ${this.department}
    Address: ${this.address}
    Phone: ${this.phone}
    Birthdate: ${this.birthdate}
    Sex: ${this.sex}
    Job Code: ${this.jobcode}
    Salary: ${this.salary}
    Original Line Number: ${this.originalLineNumber}`);
  }
}