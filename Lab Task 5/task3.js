// Task 3 - Safe Student Profile Update Service
const student = {
  id: 101, name: 'Ali', marks: 0, scholarship: false,
  address: { city: 'Islamabad', sector: 'F-10' },
  contact: { email: 'ali@university.edu' },
};
const update = { name: 'Ali Khan', address: { city: 'Rawalpindi' }, contact: { phone: '03001234567' } };

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Merges patch INTO a target. Only ever called on a deep clone, so the original is never touched.
function applyPatch(target, patch) {
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value === undefined) continue; // "not provided" - keep old value. 0, false and '' ARE provided.
    if (isPlainObject(value) && isPlainObject(target[key])) applyPatch(target[key], value);
    else target[key] = structuredClone(value);
  }
  return target;
}
const updateStudent = (original, patch) => applyPatch(structuredClone(original), patch);

// Destructuring showcase: nested + renaming + defaults + object rest + optional chaining + ??
function describeStudent({ name: fullName, marks = 0, scholarship = false, address: { city, sector = 'N/A' } = {}, contact, ...others }) {
  const email = contact?.email ?? 'no email';
  const phone = contact?.phone ?? 'no phone';
  const otherKeys = Object.keys(others); // object rest
  return { fullName, marks, scholarship, city, sector, email, phone, otherKeys }; // property shorthand
}

// Rest parameters + array destructuring
function changedFields(before, after, ...keys) {
  const [first, ...remaining] = keys;
  const differs = (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]);
  return { checkedFirst: first, alsoChecked: remaining, changed: keys.filter(differs) };
}

const updated = updateStudent(student, update);
console.log('Original :', JSON.stringify(student));
console.log('Updated  :', JSON.stringify(updated));
console.log('Described:', describeStudent(updated));
console.log('Changes  :', changedFields(student, updated, 'name', 'marks', 'address', 'contact'));
console.log('Spread   :', { ...updated, marks: updated.marks + 5 }.marks, '(new object built with spread)');

console.log('\n-- Falsy but valid values must survive --');
const scored = { ...student, marks: 75, scholarship: true };
console.log(JSON.stringify(updateStudent(scored, { marks: 0, scholarship: false, name: '' })));
console.log('undefined in update is ignored:', JSON.stringify(updateStudent(scored, { marks: undefined })));
console.log('empty update gives equal copy :', JSON.stringify(updateStudent(student, {})) === JSON.stringify(student));
console.log('missing nested data is safe   :', describeStudent({ name: 'Zed' }));

console.log('\n-- Reference challenge (=== compares memory references) --');
console.log('original === updated            :', student === updated);
console.log('original.address === updated.address:', student.address === updated.address);
console.log('original.contact === updated.contact:', student.contact === updated.contact);
const shallow = { ...student, name: 'Shallow' };
console.log('shallow spread copy: address shared? :', shallow.address === student.address, '<- why a plain {...obj} is NOT enough');
console.log('original still untouched:', student.address.city, student.contact.phone ?? '(no phone)');
