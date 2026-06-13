/**
 * Bridge module — imported by each competition round's script.js.
 * Stores quiz data in window.__compQuiz for the unified question.html to consume.
 *
 * Usage in script.js:
 *   import setupQuiz from '../../../../question.js'
 *   setupQuiz(quizData, timeLimitSeconds)
 */
export default function setupQuiz(quizData, timeLimitSeconds) {
  if (!Array.isArray(quizData) || quizData.length === 0) return;
  window.__compQuiz = { questions: quizData, timeLimit: timeLimitSeconds || 0 };
}
