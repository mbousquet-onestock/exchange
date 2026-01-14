
import React from 'react';
import { Article } from '../types.ts';

interface ArticleCardProps {
  article: Article;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, isSelected, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(article.id)}
      className={`group relative flex items-center p-4 mb-3 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#20B2AA] ${
        isSelected ? 'border-[#20B2AA] shadow-sm' : 'border-gray-200'
      }`}
    >
      <div className="w-16 h-16 mr-4 bg-gray-50 rounded overflow-hidden flex-shrink-0">
        <img src={article.imageUrl} alt={article.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-grow">
        <h3 className="text-[15px] font-semibold text-gray-800">{article.name}</h3>
        <p className="text-sm text-gray-500">
          {article.price} {article.currency} | {article.color} | {article.size}
        </p>
        <p className="text-[12px] font-mono text-gray-400 mt-1">{article.sku}</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="bg-[#E0F7F6] text-[#16A085] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight">
          {article.status}
        </span>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-medium">Qty {article.quantity}</span>
            <div 
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#20B2AA] border-[#20B2AA]' : 'border-gray-300'
                }`}
            >
                {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
