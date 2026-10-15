// main.js - the caller: demonstrates try / catch / finally for every case
import { parseTranscripts, buildReport, reportToJSON } from './transcriptService.js';
import Student from './Student.js';
import { calculateGPA as gpaOf, calculateAverage } from './gradeUtils.js';

const j = (value) => JSON.stringify(value);
const cases = [
  ['valid data', `[
    { "id": 101, "name": "Ali", "courses": [ { "code": "CS301", "marks": 81 }, { "code": "CS302", "marks": 74 } ] },
    { "id": 102, "name": "Sara", "courses": [ { "code": "CS301", "marks": 93 }, { "code": "CS302", "marks": 48 } ] }
  ]`],
  ['malformed JSON', '[ { "id": 1, "name": "Broken", '],
  ['not an array', j({ id: 1 })],
  ['missing student id', j([{ name: 'NoId', courses: [] }])],
  ['duplicate ids', j([{ id: 7, name: 'A', courses: [] }, { id: 7, name: 'B', courses: [] }])],
  ['marks above 100', j([{ id: 1, name: 'High', courses: [{ code: 'CS301', marks: 101 }] }])],
  ['marks below 0', j([{ id: 2, name: 'Low', courses: [{ code: 'CS301', marks: -5 }] }])],
  ['missing course code', j([{ id: 3, name: 'NoCode', courses: [{ marks: 70 }] }])],
  ['boundary marks 0 and 100', j([{ id: 4, name: 'Edge', courses: [{ code: 'A', marks: 0 }, { code: 'B', marks: 100 }] }])],
];

for (const [label, raw] of cases) {
  console.log(`\n### ${label}`);
  try {
    const report = buildReport(parseTranscripts(raw));
    const json = reportToJSON(report); // JS object -> JSON string
    console.log(label === 'valid data' ? json : j(report));
    console.log('round-trip OK:', JSON.parse(json).totalStudents === report.totalStudents);
  } catch (err) {
    console.log(`${err.constructor.name}: ${err.message}`);
  } finally {
    console.log('(finally) case processed');
  }
}

console.log('\n### direct use of the modules');
const demo = new Student(9, 'Demo', [{ code: 'X', marks: 80 }, { code: 'Y', marks: 60 }]);
console.log('average:', demo.average, '| gpa:', demo.gpa, '| gpaOf([]):', gpaOf([]), '| calculateAverage(null):', calculateAverage(null));
