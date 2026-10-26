// Transcribed from the seven local Phiếu Tổng Ôn photos. Keys and samples are authored references.
const choices = [
  ['A support technician _____ checks user emails at the start of the day.', ['usually', 'yesterday', 'yet', 'while'], 0, 1],
  ['Employees _____ share their login passwords with other people.', ['can', "mustn't", "don't have to", 'might'], 1, 1],
  ['Use a card reader _____ transfer photographs from a camera to a computer.', ['for', 'because', 'to', 'so'], 2, 2],
  ['Please unplug the projector cable _____ the laptop when you finish.', ['into', 'from', 'to', 'on'], 1, 2],
  ['Our company usually uses email, but today we _____ a video conference.', ['have', 'are having', 'had', 'have had'], 1, 3],
  ['A WAN is a network _____ covers a large geographical area.', ['who', 'where', 'which', 'whose'], 2, 3],
  ['If the Wi-Fi signal is not available, we _____ the mobile network instead.', ['use', 'used', 'will use', 'would use'], 2, 3],
  ['You can retrieve a database record _____ entering its ID.', ['by', 'to', 'for', 'from'], 0, 4],
  ['While I was installing the operating system, the computer _____ twice.', ['reboots', 'rebooted', 'has rebooted', 'rebooting'], 1, 4],
  ['Before _____ a hard drive, back up important files.', ['replace', 'replaced', 'replacing', 'to replacing'], 2, 4],
  ['Dedicated hosting is usually _____ secure than shared hosting.', ['more', 'most', 'as', 'the most'], 0, 5],
  ['I recommend that we _____ the plan with the better warranty.', ['choosing', 'choose', 'chose', 'to choose'], 1, 5],
  ['Our website is getting _____ popular, so we may need more bandwidth.', ['much and much', 'more and more', 'most and most', 'more better'], 1, 6],
  ['If we had a faster connection, our video conferences _____ clearer.', ['are', 'will be', 'would be', 'were'], 2, 6],
  ['The beta version _____ by selected users last week.', ['tested', 'was tested', 'is testing', 'has test'], 1, 7],
  ['Pressing the F1 key makes the Help menu _____.', ['appear', 'appears', 'appeared', 'to appear'], 0, 7],
  ['Have you _____ the network cable yet?', ['check', 'checked', 'checking', 'checks'], 1, 8],
  ['The connection error _____ be caused by a loose cable, but we need to test it.', ["mustn't", 'might', 'has to', 'did'], 1, 8],
  ['_____ Internet is the most obvious example of a WAN.', ['A', 'An', 'The', 'Some'], 2, 3],
  ['The programming team is _____ to start coding on Monday.', ['scheduled', 'schedule', 'scheduling', 'schedules'], 0, 7],
];
const terms = [
  ['systems analyst', "a specialist who studies a client's IT needs and prepares suitable system specifications", 1],
  ['helpdesk supervisor', 'a person who supervises staff who provide technical help to users', 1],
  ['scroll bar', 'a control at the side of a computer window used to move up or down', 2],
  ['SATA socket', 'a connector used to attach a hard disk or optical drive to a motherboard', 2],
  ['LAN', 'a network that normally covers a small local area such as an office or building', 3],
  ['dongle', 'a small device that can plug into a laptop so it can send/receive data through a mobile network', 3],
  ['primary key', 'a field whose value uniquely identifies each record in a database table', 4],
  ['formula', 'a calculation in a spreadsheet using cell references, numbers or functions', 4],
  ['total cost of ownership', 'the complete cost of buying, operating, maintaining and supporting a product', 5],
  ['dedicated hosting', 'a service where one customer has a whole server for its website', 5],
  ['shopping basket', 'a feature in an e-commerce site that holds selected products before checkout', 6],
  ['data compression', 'a method of coding data so it uses less storage space or bandwidth', 6],
  ['Gantt chart', 'a chart that shows project tasks and when they are planned to happen', 7],
  ['specifications', 'a written set of detailed requirements describing what software or a system must do', 7],
  ['support ticket', 'a secure or structured file that records a reported technical problem and the steps taken to solve it', 8],
  ['troubleshooting guide', 'a list of instructions/questions used to help find the cause of an IT problem and suggest solutions', 8],
];
// Reuse existing matching questions for the six repeated terms; keep only ten new items.
const repeatedTerms = new Set([3, 5, 9, 11, 12, 13]);
export const reviewLanguage = choices.map(([prompt, options, key, unit], i) => ({
  id: `review-language-${i + 1}`, unit, number: i + 1, kind: 'choice', prompt, options, answer: options[key],
  source: `Phiếu Tổng Ôn · Station 1 · Câu ${i + 1}`, explanation: `Đáp án tham khảo: ${options[key]}.`,
  // Zero and first conditional both fit the unqualified wording in question 7.
})).filter(q => q.number !== 7).concat(terms.flatMap(([term, answer, unit], i) => repeatedTerms.has(i + 1) ? [] : [{
  id: `review-matching-${i + 1}`, unit, number: i + 1, kind: 'matching', term,
  prompt: `Choose the correct definition: ${term}`, options: terms.map(row => row[1]), answer,
  explanation: `${term}: ${answer}.`, source: `Phiếu Tổng Ôn · Station 2 · Mục ${i + 1}`,
}]));

const readingA = `Northbridge College decided to modernise its computer rooms and improve support for staff and students. The project manager first met a systems analyst, who interviewed users and wrote a short list of requirements. Teachers needed reliable video calls, office staff needed word processing and spreadsheets, and technicians wanted a shared database for equipment records.

Before buying new computers, the team compared processor speed, memory and storage. Some machines had enough memory for ordinary office work, but the design department needed better graphics performance. The technicians also checked the operating system and whether existing software would run correctly.

The college connected the new computers in each building to a LAN. Staff who worked away from campus used a secure connection to access files. In the equipment database, each item had one record and a unique primary key. A query could retrieve the details of a particular computer, while a spreadsheet formula helped the manager calculate costs.

The college did not simply choose the cheapest equipment. It considered warranties, maintenance and support as well as the purchase price. This reduced unexpected costs and gave staff a more reliable system.`;
const readingB = `A small online retailer wanted a faster website and better communication between its two offices. The IT manager compared shared and dedicated hosting. Dedicated hosting offered more control and performance, but the team chose a good shared plan because the company was still small. They compared total cost of ownership, including support and monthly charges, rather than looking only at the first price.

The company also introduced video conferencing so staff could meet without travelling. Its online shop used a shopping basket and a secure payment process. Before the new site was developed, a systems analyst gathered user requirements and prepared specifications. The developers then produced an early version, and selected staff carried out beta testing. A Gantt chart showed when design, coding and testing were due to finish.

After launch, the help desk recorded problems in support tickets. When a browser stopped responding, the technician first checked the ordinary troubleshooting steps. If the problem could not be solved at the first support level, the ticket was escalated to a more experienced technician.`;
export const reviewReading = [
  { id: 'review-reading-a', unit: 'review', title: 'A College IT Upgrade', text: readingA, kind: 'choice', questions: [
    ['What did the systems analyst do first?', ['Replaced all computers.', 'Interviewed users and prepared requirements.', 'Installed a database.', 'Bought new graphics cards.'], 1, 'The analyst interviewed users and wrote a short list of requirements.'],
    ['Why did the design department need different computers?', ['It needed better graphics performance.', 'It did not use software.', 'It only used email.', 'It had no network.'], 0, 'The design department needed better graphics performance.'],
    ['What was the purpose of the primary key?', ['To calculate costs.', 'To identify each equipment record uniquely.', 'To increase bandwidth.', 'To connect two LANs.'], 1, 'Each item had one record and a unique primary key.'],
    ['What could a query do?', ['Retrieve selected database information.', 'Repair a monitor.', 'Install an operating system.', 'Create a warranty.'], 0, 'A query could retrieve the details of a particular computer.'],
    ['Why did the team not choose equipment only by purchase price?', ['It wanted fewer users.', 'It also considered warranty, maintenance and support costs.', 'It wanted to remove spreadsheets.', 'It did not have a budget.'], 1, 'The college considered warranties, maintenance and support as well as purchase price.'],
  ] },
  { id: 'review-reading-b', unit: 'review', title: 'From Choosing a Service to Supporting Users', text: readingB, kind: 'true-false', questions: [
    ['The company chose dedicated hosting because it was still small.', false, 'The team chose a shared plan because the company was still small.'],
    ['The team considered more than the initial purchase price when comparing services.', true, 'They included support and monthly charges in total cost of ownership.'],
    ['Video conferencing helped reduce the need to travel.', true, 'Staff could meet without travelling.'],
    ['Beta testing took place after the final launch.', false, 'Selected staff tested an early version before launch.'],
    ['Unresolved problems could be passed to a more experienced technician.', true, 'Unresolved tickets were escalated to a more experienced technician.'],
  ] },
].map((p, pi) => ({ ...p, source: `Phiếu Tổng Ôn · Station 3 · Reading ${pi ? 'B' : 'A'}`, questions: p.questions.map((row, i) => ({
  id: `${p.id}-${i + 1}`, unit: 'review', number: 21 + pi * 5 + i, prompt: row[0],
  options: pi ? ['True', 'False'] : row[1], answer: pi ? (row[1] ? 'True' : 'False') : row[1][row[2]],
  explanation: pi ? row[2] : row[3], source: `Phiếu Tổng Ôn · Station 3 · Câu ${21 + pi * 5 + i}`,
})) }));

export const reviewEmail = [{
  id: 'review-email-brightness', unit: 'review', source: 'Phiếu Tổng Ôn · Station 6B', minWords: 80, maxWords: 100,
  prompt: 'Write an email to a user named Alex explaining how to change the screen brightness to Power saver mode. Write 80–100 words.',
  steps: ['Start → Control Panel/Settings', 'Display → Adjust brightness', 'Power saver → Close'],
  sample: 'Hi Alex,\n\nHere is how to change your screen brightness using the steps in the exercise. First, click Start and open Control Panel or Settings. Then select Display and find Adjust brightness. Next, choose Power saver mode and check whether the screen is comfortable to read. After that, close the settings window. If your computer shows different options, please send me a screenshot so I can help you find the right setting. Please remember to check the brightness again before working for a long time.\n\nBest wishes,\nIT Support',
}];
const speaking = [
  ['How do you communicate electronically with friends and family?', 'I use instant messaging for quick conversations and video calls when relatives live far away. I sometimes send photos by email.'],
  ['What do you think are the advantages of video conferencing over face-to-face meetings?', 'Video conferencing saves travel time and money. People in different cities can join the same meeting and share their screens.'],
  ['Do you buy things on the internet? Why (not)?', 'Yes, I buy books online because I can compare prices easily. I check the seller and payment details before ordering.'],
  ['When a company buys new technology, how important do you think it is to train users?', 'Training is very important because employees need to use the technology safely and correctly. Short practice sessions can prevent mistakes.'],
  ['What was the last problem you had with an electronic device? What other problems could happen?', 'My laptop recently lost its Wi-Fi connection. I checked the settings and reconnected. Other possible problems include overheating and a flat battery.'],
  ['Can you talk about steps to solve an IT problem?', 'First, ask what happened and check the error message. Then check the connections and try one solution at a time. Finally, test the result and record the solution.'],
  ["What's the difference between a LAN and a WAN?", 'A LAN connects devices in a small area such as an office. A WAN connects networks across much larger distances, such as different cities.'],
  ["What's the difference between open source software and proprietary software?", 'Open source software makes its source code available under a licence that permits modification. Proprietary software usually restricts access to the source code and how it can be changed.'],
];
export const reviewSpeaking = speaking.map(([prompt, sample], i) => ({ id: `review-speaking-${13 + i}`, number: 13 + i, prompt, sample, source: `Phiếu Tổng Ôn · Station 5 · Part 1 · Câu ${13 + i}` }));

export const reviewDialogues = [
  { title: 'IT workplace rules', roles: [
    ['Student A · New employee', ['Ask what time work starts.', 'Ask about eating or drinking at the desk.', 'Ask about keeping the desk clean.', 'Ask about installing software or connecting personal devices.', 'Ask where to read the rules.']],
    ['Student B · Company staff', ['Start work: 8:30 a.m.', 'No food or drinks at the desk (short-circuit / insects).', 'Keep the desk clean.', 'Only technicians install software; personal devices need permission.', 'Rules are on the company intranet.']],
  ], sample: 'A: What time do we start work?\nB: At 8:30 a.m. Please keep your desk clean and do not eat or drink there.\nA: Can I install software or connect my own device?\nB: Only technicians install software, and personal devices need permission. You can read the rules on the intranet.' },
  { title: 'Choosing a mobile device', roles: [
    ['Student A · Salesperson', ['Purpose: sales work and travel.', 'Functions: GPS, calendar, browser, email, notes, camera, video.', 'Preferred: good quality, easy to use.', 'Budget: about $700.', 'Payment: credit card or e-wallet.']],
    ['Student B · Technician', ['How can I help?', 'What will you use it for?', 'Which functions do you need?', 'What is your budget?', 'Any preferred brand? How would you like to pay?']],
  ], sample: 'B: What will you use the phone for?\nA: Sales work and travel. I need GPS, email, a calendar and a camera.\nB: What is your budget?\nA: About $700. I want a good-quality phone that is easy to use.\nB: Do you have a preferred brand?\nA: No. I would like to pay by credit card or e-wallet.' },
  { title: 'Company profile', roles: [
    ["Student A · Ask about your partner's company", ['What does the company do?', 'What are its products?', 'Who are its customers?', 'What are its future plans?', 'What is its website address?']],
    ['Student B · Software company', ['Develop business and education apps.', 'Products: software only.', 'Customers: individuals, companies, schools.', 'Future plan: launch an online learning service next year.', 'Website: www.nexabit.example.']],
  ], sample: 'A: What does your company do?\nB: We develop business and education apps. We sell software only.\nA: Who are your customers?\nB: Individuals, companies and schools.\nA: What are your future plans?\nB: We plan to launch an online learning service next year. Our website is www.nexabit.example.' },
  { title: 'Computer specifications', roles: [
    ['Student A · Answer about your computer', ['Processor: Intel Core i5, 3.2 GHz.', 'Memory: 8 GB RAM.', 'Storage: 512 GB SSD.', 'Screen resolution: 1920 × 1080.', 'Device name: LAB-PC-24.']],
    ['Student B · Ask about the computer', ['Processor / speed?', 'Memory?', 'Storage size?', 'Screen resolution?', 'Device name?']],
  ], sample: 'B: What processor does it have?\nA: An Intel Core i5 running at 3.2 GHz.\nB: How much memory and storage does it have?\nA: 8 GB of RAM and a 512 GB SSD.\nB: What is the screen resolution and device name?\nA: 1920 by 1080. The device name is LAB-PC-24.' },
].map((q, i) => ({ ...q, id: `review-dialogue-${i + 1}`, kind: 'dialogue', prompt: q.title, source: `Phiếu Tổng Ôn · Station 5 · Part 2 · Context ${i + 1}` }));
