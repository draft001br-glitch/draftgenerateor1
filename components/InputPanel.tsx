
import React, { Dispatch, SetStateAction, useMemo, useCallback } from 'react';
import { APPEAL_POINTS } from '../services/geminiService';

export interface AppealPointInstruction {
    pointName: string;
    customInstruction: string;
}

interface InputPanelProps {
  interviewLog: string;
  setInterviewLog: Dispatch<SetStateAction<string>>;
  sampleMessage: string;
  setSampleMessage: Dispatch<SetStateAction<string>>;
  appealPointRules: AppealPointInstruction[];
  setAppealPointRules: Dispatch<SetStateAction<AppealPointInstruction[]>>;
  onGenerate: () => void;
  onCancel: () => void;
  isLoading: boolean;
  catchphraseTemperature: number;
  setCatchphraseTemperature: Dispatch<SetStateAction<number>>;
  manuscriptTemperature: number;
  setManuscriptTemperature: Dispatch<SetStateAction<number>>;
}

const InputPanel: React.FC<InputPanelProps> = ({ 
    interviewLog, 
    setInterviewLog, 
    sampleMessage,
    setSampleMessage,
    appealPointRules,
    setAppealPointRules,
    onGenerate, 
    onCancel,
    isLoading, 
    catchphraseTemperature,
    setCatchphraseTemperature,
    manuscriptTemperature,
    setManuscriptTemperature
}) => {
    const handleAppealPointChange = (pointName: string, isChecked: boolean) => {
        if (isChecked) {
            // Add if not exists, preserving order
            const newRules = [...appealPointRules, { pointName, customInstruction: '取材内容からしっかりと盛り込んで作成' }];
            const orderedRules = APPEAL_POINTS
                .map(point => newRules.find(r => r.pointName === point))
                .filter((r): r is AppealPointInstruction => r !== undefined);
            setAppealPointRules(orderedRules);
        } else {
            // Remove if exists
            setAppealPointRules(appealPointRules.filter(r => r.pointName !== pointName));
        }
    };

    const handleInstructionChange = (pointName: string, instruction: string) => {
        setAppealPointRules(appealPointRules.map(r => 
            r.pointName === pointName ? { ...r, customInstruction: instruction } : r
        ));
    };

  return (
    <div className="bg-black/30 backdrop-blur-lg border border-gray-800 p-6 rounded-xl shadow-2xl shadow-black/20 flex flex-col h-full">
      <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2">
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-white">
              取材内容
            </h2>
          </div>
          <div className="relative">
            <textarea
              value={interviewLog}
              onChange={(e) => setInterviewLog(e.target.value)}
              placeholder="取材内容・取材メモ・構成案をそのまま張り付けてください！"
              className="w-full p-4 bg-gray-900/70 border border-gray-700 rounded-md focus:ring-2 focus:ring-white/80 focus:outline-none resize-none text-gray-300 placeholder-gray-500 text-sm leading-relaxed transition-all duration-300"
              rows={8}
              aria-label="Interview Transcript Input"
            />
            {interviewLog && (
              <button
                  onClick={() => setInterviewLog('')}
                  className="absolute top-3 right-3 text-gray-500 hover:text-red-400 focus:outline-none transition-colors"
                  title="クリア"
                  aria-label="Clear interview log"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
              </button>
            )}
          </div>
        </div>
        <div>
            <label htmlFor="sample-message" className="block text-sm font-medium text-gray-400 mb-2">
                PR文の方向性の指示
            </label>
            <div className="p-3 bg-gray-900/70 border border-gray-700 rounded-md">
                <p className="text-xs text-gray-500 mb-2">
                    参考にするPR文の構成や事前に作成した構成内容をここに入力するとそれに基づいてPRが生成される
                </p>
                <div className="relative">
                    <textarea
                        id="sample-message"
                        value={sampleMessage}
                        onChange={(e) => setSampleMessage(e.target.value)}
                        placeholder="構成案をそのまま張り付けてください！"
                        className="w-full p-3 bg-gray-800/80 border border-gray-600 rounded-md focus:ring-1 focus:ring-white/80 focus:outline-none text-gray-300 text-sm resize-none leading-relaxed"
                        rows={6}
                        aria-label="Sample Job Description Input"
                    />
                    {sampleMessage && (
                        <button
                            onClick={() => setSampleMessage('')}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-400 focus:outline-none transition-colors"
                            title="クリア"
                            aria-label="Clear sample message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>

         <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
                3つのアピールポイント
            </label>
            <div className="space-y-3 p-3 bg-gray-900/70 border border-gray-700 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {APPEAL_POINTS.map((point) => {
                        const selectedRule = appealPointRules.find(r => r.pointName === point);
                        const isSelected = !!selectedRule;

                        return (
                            <div key={point} className="flex flex-col gap-2">
                                <label className="flex items-center text-sm text-gray-300 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleAppealPointChange(point, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-white focus:ring-white/80"
                                    />
                                    <span className="ml-2">{point}</span>
                                </label>
                                {isSelected && (
                                    <div className="relative">
                                        <textarea
                                            value={selectedRule.customInstruction}
                                            onChange={(e) => handleInstructionChange(point, e.target.value)}
                                            placeholder={`アピールポイントの詳細があれば入力`}
                                            className="w-full p-2 pr-8 bg-gray-800/80 border border-gray-600 rounded-md focus:ring-1 focus:ring-white/80 focus:outline-none text-gray-300 text-sm resize-none placeholder-gray-500 transition-all duration-200"
                                            rows={2}
                                        />
                                        {selectedRule.customInstruction && (
                                            <button
                                                onClick={() => handleInstructionChange(point, '')}
                                                className="absolute top-2 right-2 text-gray-500 hover:text-red-400 focus:outline-none transition-colors"
                                                title="クリア"
                                                aria-label={`Clear instruction for ${point}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
                温度感の調整（推奨数値がデフォルト）
            </label>
            <div className="space-y-4 p-3 bg-gray-900/70 border border-gray-700 rounded-md">
                <div className="flex flex-col">
                    <label htmlFor="catchphrase-temp" className="text-xs text-gray-300 mb-1 flex justify-between">
                        <span>キャッチコピーの温度感</span>
                        <span className="font-mono text-white/80">{catchphraseTemperature.toFixed(2)}</span>
                    </label>
                    <input
                        id="catchphrase-temp"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={catchphraseTemperature}
                        onChange={(e) => setCatchphraseTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white/80"
                    />
                    <p className="text-xs text-gray-500 mt-1">数値を下げるとより取材内容に忠実な内容を生成する</p>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="manuscript-temp" className="text-xs text-gray-300 mb-1 flex justify-between">
                        <span>原稿本文の温度感</span>
                        <span className="font-mono text-white/80">{manuscriptTemperature.toFixed(2)}</span>
                    </label>
                    <input
                        id="manuscript-temp"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={manuscriptTemperature}
                        onChange={(e) => setManuscriptTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white/80"
                    />
                    <p className="text-xs text-gray-500 mt-1">数値を下げるとより取材内容に忠実な内容を生成する</p>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800">
        {isLoading ? (
            <button
                onClick={onCancel}
                className="w-full flex items-center justify-center bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-all duration-300 ease-in-out"
                aria-label="Cancel Generation"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                生成中断
            </button>
        ) : (
            <button
                onClick={onGenerate}
                className="w-full flex items-center justify-center bg-white text-black font-bold py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-all duration-300 ease-in-out"
                aria-label="Generate Job Description"
            >
                原稿生成開始！
            </button>
        )}
      </div>
    </div>
  );
};

export default InputPanel;
