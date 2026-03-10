// src/api/assessments.js
import api from './axiosConfig';

export async function submitAssessment({ answers, userId, quizId }) {
  try {
    const response = await api.post('/assessments/submit', {
      answers,
      userId,
      quizId
    });
    return response.data; // { score, rawReport, questions: [...] }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to submit assessment';
    throw new Error(errorMessage);
  }
}