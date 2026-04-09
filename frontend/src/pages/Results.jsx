import { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useTheme } from '../context/ThemeContext';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconCheck = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const IconX = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconWarn = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconInfo = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconZap = ({ cls = 'h-6 w-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconBook = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const IconBack = ({ cls = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

// ── QuestionSection ────────────────────────────────────────────────────────
const QuestionSection = ({ title, questions, status, isDark }) => {
  if (!questions || questions.length === 0) return null;

  // Section wrapper colors
  const sectionTheme = {
    Incorrect: {
      dark:  { wrap: 'bg-red-900/10 border-red-900',     header: 'bg-red-900/30',     icon: 'text-red-500'   },
      light: { wrap: 'bg-red-50 border-red-200',          header: 'bg-red-100',        icon: 'text-red-600'   },
    },
    Unattempted: {
      dark:  { wrap: 'bg-amber-900/10 border-amber-900', header: 'bg-amber-900/30',   icon: 'text-amber-500' },
      light: { wrap: 'bg-amber-50 border-amber-200',      header: 'bg-amber-100',      icon: 'text-amber-600' },
    },
    Correct: {
      dark:  { wrap: 'bg-emerald-900/10 border-emerald-900', header: 'bg-emerald-900/30', icon: 'text-emerald-500' },
      light: { wrap: 'bg-emerald-50 border-emerald-200',      header: 'bg-emerald-100',    icon: 'text-emerald-600' },
    },
  };

  const t = isDark ? sectionTheme[status].dark : sectionTheme[status].light;
  const titleColor = isDark ? 'text-white' : 'text-gray-900';
  const SectionIcon = status === 'Incorrect' ? IconX : status === 'Unattempted' ? IconWarn : IconCheck;

  return (
    <div className={`mb-10 rounded-xl border overflow-hidden ${t.wrap}`}>
      <h3 className={`text-xl font-bold p-5 flex items-center ${t.header} ${titleColor}`}>
        <SectionIcon cls={`h-6 w-6 mr-2 ${t.icon}`} />
        {title} ({questions.length})
      </h3>

      <div className="p-5 space-y-5">
        {questions.map((q, index) => (
          <div key={index} className={`rounded-xl p-6 shadow-sm border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-md'}`}>
            <p className={`font-semibold text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {q.qNo}. {q.questionText}
            </p>

            <div className="space-y-3">
              {q.options.map((option, oIndex) => {
                const isCorrect   = option === q.correctAnswer;
                const isUserWrong = option === q.userAnswer && !isCorrect;

                // Option styles — dark vs light
                let optStyle, OptionIcon = null;

                if (isCorrect) {
                  optStyle = isDark
                    ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400 font-semibold'
                    : 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold';
                  OptionIcon = <IconCheck cls="h-5 w-5 text-emerald-500 ml-auto shrink-0" />;
                } else if (isUserWrong) {
                  optStyle = isDark
                    ? 'border-red-500/50 bg-red-900/20 text-red-400 font-semibold'
                    : 'border-red-400 bg-red-50 text-red-700 font-semibold';
                  OptionIcon = <IconX cls="h-5 w-5 text-red-500 ml-auto shrink-0" />;
                } else {
                  optStyle = isDark
                    ? 'border-gray-700 bg-gray-800 text-gray-400'
                    : 'border-gray-200 bg-gray-50 text-gray-600';
                }

                return (
                  <div key={oIndex} className={`flex items-center p-4 border rounded-lg ${optStyle}`}>
                    <span className="flex-grow">{option}</span>
                    {OptionIcon}
                  </div>
                );
              })}

              {/* Status hint */}
              {status === 'Unattempted' && (
                <div className={`flex items-center mt-3 text-sm p-3 rounded-lg border ${isDark ? 'text-amber-400 bg-amber-900/20 border-amber-900/30' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                  <IconInfo cls="h-5 w-5 mr-2 shrink-0" />
                  You did not attempt this question. The correct answer is highlighted in green.
                </div>
              )}
              {status === 'Incorrect' && (
                <div className={`flex items-center mt-3 text-sm p-3 rounded-lg border ${isDark ? 'text-red-400 bg-red-900/20 border-red-900/30' : 'text-red-700 bg-red-50 border-red-200'}`}>
                  <IconInfo cls="h-5 w-5 mr-2 shrink-0" />
                  Your answer was incorrect. The correct answer is highlighted in green.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── UpskillingSummary ──────────────────────────────────────────────────────
const UpskillingSummary = ({ results, summary, isDark }) => {
  if (!summary) return null;

  const feedback = () => {
    const p = summary.scorePercentage;
    if (p >= 80) return "Excellent performance! You've demonstrated strong knowledge in this domain.";
    if (p >= 60) return "Good job! You have a solid understanding, but there's room for improvement.";
    if (p >= 40) return "You're on the right track, but need more practice to strengthen your knowledge.";
    return "This topic needs more attention. Consider reviewing the fundamentals.";
  };

  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-md';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const feedbackColor = isDark ? 'text-blue-300' : 'text-blue-600';
  const bodyText = isDark ? 'text-gray-300' : 'text-gray-600';
  const bullet = (color) => isDark ? `text-${color}-500` : `text-${color}-600`;

  const focusCard  = isDark ? 'bg-orange-900/10 border-orange-900/30' : 'bg-orange-50 border-orange-200';
  const strengthCard = isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-200';
  const learnCard  = isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-200';
  const focusTitle = isDark ? 'text-orange-400' : 'text-orange-600';
  const strengthTitle = isDark ? 'text-emerald-400' : 'text-emerald-700';
  const learnTitle = isDark ? 'text-blue-400' : 'text-blue-700';

  return (
    <div className={`rounded-xl p-8 mb-10 border ${card}`}>
      <h3 className={`text-xl font-bold mb-6 pb-3 border-b border-blue-500/30 flex items-center ${heading}`}>
        <IconZap cls={`h-6 w-6 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
        Upskilling Recommendations
      </h3>

      <p className={`mb-6 font-medium ${feedbackColor}`}>{feedback()}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.upskillAreas?.length > 0 && (
          <div className={`rounded-xl p-6 border ${focusCard}`}>
            <h4 className={`font-bold mb-4 flex items-center ${focusTitle}`}>
              <IconWarn cls="h-5 w-5 mr-2" /> Areas to Focus On
            </h4>
            <ul className="space-y-2">
              {results.upskillAreas.map((area, i) => (
                <li key={i} className={`flex items-start ${bodyText}`}>
                  <span className={`mr-2 ${bullet('orange')}`}>•</span>{area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.strengths?.length > 0 && (
          <div className={`rounded-xl p-6 border ${strengthCard}`}>
            <h4 className={`font-bold mb-4 flex items-center ${strengthTitle}`}>
              <IconCheck cls="h-5 w-5 mr-2" /> Your Strengths
            </h4>
            <ul className="space-y-2">
              {results.strengths.map((s, i) => (
                <li key={i} className={`flex items-start ${bodyText}`}>
                  <span className={`mr-2 ${bullet('emerald')}`}>•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {results.recommendations && (
        <div className={`mt-6 rounded-xl p-6 border ${learnCard}`}>
          <h4 className={`font-bold mb-4 flex items-center ${learnTitle}`}>
            <IconBook cls="h-5 w-5 mr-2" /> Next Steps for Learning
          </h4>
          <p className={`leading-relaxed ${bodyText}`}>{results.recommendations}</p>
        </div>
      )}

      {/* Fallback cards */}
      {!results.upskillAreas?.length && !results.strengths?.length && !results.recommendations && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { card: strengthCard, title: strengthTitle, Icon: IconCheck, label: 'Strengths', text: `You answered ${summary.correctCount} questions correctly. Keep building on these strengths!` },
            { card: isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-200', title: isDark ? 'text-red-400' : 'text-red-600', Icon: IconX, label: 'Areas for Improvement', text: `You missed ${summary.incorrectCount} questions. Review these topics to improve.` },
            { card: isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-200', title: isDark ? 'text-amber-400' : 'text-amber-600', Icon: IconWarn, label: 'Time Management', text: `You left ${summary.unattemptedCount} questions unanswered. Practice under time pressure.` },
          ].map(({ card: c, title: t, Icon, label, text }) => (
            <div key={label} className={`rounded-xl p-5 border ${c}`}>
              <h5 className={`font-semibold mb-2 flex items-center ${t}`}>
                <Icon cls="h-5 w-5 mr-2" />{label}
              </h5>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Results ───────────────────────────────────────────────────────────
export default function Results() {
  const { id: assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(!location.state?.results);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!results) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/assessment/${assessmentId}`);
          setResults(res.data);
        } catch {
          setError('Failed to load assessment results.');
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [assessmentId, results]);

  const { incorrectQs, unattemptedQs, correctQs, summary } = useMemo(() => {
    if (!results?.questions) return { incorrectQs: [], unattemptedQs: [], correctQs: [], summary: {} };

    const incorrect = [], unattempted = [], correct = [];
    results.questions.forEach((q, i) => {
      const ua = (results.userAnswers ?? []).find(a => a.qNo === i + 1);
      const full = { ...q, qNo: i + 1, userAnswer: ua?.selectedOption ?? null };
      if (!ua) unattempted.push(full);
      else if (ua.selectedOption === q.correctAnswer) correct.push(full);
      else incorrect.push(full);
    });

    const total = results.questions.length;
    const correctCount = correct.length;
    return {
      incorrectQs: incorrect, unattemptedQs: unattempted, correctQs: correct,
      summary: { totalQuestions: total, scorePercentage: Math.round((correctCount / total) * 100), correctCount, incorrectCount: incorrect.length, unattemptedCount: unattempted.length }
    };
  }, [results]);

  if (loading) return (
    <div className={`min-h-screen flex justify-center items-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  if (error) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    </div>
  );

  if (!results) return null;

  const scoreColor = summary.scorePercentage >= 70 ? '#10B981' : summary.scorePercentage >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div
      className={`min-h-screen ${isDark ? 'text-white' : 'results-page'}`}
      style={isDark ? { background: 'linear-gradient(to right, #000001, #000000)' } : {}}
    >
      <div className="max-w-4xl mx-auto py-20 px-6">
        <h2 className={`text-3xl font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Assessment Results
        </h2>

        {/* Score card */}
        <div className={`rounded-xl p-8 mb-10 flex flex-col md:flex-row items-center gap-8 border ${isDark ? 'bg-gray-900 border-gray-800 shadow-lg' : 'bg-white border-blue-100 shadow-xl'}`}>
          <div className="w-40 h-40 flex-shrink-0">
            <CircularProgressbar
              value={summary.scorePercentage}
              text={`${summary.scorePercentage}%`}
              styles={buildStyles({
                textColor: isDark ? '#fff' : '#111827',
                textSize: '20px',
                pathColor: scoreColor,
                trailColor: isDark ? '#374151' : '#e5e7eb',
                pathTransitionDuration: 0.5,
              })}
            />
          </div>

          <div className="text-center md:text-left flex-grow">
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Your Score: {summary.correctCount} / {summary.totalQuestions}
            </h3>

            <div className="flex flex-wrap gap-3 mt-5 justify-center md:justify-start">
              {/* Correct */}
              <span className={`px-4 py-2 rounded-full flex items-center font-medium border ${isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                <IconCheck cls="h-4 w-4 mr-2" /> Correct: {summary.correctCount}
              </span>
              {/* Incorrect */}
              <span className={`px-4 py-2 rounded-full flex items-center font-medium border ${isDark ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-red-50 text-red-600 border-red-300'}`}>
                <IconX cls="h-4 w-4 mr-2" /> Incorrect: {summary.incorrectCount}
              </span>
              {/* Unattempted */}
              <span className={`px-4 py-2 rounded-full flex items-center font-medium border ${isDark ? 'bg-amber-900/30 text-amber-400 border-amber-900' : 'bg-amber-50 text-amber-700 border-amber-300'}`}>
                <IconWarn cls="h-4 w-4 mr-2" /> Unattempted: {summary.unattemptedCount}
              </span>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/assessment')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition-colors font-medium flex items-center shadow-lg shadow-blue-500/30"
              >
                <IconBack cls="h-5 w-5 mr-2" /> Try Another Assessment
              </button>
            </div>
          </div>
        </div>

        <UpskillingSummary results={results} summary={summary} isDark={isDark} />

        <QuestionSection title="Incorrect Questions"   questions={incorrectQs}   status="Incorrect"   isDark={isDark} />
        <QuestionSection title="Unattempted Questions" questions={unattemptedQs} status="Unattempted" isDark={isDark} />
        <QuestionSection title="Correct Questions"     questions={correctQs}     status="Correct"     isDark={isDark} />
      </div>
    </div>
  );
}
