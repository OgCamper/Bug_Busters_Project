export function takeQuiz(answers: string[], userAnswers: string[]) {
  // placeholder logic
  let score = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === userAnswers[i]) score++;
  }
  return { score };
}