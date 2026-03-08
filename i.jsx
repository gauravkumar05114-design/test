<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCQ Test with Tracking</title>
    <!-- React aur Tailwind CSS ko load kar rahe hain -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        const App = () => {
            // --- CONFIGURATION ---
            // Yahan apna Google Script URL dalein
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEAbx370j8VkRK-4mw9PWe53zgPgWQ13jzfQrGjnLasJvvxqj2L8Iq6Pg3W-mUEvoXVg/exec";

            const [step, setStep] = useState('login'); 
            const [studentName, setStudentName] = useState('');
            const [currentIdx, setCurrentIdx] = useState(0);
            const [answers, setAnswers] = useState({}); 
            const [timeLogs, setTimeLogs] = useState({}); 
            const [isSubmitting, setIsSubmitting] = useState(false);

            const startTimeRef = useRef(null);

            // Sawal (Inhein aap badal sakte hain)
            const questions = [
                { id: 1, text: "HTML ka full form kya hai?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Markup", "None"], correct: 0 },
                { id: 2, text: "CSS ka use kis liye hota hai?", options: ["Logic", "Design/Styling", "Database", "Server"], correct: 1 },
                { id: 3, text: "JavaScript kya hai?", options: ["Programming Language", "Browser", "OS", "Hardware"], correct: 0 },
                { id: 4, text: "GitHub kya hai?", options: ["Code Hosting Platform", "Compiler", "Text Editor", "Operating System"], correct: 0 },
                { id: 5, text: "SQL ka use kahan hota hai?", options: ["Design", "Database Management", "Networking", "AI"], correct: 1 }
            ];

            // Time Tracking Logic
            useEffect(() => {
                if (step === 'quiz') {
                    startTimeRef.current = Date.now();
                    return () => {
                        const endTime = Date.now();
                        const secondsSpent = Math.floor((endTime - startTimeRef.current) / 1000);
                        const qId = questions[currentIdx].id;
                        setTimeLogs(prev => ({
                            ...prev,
                            [qId]: (prev[qId] || 0) + secondsSpent
                        }));
                    };
                }
            }, [currentIdx, step]);

            const handleStart = () => {
                if (studentName.trim()) setStep('quiz');
                else alert("Kripya apna naam likhein!");
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
                
                const finalData = {
                    name: studentName,
                    score: result.score,
                    attempted: result.attempted,
                    skipped: result.skipped,
                    timePerQuestion: timeLogs
                };

                try {
                    // Google Sheet par data bhejna
                    await fetch(GOOGLE_SCRIPT_URL, {
                        method: "POST",
                        mode: "no-cors",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(finalData)
                    });
                    setStep('result');
                } catch (error) {
                    console.error("Submission failed", error);
                    alert("Data save nahi ho paya. Connection check karein.");
                }
                setIsSubmitting(false);
            };

            return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                    <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-8">
                        
                        {/* Step 1: Login */}
                        {step === 'login' && (
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold text-indigo-600 mb-4">Exam Portal</h1>
                                <p className="text-gray-500 mb-6">Test shuru karne ke liye apna naam likhein</p>
                                <input 
                                    className="w-full p-4 border-2 border-gray-100 rounded-xl mb-6 focus:border-indigo-500 outline-none"
                                    placeholder="Aapka Poora Naam"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                />
                                <button 
                                    onClick={handleStart}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition"
                                >
                                    Exam Shuru Karein
                                </button>
                            </div>
                        )}

                        {/* Step 2: Quiz */}
                        {step === 'quiz' && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-bold text-indigo-500">Sawal {currentIdx + 1} / {questions.length}</span>
                                    <span className="text-xs text-gray-400">{studentName}</span>
                                </div>

                                <h2 className="text-xl font-bold mb-6 text-gray-800">{questions[currentIdx].text}</h2>

                                <div className="space-y-3 mb-8">
                                    {questions[currentIdx].options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionSelect(i)}
                                            className={`w-full text-left p-4 border-2 rounded-xl transition ${
                                                answers[questions[currentIdx].id] === i 
                                                ? 'border-indigo-500 bg-indigo-50' 
                                                : 'border-gray-50 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="font-bold mr-2 text-indigo-400">{String.fromCharCode(65+i)}.</span> {opt}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex justify-between gap-4">
                                    <button 
                                        disabled={currentIdx === 0}
                                        onClick={() => setCurrentIdx(currentIdx - 1)}
                                        className="px-6 py-2 border rounded-lg disabled:opacity-20"
                                    >Pichla</button>
                                    
                                    {currentIdx === questions.length - 1 ? (
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="px-8 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                                        >
                                            {isSubmitting ? "Saving..." : "Submit Karein"}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setCurrentIdx(currentIdx + 1)}
                                            className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                                        >Aage Badhein</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {step === 'result' && (
                            <div className="text-center">
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-2xl font-bold mb-2">Test Safalta Purvak Submit Hua!</h2>
                                <p className="text-gray-500 mb-6">Aapka data Google Sheet par bhej diya gaya hai.</p>
                                <div className="grid grid-cols-3 gap-2 bg-indigo-50 p-4 rounded-xl">
                                    <div><p className="text-xs text-gray-400">Score</p><p className="font-bold">{calculateResult().score}</p></div>
                                    <div><p className="text-xs text-gray-400">Attempt</p><p className="font-bold">{calculateResult().attempted}</p></div>
                                    <div><p className="text-xs text-gray-400">Skip</p><p className="font-bold">{calculateResult().skipped}</p></div>
                                </div>
                                <button onClick={() => location.reload()} className="mt-6 text-indigo-600 font-bold underline">Dobara Shuru Karein</button>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
