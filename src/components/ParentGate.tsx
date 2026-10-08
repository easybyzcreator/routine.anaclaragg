import React, { useState, useEffect } from "react";
import { X, ShieldAlert } from "lucide-react";

interface ParentGateProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function ParentGate({ onSuccess, onClose }: ParentGateProps) {
  const [numA, setNumA] = useState<number>(0);
  const [numB, setNumB] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  // Generate a random math problem suitable for adults/teens
  useEffect(() => {
    const isMultiplication = Math.random() > 0.5;
    if (isMultiplication) {
      setNumA(Math.floor(Math.random() * 6) + 4); // 4 to 9
      setNumB(Math.floor(Math.random() * 7) + 3); // 3 to 9
    } else {
      setNumA(Math.floor(Math.random() * 40) + 15); // 15 to 55
      setNumB(Math.floor(Math.random() * 40) + 15); // 15 to 55
    }
  }, []);

  const isMultiplication = numA < 10 && numB < 10;
  const correctAnswer = isMultiplication ? numA * numB : numA + numB;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer.trim(), 10) === correctAnswer) {
      onSuccess();
    } else {
      setError(true);
      setUserAnswer("");
      // Generate a new one
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      id="parent-gate-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 flex flex-col items-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-[#FF7A00]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-800 text-center mb-1">
          Área Restrita aos Responsáveis
        </h3>
        <p className="text-xs text-gray-500 text-center mb-6 px-4">
          Para garantir a concentração da criança, resolva este desafio matemático para acessar a configuração.
        </p>

        {/* Math Challenge */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full text-center mb-4">
          <span className="text-3xl font-extrabold text-gray-700 tracking-wider">
            {numA} {isMultiplication ? "×" : "+"} {numB} = ?
          </span>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <input
            id="parent-gate-answer"
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Digite o resultado"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] text-center text-lg font-bold mb-4"
            autoFocus
          />

          {error && (
            <p className="text-sm font-semibold text-red-500 text-center mb-3 animate-pulse">
              Ops! Tente novamente com atenção.
            </p>
          )}

          <div className="flex gap-2 w-full">
            <button
              id="cancel-parent-gate"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition duration-200 text-sm cursor-pointer"
            >
              Voltar à Criança
            </button>
            <button
              id="submit-parent-gate"
              type="submit"
              className="flex-1 py-3 bg-[#FF7A00] hover:bg-[#E06B00] text-white font-bold rounded-xl transition duration-200 text-sm shadow-md cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
