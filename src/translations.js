import handoutParagraphs from '../content/translation-handout-paragraphs.json' with { type: 'json' };
import vietnamese from '../content/handout01-vietnamese.json' with { type: 'json' };

const notes = {
  19: 'Nguồn dùng cụm “copy pirated games” chưa chuẩn ngữ pháp; bản dịch tham khảo hiểu là sao chép trò chơi lậu.',
  25: 'Nguồn dùng “systematic error”; trong ngữ cảnh máy tính ngừng hoạt động, bản dịch tham khảo hiểu là lỗi hệ thống.',
  30: 'Câu 30 và 31 gần như trùng nhau trong handout; giữ cả hai theo số thứ tự gốc. Câu 30 dùng “control”, câu 31 dùng “controls”.',
  31: 'Câu 30 và 31 gần như trùng nhau trong handout; giữ cả hai theo số thứ tự gốc.',
  47: 'Nguồn viết “bricks and motar stores”, được hiểu là cửa hàng truyền thống (cửa hàng có địa điểm thực tế).',
  48: 'Handout không giải thích chữ viết tắt HD nên đáp án giữ nguyên HD. Cụm “systems analysis” trong danh sách nghề được dịch theo ngữ cảnh là chuyên viên phân tích hệ thống.',
};

export const TRANSLATION_PAGE_SIZE = 10;
export const translationQuestions = Array.from({ length: 50 }, (_, index) => {
  const number = index + 1;
  const sourceIndex = handoutParagraphs.indexOf(String(number));
  const english = sourceIndex >= 0 ? handoutParagraphs[sourceIndex + 1] : null;
  if (typeof english !== 'string' || !english.trim() || !vietnamese[index]) throw new Error(`Missing Handout 01 question ${number}`);
  return {
    id: `handout-01-${String(number).padStart(2, '0')}`,
    number, english, reference: vietnamese[index], note: notes[number] || '',
  };
});

export function validateGrade(data, questions) {
  if (!questions.length || !data || !Array.isArray(data.results) || data.results.length !== questions.length) throw new Error('Kết quả chấm không đủ câu. Vui lòng thử lại.');
  const seen = new Set();
  const results = data.results.map(result => {
    if (!result || !questions.some(q => q.id === result.id) || seen.has(result.id)) throw new Error('Kết quả chấm không khớp bài.');
    seen.add(result.id);
    for (const [key, max] of [['meaning', 6], ['terminology', 2], ['expression', 2]]) {
      if (typeof result[key] !== 'number' || !Number.isFinite(result[key]) || result[key] < 0 || result[key] > max) throw new Error('Điểm AI không hợp lệ.');
    }
    if (typeof result.feedback !== 'string' || typeof result.suggestion !== 'string') throw new Error('Thiếu nhận xét của AI.');
    return { ...result, score: Math.round((result.meaning + result.terminology + result.expression) * 10) / 10 };
  });
  return { results, score: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length * 10) / 10 };
}
