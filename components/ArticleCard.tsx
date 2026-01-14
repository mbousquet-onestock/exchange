
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
      className={`group relative flex items-center p-2.5 mb-1.5 bg-white border rounded-lg cursor-pointer transition-all hover:border-[#20B2AA] ${
        isSelected ? 'border-[#20B2AA] shadow-sm' : 'border-gray-200'
      }`}
    >
      <div className="w-[56px] h-[56px] mr-3 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
        <img src={article.imageUrl} alt={article.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-grow">
        <h3 className="text-[14px] font-bold text-gray-800 leading-tight mb-0.5">{article.name}</h3>
        <p className="text-[13px] text-gray-600 font-medium">
          {article.currency}{article.price} | {article.color} | {article.size}
        </p>
        <p className="text-[11px] text-gray-400 tracking-tight font-medium">{article.sku}</p>
      </div>

      <div className="flex items-center gap-3 pr-1">
        <span className="bg-[#E0F7F6] text-[#20B2AA] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
          {article.status}
        </span>
        
        <span className="text-[13px] text-gray-700 font-semibold whitespace-nowrap">
            Qty {article.quantity}
        </span>

        <div 
            className={`w-[18px] h-[18px] border-2 rounded transition-all duration-200 flex items-center justify-center ${
                isSelected ? 'bg-[#20B2AA] border-[#20B2AA]' : 'border-gray-300'
            }`}
        >
            {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
