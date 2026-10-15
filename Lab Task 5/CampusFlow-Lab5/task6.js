// Task 6 - Legacy Course Registration Service Using Callbacks (error-first, setTimeout, no Promises)
const students = {
  101: { id: 101, name: 'Ali', completed: ['CS301'] },
  102: { id: 102, name: 'Sara', completed: [] },
  103: { id: 103, name: 'Hina', completed: ['CS301'] },
  104: { id: 104, name: 'Zoya', completed: ['CS301'] },
};
const courses = { CS401: { code: 'CS401', prerequisite: 'CS301', capacity: 2 } };
const registrations = []; // { studentId, course }

// Every function: async via setTimeout, calls its callback EXACTLY ONCE (return after the error branch)
function loadStudent(id, callback) {
  setTimeout(() => {
    const student = students[id];
    if (!student) return callback(new Error(`Student ${id} does not exist`));
    callback(null, student);
  }, 40);
}

function checkPrerequisites(student, courseCode, callback) {
  setTimeout(() => {
    const course = courses[courseCode];
    if (!course) return callback(new Error(`Course ${courseCode} does not exist`));
    if (!student.completed.includes(course.prerequisite)) {
      return callback(new Error(`${student.name} has not completed prerequisite ${course.prerequisite}`));
    }
    callback(null, course);
  }, 40);
}

function checkSeats(course, callback) {
  setTimeout(() => {
    const taken = registrations.filter((r) => r.course === course.code).length;
    if (taken >= course.capacity) return callback(new Error(`${course.code} is full (${taken}/${course.capacity})`));
    callback(null, course);
  }, 40);
}

function registerCourse(student, course, callback) {
  setTimeout(() => {
    const already = registrations.some((r) => r.studentId === student.id && r.course === course.code);
    if (already) return callback(new Error(`${student.name} is already registered for ${course.code}`));
    registrations.push({ studentId: student.id, course: course.code });
    callback(null, { studentId: student.id, course: course.code, status: 'REGISTERED' });
  }, 40);
}

// The dependent workflow: each stage starts only inside the previous stage's callback
function register(studentId, courseCode, done) {
  loadStudent(studentId, (loadErr, student) => {
    if (loadErr) return done(loadErr);
    checkPrerequisites(student, courseCode, (preErr, course) => {
      if (preErr) return done(preErr);
      checkSeats(course, (seatErr) => {
        if (seatErr) return done(seatErr);
        registerCourse(student, course, (regErr, confirmation) => {
          if (regErr) return done(regErr);
          done(null, confirmation);
        });
      });
    });
  });
}

// Runs the test cases one after another (callback recursion, so the output order is predictable)
function runCases(list, index = 0) {
  if (index === list.length) return console.log('\nAll cases finished. Registrations:', registrations);
  const [label, studentId, courseCode] = list[index];
  register(studentId, courseCode, (err, confirmation) => {
    console.log(`[${label}]`, err ? `FAILED -> ${err.message}` : confirmation);
    runCases(list, index + 1);
  });
}

runCases([
  ['normal: Ali registers', 101, 'CS401'],
  ['already registered', 101, 'CS401'],
  ['normal: Hina registers', 103, 'CS401'],
  ['course is full', 104, 'CS401'],
  ['prerequisite missing', 102, 'CS401'],
  ['student does not exist', 999, 'CS401'],
  ['course does not exist', 101, 'CS999'],
]);
