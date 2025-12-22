import React from 'react';
import type { OptimizationStrategyData, OptimizationPackage, TagAuditData, UserInput } from '../types';
import ResultSection from './ResultSection';
import MagnitudeDisplay from './MagnitudeDisplay';

interface OptimizationStrategyProps {
  data: OptimizationStrategyData;
  userInput: UserInput;
}

const getBadgeClass = (value: string) => {
  switch (value?.toLowerCase()) {
    case 'cao': return 'bg-green-100 text-green-800 border-green-200';
    case 'trung bình': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'thấp': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const RelevanceBadge: React.FC<{value: string}> = ({ value }) => (
    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${getBadgeClass(value)}`}>
        {value}
    </span>
);


const CopyButton: React.FC<{ textToCopy: string; className?: string }> = ({ textToCopy, className = '' }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <button onClick={handleCopy} className={`flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-800 transition-all ${className}`}>
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
        </button>
    );
};

const CopyAllTagsButton: React.FC<{ tags: string[] }> = ({ tags }) => {
    const [copied, setCopied] = React.useState(false);
    const textToCopy = tags.join(', ');

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="w-full mt-2 flex justify-center items-center gap-2 py-2 px-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all"
        >
            {copied ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Đã sao chép {tags.length} Tags!</span>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Sao chép tất cả {tags.length} Tags</span>
                </>
            )}
        </button>
    );
};


const SuggestedTag: React.FC<{ tagData: TagAuditData }> = ({ tagData }) => (
    <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
        <div className="flex items-center gap-2">
            <CopyButton textToCopy={tagData.tag} className="p-1" />
            <span className="text-gray-800 text-sm font-medium" title={tagData.tag}>{tagData.tag}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-1.5 pt-1.5 border-t border-gray-200">
            <div className="text-xs text-center">
                <MagnitudeDisplay value={tagData.volume} magnitude={tagData.volumeMagnitude} context="volume" />
                <span className="block text-[10px] text-gray-400 mt-0.5">Lượng tìm kiếm</span>
            </div>
            <div className="text-xs text-center">
                <MagnitudeDisplay value={tagData.competition} magnitude={tagData.competitionMagnitude} context="competition" />
                <span className="block text-[10px] text-gray-400 mt-0.5">Cạnh tranh</span>
            </div>
            <div className="text-xs text-center">
               <RelevanceBadge value={tagData.intentRelevance} />
               <span className="block text-[10px] text-gray-400 mt-1">Phù hợp</span>
            </div>
        </div>
    </div>
);


const PackageCard: React.FC<{ pkg: OptimizationPackage }> = ({ pkg }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col shadow-sm">
        <h5 className="text-lg font-bold text-teal-600 mb-2">{pkg.strategyName}</h5>
        <p className="text-sm text-gray-600 mb-4 italic flex-grow">{pkg.rationale}</p>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-4">
            <div className="flex items-start gap-3 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 shrink-0 mt-0.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>
                <div>
                    <h6 className="text-sm font-semibold text-indigo-800">Phù hợp với Shop</h6>
                    <p className="text-xs text-indigo-700">{pkg.sellerProfileAndAds.sellerProfile}</p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 shrink-0 mt-0.5"><path d="m9 9 6 6m-6 0 6-6"/><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.7.9 6.4 2.3L21 12Z"/></svg>
                <div>
                    <h6 className="text-sm font-semibold text-indigo-800">Chiến lược Ads Đề xuất</h6>
                    <p className="text-xs text-indigo-700">{pkg.sellerProfileAndAds.adsStrategy}</p>
                </div>
            </div>
        </div>
        
        <div className="space-y-3">
            <div>
                <h6 className="text-sm font-semibold text-gray-500 mb-1">Tiêu đề mới (Tiếng Anh)</h6>
                <div className="relative">
                    <p className="bg-gray-100 p-2 rounded-md text-sm text-gray-800 pr-10 border border-gray-200">{pkg.newTitle}</p>
                    <CopyButton textToCopy={pkg.newTitle} className="absolute top-2 right-2 p-1.5" />
                </div>
            </div>

            {pkg.bulletPoints && pkg.bulletPoints.length > 0 && (
                <div>
                    <h6 className="text-sm font-semibold text-gray-500 mb-1">Mô tả ngắn (Bullet Points)</h6>
                    <div className="relative">
                        <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-800 pr-10 border border-gray-200">
                            <ul className="space-y-1.5 list-disc list-inside">
                                {pkg.bulletPoints.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </div>
                        <CopyButton textToCopy={pkg.bulletPoints.join('\n')} className="absolute top-2 right-2 p-1.5" />
                    </div>
                </div>
            )}

            <div>
                <h6 className="text-sm font-semibold text-gray-500 mb-1">13 Tags mới & Phân tích</h6>
                 <div>
                    <div className="space-y-2 bg-white p-2 rounded-md border border-gray-200">
                        {pkg.newTags.map((tagData, i) => (
                           <SuggestedTag key={`${tagData.tag}-${i}`} tagData={tagData} />
                        ))}
                    </div>
                    <CopyAllTagsButton tags={pkg.newTags.map(t => t.tag)} />
                    <div className="mt-2">
                        <p className="text-xs text-gray-500">Hoặc sao chép thủ công:</p>
                        <div className="mt-1 p-2 bg-gray-100 rounded-md text-xs text-gray-700 break-words select-all font-mono">
                            {pkg.newTags.map(t => t.tag).join(', ')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);


const OptimizationStrategy: React.FC<OptimizationStrategyProps> = ({ data }) => {
  return (
    <ResultSection 
      title="Giai đoạn 3: Chiến lược Tối ưu 360°"
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.33-.04-3.08.73-.77 2.24-.78 3.08-.04 1.26 1.5 5 2 5 2s-.5-3.74-2-5c-.84-.71-2.33-.7-3.08.04-.77-.73-.78-2.24-.04-3.08 1.5-1.26 2-5 2-5s-3.74.5-5 2c-.71.84-.7 2.33.04 3.08-.73.77-2.24-.78-3.08.04-1.26-1.5-5-2-5-2s.5 3.74 2 5c.84.71 2.33.7 3.08-.04.77.73.78 2.24.04 3.08z"/></svg>
      }
    >
      <div className="space-y-8">
        <div>
          <h4 className="text-xl font-semibold text-teal-600 mb-4">Phần A: Gói Tối ưu Title + Tags</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.packages.map((pkg, i) => (
                <PackageCard 
                    key={`${pkg.strategyName}-${i}`} 
                    pkg={pkg} 
                />
              ))}
          </div>
        </div>

        {data.relatedKeywords && data.relatedKeywords.length > 0 && (
            <div>
                <h4 className="text-xl font-semibold text-teal-600 mb-4">Phần B: Gợi ý 20 Tags liên quan đến chủ thể</h4>
                <p className="text-sm text-gray-600 mb-3">Sử dụng các tags này để mở rộng phạm vi tiếp cận hoặc thay thế cho các tags không hiệu quả trong gói chiến lược đã chọn.</p>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {data.relatedKeywords.map((tag, index) => (
                            <SuggestedTag key={`related-${index}`} tagData={tag} />
                        ))}
                    </div>
                    <CopyAllTagsButton tags={data.relatedKeywords.map(t => t.tag)} />
                     <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500">Hoặc sao chép thủ công:</p>
                        <div className="mt-1 p-2 bg-gray-100 rounded-md text-xs text-gray-700 break-words select-all font-mono max-h-24 overflow-y-auto text-left">
                            {data.relatedKeywords.map(t => t.tag).join(', ')}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-teal-600 mb-4">Phần C: Khuyến nghị Thuộc tính</h4>
              <p className="text-sm text-gray-600 mb-3">Hãy đảm bảo bạn đã điền các thuộc tính quan trọng này trong listing Etsy của bạn:</p>
              <div className="flex flex-wrap gap-2">
                {data.attributeRecommendations.map((attr, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-md border border-blue-200">{attr}</span>
                ))}
              </div>
            </div>

            {data.imageCritique && (
              <div>
                <h4 className="text-xl font-semibold text-teal-600 mb-4">Phần D: Phê bình Hình ảnh</h4>
                <p className="text-gray-700 bg-gray-100 p-4 rounded-md border border-gray-200">{data.imageCritique}</p>
              </div>
            )}
        </div>
      </div>
    </ResultSection>
  );
};

export default OptimizationStrategy;

