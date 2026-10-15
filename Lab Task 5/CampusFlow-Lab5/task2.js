// Task 2 - Academic Performance Intelligence Engine
const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 },
];

const POLICY = [
  { min: 85, grade: 'A', points: 4.0 }, { min: 80, grade: 'A-', points: 3.67 },
  { min: 75, grade: 'B+', points: 3.33 }, { min: 70, grade: 'B', points: 3.0 },
  { min: 65, grade: 'B-', points: 2.67 }, { min: 60, grade: 'C+', points: 2.33 },
  { min: 50, grade: 'C', points: 2.0 }, { min: -Infinity, grade: 'F', points: 0 },
];
const PASS_MARK = 50;

// A. Result processing (map returns a NEW array of NEW objects)
const gradeFor = (marks) => POLICY.find((rule) => marks >= rule.min);
const processResults = (list) =>
  list.map((r) => {
    const { grade, points } = gradeFor(r.marks);
    return { ...r, grade, status: r.marks >= PASS_MARK ? 'PASS' : 'FAIL', gradePoints: points };
  });

// B. Ranked list: sort() MUTATES, so sort a copy made with spread
const rank = (list) => [...list].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));

// C. Department statistics - departments are discovered from the data, so "DS" works automatically
const departmentStats = (list) => {
  const totals = list.reduce((acc, { department, marks, status }) => {
    const d = acc[department] ?? { students: 0, sum: 0, highest: -Infinity, passed: 0 };
    return { ...acc, [department]: { students: d.students + 1, sum: d.sum + marks, highest: Math.max(d.highest, marks), passed: d.passed + (status === 'PASS' ? 1 : 0) } };
  }, {});
  return Object.fromEntries(
    Object.entries(totals).map(([dept, d]) => [dept, { students: d.students, average: Number((d.sum / d.students).toFixed(2)), highest: d.highest, passed: d.passed }])
  );
};

const idsBefore = results.map((r) => r.id).join(',');
const processed = processResults(results);
console.log('A. Processed results');
console.table(processed.map(({ name, marks, grade, status, gradePoints }) => ({ name, marks, grade, status, gradePoints })));

const ranked = rank(processed);
console.log('B. Ranked merit list:', ranked.map((r) => `${r.name}(${r.marks})`).join(' > '));
console.log('   original order kept:', results.map((r) => r.id).join(',') === idsBefore, '| keys of original row:', Object.keys(results[0]).join(','));

console.log('\nC. Department statistics');
console.log(departmentStats(processed));
const withDS = [...processed, ...processResults([{ id: 7, name: 'Dania', department: 'DS', course: 'FSWD', marks: 55 }])];
console.log('   after a new "DS" department appears:', departmentStats(withDS).DS);

console.log('\nD. Academic queries');
const average = processed.reduce((sum, r) => sum + r.marks, 0) / processed.length;
console.log('first scoring > 85         :', processed.find((r) => r.marks > 85)?.name);
console.log('index of first failed      :', processed.findIndex((r) => r.status === 'FAIL'));
console.log('at least one failed        :', processed.some((r) => r.status === 'FAIL'));
console.log('all marks within 0-100     :', processed.every((r) => r.marks >= 0 && r.marks <= 100));
console.log('same check with bad data   :', [...processed, { marks: 120 }].every((r) => r.marks >= 0 && r.marks <= 100));
console.log(`overall average            : ${average.toFixed(2)}`);
console.log('above average              :', processed.filter((r) => r.marks > average).map((r) => r.name));
console.log('top three                  :', ranked.slice(0, 3).map((r) => r.name));
