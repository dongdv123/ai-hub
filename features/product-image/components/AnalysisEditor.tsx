import React from 'react';
import { ProductAnalysis, EtsySeoResult, EditableImagePlan } from '../services/geminiService';
import Spinner from './Spinner';
import EtsySeoDisplay from './EtsySeoDisplay';
import WarningIcon from './icons/WarningIcon';
import Tooltip from './Tooltip';
import QuestionMarkIcon from './icons/QuestionMarkIcon';

interface AnalysisEditorProps {
  analysis: ProductAnalysis;
  etsySeo: EtsySeoResult;
  previewUrls: string[];
  imagePlan: EditableImagePlan[];
  prompts: string[];
  onAnalysisChange: (newAnalysis: ProductAnalysis) => void;
  onSeoChange: (newSeo: EtsySeoResult) => void;
  onPromptsChange: (newPrompts: string[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
  generationStatus: string | null;
  error: string | null;
}

const AnalysisEditor: React.FC<AnalysisEditorProps> = ({ 
    analysis,
    etsySeo, 
    previewUrls,
    imagePlan,
    prompts,
    onAnalysisChange,
    onSeoChange,
    onPromptsChange,
    onGenerate, 
    onBack, 
    isGenerating,
    generationStatus,
    error
}) => {

  const handleDimensionChange = (index: number, value: string) => {
    const newDimensions = [...analysis.dimensions];
    newDimensions[index] = { ...newDimensions[index], value };
    onAnalysisChange({ ...analysis, dimensions: newDimensions });
  };

  const handleMaterialChange = (index: number, description: string) => {
    const newMaterials = [...analysis.materials];
    newMaterials[index] = { ...newMaterials[index], description };
    onAnalysisChange({ ...analysis, materials: newMaterials });
  };

  const handlePromptChange = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    onPromptsChange(newPrompts);
  }

  const renderGenerateButtonContent = () => {
    if (isGenerating) {
        return (
            <>
                <Spinner className="h-6 w-6" />
                <span className="ml-3 animate-pulse">{generationStatus || 'Đang tạo hình ảnh...'}</span>
            </>
        );
    }
    return 'Bước 3: Tạo ảnh sản phẩm';
  }

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div>
        <button 
          onClick={onBack} 
          className="text-teal-600 hover:text-teal-500 transition-colors text-sm mb-4"
          disabled={isGenerating}
        >
          &larr; Bắt đầu lại với hình ảnh mới
        </button>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Bước 2: Phân tích &amp; Tinh chỉnh</h2>
        
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-lg mt-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <WarningIcon className="h-6 w-6 text-teal-500" />
                </div>
                <div className="ml-3">
                    <h3 className="text-lg font-bold text-teal-800">Đánh giá của bạn rất quan trọng!</h3>
                    <div className="mt-2 text-sm text-teal-700">
                        <p>Kiểm tra kỹ và tinh chỉnh các chi tiết sản phẩm, kế hoạch hình ảnh và nội dung SEO bên dưới. Các chỉnh sửa của bạn ảnh hưởng trực tiếp đến chất lượng của kết quả cuối cùng.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
            {previewUrls.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-teal-600 mb-4">Hình ảnh gốc ({previewUrls.length})</h3>
                    <div className="grid grid-cols-3 gap-4">
                         {previewUrls.map((url, index) => (
                            <div key={index} className="bg-gray-100 border border-gray-300 rounded-lg shadow-inner p-3 flex items-center justify-center aspect-square overflow-hidden">
                                <img 
                                    src={url} 
                                    alt={`Hình ảnh sản phẩm gốc ${index + 1}`} 
                                    className="max-w-full max-h-full object-contain" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-teal-600 mb-2">Phác thảo hình học</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{analysis.sketch || "Không có mô tả phác thảo."}</p>
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-teal-600">Điều chỉnh kích thước (cm)</h3>
                    <Tooltip content="Kích thước chính xác giúp AI hiểu được quy mô của sản phẩm, dẫn đến những bức ảnh chân thực hơn. Đảm bảo các đơn vị nhất quán (cm).">
                        <QuestionMarkIcon className="h-5 w-5 text-gray-400 cursor-help" />
                    </Tooltip>
                </div>
                {analysis.dimensions?.length > 0 ? (
                    <div className="space-y-4">
                        {analysis.dimensions.map((dim, index) => (
                            <div key={dim.label}>
                                <label htmlFor={`dim-${dim.label}`} className="block text-sm font-medium text-gray-700 mb-1">{dim.label.toUpperCase()} - {dim.description}</label>
                                <input
                                    id={`dim-${dim.label}`}
                                    type="text"
                                    value={dim.value}
                                    onChange={(e) => handleDimensionChange(index, e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                    disabled={isGenerating}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">AI không thể xác định bất kỳ kích thước nào.</p>
                )}
            </div>

            <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-teal-600">Điều chỉnh vật liệu</h3>
                     <Tooltip content="Mô tả vật liệu chính xác (ví dụ: 'thép chải', 'nhựa mờ', 'thủy tinh trong suốt') là rất quan trọng để hiển thị kết cấu và phản chiếu chân thực.">
                        <QuestionMarkIcon className="h-5 w-5 text-gray-400 cursor-help" />
                    </Tooltip>
                </div>
                {analysis.materials?.length > 0 ? (
                    <div className="space-y-4">
                        {analysis.materials.map((mat, index) => (
                            <div key={mat.label}>
                                <label htmlFor={`mat-${mat.label}`} className="block text-sm font-medium text-gray-700 mb-1">{mat.label} - {mat.location}</label>
                                <input
                                    id={`mat-${mat.label}`}
                                    type="text"
                                    value={mat.description}
                                    onChange={(e) => handleMaterialChange(index, e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                                    disabled={isGenerating}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">AI không thể xác định bất kỳ vật liệu nào.</p>
                )}
            </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <details className="group">
          <summary className="list-none flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-teal-600">Nâng cao: Chỉnh sửa Prompt hình ảnh</h3>
              <Tooltip content="Người dùng nâng cao có thể chỉnh sửa trực tiếp các prompt được sử dụng để tạo hình ảnh. Các thay đổi ở đây giúp bạn kiểm soát hoàn toàn kết quả cuối cùng.">
                  <QuestionMarkIcon className="h-5 w-5 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <span className="text-sm text-gray-500 group-open:hidden">Nhấp để mở rộng</span>
            <span className="text-sm text-gray-500 hidden group-open:inline">Nhấp để thu gọn</span>
          </summary>
          <div className="mt-4 space-y-4">
            {prompts.map((prompt, index) => (
              <div key={index}>
                <label htmlFor={`prompt-${index}`} className="block text-sm font-medium text-gray-700 mb-1">{imagePlan[index]?.label || `Prompt ${index + 1}`}</label>
                <textarea
                  id={`prompt-${index}`}
                  value={prompt}
                  onChange={(e) => handlePromptChange(index, e.target.value)}
                  rows={8}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition font-mono text-xs"
                  disabled={isGenerating}
                />
              </div>
            ))}
          </div>
        </details>
      </div>

       <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-teal-600">ReSEO Etsy Tiêu đề/Thẻ</h3>
                 <Tooltip content="Xem xét và tinh chỉnh các gợi ý này. Sử dụng các từ khóa mạnh mẽ mà người mua sẽ tìm kiếm. Đảm bảo tiêu đề hấp dẫn và các thẻ bao gồm tất cả các khía cạnh liên quan của sản phẩm.">
                    <QuestionMarkIcon className="h-5 w-5 text-gray-400 cursor-help" />
                </Tooltip>
            </div>
             <div className="bg-amber-100 border-l-4 border-amber-400 p-3 rounded-r-lg text-sm text-amber-800 mb-4">
                <strong>Tuyên bố từ chối trách nhiệm:</strong> Nội dung ReSEO này là một gợi ý AI cơ bản. Vui lòng xem xét và điều chỉnh nó để phù hợp nhất với sản phẩm và đối tượng của bạn.
             </div>
            <p className="text-sm text-gray-500 mb-4">Đây là nội dung SEO đã được tạo của bạn. Hãy xem xét và chỉnh sửa tiêu đề cũng như thẻ để khớp hoàn hảo với sản phẩm và đối tượng mục tiêu của bạn.</p>
            <EtsySeoDisplay data={etsySeo} onSeoChange={onSeoChange} disabled={isGenerating} />
        </div>

      {error && (
        <div className="mt-6 text-red-800 bg-red-100 p-4 rounded-lg border border-red-300">
            <h4 className="font-bold text-red-900 mb-2">Đã xảy ra lỗi trong quá trình tạo hình ảnh</h4>
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{error}</pre>
        </div>
      )}

      <div className="text-center pt-4">
        <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-10 py-4 bg-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center mx-auto min-w-[280px]"
        >
          {renderGenerateButtonContent()}
        </button>
      </div>
    </div>
  );
};

export default AnalysisEditor;