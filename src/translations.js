import keys from '../content/translation-key.json' with { type: 'json' };

// Reconstructed for practice from the Vietnamese answer key, not original exam text.
const english = [
  [
    'Skype is a great online service and tool that allows Skype users to make video calls over the Internet.',
    'Once a virus has entered your computer, its type or the way it got in is less important than removing it and preventing further infection.',
    'When a company wants to switch to software from another supplier, transferring its data to the new software can be difficult.',
    'The great advantage of a mesh network is that when one connection breaks, data can use other connections.',
    'Computer networks link computers through communication lines and software protocols that allow data to be transmitted quickly and reliably.',
  ],
  [
    'Mainframe computers usually process several application programs simultaneously to increase processing productivity.',
    'What we need are small programs that are easy to understand and use, and that work together to perform more complex tasks.',
    'E-commerce systems use standard software with small files, called cookies, to find products in the shopping cart.',
    'A support technician’s duties are to set up new computers, install software and keep systems running smoothly.',
    'Open-source operating system suppliers often make money by charging for support, but if you buy proprietary software, support is free.',
  ],
  [
    'A virus can change or delete data on your computer, use your email program to spread itself to other computers, or even erase everything on your hard disk.',
    'Online services provide a wide range of information and services, whereas a BBS usually focuses on a single topic.',
    'With open-source software, an organization does not have to follow the vendor’s decisions. With proprietary software, the vendor controls software updates.',
    'In a client-server system, servers are dedicated computers that store data, support websites and perform similar functions.',
    'A global positioning system would be extremely useful for delivery drivers. If they got lost, it would help them find their customers.',
  ],
  [
    'Computer viruses are small software programs designed to spread from one computer to another and interfere with computer operation.',
    'A single instruction written in a high-level language usually produces several instructions when translated into machine code.',
    'An operating system is the main control program that controls the functions of the computer system as a whole and the operation of application systems.',
    'Online services provide an infrastructure in which subscribers can communicate with one another by exchanging email messages or participating in online forums.',
    null,
  ],
  [
    'RescueTime is a great service that can help you focus while working on your computer and track how much time you spend on each task.',
    'As services become increasingly expensive, support seems to be regarded as an additional business opportunity.',
    'The Internet is a global system of interconnected computers that use compatible network protocols to serve billions of users worldwide.',
    'In a graphical interface, users use a mouse to click on icons representing the functions to be performed.',
    'One way to extract data from a simple database is to retrieve a record, for example when you want to check the data in a record.',
  ],
];

export const translationTests = keys.map((test, index) => ({ ...test,
  questions: test.questions.map((question, i) => ({ ...question, english: english[index][i] })),
}));

export function validateGrade(data, questions) {
  const expected = questions.filter(q => !q.incomplete);
  if (!data || !Array.isArray(data.results) || data.results.length !== expected.length) throw new Error('Kết quả chấm không đủ câu. Vui lòng thử lại.');
  const seen = new Set();
  const results = data.results.map(result => {
    if (!expected.some(q => q.id === result.id) || seen.has(result.id)) throw new Error('Kết quả chấm không khớp bài.');
    seen.add(result.id);
    for (const [key, max] of [['meaning', 6], ['terminology', 2], ['expression', 2]]) {
      if (typeof result[key] !== 'number' || !Number.isFinite(result[key]) || result[key] < 0 || result[key] > max) throw new Error('Điểm AI không hợp lệ.');
    }
    if (typeof result.feedback !== 'string' || typeof result.suggestion !== 'string') throw new Error('Thiếu nhận xét của AI.');
    return { ...result, score: Math.round((result.meaning + result.terminology + result.expression) * 10) / 10 };
  });
  return { results, score: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length * 10) / 10 };
}
