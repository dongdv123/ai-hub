import React from 'react';
import type { MarketAnalysisData } from '../types';
import ResultSection from './ResultSection';

interface MarketAnalysisProps {
  data: MarketAnalysisData;
}

const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ data }) => {
  return (
    <ResultSection 
      title="Giai đoạn 1: Phân tích Thị trường & Định giá"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
      }
    >
      <div className="space-y-4 text-gray-700">
        <div>
          <h4 className="font-semibold text-teal-600">Phân tích Ngách chính</h4>
          <p>{data.nicheAnalysis}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
          <h4 className="font-semibold text-teal-600">Phân tích Định vị Giá</h4>
          <p>
            {data.pricePositioning}
          </p>
        </div>
      </div>
    </ResultSection>
  );
};

export default MarketAnalysis;
