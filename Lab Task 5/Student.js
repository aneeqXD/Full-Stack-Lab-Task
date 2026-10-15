// Student.js - default export
import { calculateAverage, calculateGPA } from './gradeUtils.js';

export default class Student {
  constructor(id, name, courses = []) {
    this.id = id;
    this.name = name;
    this.courses = courses;
  }
  get marks() {
    return this.courses.map((c) => c.marks);
  }
  get average() {
    return calculateAverage(this.marks);
  }
  get gpa() {
    return calculateGPA(this.marks);
  }
}
