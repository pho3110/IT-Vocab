import './exam-matching.css';

export default function ExamMatching({ questions, answers, submitted, onAnswer }) {
  const options = questions[0].options;
  const letter = answer => {
    const index = options.indexOf(answer);
    return index < 0 ? '—' : String.fromCharCode(65 + index);
  };
  return <section className="exam-matching" aria-labelledby="exam-matching-title">
    <h3 id="exam-matching-title">A. Nối từ với định nghĩa</h3>
    <p>Chọn chữ A–F cho mỗi số 1–5. Có một định nghĩa thừa.</p>
    <table className="exam-matching-table">
      <caption className="sr-only">Cột trái: từ 1–5. Cột phải: định nghĩa A–F.</caption>
      <thead><tr><th scope="col">Từ 1–5</th><th scope="col">Định nghĩa A–F</th></tr></thead>
      <tbody>{options.map((option, index) => {
          const question = questions[index];
          const answer = question ? answers[question.id] || '' : '';
          const legacyAnswer = answer && !options.includes(answer);
          const correct = question && answer === question.answer;
          return <tr key={option}>
            <td className={submitted && question ? correct ? 'correct' : 'incorrect' : ''}>{question && <>
            <div className="exam-matching-term"><span className="exam-matching-number" aria-hidden="true">{index + 1}.</span><span lang="en">{question.term}</span></div>
            <label htmlFor={`match-${question.id}`} className="sr-only">Chọn chữ cho câu {index + 1}: {question.term}</label>
            <select id={`match-${question.id}`} value={legacyAnswer ? '' : answer} disabled={submitted} onChange={event => onAnswer(question.id, event.target.value)}>
              <option value="">—</option>
              {options.map((option, i) => <option key={option} value={option}>{String.fromCharCode(65 + i)}</option>)}
            </select>
            {legacyAnswer && <p className="exam-matching-legacy">Lựa chọn ở bản cũ: {answer}{!submitted && '. Hãy chọn lại chữ trong bảng mới.'}</p>}
            </>}</td>
            <td><div className="exam-matching-definition"><strong>{String.fromCharCode(65 + index)}.</strong><span lang="en">{option}</span></div></td>
          </tr>;
      })}</tbody>
    </table>
    {submitted && <div className="exam-matching-results">{questions.map((question, index) => <div className="exam-feedback" key={question.id}><strong>{index + 1} → {letter(question.answer)} · {answers[question.id] === question.answer ? 'Đúng' : answers[question.id] ? 'Chưa đúng' : 'Chưa trả lời'}</strong><p>{question.explanation}</p><small>{question.source}</small></div>)}</div>}
  </section>;
}
