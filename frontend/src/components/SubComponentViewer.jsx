import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api/axiosConfig';

export default function SubComponentViewer({
  subComponent,
  roadmapId,
  moduleId,
  onStatusChange,
  isDetailView = false,
  allSubComponents = [],
  onNavigate = null
}) {
  const [isExpanded, setIsExpanded] = useState(isDetailView); // Auto-expand in detail view
  const [isLoadingContent, setIsLoadingContent] = useState(false); // Phase 2 loading state
  const [showSolution, setShowSolution] = useState(false);
  const [contentError, setContentError] = useState(null); // Error state for Phase 2
  const [copiedIndex, setCopiedIndex] = useState(null); // Track which code block was copied

  // Backward Compatibility (Requirement 6.1, 6.2):
  // Check if subtopic has existing content - treat as already hydrated
  const hasContent = subComponent.learningContent && subComponent.learningContent.explanation;
  const isReviewed = subComponent.status === 'REVIEWED';

  // Auto-expand when in detail view
  useEffect(() => {
    if (isDetailView) {
      setIsExpanded(true);
    }
  }, [isDetailView]);

  const handleMarkReviewed = async () => {
    try {
      const response = await api.put(
        `/roadmaps/${roadmapId}/modules/${moduleId}/subcomponents/${subComponent.subComponentId}/review`
      );

      if (onStatusChange) {
        onStatusChange(response.data.data);
      }
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    }
  };

  const handleGenerateContent = async () => {
    // Backward Compatibility (Requirement 6.1, 6.2, 6.3):
    // Check if content already exists - treat existing content as already hydrated
    // This handles mixed state where some subtopics have content and some don't
    if (hasContent) {
      console.log('Content already exists, skipping generation');
      return;
    }

    // Clear any previous errors
    setContentError(null);
    
    // Set loading state to true before API call
    setIsLoadingContent(true);
    
    try {
      // Phase 2: Generate content only for subtopics with null/empty content
      const response = await api.post(
        `/roadmaps/${roadmapId}/modules/${moduleId}/subtopics/${subComponent.subComponentId}/generate-content`
      );

      // Handle successful response: optimistically update local state
      if (response.data.success && response.data.data) {
        const updatedSubtopic = response.data.data;
        
        // Optimistic UI: Update the subComponent with the new content immediately
        // This avoids redundant API calls and provides instant feedback
        if (onStatusChange) {
          onStatusChange(updatedSubtopic);
        } else {
          // If no callback provided, reload to show new content
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      
      // Handle error response: display user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error?.details ||
                          'Failed to generate content. Please try again.';
      
      setContentError(errorMessage);
    } finally {
      // Set loading state to false after completion
      setIsLoadingContent(false);
    }
  };

  return (
    <div className={`${isDetailView ? '' : 'bg-gray-900/30 border border-gray-800 rounded-lg overflow-hidden'}`}>
      {/* Header - Only show if not in detail view */}
      {!isDetailView && (
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-900/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Status Icon */}
            <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${isReviewed ? 'bg-green-600' : 'bg-gray-700'}
          `}>
              {isReviewed ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold ${isReviewed ? 'text-green-400' : 'text-white'}`}>
                  {subComponent.title}
                </h4>
                {/* Importance Level Badge */}
                {subComponent.importanceLevel && (
                  <span className={`
                    px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0
                    ${subComponent.importanceLevel === 'high' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : subComponent.importanceLevel === 'medium'
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }
                  `}>
                    {subComponent.importanceLevel}
                  </span>
                )}
              </div>
              {/* Description */}
              {subComponent.description && (
                <p className="text-gray-400 text-sm line-clamp-2">
                  {subComponent.description}
                </p>
              )}
              {isReviewed && subComponent.reviewedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Reviewed {new Date(subComponent.reviewedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Expand Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gray-500 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={isDetailView ? '' : 'border-t border-gray-800'}
          >
            <div className={isDetailView ? 'space-y-6' : 'p-6 space-y-6'}>
              {isLoadingContent ? (
                /* Phase 2 Loading State */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                    <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h5 className="text-white text-xl font-bold mb-3">Generating Content...</h5>
                  <p className="text-gray-400 text-base max-w-md mx-auto">
                    Creating comprehensive learning material tailored to this subtopic
                  </p>
                </div>
              ) : contentError ? (
                /* Error State with Retry Button */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h5 className="text-white text-xl font-bold mb-3">Content Generation Failed</h5>
                  <p className="text-gray-400 text-base mb-6 max-w-md mx-auto">
                    {contentError}
                  </p>
                  <button
                    onClick={handleGenerateContent}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg transition-all flex items-center gap-3 mx-auto shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Generation
                  </button>
                </div>
              ) : !hasContent ? (
                /* No Content - Generate Button */
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h5 className="text-white text-xl font-bold mb-3">Ready to Learn?</h5>
                  <p className="text-gray-400 text-base mb-6 max-w-md mx-auto">
                    Generate professional, comprehensive learning content tailored to your skill level
                  </p>
                  <button
                    onClick={handleGenerateContent}
                    disabled={isLoadingContent}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
                  >
                    {isLoadingContent ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Content...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Learning Content
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Has Content - Professional Technical Display */
                <div className="professional-content">
                  {/* Main Content Area - Professional Typography */}
                  {subComponent.learningContent.explanation && (
                    <div className="prose-container">
                      <div
                        className="content-body"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const raw = subComponent.learningContent.explanation;

                            // Pre-process: split inline "* item" markers into separate lines
                            // Only match single * (not **bold**) followed by a capital letter or backtick
                            const normalized = raw
                              .replace(/(?<!\*)\*(?!\*)\s+(?=[A-Z`])/g, '\n\n* ')
                              .replace(/\s+(\d+)\.\s+(?=[A-Z`])/g, '\n\n$1. ');

                            return normalized
                              .split('\n\n')
                              .map(paragraph => {
                                const trimmed = paragraph.trim();
                                if (!trimmed) return '';

                                // Bold headers **Header:**
                                if (trimmed.match(/^\*\*(.+?):\*\*$/)) {
                                  const heading = trimmed.replace(/^\*\*(.+?):\*\*$/, '$1');
                                  return `<h2 class="section-heading-bold">${heading}:</h2>`;
                                }
                                // Bold headers **Header**
                                if (trimmed.match(/^\*\*(.+?)\*\*$/)) {
                                  const heading = trimmed.replace(/^\*\*(.+?)\*\*$/, '$1');
                                  return `<h2 class="section-heading-bold">${heading}</h2>`;
                                }
                                // ## Heading
                                if (trimmed.startsWith('## ')) {
                                  return `<h2 class="section-heading">${trimmed.slice(3)}</h2>`;
                                }
                                // ### Heading
                                if (trimmed.startsWith('### ')) {
                                  return `<h3 class="subsection-heading">${trimmed.slice(4)}</h3>`;
                                }

                                // Multi-line bullet block (lines starting with * or -)
                                const lines = trimmed.split('\n');
                                const allBullets = lines.every(l => l.trim().match(/^[*\-•]\s+/));
                                if (allBullets && lines.length > 1) {
                                  const items = lines.map(l => {
                                    const content = l.trim().replace(/^[*\-•]\s+/, '')
                                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                      .replace(/`(.+?)`/g, '<code>$1</code>');
                                    return `<li class="bullet-item">${content}</li>`;
                                  }).join('');
                                  return `<ul class="bullet-list">${items}</ul>`;
                                }

                                // Single bullet line
                                if (trimmed.match(/^[*\-•]\s+/)) {
                                  const content = trimmed.replace(/^[*\-•]\s+/, '')
                                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/`(.+?)`/g, '<code>$1</code>');
                                  return `<div class="bullet-item">${content}</div>`;
                                }

                                // Numbered list block
                                const allNumbered = lines.every(l => l.trim().match(/^\d+\.\s+/));
                                if (allNumbered && lines.length > 1) {
                                  const items = lines.map(l => {
                                    const num = l.trim().match(/^(\d+)\./)[1];
                                    const content = l.trim().replace(/^\d+\.\s+/, '')
                                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                      .replace(/`(.+?)`/g, '<code>$1</code>');
                                    return `<li class="numbered-item"><span class="number">${num}.</span> ${content}</li>`;
                                  }).join('');
                                  return `<ol class="numbered-list">${items}</ol>`;
                                }

                                // Single numbered item
                                if (trimmed.match(/^\d+\.\s+/)) {
                                  const num = trimmed.match(/^(\d+)\./)[1];
                                  const content = trimmed.replace(/^\d+\.\s+/, '')
                                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/`(.+?)`/g, '<code>$1</code>');
                                  return `<div class="numbered-item"><span class="number">${num}.</span> ${content}</div>`;
                                }

                                // Regular paragraph
                                const processed = trimmed
                                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/`(.+?)`/g, '<code>$1</code>')
                                  .replace(/\*(.+?)\*/g, '<em>$1</em>');
                                return `<p class="content-paragraph">${processed}</p>`;
                              })
                              .join('');
                          })()
                        }}
                      />
                    </div>
                  )}

                  {/* Code Examples - Enhanced Styling */}
                  {subComponent.learningContent.codeExamples && subComponent.learningContent.codeExamples.length > 0 && (
                    <div className="code-examples-section">
                      {subComponent.learningContent.codeExamples.map((example, idx) => (
                        <div key={idx} className="code-example-block">
                          <div className="code-header">
                            <div className="flex items-center gap-2">
                              <div className="code-language-badge">
                                {example.language}
                              </div>
                              <span className="code-description">{example.description}</span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(example.code);
                                setCopiedIndex(idx);
                                setTimeout(() => setCopiedIndex(null), 2000);
                              }}
                              className="copy-button"
                              title="Copy code"
                            >
                              {copiedIndex === idx ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="code-content">
                            <SyntaxHighlighter
                              language={example.language}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                padding: '1.5rem',
                                background: '#1e1e1e',
                                fontSize: '0.9rem',
                                lineHeight: '1.6',
                                borderRadius: '0 0 12px 12px'
                              }}
                              showLineNumbers={true}
                            >
                              {example.code}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation and Quiz Buttons */}
              <div className="pt-6 border-t border-gray-800 space-y-3">
                {/* Previous and Next Topic Buttons */}
                {isDetailView && allSubComponents.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Previous Topic Button */}
                    <button
                      onClick={() => {
                        const currentIndex = allSubComponents.findIndex(
                          sc => sc.subComponentId === subComponent.subComponentId
                        );
                        if (currentIndex > 0 && onNavigate) {
                          onNavigate(allSubComponents[currentIndex - 1]);
                        }
                      }}
                      disabled={allSubComponents.findIndex(sc => sc.subComponentId === subComponent.subComponentId) === 0}
                      className="px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous Topic
                    </button>

                    {/* Next Topic Button */}
                    <button
                      onClick={async () => {
                        // Mark current topic as reviewed before navigating
                        if (!isReviewed && hasContent) {
                          await handleMarkReviewed();
                        }

                        const currentIndex = allSubComponents.findIndex(
                          sc => sc.subComponentId === subComponent.subComponentId
                        );
                        if (currentIndex < allSubComponents.length - 1 && onNavigate) {
                          // Small delay to ensure review is saved
                          setTimeout(() => {
                            onNavigate(allSubComponents[currentIndex + 1]);
                          }, 300);
                        }
                      }}
                      disabled={allSubComponents.findIndex(sc => sc.subComponentId === subComponent.subComponentId) === allSubComponents.length - 1}
                      className="px-6 py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Next Topic
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Take Quiz Button - Explicitly for Topic Quiz */}
                {subComponent.hasQuiz !== false && hasContent && (
                  <div className="group relative">
                    <button
                      onClick={async () => {
                        try {
                          // Mark as reviewed before starting quiz
                          if (!isReviewed) {
                            await handleMarkReviewed();
                          }

                          const response = await api.post(
                            `/roadmaps/${roadmapId}/modules/${moduleId}/subtopics/${subComponent.subComponentId}/quiz/start`
                          );

                          // Navigate to quiz page
                          window.location.href = `/roadmap/${roadmapId}/module/${moduleId}/subtopic/${subComponent.subComponentId}/quiz/${response.data.sessionId}`;
                        } catch (error) {
                          console.error('Error starting quiz:', error);
                          const errorMessage = error.response?.data?.message || 'Failed to start quiz';
                          alert(errorMessage);
                        }
                      }}
                      className={`
                        w-full px-6 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 border
                        ${isReviewed
                          ? 'bg-gray-800/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-900/20'
                        }
                        hover:scale-[1.01] active:scale-[0.99]
                      `}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {isReviewed ? 'Take Quiz' : 'Take Topic Quiz'}
                    </button>
                    {!isReviewed && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-full shadow-lg">
                        Recommended
                      </div>
                    )}
                  </div>
                )}

                {/* Info message for intro topics without quiz */}
                {subComponent.hasQuiz === false && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-center">
                    <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-300 text-sm font-medium">
                      This is an introductory topic - no quiz required
                    </p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      Review the content and proceed to the next topic
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
