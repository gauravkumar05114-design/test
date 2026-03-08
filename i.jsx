import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  // --- CONFIGURATION ---
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEAbX37Oj8VkRK-4mw9PWe53zgPgWQ13jzfQrGJnLasJvvxQj2L8Iq6Pg3W-mUEvoXVg/exec"; // Yahan apna URL dalein

  const [step, setStep] = useState('login'); // login, quiz, result
  const [studentName, setStudentName] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // {questionId: selectedOption}
  const [timeLogs, setTimeLogs] = useState({}); // {questionId: seconds}
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer logic
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Mock Questions (Aap yahan 100 questions tak add kar sakte hain)
  const questions = [
    { id: 1, text: "HTML ka full form kya hai?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Markup", "None"], correct: 0 },
    { id: 2, text: "CSS ka use kis liye hota hai?", options: ["Logic", "Design/Styling", "Database", "Server"], correct: 1 },
    { id: 3, text: "JavaScript kya hai?", options: ["Programming Language", "Browser", "OS", "Hardware"], correct: 0 },
    { id: 4, text: "GitHub kya hai?", options: ["Code Hosting Platform", "Compiler", "Text Editor", "Operating System"], correct: 0 },
    { id: 5, text: "SQL ka use kahan hota hai?", options: ["Design", "Database Management", "Networking", "AI"], correct: 1 },
  ];

  // Jab question change ho, purane question ka time save karo
  useEffect(() => {
    if (step === 'quiz') {
      startTimeRef.current = Date.now();
      
      return () => {
        const endTime = Date.now();
        const secondsSpent = Math.floor((endTime - startTimeRef.current) / 1000);
        setTimeLogs(prev => ({
          ...prev,
          [questions[currentIdx].id]: (prev[questions[currentIdx].id] || 0) + secondsSpent
        }));
      };
    }
  }, [currentIdx, step]);

  const handleStart = () => {
    if (studentName.trim()) setStep('quiz');
  };

  const handleOptionSelect = (optionIdx) => {
    setAnswers({ ...answers, [questions[currentIdx].id]: optionIdx });
  };

  const calculateResult = () => {
    let score = 0;
    let attempted = 0;
    let skipped = 0;

    questions.forEach(q => {
      if (answers[q.id] !== undefined) {
        attempted++;
        if (answers[q.id] === q.correct) score++;
      } else {
        skipped++;
      }
    });

    return { score, attempted, skipped };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = calculateResult();
    
    // Final data package
    const finalData = {
      name: studentName,
      score: result.score,
      attempted: result.attempted,
      skipped: result.skipped,
      timePerQuestion: timeLogs
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData)
      });
      setStep('result');
    } catch (error) {
      console.error("Submission failed", error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* Step 1: Registration */}
        {step === 'login' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600 mb-6">Exam Portal</h1>
            <p className="mb-6 text-gray-500">Apna naam likhein aur exam shuru karein.</p>
            <input 
              className="w-full p-4 border rounded-xl mb-4 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
              placeholder="Full Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <button 
              onClick={handleStart}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Start Examination
            </button>
          </div>
        )}

        {/* Step 2: Quiz with Tracking */}
        {step === 'quiz' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-400">Student: {studentName}</span>
            </div>

            <h2 className="text-xl font-semibold mb-6">{questions[currentIdx].text}</h2>

            <div className="space-y-3 mb-8">
              {questions[currentIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(i)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                    answers[questions[currentIdx].id] === i 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="mr-3 font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-4">
              <button 
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="px-6 py-3 border rounded-xl disabled:opacity-30"
              >
                Previous
              </button>
              
              {currentIdx === questions.length - 1 ? (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg"
                >
                  {isSubmitting ? "Submitting..." : "Finish & Submit"}
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Result Message */}
        {step === 'result' && (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              ✓
            </div>
            <h2 className="text-3xl font-bold mb-2">Exam Submitted!</h2>
            <p className="text-gray-500 mb-8">Aapka result aur time-tracking data Google Sheet par bhej diya gaya hai.</p>
            <div className="grid grid-cols-3 gap-4 border-t pt-8">
              <div>
                <p className="text-sm text-gray-400 uppercase">Score</p>
                <p className="text-2xl font-bold">{calculateResult().score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase">Attempted</p>
                <p className="text-2xl font-bold">{calculateResult().attempted}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase">Skipped</p>
                <p className="text-2xl font-bold">{calculateResult().skipped}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;