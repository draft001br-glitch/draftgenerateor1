import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputPanel, { AppealPointInstruction } from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import HistoryModal from './components/HistoryModal';
import { 
  generateJobDescription, 
  refineJobDescription, 
  formatForWebEditor, 
  generateSeniorEmployeeVoice, 
  extractNGWords, 
  replaceNGWords 
} from './services/geminiService';
import { 
  loadHistoryItems, 
  saveHistoryItem, 
  deleteHistoryItem, 
  clearAllHistory, 
  updateHistoryItemTitle 
} from './services/historyService';
import { HistoryItem } from './types/history';
import { INITIAL_RECRUITMENT_TEMPLATES } from './constants';

interface Source {
  uri: string;
  title: string;
}

const App: React.FC = () => {
  const [interviewLog, setInterviewLog] = useState<string>('');
  const [sampleMessage, setSampleMessage] = useState<string>('');
  const [appealPointRules, setAppealPointRules] = useState<AppealPointInstruction[]>([]);
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [isGeneratingSeniorVoice, setIsGeneratingSeniorVoice] = useState<boolean>(false);
  const [isReplacingNGWords, setIsReplacingNGWords] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [recruitmentTemplates] = useState<string>(INITIAL_RECRUITMENT_TEMPLATES);
  const [catchphraseTemperature, setCatchphraseTemperature] = useState<number>(0.15);
  const [manuscriptTemperature, setManuscriptTemperature] = useState<number>(0.35);

  // History state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const generationAbortController = useRef<AbortController | null>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    const loaded = loadHistoryItems();
    setHistoryList(loaded);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!interviewLog.trim()) {
      setError('取材内容もしくは取材メモが必要です。');
      return;
    }
    
    generationAbortController.current = new AbortController();
    const { signal } = generationAbortController.current;

    setIsLoading(true);
    setError(null);
    setGeneratedDescription('');
    setSources([]);

    try {
      const result = await generateJobDescription(
          interviewLog, 
          sampleMessage,
          appealPointRules, 
          recruitmentTemplates,
          catchphraseTemperature,
          manuscriptTemperature
      );

      if (signal.aborted) {
          console.log('生成がキャンセルされました。');
          return;
      }

      setGeneratedDescription(result.text);
      setSources(result.sources);

      // Auto-save to history
      const { item, list } = saveHistoryItem({
        description: result.text,
        sources: result.sources,
        interviewLog,
        sampleMessage,
        appealPointRules,
        catchphraseTemperature,
        manuscriptTemperature,
        actionType: 'generate',
        actionLabel: '新規生成',
      });
      setHistoryList(list);
      setActiveHistoryId(item.id);
      showNotification('原稿を生成し、履歴に保存しました。', 'success');

    } catch (e: unknown) {
      if (signal.aborted) {
        console.log('生成がキャンセルされました。');
        return;
      }
      if (e instanceof Error) {
        setError(`生成失敗: ${e.message}`);
      } else {
        setError('エラー');
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
      generationAbortController.current = null;
    }
  }, [
      interviewLog, 
      sampleMessage,
      appealPointRules, 
      recruitmentTemplates,
      catchphraseTemperature,
      manuscriptTemperature,
      showNotification
  ]);

  const handleCancel = useCallback(() => {
    if (generationAbortController.current) {
        generationAbortController.current.abort();
        setIsLoading(false);
        setError("生成がキャンセルされました。");
    }
  }, []);

  const handleRefine = useCallback(async (instruction: string, tone: number = 50) => {
      if (!generatedDescription || (!instruction.trim() && tone === 50)) return;

      setIsRefining(true);
      setError(null);

      try {
          const refinedText = await refineJobDescription(
              generatedDescription,
              instruction,
              manuscriptTemperature,
              recruitmentTemplates,
              tone 
          );
          setGeneratedDescription(refinedText);

          // Auto-save refined version to history
          const { item, list } = saveHistoryItem({
            description: refinedText,
            sources,
            interviewLog,
            sampleMessage,
            appealPointRules,
            catchphraseTemperature,
            manuscriptTemperature,
            actionType: 'refine',
            actionLabel: '微調整',
            instructionUsed: instruction || (tone !== 50 ? `トーン ${tone}%` : undefined),
          });
          setHistoryList(list);
          setActiveHistoryId(item.id);
          showNotification('指示に基づいて原稿を更新し、履歴に保存しました。', 'success');

      } catch (e: unknown) {
          if (e instanceof Error) {
              setError(`生成失敗: ${e.message}`);
          } else {
              setError('エラー');
          }
      } finally {
          setIsRefining(false);
      }
  }, [generatedDescription, manuscriptTemperature, recruitmentTemplates, sources, interviewLog, sampleMessage, appealPointRules, catchphraseTemperature, showNotification]);

  const handleFormat = useCallback(async () => {
      if (!generatedDescription) return;

      setIsFormatting(true);
      setError(null);

      try {
          const formattedText = await formatForWebEditor(generatedDescription);
          setGeneratedDescription(formattedText);

          // Save formatted draft to history
          const { item, list } = saveHistoryItem({
            description: formattedText,
            sources,
            interviewLog,
            sampleMessage,
            appealPointRules,
            catchphraseTemperature,
            manuscriptTemperature,
            actionType: 'format',
            actionLabel: '原稿整形',
          });
          setHistoryList(list);
          setActiveHistoryId(item.id);
          showNotification('結果を整理し、履歴に保存しました。', 'success');

      } catch (e: unknown) {
          if (e instanceof Error) {
              setError(`生成失敗: ${e.message}`);
          } else {
              setError('エラー');
          }
      } finally {
          setIsFormatting(false);
      }
  }, [generatedDescription, sources, interviewLog, sampleMessage, appealPointRules, catchphraseTemperature, manuscriptTemperature, showNotification]);

  const handleGenerateSeniorEmployeeVoice = useCallback(async () => {
      if (!interviewLog.trim()) {
          setError('取材内容もしくは取材メモが必要です。');
          return;
      }

      setIsGeneratingSeniorVoice(true);
      setError(null);

      try {
          const voiceText = await generateSeniorEmployeeVoice(interviewLog);
          const combined = (generatedDescription ? generatedDescription + '\n\n' : '') + voiceText;
          setGeneratedDescription(combined);

          // Save senior voice addition to history
          const { item, list } = saveHistoryItem({
            description: combined,
            sources,
            interviewLog,
            sampleMessage,
            appealPointRules,
            catchphraseTemperature,
            manuscriptTemperature,
            actionType: 'senior_voice',
            actionLabel: '先輩社員追加',
          });
          setHistoryList(list);
          setActiveHistoryId(item.id);
          showNotification('先輩社員原稿を追加し、履歴に保存しました。', 'success');

      } catch (e: unknown) {
          if (e instanceof Error) {
              setError(`先輩社員原稿生成失敗: ${e.message}`);
          } else {
              setError('エラー');
          }
      } finally {
          setIsGeneratingSeniorVoice(false);
      }
  }, [interviewLog, generatedDescription, sources, sampleMessage, appealPointRules, catchphraseTemperature, manuscriptTemperature, showNotification]);

  const handleReplaceNGWords = useCallback(async () => {
      if (!generatedDescription) return;

      setIsReplacingNGWords(true);
      setError(null);

      try {
          const matches = extractNGWords(generatedDescription);
          if (matches.length > 0) {
              const replacedText = await replaceNGWords(generatedDescription, matches);
              setGeneratedDescription(replacedText);

              // Save NG word replaced version to history
              const { item, list } = saveHistoryItem({
                description: replacedText,
                sources,
                interviewLog,
                sampleMessage,
                appealPointRules,
                catchphraseTemperature,
                manuscriptTemperature,
                actionType: 'ng_replace',
                actionLabel: 'NG置換',
              });
              setHistoryList(list);
              setActiveHistoryId(item.id);
              showNotification(`NGワード（${matches.length}箇所）を置換し、履歴に保存しました。`, 'success');
          } else {
              showNotification('NGワードは見つかりませんでした。', 'info');
          }
      } catch (e: unknown) {
          if (e instanceof Error) {
              setError(`NGワード置換失敗: ${e.message}`);
          } else {
              setError('エラー');
          }
      } finally {
          setIsReplacingNGWords(false);
      }
  }, [generatedDescription, sources, interviewLog, sampleMessage, appealPointRules, catchphraseTemperature, manuscriptTemperature, showNotification]);

  // Manual save current draft to history
  const handleManualSaveToHistory = useCallback(() => {
    if (!generatedDescription.trim()) return;

    const { item, list } = saveHistoryItem({
      description: generatedDescription,
      sources,
      interviewLog,
      sampleMessage,
      appealPointRules,
      catchphraseTemperature,
      manuscriptTemperature,
      actionType: 'manual_save',
      actionLabel: '手動保存',
    });
    setHistoryList(list);
    setActiveHistoryId(item.id);
    showNotification('現在の原稿を履歴に保存しました。', 'success');
  }, [generatedDescription, sources, interviewLog, sampleMessage, appealPointRules, catchphraseTemperature, manuscriptTemperature, showNotification]);

  // Load a history item to active workspace for re-prompting & editing
  const handleSelectHistory = useCallback((item: HistoryItem, restoreInputs: boolean) => {
    setGeneratedDescription(item.description);
    setSources(item.sources || []);
    setActiveHistoryId(item.id);
    setError(null);

    if (restoreInputs) {
      if (item.interviewLog !== undefined) setInterviewLog(item.interviewLog);
      if (item.sampleMessage !== undefined) setSampleMessage(item.sampleMessage);
      if (item.appealPointRules) setAppealPointRules(item.appealPointRules);
      if (item.catchphraseTemperature !== undefined) setCatchphraseTemperature(item.catchphraseTemperature);
      if (item.manuscriptTemperature !== undefined) setManuscriptTemperature(item.manuscriptTemperature);
    }

    showNotification(`履歴「${item.title}」を読み込みました。下の微調整から再度指示を出せます。`, 'info');
  }, [showNotification]);

  // Delete a single history item
  const handleDeleteHistory = useCallback((id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryList(updated);
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
    showNotification('履歴を1件削除しました。', 'info');
  }, [activeHistoryId, showNotification]);

  // Clear all history
  const handleClearAllHistory = useCallback(() => {
    clearAllHistory();
    setHistoryList([]);
    setActiveHistoryId(null);
    showNotification('すべての生成履歴を削除しました。', 'info');
  }, [showNotification]);

  // Update a history item's title
  const handleUpdateTitle = useCallback((id: string, newTitle: string) => {
    const updated = updateHistoryItemTitle(id, newTitle);
    setHistoryList(updated);
    showNotification('タイトルを更新しました。', 'success');
  }, [showNotification]);

  const activeHistoryItem = historyList.find(i => i.id === activeHistoryId) || null;

  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-sans relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-slideIn">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs md:text-sm backdrop-blur-lg ${
            notification.type === 'success'
              ? 'bg-green-950/90 text-green-200 border-green-700/80 shadow-green-900/30'
              : 'bg-blue-950/90 text-blue-200 border-blue-700/80 shadow-blue-900/30'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Header 
        historyCount={historyList.length}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onSaveCurrentDraft={handleManualSaveToHistory}
        canSaveCurrentDraft={Boolean(generatedDescription.trim())}
      />

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <InputPanel
            interviewLog={interviewLog}
            setInterviewLog={setInterviewLog}
            sampleMessage={sampleMessage}
            setSampleMessage={setSampleMessage}
            appealPointRules={appealPointRules}
            setAppealPointRules={setAppealPointRules}
            onGenerate={handleGenerate}
            onCancel={handleCancel}
            isLoading={isLoading}
            catchphraseTemperature={catchphraseTemperature}
            setCatchphraseTemperature={setCatchphraseTemperature}
            manuscriptTemperature={manuscriptTemperature}
            setManuscriptTemperature={setManuscriptTemperature}
          />
          <OutputPanel
            description={generatedDescription}
            onDescriptionChange={setGeneratedDescription}
            sources={sources}
            isLoading={isLoading}
            isRefining={isRefining}
            isFormatting={isFormatting}
            isGeneratingSeniorVoice={isGeneratingSeniorVoice}
            isReplacingNGWords={isReplacingNGWords}
            error={error}
            onRefine={handleRefine}
            onFormat={handleFormat}
            onGenerateSeniorEmployeeVoice={handleGenerateSeniorEmployeeVoice}
            onReplaceNGWords={handleReplaceNGWords}
            activeHistoryItem={activeHistoryItem}
            onClearActiveHistory={() => setActiveHistoryId(null)}
            historyCount={historyList.length}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onSaveToHistory={handleManualSaveToHistory}
          />
        </div>
      </main>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        historyList={historyList}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearAllHistory={handleClearAllHistory}
        onUpdateTitle={handleUpdateTitle}
        activeHistoryId={activeHistoryId}
      />
    </div>
  );
};

export default App;
