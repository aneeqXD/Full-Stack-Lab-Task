// Task 4 - University User Hierarchy and Dynamic this
class Person {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  introduce() {
    return `Hi, I am ${this.name} (${this.email})`;
  }
}

class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email); // must run before "this" is usable
    this.rollNo = rollNo;
    this.marks = marks;
  }
  introduce() {
    return `${super.introduce()} - Student, roll no ${this.rollNo}`; // reuse parent behaviour
  }
  getResult() {
    return `${this.name}: ${this.marks} marks -> ${this.marks >= 50 ? 'PASS' : 'FAIL'}`;
  }
}

class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    this.employeeId = employeeId;
    this.department = department;
  }
  introduce() {
    return `${super.introduce()} - Faculty (${this.employeeId}), ${this.department} department`;
  }
}

const users = [
  new Student('Aneeq', 'aneeq@students.au.edu.pk', '241803', 88),
  new FacultyMember('Dr. Sana', 'sana@au.edu.pk', 'E-1007', 'CS'),
  new Student('Usman', 'usman@students.au.edu.pk', '241900', 42),
  new FacultyMember('Dr. Imran', 'imran@au.edu.pk', 'E-2014', 'SE'),
  new Person('Visitor', 'visitor@example.com'),
];

console.log('-- Runtime polymorphism: same call, different method chosen by the real object --');
users.forEach((user) => console.log(user.introduce()));

console.log('\n-- instanceof / prototype chain --');
const [stu, fac] = users;
console.log('stu instanceof Student/Person/FacultyMember:', stu instanceof Student, stu instanceof Person, stu instanceof FacultyMember);
console.log('fac instanceof FacultyMember/Person/Student:', fac instanceof FacultyMember, fac instanceof Person, fac instanceof Student);
console.log('Student.prototype -> Person.prototype      :', Object.getPrototypeOf(Student.prototype) === Person.prototype);
console.log('getResult() only exists on students        :', users.filter((u) => u instanceof Student).map((u) => u.getResult()));
try { Student('x'); } catch (e) { console.log('calling a class without new ->', e.name + ':', e.message); }

console.log('\n-- call(): borrow Person.introduce for a plain object --');
const guest = { name: 'Dr. Ahmed', email: 'ahmed@example.com' };
console.log(Person.prototype.introduce.call(guest));

console.log('\n-- Detached method loses its this --');
const fn = stu.introduce;
try { console.log(fn()); } catch (e) { console.log('fn() ->', e.name + ':', e.message); }

console.log('\n-- bind(): permanently fixes this --');
const safeIntroduce = stu.introduce.bind(stu);
console.log(safeIntroduce());
const guestIntro = Person.prototype.introduce.bind(guest);
console.log(guestIntro());
console.log('bind wins over call:', safeIntroduce.call(guest) === safeIntroduce());
