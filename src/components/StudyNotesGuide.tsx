import React, { useState } from 'react';
import { LectureData } from '../types';
import {
  FileText,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';

interface StudyNotesGuideProps {
  lecture: LectureData;
}

export const StudyNotesGuide: React.FC<StudyNotesGuideProps> = ({ lecture }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyNotes = () => {
    let fullText = `# ${lecture.title}\n`;
    fullText += `Subject: ${lecture.subject} | Audience: ${lecture.targetAudience}\n\n`;
    fullText += `## Overview\n${lecture.overviewSummary}\n\n`;

    fullText += `## Slide-by-Slide Notes\n`;
    (lecture.slides || []).forEach(slide => {
      fullText += `### Slide ${slide.slideNumber}: ${slide.topicTitle} (${slide.chapterTitle})\n`;
      fullText += `${slide.subtitle}\n`;
      (slide.bullets || []).forEach(b => {
        fullText += `- **${b.heading}**: ${b.content} (${b.emphasis})\n`;
      });
      if (slide.calloutBox) {
        fullText += `> **${slide.calloutBox.title}**: ${slide.calloutBox.text}\n`;
      }
      if (slide.blackboardSummarySnippet) {
        fullText += `*Core Formula/Axiom*: \`${slide.blackboardSummarySnippet}\`\n`;
      }
      fullText += `\n`;
    });

    if (lecture.keyTermsGlossary && lecture.keyTermsGlossary.length > 0) {
      fullText += `## Key Terms & Definitions\n`;
      lecture.keyTermsGlossary.forEach(k => {
        fullText += `- **${k.term}**: ${k.definition}\n`;
      });
      fullText += `\n`;
    }

    if (lecture.suggestedReviewQuestions && lecture.suggestedReviewQuestions.length > 0) {
      fullText += `## Review Questions\n`;
      lecture.suggestedReviewQuestions.forEach((q, idx) => {
        fullText += `${idx + 1}. ${q}\n`;
      });
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 select-text">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            Comprehensive Revision Guide
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Study Notes: {lecture.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyNotes}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy All Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-1">
        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
          Lecture Abstract & Core Objective
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
          {lecture.overviewSummary}
        </p>
      </div>

      {/* Slide Notes Breakdown */}
      <div className="space-y-6">
        <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>Slide-by-Slide Detailed Breakdown</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(lecture.slides || []).map(slide => (
            <div
              key={slide.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Slide {slide.slideNumber} of {slide.totalSlides}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {slide.chapterTitle}
                </span>
              </div>

              <div>
                <h5 className="text-sm font-bold text-slate-900 leading-tight">
                  {slide.topicTitle}
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">{slide.subtitle}</p>
              </div>

              <div className="space-y-2">
                {(slide.bullets || []).map(b => (
                  <div key={b.id} className="text-xs leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      • {b.heading}:{' '}
                      <span className="font-normal text-slate-600">{b.content}</span>
                    </p>
                  </div>
                ))}
              </div>

              {slide.calloutBox && (
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                  <span className="font-bold">{slide.calloutBox.title}: </span>
                  <span>{slide.calloutBox.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Terms Glossary */}
        {lecture.keyTermsGlossary && lecture.keyTermsGlossary.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
              Essential Glossary & Definitions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lecture.keyTermsGlossary.map((term, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                >
                  <p className="font-bold text-slate-900">{term.term}</p>
                  <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                    {term.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Questions */}
        {lecture.suggestedReviewQuestions && lecture.suggestedReviewQuestions.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Recommended Self-Review Questions</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {lecture.suggestedReviewQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
