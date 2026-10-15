// Task 8 - Concurrent Academic API Aggregator with async/await
const users = [
  { id: 1, name: 'Ali', department: 'CS' }, { id: 2, name: 'Sara', department: 'CS' },
  { id: 3, name: 'Usman', department: 'SE' }, { id: 4, name: 'Hina', department: 'AI' },
  { id: 5, name: 'Zoya', department: 'AI' },
];
const courses = [{ id: 'FSWD', title: 'Full Stack Web Development' }, { id: 'DB', title: 'Databases' }, { id: 'AI', title: 'Intro to AI' }];
const results = [
  { userId: 1, courseId: 'FSWD', marks: 82 }, { userId: 1, courseId: 'DB', marks: 76 },
  { userId: 2, courseId: 'FSWD', marks: 91 }, { userId: 2, courseId: 'DB', marks: 88 },
  { userId: 3, courseId: 'FSWD', marks: 47 }, { userId: 3, courseId: 'DB', marks: 42 },
  { userId: 4, courseId: 'AI', marks: 73 }, { userId: 5, courseId: 'AI', marks: 91 },
];

const ROUTES = {
  '/users': { status: 200, body: users },
  '/courses': { status: 200, body: courses },
  '/results': { status: 200, body: results },
  '/missing': { status: 404, statusText: 'Not Found', body: { error: 'nope' } },
  '/error': { status: 500, statusText: 'Internal Server Error', body: { error: 'boom' } },
  '/network': { network: true },
  '/badjson': { status: 200, raw: '{ this is not json' },
  '/slow': { status: 200, body: { message: 'slow but fine' }, delay: 400 },
};

// Behaves like fetch(): resolves with a response-shaped object, rejects on network failure or abort
function fakeFetch(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const route = ROUTES[url] ?? { status: 404, statusText: 'Not Found', body: {} };
    const timer = setTimeout(() => {
      if (route.network) return reject(new TypeError('fetch failed: network unreachable'));
      resolve({
        ok: route.status >= 200 && route.status < 300,
        status: route.status,
        statusText: route.statusText ?? 'OK',
        async json() {
          if (route.raw !== undefined) return JSON.parse(route.raw); // throws SyntaxError
          return structuredClone(route.body);
        },
      });
    }, route.delay ?? 150);
    signal?.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.name = 'HttpError'; this.status = status; }
}

async function getJSON(url, fetchImplementation, options) {
  const response = await fetchImplementation(url, options); // network failure / abort propagate as-is
  if (!response.ok) throw new HttpError(response.status, `HTTP ${response.status} ${response.statusText} for ${url}`);
  return await response.json(); // invalid JSON propagates as SyntaxError
}

async function fetchWithTimeout(url, milliseconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException(`Timed out after ${milliseconds}ms`, 'TimeoutError')), milliseconds);
  try {
    return await getJSON(url, fakeFetch, { signal: controller.signal });
  } finally {
    clearTimeout(timer); // runs on success AND on failure
  }
}

function classify(err) {
  if (err instanceof HttpError) return `HTTP failure (${err.status})`;
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return 'timeout / abort';
  if (err instanceof SyntaxError) return 'invalid JSON';
  if (err instanceof TypeError) return 'network failure';
  return 'unknown error';
}

const avg = (nums) => (nums.length ? Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)) : 0);

function buildStats(userList, courseList, resultList) {
  const perStudent = userList.map((u) => ({ ...u, average: avg(resultList.filter((r) => r.userId === u.id).map((r) => r.marks)) }));
  const top = perStudent.reduce((best, s) => (s.average > best.average ? s : best));
  const departments = perStudent.reduce((acc, s) => {
    const d = acc[s.department] ?? { students: 0, total: 0, failed: 0 };
    return { ...acc, [s.department]: { students: d.students + 1, total: d.total + s.average, failed: d.failed + (s.average < 50 ? 1 : 0) } };
  }, {});
  return {
    totalStudents: userList.length,
    totalCourses: courseList.length,
    overallAverage: avg(resultList.map((r) => r.marks)),
    topStudent: `${top.name} (${top.average})`,
    failedStudents: perStudent.filter((s) => s.average < 50).length,
    departments: Object.fromEntries(Object.entries(departments).map(([k, d]) => [k, { students: d.students, average: avg([d.total / d.students]), failed: d.failed }])),
  };
}

async function loadDashboard() {
  // All three requests START immediately; Promise.all waits for the slowest one
  const [u, c, r] = await Promise.all(['/users', '/courses', '/results'].map((path) => fetchWithTimeout(path, 1000)));
  return buildStats(u, c, r);
}

async function loadSequentially() {
  const u = await fetchWithTimeout('/users', 1000); // each await waits for the previous one
  const c = await fetchWithTimeout('/courses', 1000);
  const r = await fetchWithTimeout('/results', 1000);
  return buildStats(u, c, r);
}

async function timed(label, fn) {
  const start = performance.now();
  const value = await fn();
  console.log(`${label}: ${Math.round(performance.now() - start)} ms`);
  return value;
}

console.log('--- Dashboard ---');
console.log(await timed('concurrent (Promise.all)', loadDashboard));
await timed('sequential awaits       ', loadSequentially);

console.log('\n--- Error classification (500 ms timeout, 100 ms for /slow) ---');
for (const path of ['/users', '/missing', '/error', '/network', '/badjson', '/slow']) {
  try {
    const data = await fetchWithTimeout(path, path === '/slow' ? 100 : 500);
    console.log(`${path.padEnd(9)} OK (${Array.isArray(data) ? data.length + ' items' : 'object'})`);
  } catch (err) {
    console.log(`${path.padEnd(9)} ${classify(err).padEnd(18)} <- ${err.name}: ${err.message}`);
  }
}
console.log('/slow with a 1000 ms timeout ->', await fetchWithTimeout('/slow', 1000));

console.log('\n--- One failing endpoint rejects the whole Promise.all ---');
try {
  await Promise.all(['/users', '/courses', '/missing'].map((p) => getJSON(p, fakeFetch)));
} catch (err) {
  console.log('Dashboard load failed:', classify(err));
}
