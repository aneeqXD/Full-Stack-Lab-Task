// Task 1 - Admission Decision and Data Sanitization Engine
const WEIGHTS = { matric: 0.2, intermediate: 0.3, entryTest: 0.5 };
const SELECT_MERIT = 75; // SELECTED = eligible AND merit >= 75 AND fee paid; otherwise eligible => WAITING

const applicants = [
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91', intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88', intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76', intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' },
  // boundary + invalid cases
  { id: 'A104', name: 'Boundary Bilal', age: '17', matricMarks: '70', intermediateMarks: '70', entryTest: '70', program: 'bscs', feePaid: 'true' },
  { id: 'A105', name: 'Low Test Laiba', age: '20', matricMarks: '95', intermediateMarks: '90', entryTest: '55', program: 'BSSE', feePaid: 'true' },
  { id: 'A106', name: 'Too Young', age: '16', matricMarks: '101', intermediateMarks: '80', entryTest: '80', program: 'BSAI', feePaid: 'true' },
  { id: 'A107', name: 'Unpaid Umar', age: '21', matricMarks: '90', intermediateMarks: '90', entryTest: '90', program: 'BSCS', feePaid: 'false' },
  { id: 'A108', name: '', age: null, matricMarks: undefined, intermediateMarks: '80', entryTest: 'abc', program: 'BSEE', feePaid: 'maybe' },
  { id: 'A109', name: 'Almost Aiman', age: '30', matricMarks: '100', intermediateMarks: '60', entryTest: '60', program: 'BSAI', feePaid: 'true' },
];
applicants.forEach((a) => Object.freeze(a));
Object.freeze(applicants); // source data is frozen: any accidental mutation would throw

// Explicit conversion: blank / missing never silently becomes 0
function toNumber(value) {
  if (value === undefined || value === null) return NaN;
  const text = String(value).trim();
  return text === '' ? NaN : Number(text);
}

function isSupportedProgram(program) {
  switch (program) {
    case 'BSCS':
    case 'BSSE':
    case 'BSAI':
      return true;
    default:
      return false;
  }
}

function sanitize(raw) {
  const errors = [];
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) errors.push('name is missing');

  const age = toNumber(raw.age);
  if (Number.isNaN(age)) errors.push('age is missing or not a number');
  else if (age < 17 || age > 30) errors.push(`age ${age} is outside 17-30`);

  const marks = {
    matric: toNumber(raw.matricMarks),
    intermediate: toNumber(raw.intermediateMarks),
    entryTest: toNumber(raw.entryTest),
  };
  for (const [field, value] of Object.entries(marks)) {
    if (Number.isNaN(value)) errors.push(`${field} is missing or not a number`);
    else if (value < 0 || value > 100) errors.push(`${field} ${value} is outside 0-100`);
  }

  const program = String(raw.program ?? '').trim().toUpperCase();
  if (!isSupportedProgram(program)) errors.push(`unsupported program "${raw.program}"`);

  const fee = String(raw.feePaid).trim().toLowerCase();
  if (fee !== 'true' && fee !== 'false') errors.push('feePaid must be "true" or "false"');

  return { valid: errors.length === 0, errors, clean: { id: raw.id, name, age, ...marks, program, feePaid: fee === 'true' } };
}

const round2 = (n) => Math.round(n * 100) / 100;

function evaluate(raw) {
  const { valid, errors, clean } = sanitize(raw);
  if (!valid) return { id: raw.id, name: clean.name, program: clean.program, merit: null, status: 'INVALID DATA', errors };

  const merit = round2(clean.matric * WEIGHTS.matric + clean.intermediate * WEIGHTS.intermediate + clean.entryTest * WEIGHTS.entryTest);
  const eligible = merit >= 70 && clean.entryTest >= 60 && clean.intermediate >= 60;
  const status = !eligible ? 'REJECTED' : merit >= SELECT_MERIT && clean.feePaid ? 'SELECTED' : 'WAITING';
  return { id: clean.id, name: clean.name, program: clean.program, merit, status, errors: [] };
}

function summarize(decisions) {
  const valid = decisions.filter((d) => d.status !== 'INVALID DATA');
  const programCounts = {};
  for (const d of decisions) {
    const key = isSupportedProgram(d.program) ? d.program : 'UNSUPPORTED';
    programCounts[key] = (programCounts[key] ?? 0) + 1;
  }
  if (valid.length === 0) return { validApplicants: 0, invalidApplicants: decisions.length, programCounts };
  const best = valid.reduce((a, b) => (b.merit > a.merit ? b : a));
  const worst = valid.reduce((a, b) => (b.merit < a.merit ? b : a));
  return {
    validApplicants: valid.length,
    invalidApplicants: decisions.length - valid.length,
    highestMerit: `${best.name} (${best.merit})`,
    lowestMeritAmongValid: `${worst.name} (${worst.merit})`,
    averageMerit: round2(valid.reduce((sum, d) => sum + d.merit, 0) / valid.length),
    programCounts,
  };
}

const decisions = applicants.map(evaluate);
console.table(decisions.map(({ id, name, program, merit, status }) => ({ id, name, program, merit, status })));
decisions.filter((d) => d.errors.length > 0).forEach((d) => console.log(`${d.id} problems:`, d.errors.join('; ')));
console.log('\nSummary:', summarize(decisions));
console.log('\nSource untouched (frozen):', Object.isFrozen(applicants) && applicants[0].age === '19');
