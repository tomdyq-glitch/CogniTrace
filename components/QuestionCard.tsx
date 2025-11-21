import React from 'react';
import { Question } from '../types';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (index: number) => void;
  selectedAnswer: number | null;
  isSubmitting: boolean;
  onNext: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  selectedAnswer,
  isSubmitting,
  onNext
}) => {
  const isAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header / Metadata */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase">
            {question.subject}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded border ${
            question.difficulty > 7 ? 'border-red-200 text-red-600 bg-red-50' :
            question.difficulty < 4 ? 'border-green-200 text-green-600 bg-green-50' :
            'border-yellow-200 text-yellow-600 bg-yellow-50'
          }`}>
            难度等级: {question.difficulty}/10
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center">
          <HelpCircle size={14} className="mr-1" />
          AI 实时生成
        </div>
      </div>

      {/* Question Body */}
      <div className="p-8">
        <h2 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
          {question.text}
        </h2>

        {/* Reasoning Badge */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <div className="min-w-[20px] pt-0.5 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 0 0-10-10Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <span className="block text-xs font-bold text-blue-700 uppercase mb-0.5">自适应推荐逻辑</span>
            <p className="text-sm text-blue-800">{question.reasoningForSelection}</p>
          </div>
        </div>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            let optionClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";
            
            if (!isAnswered) {
              optionClass += "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600";
            } else {
              if (idx === question.correctIndex) {
                optionClass += "border-green-500 bg-green-50 text-green-800";
              } else if (idx === selectedAnswer) {
                optionClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                optionClass += "border-slate-100 text-slate-400 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => !isAnswered && !isSubmitting && onAnswer(idx)}
                disabled={isAnswered || isSubmitting}
                className={optionClass}
              >
                <span className="font-medium">{option}</span>
                {isAnswered && idx === question.correctIndex && <CheckCircle2 className="text-green-500" size={20} />}
                {isAnswered && idx === selectedAnswer && idx !== question.correctIndex && <XCircle className="text-red-500" size={20} />}
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {isAnswered && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
              <h4 className={`font-bold mb-2 flex items-center ${isCorrect ? 'text-green-800' : 'text-orange-800'}`}>
                {isCorrect ? '回答正确！掌握度已更新。' : '回答错误。这是个学习的好机会。'}
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed">
                <span className="font-bold mr-1">解析:</span>{question.explanation}
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md shadow-indigo-200 flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? '分析中...' : '追踪下一步'}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};