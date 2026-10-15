// Task 7 - Promise-Based Multi-Service Registration Engine
const students = { 101: { id: 101, name: 'Ali', completed: ['CS301'] }, 102: { id: 102, name: 'Sara', completed: [] } };
const courses = { CS401: { code: 'CS401', prerequisite: 'CS301', seatsLeft: 3 } };

// Promise creation: resolve()/reject() decided inside the timer
const delayed = (ms, work) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(work()); } catch (err) { reject(err); }
    }, ms);
  });

const getStudent = (id) => delayed(30, () => { if (!students[id]) throw new Error(`Student ${id} not found`); return students[id]; });
const getCourse = (code) => delayed(30, () => { if (!courses[code]) throw new Error(`Course ${code} not found`); return courses[code]; });
const checkPrerequisites = (ctx) => delayed(30, () => {
  if (!ctx.student.completed.includes(ctx.course.prerequisite)) throw new Error(`${ctx.student.name} is missing ${ctx.course.prerequisite}`);
  return ctx;
});
const checkSeats = (ctx) => delayed(30, () => { if (ctx.course.seatsLeft <= 0) throw new Error('No seats left'); return ctx; });
const registerStudent = (ctx) => delayed(30, () => ({ studentId: ctx.student.id, course: ctx.course.code, status: 'REGISTERED' }));

const sendEmail = (c) => delayed(60, () => `email sent for ${c.studentId}`);
const sendSMS = () => delayed(40, () => { throw new Error('SMS gateway offline'); });
const writeAuditLog = (c) => delayed(20, () => `audit entry for ${c.studentId}/${c.course}`);

// Part A - every .then RETURNS the next promise/value, so data flows stage to stage
function registrationChain(studentId, courseCode) {
  return getStudent(studentId)
    .then((student) => getCourse(courseCode).then((course) => ({ student, course })))
    .then((ctx) => checkPrerequisites(ctx))
    .then((ctx) => checkSeats(ctx))
    .then((ctx) => registerStudent(ctx));
}

function scenarioSuccess() {
  console.log('--- Part A + B: successful registration, then three independent services ---');
  return registrationChain(101, 'CS401')
    .then((confirmation) => {
      console.log('Registered:', confirmation);
      // Part B - allSettled: wait for ALL three and learn each outcome even if one rejects
      return Promise.allSettled([sendEmail(confirmation), sendSMS(confirmation), writeAuditLog(confirmation)]);
    })
    .then((outcomes) => {
      const names = ['Email', 'SMS', 'Audit'];
      console.log(outcomes.map(({ status }, i) => ({ service: names[i], status })));
      console.log('SMS failure reason:', outcomes[1].reason.message);
    })
    .catch((err) => console.log('Workflow failed:', err.message))
    .finally(() => console.log('(finally) scenario 1 done\n'));
}

function scenarioFailure() {
  console.log('--- Chain stops at the first failing stage ---');
  return registrationChain(102, 'CS401')
    .then((confirmation) => console.log('Unexpected success', confirmation))
    .catch((err) => console.log('Caught:', err.message))
    .finally(() => console.log('(finally) scenario 2 done\n'));
}

function scenarioMissingReturn() {
  console.log('--- Bug demo: a .then() without return breaks the chain ---');
  return getStudent(101)
    .then((student) => { getCourse('CS401'); })              // BUG: promise not returned
    .then((course) => console.log('next stage received:', course)) // undefined, and it did not wait
    .finally(() => console.log('(finally) scenario 3 done\n'));
}

// Part C - two independent servers
const serverA = () => delayed(30, () => { throw new Error('Server A crashed'); }); // fails FAST
const serverB = () => delayed(120, () => ({ code: 'CS401', source: 'Server B' })); // succeeds, slower
const serverC = () => delayed(200, () => { throw new Error('Server C crashed'); });

function scenarioServers() {
  console.log('--- Part C: first SETTLED vs first SUCCESSFUL ---');
  return Promise.race([serverA(), serverB()])
    .then((r) => console.log('race ->', r))
    .catch((err) => console.log('race rejected with the fastest failure:', err.message))
    .then(() => Promise.any([serverA(), serverB()]))
    .then((r) => console.log('any  ->', r))
    .then(() => Promise.any([serverA(), serverC()]))
    .catch((err) => console.log(`any with every server down -> ${err.constructor.name} (${err.errors.length} errors)`))
    .finally(() => console.log('(finally) scenario 4 done'));
}

scenarioSuccess().then(scenarioFailure).then(scenarioMissingReturn).then(scenarioServers);
