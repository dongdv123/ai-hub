import React from 'react';
import type { AuditData } from '../types';
import ResultSection from './ResultSection';
import InfoTooltip from './InfoTooltip';
import MagnitudeDisplay from './MagnitudeDisplay';

const getBadgeClass = (value: string) => {
  switch (value?.toLowerCase()) {
    case 'cao': return 'bg-green-100 text-green-800 border-green-200';
    case 'trung bình': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'thấp': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const TagAuditBadge: React.FC<{value: string}> = ({ value }) => (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getBadgeClass(value)}`}>
        {value}
    </span>
);

interface AuditAnalysisProps {
  data: AuditData;
}

const AuditAnalysis: React.FC<AuditAnalysisProps> = ({ data }) => {
  return (
    <ResultSection 
      title="Giai đoạn 2: Kiểm toán Title & Tags"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V21c0 .8.7 1.5 1.5 1.5h8c.8 0 1.5-.7 1.5-1.5V6.9c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-teal-600 mb-3">Kiểm toán 13 Tags</h4>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">Tag</th>
                  <th scope="col" className="px-4 py-3 text-center w-48 whitespace-normal">
                    <div className="flex items-center justify-center">
                      KHỐI LƯỢNG (ƯỚC TÍNH)
                      <InfoTooltip text="Ước tính lượng người tìm kiếm từ khóa này hàng tháng. Con số này là do AI ước tính để tham khảo chiến lược." />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center w-48 whitespace-normal">
                     <div className="flex items-center justify-center">
                      CẠNH TRANH (ƯỚC TÍNH)
                      <InfoTooltip text="Ước tính số lượng listing đang cạnh tranh cho từ khóa này trên Etsy. Con số này là do AI ước tính để tham khảo chiến lược." />
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center w-40 whitespace-normal">
                     <div className="flex items-center justify-center">
                      ĐỘ PHÙ HỢP Ý ĐỊNH
                      <InfoTooltip text="Độ liên quan của từ khóa đến sản phẩm và ý định mua hàng của khách. 'Cao' có nghĩa là người tìm kiếm từ khóa này rất có khả năng sẽ mua sản phẩm của bạn." />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.tagsAudit.filter(t => t.tag && t.tag.trim() !== '').map((tagAudit, index) => (
                  <tr key={index} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap align-top">
                      {tagAudit.tag}
                      {tagAudit.reason && (
                        <p className="text-xs text-red-600/80 mt-1.5 font-normal italic max-w-xs whitespace-normal">
                          <span className="font-bold not-italic">(!) Lý do:</span> {tagAudit.reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <MagnitudeDisplay value={tagAudit.volume} magnitude={tagAudit.volumeMagnitude} context="volume" />
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <MagnitudeDisplay value={tagAudit.competition} magnitude={tagAudit.competitionMagnitude} context="competition" />
                    </td>
                    <td className="px-4 py-3 text-center align-middle"><TagAuditBadge value={tagAudit.intentRelevance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-teal-600 mb-3">Kiểm toán Tiêu đề (Title)</h4>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <span className="font-semibold text-gray-500 w-28 shrink-0">Độ dễ đọc:</span>
              <p>{data.titleAudit.readability}</p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-gray-500 w-28 shrink-0">Tối ưu hóa:</span>
              <p>{data.titleAudit.optimization}</p>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-gray-500 w-28 shrink-0">Độ lãng phí:</span>
              <p>{data.titleAudit.waste}</p>
            </div>
          </div>
        </div>
      </div>
    </ResultSection>
  );
};

export default AuditAnalysis;

