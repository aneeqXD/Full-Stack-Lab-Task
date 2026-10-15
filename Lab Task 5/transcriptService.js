// transcriptService.js - default import (Student) + named import with an alias
import Student from './Student.js';
import { calculateGrade as letterGrade } from './gradeUtils.js';

export function parseTranscripts(rawJson) {
  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (err) {
    throw new SyntaxError(`Malformed JSON: ${err.message}`);
  }
  if (!Array.isArray(data)) throw new TypeError('Transcript data must be an array of students');

  const seenIds = new Set();
  return data.map((entry, index) => {
    const { id, name, courses } = entry ?? {};
    if (id === undefined || id === null || id === '') throw new TypeError(`Student at index ${index} has no id`);
    if (seenIds.has(id)) throw new Error(`Duplicate student id: ${id}`);
    seenIds.add(id);
    if (typeof name !== 'string' || name.trim() === '') throw new TypeError(`Student ${id} has no name`);
    if (!Array.isArray(courses)) throw new TypeError(`Student ${id}: courses must be an array`);

    for (const { code, marks } of courses) {
      if (typeof code !== 'string' || code.trim() === '') throw new TypeError(`Student ${id}: a course code is missing`);
      if (typeof marks !== 'number' || Number.isNaN(marks)) throw new TypeError(`Student ${id}, ${code}: marks must be a number`);
      if (marks < 0 || marks > 100) throw new RangeError(`Student ${id}, ${code}: marks ${marks} must be between 0 and 100`);
    }
    return new Student(id, name.trim(), courses);
  });
}

export function buildReport(students) {
  return {
    totalStudents: students.length,
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      average: s.average,
      gpa: s.gpa,
      courses: s.courses.map((c) => ({ ...c, grade: letterGrade(c.marks) })),
    })),
  };
}

export const reportToJSON = (report) => JSON.stringify(report, null, 2);
