import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types/history';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onSelectHistory: (item: HistoryItem, restoreInputs: boolean) => void;
  onDeleteHistory: (id: string) => void;
  onClearAllHistory: () => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  activeHistoryId: string | null;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  historyList,
  onSelectHistory,
  onDeleteHistory,
  onClearAllHistory,
  onUpdateTitle,
  activeHistoryId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [restoreInputs, setRestoreInputs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered history list
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return historyList;
    const q = searchTerm.toLowerCase();
    return historyList.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.instructionUsed && item.instructionUsed.toLowerCase().includes(q)) ||
      (item.actionLabel && item.actionLabel.toLowerCase().includes(q))
    );
  }, [historyList, searchTerm]);

  // Currently previewed item (defaults to selectedPreviewId or first in list)
  const previewItem = useMemo(() => {
    if (!filteredList.length) return null;
    if (selectedPreviewId) {
      const found = filteredList.find(i => i.id === selectedPreviewId);
      if (found) return found;
    }
    return filteredList[0];
  }, [filteredList, selectedPreviewId]);

  if (!isOpen) return null;

  const handleCopy = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.description).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleStartEditTitle = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(item.id);
    setEditingTitleValue(item.title);
  };

  const handleSaveTitle = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitleValue.trim()) {
      onUpdateTitle(id, editingTitleValue.trim());
    }
    setEditingTitleId(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteHistory(id);
    setDeletingId(null);
    if (selectedPreviewId === id) {
      setSelectedPreviewId(null);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  const handleSelectToReuse = (item: HistoryItem) => {
    onSelectHistory(item, restoreInputs);
    onClose();
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'generate':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'refine':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      case 'senior_voice':
        return 'bg-teal-900/60 text-teal-300 border-teal-700/50';
      case 'ng_replace':
        return 'bg-orange-900/60 text-orange-300 border-orange-700/50';
      case 'format':
        return 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gray-950 border border-gray-800 text-gray-200 rounded-2xl w-full max-w-6xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-900/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                生成結果の履歴
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 font-normal">
                  {historyList.length}件
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                過去の生成結果を選択して、再度指示（微調整・整形・追加）を出して使用できます
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {historyList.length > 0 && !isConfirmingClearAll && (
              <button
                onClick={() => setIsConfirmingClearAll(true)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                履歴をすべて削除
              </button>
            )}

            {isConfirmingClearAll && (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/80 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-red-200">全件削除しますか？</span>
                <button
                  onClick={() => {
                    onClearAllHistory();
                    setIsConfirmingClearAll(false);
                    setSelectedPreviewId(null);
                  }}
                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium transition-colors"
                >
                  削除実行
                </button>
                <button
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/80 transition-colors"
              title="閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body: Split View (List on left, Preview on right) */}
        {historyList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-5 rounded-full bg-gray-900 border border-gray-800 text-gray-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">生成履歴はまだありません</h3>
            <p className="text-sm text-gray-500 max-w-md">
              取材内容を入力して「原稿生成開始！」をクリックすると、生成された原稿が自動的にここに保存されます。
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: History List & Search */}
            <div className="w-full md:w-5/12 lg:w-4/12 border-r border-gray-800/80 flex flex-col bg-gray-950">
              {/* Search Bar */}
              <div className="p-3 border-b border-gray-800/60 bg-gray-900/40">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="履歴を検索（タイトル・本文・指示など）"
                    className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-700/80 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-800/50 p-2 space-y-1">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    検索条件に一致する履歴がありません
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const isSelected = previewItem?.id === item.id;
                    const isActiveInWorkspace = activeHistoryId === item.id;
                    const isDeletingThis = deletingId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPreviewId(item.id)}
                        className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-950/30 border-blue-700/60 shadow-md'
                            : 'bg-gray-900/30 hover:bg-gray-900/70 border-transparent hover:border-gray-800'
                        }`}
                      >
                        {/* Top line: Badges & Date */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${getActionBadgeColor(item.actionType)}`}>
                              {item.actionLabel}
                            </span>
                            {isActiveInWorkspace && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                作業中
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {item.formattedDate}
                          </span>
                        </div>

                        {/* Title (Editable) */}
                        {editingTitleId === item.id ? (
                          <form onSubmit={(e) => handleSaveTitle(item.id, e)} className="my-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                autoFocus
                                className="w-full text-xs bg-gray-900 border border-blue-500 rounded px-2 py-1 text-white focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                                title="保存"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTitleId(null)}
                                className="p-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
                                title="キャンセル"
                              >
                                ✕
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-blue-300 transition-colors">
                              {item.title}
                            </h4>
                            <button
                              onClick={(e) => handleStartEditTitle(item, e)}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-opacity p-0.5"
                              title="タイトルを編集"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Refine instruction preview if any */}
                        {item.instructionUsed && (
                          <p className="text-[11px] text-purple-300/80 bg-purple-950/30 px-2 py-0.5 rounded my-1 line-clamp-1 border border-purple-900/40">
                            指示: {item.instructionUsed}
                          </p>
                        )}

                        {/* Text preview snippet */}
                        <p className="text-xs text-gray-400 line-clamp-2 my-1 leading-relaxed">
                          {item.description.replace(/[#*`|\-]/g, '').trim()}
                        </p>

                        {/* Footer info & Delete Button */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                          <span>{item.charCount.toLocaleString()}文字</span>

                          {/* Delete Action with Confirmation */}
                          {isDeletingThis ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span className="text-red-400 font-medium">削除?</span>
                              <button
                                onClick={(e) => handleConfirmDelete(item.id, e)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-[10px] transition-colors"
                              >
                                はい
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] transition-colors"
                              >
                                いいえ
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleDeleteClick(item.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-950/40 transition-all"
                                title="この履歴を削除"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Detailed Preview & Re-use Actions */}
            <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col bg-gray-950/80 overflow-hidden">
              {previewItem ? (
                <>
                  {/* Action Bar for the Selected Preview */}
                  <div className="p-4 border-b border-gray-800 bg-gray-900/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${getActionBadgeColor(previewItem.actionType)}`}>
                          {previewItem.actionLabel}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {previewItem.formattedDate}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({previewItem.charCount.toLocaleString()}文字)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-1">
                        {previewItem.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopy(previewItem)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
                      >
                        {copiedId === previewItem.id ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            コピー完了
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            テキストコピー
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSelectToReuse(previewItem)}
                        className="px-4 py-2 text-xs md:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 border border-blue-400/40"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        この原稿を復元して再指示・使用
                      </button>
                    </div>
                  </div>

                  {/* Options bar: Restore input checkbox & note */}
                  <div className="px-4 py-2 bg-blue-950/20 border-b border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={restoreInputs}
                        onChange={(e) => setRestoreInputs(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span>取材メモ・設定値（温度感など）も作業領域に復元する</span>
                    </label>

                    {previewItem.instructionUsed && (
                      <span className="text-purple-300 font-mono text-[11px] truncate max-w-xs">
                        適用指示: {previewItem.instructionUsed}
                      </span>
                    )}
                  </div>

                  {/* Preview Text Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6 text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                      {previewItem.description}
                    </div>

                    {/* Associated input transcript if any */}
                    {previewItem.interviewLog && (
                      <details className="mt-4 border border-gray-800/70 rounded-xl bg-gray-900/40 p-4 text-xs">
                        <summary className="font-semibold text-gray-400 cursor-pointer hover:text-gray-200 flex items-center justify-between">
                          <span>保存時の取材内容・メモ（クリックで展開）</span>
                          <span className="text-[10px] text-gray-500">{previewItem.interviewLog.length}文字</span>
                        </summary>
                        <div className="mt-3 pt-3 border-t border-gray-800 text-gray-400 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                          {previewItem.interviewLog}
                        </div>
                      </details>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-gray-500 text-sm">
                  左のリストから履歴を選択してください
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
