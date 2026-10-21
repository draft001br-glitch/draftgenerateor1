import React, { useState, useCallback, useMemo, useRef } from 'react';
import { HistoryItem } from '../types/history';

interface Source {
  uri: string;
  title: string;
}

interface OutputPanelProps {
  description: string;
  onDescriptionChange?: (newVal: string) => void;
  sources: Source[];
  isLoading: boolean;
  isRefining?: boolean;
  isFormatting?: boolean;
  isGeneratingSeniorVoice?: boolean;
  isReplacingNGWords?: boolean;
  error: string | null;
  onRefine?: (instruction: string, tone?: number) => void;
  onFormat?: () => void;
  onGenerateSeniorEmployeeVoice?: () => void;
  onReplaceNGWords?: () => void;
  activeHistoryItem?: HistoryItem | null;
  onClearActiveHistory?: () => void;
  historyCount?: number;
  onOpenHistory?: () => void;
  onSaveToHistory?: () => void;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse p-4 w-full max-w-4xl mx-auto">
    <div className="h-10 bg-gray-800 rounded w-1/3 mb-8"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      <div className="h-4 bg-gray-800 rounded w-4/5"></div>
    </div>
     <div className="h-8 bg-gray-800 rounded w-1/4 mt-12 mb-6"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      <div className="h-4 bg-gray-800 rounded w-4/5"></div>
    </div>
  </div>
);

const QUICK_INSTRUCTION_PRESETS = [
  '未経験向けの研修・教育体制をより具体的に',
  '仕事のやりがいや面白さを魅力的に強調',
  '残業や休日、働きやすさの記述を分かりやすく補強',
  '求める人物像・応募条件のハードルを下げて親しみやすく',
  'キャッチコピーを20代若手に刺さるインパクトある表現に',
  '全体の文体をより親しみやすく柔らかいトーンに修正',
];

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  description, 
  onDescriptionChange,
  sources, 
  isLoading, 
  isRefining = false, 
  isFormatting = false, 
  isGeneratingSeniorVoice = false,
  isReplacingNGWords = false, 
  error, 
  onRefine, 
  onFormat,
  onGenerateSeniorEmployeeVoice,
  onReplaceNGWords,
  activeHistoryItem,
  onClearActiveHistory,
  historyCount = 0,
  onOpenHistory,
  onSaveToHistory,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [tweakInput, setTweakInput] = useState('');
  const [toneValue, setToneValue] = useState(50);
  const [isDirectEditing, setIsDirectEditing] = useState(false);

  const tweakSectionRef = useRef<HTMLDivElement | null>(null);

  const handleCopy = useCallback(() => {
    if (description) {
      navigator.clipboard.writeText(description).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); 
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  }, [description]);

  const handleSaveClick = useCallback(() => {
    if (onSaveToHistory) {
      onSaveToHistory();
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2200);
    }
  }, [onSaveToHistory]);

  const handleRefineClick = useCallback(() => {
      if (onRefine && tweakInput.trim()) {
          onRefine(tweakInput, toneValue);
          setTweakInput(''); 
      }
  }, [onRefine, tweakInput, toneValue]);

  const handleToneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setToneValue(parseInt(e.target.value, 10));
  }, []);

  const handleApplyTone = useCallback(() => {
      if (onRefine && toneValue !== 50) {
          onRefine('', toneValue);
      }
  }, [onRefine, toneValue]);

  const scrollToTweak = useCallback(() => {
    tweakSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const parseInline = useCallback((text: string) => {
        if (!text) return '';

        // Handle BR tags explicitly before escaping
        let processed = text.replace(/<br\s*\/?>/gi, '___BR___');

        // Basic HTML escaping
        processed = processed
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Restore BR
        processed = processed.replace(/___BR___/g, '<br />');

        // Bold **text**
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
        
        // Code `text`
        processed = processed.replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-300">$1</code>');
        
        // Italics *text* (basic implementation)
        processed = processed.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em class="italic text-gray-400">$2</em>');

        // Highlight symbols often used in Japanese job ads for better readability
        processed = processed.replace(/([◆■●])/g, '<span class="text-blue-400 mr-1">$1</span>');
        processed = processed.replace(/(【.*?】)/g, '<span class="font-bold text-blue-200">$1</span>');
        
        return processed;
  }, []);

  const renderContent = useMemo(() => {
    if (!description) return null;

    const lines = description.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // 1. Horizontal Rules
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            elements.push(<hr key={`hr-${i}`} className="my-10 border-gray-700" />);
            i++;
            continue;
        }

        // 2. Headers
        if (trimmed.startsWith('#')) {
            const level = trimmed.match(/^#+/)?.[0].length || 0;
            const content = trimmed.replace(/^#+\s*/, '');
            const htmlContent = parseInline(content);
            
            if (level === 1) {
                elements.push(
                    <h1 key={`h1-${i}`} className="text-3xl md:text-4xl font-extrabold text-white mt-12 mb-8 pb-4 border-b border-gray-700 tracking-tight" dangerouslySetInnerHTML={{__html: htmlContent}} />
                );
            } else if (level === 2) {
                elements.push(
                    <h2 key={`h2-${i}`} className="text-2xl font-bold text-blue-100 mt-10 mb-6 flex items-center group" >
                         <span className="w-1.5 h-8 bg-blue-600 rounded-full mr-3 group-hover:bg-blue-500 transition-colors"></span>
                         <span dangerouslySetInnerHTML={{__html: htmlContent}}></span>
                    </h2>
                );
            } else if (level === 3) {
                elements.push(
                    <h3 key={`h3-${i}`} className="text-xl font-bold text-white mt-8 mb-4 pl-2 border-l-4 border-gray-600" dangerouslySetInnerHTML={{__html: htmlContent}} />
                );
            } else {
                elements.push(
                    <h4 key={`h4-${i}`} className="text-lg font-semibold text-blue-300 mt-6 mb-3 flex items-center" >
                        <span className="mr-2 text-blue-500">●</span>
                        <span dangerouslySetInnerHTML={{__html: htmlContent}}></span>
                    </h4>
                );
            }
            i++;
            continue;
        }

        // 3. Tables
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const tableRows: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                tableRows.push(lines[i].trim());
                i++;
            }

            if (tableRows.length > 0) {
                const parsedRows = tableRows.map(row => {
                    const content = row.slice(1, -1);
                    return content.split('|').map(c => c.trim());
                });

                const separatorIndex = parsedRows.findIndex(row => row.every(cell => /^[-:\s]+$/.test(cell)));
                
                let headerRow: string[] | null = null;
                let bodyRows = parsedRows;

                if (separatorIndex !== -1) {
                    if (separatorIndex === 1) {
                        headerRow = parsedRows[0];
                        bodyRows = parsedRows.slice(2);
                    } else {
                         bodyRows = parsedRows.filter((_, idx) => idx !== separatorIndex);
                    }
                }

                const isSpecTable = bodyRows.every(r => r.length === 2);

                elements.push(
                    <div key={`table-${i}`} className="my-8 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/40 w-full shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                {headerRow && (
                                    <thead className="bg-gray-800">
                                        <tr>
                                            {headerRow.map((cell, cIdx) => (
                                                <th key={`th-${cIdx}`} className="px-6 py-3 text-sm font-bold text-gray-200 border-b border-gray-700 whitespace-nowrap bg-gray-800/80" dangerouslySetInnerHTML={{__html: parseInline(cell)}} />
                                            ))}
                                        </tr>
                                    </thead>
                                )}
                                <tbody className="divide-y divide-gray-700/50">
                                    {bodyRows.map((row, rIdx) => (
                                        <tr key={`tr-${rIdx}`} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-gray-800/20'}>
                                            {row.map((cell, cIdx) => {
                                                const isLabelCol = isSpecTable && cIdx === 0;
                                                
                                                return (
                                                    <td 
                                                        key={`td-${cIdx}`} 
                                                        className={`px-6 py-5 text-sm border-gray-700/50 align-top leading-relaxed ${
                                                            isLabelCol 
                                                                ? 'font-bold text-blue-200 bg-white/5 w-[25%] min-w-[160px] border-r border-gray-700/50' 
                                                                : 'text-gray-300 w-auto whitespace-pre-wrap'
                                                        }`} 
                                                        dangerouslySetInnerHTML={{__html: parseInline(cell)}} 
                                                    />
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            continue;
        }

        // 4. List Items
        const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
        if (listMatch) {
            const listType = /^\d+\./.test(listMatch[2]) ? 'ol' : 'ul';
            const listItems: { text: string }[] = [];
            
            while (i < lines.length) {
                const curLine = lines[i];
                const match = curLine.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
                if (match) {
                     listItems.push({ text: match[3] });
                     i++;
                } else if (curLine.trim() === '') {
                     i++;
                     break; 
                } else {
                     break;
                }
            }

            if (listType === 'ul') {
                elements.push(
                    <ul key={`ul-${i}`} className="my-4 space-y-2 text-gray-300 pl-4 list-disc marker:text-blue-400">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{__html: parseInline(item.text)}} />
                        ))}
                    </ul>
                );
            } else {
                elements.push(
                    <ol key={`ol-${i}`} className="my-4 space-y-2 text-gray-300 pl-4 list-decimal marker:text-blue-400">
                        {listItems.map((item, idx) => (
                            <li key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{__html: parseInline(item.text)}} />
                        ))}
                    </ol>
                );
            }
            continue;
        }

        // 5. Paragraphs & Line Breaks
        if (trimmed === '') {
            elements.push(<div key={`space-${i}`} className="h-4" />);
        } else {
            elements.push(
                <p key={`p-${i}`} className="text-gray-300 leading-relaxed my-2" dangerouslySetInnerHTML={{__html: parseInline(line)}} />
            );
        }
        i++;
    }

    return elements;
  }, [description, parseInline]);

  const renderStatus = () => {
    if (isLoading) {
      return <LoadingSkeleton />;
    }
    if (error) {
      return (
        <div className="text-red-200 bg-red-900/20 p-6 rounded-xl border border-red-800 shadow-lg" role="alert">
          <p className="font-bold flex items-center text-lg mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            生成エラー
          </p>
          <p>{error}</p>
        </div>
      );
    }
    if (description) {
      return (
         <div className="pr-2 relative">
             {isRefining && (
                 <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-lg min-h-[300px]">
                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                     <p className="text-blue-200 font-semibold text-base">指示に基づいて原稿を再生成・微調整中...</p>
                 </div>
             )}

             {/* Loaded History Banner */}
             {activeHistoryItem && (
               <div className="mb-6 p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 shadow-inner flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                 <div className="flex items-center gap-2.5">
                   <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-blue-300">履歴から読込中</span>
                       <span className="text-[11px] text-gray-400 font-mono">({activeHistoryItem.formattedDate})</span>
                       <span className="text-[11px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50">
                         {activeHistoryItem.actionLabel}
                       </span>
                     </div>
                     <p className="text-sm font-semibold text-white truncate max-w-md">
                       {activeHistoryItem.title}
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center gap-2">
                   <button
                     onClick={scrollToTweak}
                     className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                     </svg>
                     この原稿に指示を出す
                   </button>
                   {onClearActiveHistory && (
                     <button
                       onClick={onClearActiveHistory}
                       className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                       title="新規として扱う（履歴連携を解除）"
                     >
                       解除
                     </button>
                   )}
                 </div>
               </div>
             )}

            {/* Direct Editing Switcher */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDirectEditing(false)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    !isDirectEditing 
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  整形プレビュー
                </button>
                <button
                  onClick={() => setIsDirectEditing(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isDirectEditing 
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  テキスト直接編集
                </button>
              </div>
              <span className="text-xs text-gray-500">
                文字数: {description.length.toLocaleString()}文字
              </span>
            </div>

            {/* View or Direct Edit Textarea */}
            {isDirectEditing ? (
              <div className="mb-8">
                <textarea
                  value={description}
                  onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                  className="w-full h-[550px] p-4 bg-gray-900/90 border border-gray-700 rounded-xl text-gray-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-y"
                  placeholder="原稿内容を直接編集できます"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ※直接編集した内容はそのまま下記の「微調整」や各処理、「履歴に保存」の対象になります。
                </p>
              </div>
            ) : (
              renderContent
            )}
            
            {/* Refine & Tone Section */}
            {onRefine && (
                <div ref={tweakSectionRef} className="mt-10 pt-6 border-t border-gray-800 space-y-6">
                    
                    {/* Tone Adjustment */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-300 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                トーンの調整
                            </h4>
                            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-blue-200 font-mono">
                                {toneValue === 50 ? '標準（変更なし）' : toneValue < 50 ? `カジュアル ${toneValue}%` : `かっちり ${toneValue}%`}
                            </span>
                        </div>
                        <div className="px-2">
                             <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={toneValue}
                                onChange={handleToneChange}
                                disabled={isRefining}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-medium uppercase tracking-wide">
                                <span>カジュアル</span>
                                <span>ニュートラル</span>
                                <span>かっちりとした表現</span>
                            </div>
                        </div>
                         {toneValue !== 50 && (
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={handleApplyTone}
                                    disabled={isRefining}
                                    className="px-3 py-1.5 bg-blue-900/40 text-blue-200 text-xs font-medium rounded border border-blue-800 hover:bg-blue-800/50 transition-colors"
                                >
                                    トーン調整を適用
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Manual Tweak & Prompt Instructions */}
                    <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-white flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              現在の原稿に再度指示を出して修正（微調整）
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                          表示中の原稿（履歴から読み込んだ内容を含む）をベースに、追加・変更したい指示を入力してAIに再生成させます。
                        </p>

                        {/* Quick Presets */}
                        <div className="mb-3">
                          <div className="text-[11px] text-gray-500 font-semibold mb-1.5">よく使われる指示の例（クリックで入力）:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_INSTRUCTION_PRESETS.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setTweakInput(preset)}
                                className="text-[11px] px-2.5 py-1 bg-gray-800/80 hover:bg-blue-900/40 text-gray-300 hover:text-blue-200 rounded-md border border-gray-700/80 hover:border-blue-700/50 transition-colors text-left"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <textarea 
                                    value={tweakInput} 
                                    onChange={(e) => setTweakInput(e.target.value)}
                                    placeholder="例: 「もう少し仕事内容の研修内容を詳しく」「残業が少ない魅力を強調」「未経験でも安心できるポイントを冒頭に」など"
                                    className="w-full p-3.5 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/80 focus:outline-none text-gray-200 text-sm resize-none placeholder-gray-500"
                                    rows={3}
                                    disabled={isRefining}
                                />
                                {tweakInput && (
                                    <button
                                        onClick={() => setTweakInput('')}
                                        className="absolute top-2.5 right-2.5 text-gray-500 hover:text-red-400 focus:outline-none transition-colors"
                                        title="クリア"
                                        aria-label="Clear tweak input"
                                        disabled={isRefining}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-gray-500">
                                修正結果は自動的に新しい履歴として保存されます
                              </span>
                              <button 
                                  onClick={handleRefineClick}
                                  disabled={!tweakInput.trim() || isRefining || isFormatting}
                                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30 flex items-center gap-1.5"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  指示を出して生成結果を修正
                              </button>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Section */}
                    <div className="pt-6 border-t border-gray-700/50 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            追加プロセス（セグメント処理）
                        </h4>
                        
                        {onGenerateSeniorEmployeeVoice && (
                            <button 
                                onClick={onGenerateSeniorEmployeeVoice}
                                disabled={isGeneratingSeniorVoice || isRefining || isFormatting || isReplacingNGWords}
                                className="w-full py-3 bg-teal-600/80 hover:bg-teal-600 text-white text-sm font-medium rounded-lg shadow-lg border border-teal-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isGeneratingSeniorVoice ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        先輩社員原稿を生成中...
                                    </>
                                ) : '【2】先輩社員原稿を追加'}
                            </button>
                        )}

                        {onReplaceNGWords && (
                            <button 
                                onClick={onReplaceNGWords}
                                disabled={isReplacingNGWords || isGeneratingSeniorVoice || isRefining || isFormatting}
                                className="w-full py-3 bg-orange-600/80 hover:bg-orange-600 text-white text-sm font-medium rounded-lg shadow-lg border border-orange-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isReplacingNGWords ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        NGワードを置換中...
                                    </>
                                ) : '【3】NGワードを抽出・置換'}
                            </button>
                        )}

                        {onFormat && (
                            <button 
                                onClick={onFormat}
                                disabled={isFormatting || isRefining || isGeneratingSeniorVoice || isReplacingNGWords}
                                className="w-full py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg border border-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isFormatting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        結果を整形中...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        【4】生成結果を整理
                                    </>
                                )}
                            </button>
                        )}
                        <p className="text-xs text-gray-500 mt-2 text-center">各セグメントは順に実行してください。</p>
                    </div>
                </div>
            )}
         </div>
      );
    }
    return (
      <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full p-8 opacity-60">
         <div className="bg-gray-800/50 p-6 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
         </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">生成準備</h3>
        <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">
          左側の取材内容を入力して「原稿生成開始！」をクリックするか、過去の履歴から原稿を読み込んで再利用してください。
        </p>
        {historyCount > 0 && onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-blue-300 text-xs font-semibold rounded-lg border border-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            保存済みの履歴（{historyCount}件）から読み込む
          </button>
        )}
      </div>
    );
  };

  const renderSources = () => {
    if (isLoading || !sources || sources.length === 0) {
        return null;
    }
    return (
        <div className="mt-12 pt-8 border-t border-gray-800">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Referenced Sources</h4>
            <ul className="space-y-3">
                {sources.map((source, index) => (
                    <li key={index} className="text-xs flex items-start group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2 mt-0.5 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-400 hover:text-blue-300 hover:underline break-all transition-colors"
                          title={source.title}
                      >
                          {source.title || source.uri}
                      </a>
                    </li>
                ))}
            </ul>
        </div>
    );
  };
  
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-gray-800/60 p-6 md:p-8 rounded-2xl shadow-2xl min-h-[600px] lg:min-h-0 lg:h-full flex flex-col">
       <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-gray-800/80">
          <div className="flex items-center space-x-3">
             <h2 className="text-xl font-bold text-white tracking-tight">
                生成結果
             </h2>
             {historyCount > 0 && onOpenHistory && (
               <button
                 onClick={onOpenHistory}
                 className="px-2.5 py-1 text-xs rounded-lg bg-gray-800/80 hover:bg-gray-700 text-blue-300 border border-gray-700 flex items-center gap-1.5 transition-colors"
                 title="履歴一覧を開く"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 履歴 ({historyCount})
               </button>
             )}
          </div>

          <div className="flex items-center gap-2">
            {description && !isLoading && !error && onSaveToHistory && (
              <button
                onClick={handleSaveClick}
                className={`text-xs font-medium py-2 px-3 rounded-lg transition-all border flex items-center gap-1.5 ${
                  isSavedNotice
                    ? 'bg-green-950/80 text-green-300 border-green-800'
                    : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-700'
                }`}
                title="現在の原稿状態を履歴に保存"
              >
                {isSavedNotice ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    保存完了
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    履歴に保存
                  </>
                )}
              </button>
            )}

            {description && !isLoading && !error && (
              <button
                onClick={handleCopy}
                className={`text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
                  isCopied
                    ? 'bg-green-600 text-white cursor-default shadow-lg shadow-green-900/20'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                }`}
                disabled={isCopied}
                aria-live="polite"
              >
                {isCopied ? (
                  <span className="flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                    コピー完了
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    コピー
                  </span>
                )}
              </button>
            )}
          </div>
       </div>

      <div className="w-full flex-grow overflow-y-auto custom-scrollbar pr-2" aria-live="polite">
          {renderStatus()}
          {renderSources()}
      </div>
    </div>
  );
};

export default OutputPanel;