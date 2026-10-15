// gradeUtils.js - named exports only
const SCALE = [
  [85, 'A', 4.0], [80, 'A-', 3.67], [75, 'B+', 3.33], [70, 'B', 3.0],
  [65, 'B-', 2.67], [60, 'C+', 2.33], [50, 'C', 2.0], [0, 'F', 0],
];
const round2 = (n) => Math.round(n * 100) / 100;

export function calculateGrade(marks) {
  const [, letter] = SCALE.find(([min]) => marks >= min);
  return letter;
}

export function calculateGradePoints(marks) {
  const [, , points] = SCALE.find(([min]) => marks >= min);
  return points;
}

export function calculateAverage(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return round2(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function calculateGPA(marksList) {
  return calculateAverage(marksList.map((m) => calculateGradePoints(m)));
}
