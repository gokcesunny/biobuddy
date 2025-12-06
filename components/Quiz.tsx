import React, { useState } from 'react';
import { QuizData } from '../types';

interface QuizProps {
  data: QuizData;
  onClose?: () => void;
}

const Quiz: React.FC<QuizProps> = ({ data, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = data.questions[currentQuestionIndex];

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowSummary(true);
    }
  };

  if (showSummary) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 w-full max-w-lg mx-auto mt-4">
        <h3 className="text-2xl font-bold text-emerald-800 mb-4 text-center">Quiz Complete!</h3>
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-emerald-100 bg-emerald-50">
             <span className="text-3xl font-bold text-emerald-600">{Math.round((score / data.questions.length) * 100)}%</span>
          </div>
        </div>
        <p className="text-center text-slate-600 mb-6">
          You got {score} out of {data.questions.length} questions correct.
        </p>
        <button 
          onClick={onClose}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
        >
          Return to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 w-full max-w-2xl mx-auto my-4">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-700">{data.title}</h3>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-full text-slate-500">
          {currentQuestionIndex + 1} / {data.questions.length}
        </span>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-medium text-slate-900 mb-4">{currentQuestion.question}</h4>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let baseStyle = "w-full text-left p-3 rounded-lg border transition-all duration-200 relative ";
            if (isAnswered) {
               if (option === currentQuestion.correctAnswer) {
                 baseStyle += "bg-green-50 border-green-500 text-green-800";
               } else if (option === selectedOption) {
                 baseStyle += "bg-red-50 border-red-500 text-red-800";
               } else {
                 baseStyle += "bg-slate-50 border-slate-200 opacity-60";
               }
            } else {
              if (selectedOption === option) {
                baseStyle += "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500";
              } else {
                baseStyle += "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={baseStyle}
                disabled={isAnswered}
              >
                {option}
                {isAnswered && option === currentQuestion.correctAnswer && (
                  <span className="absolute right-3 top-3 text-green-600">✓</span>
                )}
                {isAnswered && option === selectedOption && option !== currentQuestion.correctAnswer && (
                   <span className="absolute right-3 top-3 text-red-600">✗</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
          <strong>Explanation:</strong> {currentQuestion.explanation}
        </div>
      )}

      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={checkAnswer}
            disabled={!selectedOption}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedOption 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 shadow-sm transition-colors"
          >
            {currentQuestionIndex === data.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
