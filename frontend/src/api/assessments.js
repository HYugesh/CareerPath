// src/api/assessments.js
export async function submitAssessment({ answers, userId, quizId }) {
  const resp = await fetch('/api/assessments/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, userId, quizId })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(()=>({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to submit assessment');
  }
  const data = await resp.json();
  return data; // { score, rawReport, questions: [...] }
}