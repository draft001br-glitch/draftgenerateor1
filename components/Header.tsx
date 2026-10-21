import React from 'react';

interface HeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onSaveCurrentDraft?: () => void;
  canSaveCurrentDraft?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onSaveCurrentDraft,
  canSaveCurrentDraft = false,
}) => {
  return (
    <header className="bg-black/80 backdrop-blur-md border-b border-gray-800/80 sticky top-0 z-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ｒｅ就活原稿
            </h1>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
              AI生成＆履歴管理
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-400 mt-0.5">
            取材内容からプロフェッショナルな求人原稿を生成・微調整
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canSaveCurrentDraft && onSaveCurrentDraft && (
            <button
              onClick={onSaveCurrentDraft}
              className="px-3 py-2 text-xs md:text-sm font-medium text-gray-300 hover:text-white bg-gray-900/90 hover:bg-gray-800 border border-gray-700/80 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="現在の作業内容を履歴に保存"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>この原稿を保存</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="relative px-3.5 py-2 text-xs md:text-sm font-semibold text-white bg-gray-800/90 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:border-gray-600 group"
            title="生成結果の履歴を表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>生成履歴</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
              historyCount > 0 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {historyCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;