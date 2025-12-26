import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateImage } from './services/runwareService';
import { refinePrompt, generateSEOMetadata } from '../seo-assistant/services/geminiService';
import Loader from '../seo-assistant/components/Loader';
import ImageMasker from './components/ImageMasker';
import { useAppContext } from '../seo-assistant/context/AppContext';

const ImageTab: React.FC = () => {
  const { currentTitle, currentTags, setCurrentTitle, setCurrentTags } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Product / Studio');
  const [aspectRatio, setAspectRatio] = useState('Square (1:1)');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [seedImage, setSeedImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [maskPosition, setMaskPosition] = useState<string | null>(null);
  const [maskSize, setMaskSize] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [selectedModel, setSelectedModel] = useState(import.meta.env.VITE_RUNWARE_MODEL || 'runware:100@1');
  const [numberResults, setNumberResults] = useState(1);
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);

  const defaultModels = [
    { id: 'runware:100@1', name: 'Flux.1 Schnell (Fast)' },
    { id: 'runware:101@1', name: 'Flux.1 Dev (Quality)' },
    { id: 'runware:103@1', name: 'Flux.1 Pro (Premium)' },
    { id: 'prunaai:1@1', name: 'Pruna AI (Optimized)' },
    { id: 'google:gemini-2.0-flash', name: 'Gemini 2.0 Flash (Bộ não)' },
  ];
  const [models, setModels] = useState(defaultModels);
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);
  const [customModelId, setCustomModelId] = useState('');

  React.useEffect(() => {
    const savedModels = localStorage.getItem('custom_image_models');
    if (savedModels) {
      try {
        const parsed = JSON.parse(savedModels);
        setModels([...defaultModels, ...parsed]);
      } catch (e) {
        console.error('Failed to parse custom models', e);
      }
    }
  }, []);

  const handleSaveCustomModel = () => {
    if (!customModelId.trim()) return;
    
    const newModel = {
      id: customModelId.trim(),
      name: `Custom: ${customModelId.trim()}`
    };

    // Avoid duplicates
    if (models.some(m => m.id === newModel.id)) {
        alert('Model ID này đã tồn tại!');
        return;
    }

    const updatedModels = [...models, newModel];
    setModels(updatedModels);
    
    // Save only custom models to localStorage
    const customModels = updatedModels.filter(m => !defaultModels.find(dm => dm.id === m.id));
    localStorage.setItem('custom_image_models', JSON.stringify(customModels));
    
    setSelectedModel(newModel.id);
    setCustomModelId('');
    setShowCustomModelInput(false);
  };

  const handleDeleteCustomModel = () => {
    if (!selectedModel) return;
    
    // Check if it's a default model
    if (defaultModels.some(dm => dm.id === selectedModel)) {
        return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa model này?')) return;

    const updatedModels = models.filter(m => m.id !== selectedModel);
    setModels(updatedModels);

    // Update local storage
    const customModels = updatedModels.filter(m => !defaultModels.find(dm => dm.id === m.id));
    localStorage.setItem('custom_image_models', JSON.stringify(customModels));

    // Reset selection to first default model
    setSelectedModel(defaultModels[0].id);
  };

  const handleCopyImage = async (imgUrl: string, index: number) => {
    try {
      setCopyingIndex(index);
      
      // Fetch the image
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      
      // Most browsers only support copying PNG to clipboard
      // We'll use a canvas to convert the image to PNG if it's not already
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(img, 0, 0);
      
      const pngBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!pngBlob) throw new Error("Could not create PNG blob");
      
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
      
      setTimeout(() => setCopyingIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      setCopyingIndex(null);
      alert("Không thể copy ảnh trực tiếp. Thử lại hoặc chuột phải vào ảnh chọn 'Copy Image'.");
    }
  };

  const handleDownloadImage = async (imgUrl: string, index: number) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etsy-image-${Date.now()}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
      // Fallback: open in new tab
      window.open(imgUrl, '_blank');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        setError("Vui lòng nhập mô tả ảnh.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // Supported dimensions by Runware FLUX models
      const supportedDimensions = [
        { w: 1024, h: 1024, ratio: 1 },
        { w: 1184, h: 896, ratio: 1184/896 },
        { w: 1248, h: 832, ratio: 1248/832 },
        { w: 1376, h: 768, ratio: 1376/768 },
        { w: 896, h: 1184, ratio: 896/1184 },
        { w: 832, h: 1248, ratio: 832/1248 },
        { w: 768, h: 1376, ratio: 768/1376 }
      ];

      let width = 1024;
      let height = 1024;

      if (seedImage && imageDimensions) {
        // Find closest supported dimensions based on uploaded image aspect ratio
        const targetRatio = imageDimensions.width / imageDimensions.height;
        const closest = supportedDimensions.reduce((prev, curr) => {
          return Math.abs(curr.ratio - targetRatio) < Math.abs(prev.ratio - targetRatio) ? curr : prev;
        });
        width = closest.w;
        height = closest.h;
      } else {
        // Map UI selection to exact supported dimensions
        switch (aspectRatio) {
          case 'Square (1:1)': width = 1024; height = 1024; break;
          case 'Landscape (4:3)': width = 1184; height = 896; break;
          case 'Landscape (3:2)': width = 1248; height = 832; break;
          case 'Landscape (16:9)': width = 1376; height = 768; break;
          case 'Portrait (3:4)': width = 896; height = 1184; break;
          case 'Portrait (2:3)': width = 832; height = 1248; break;
          case 'Portrait (9:16)': width = 768; height = 1376; break;
          default: width = 1024; height = 1024;
        }
      }

      let finalPrompt = prompt;
      
      // If Gemini is selected as the "brain", we use it to refine the prompt first
      if (selectedModel.startsWith('google:')) {
          const refined = await refinePrompt(prompt, style, maskPosition || undefined, maskSize || undefined);
          finalPrompt = refined;
          // Prompt (Mô tả) chỉ để người dùng nhập, không tự động cập nhật vào UI
      }

      // Add position and size info to prompt if using mask
      if (maskImage && maskPosition) {
          const posMap: Record<string, string> = {
              'top far left': 'ở góc trên cùng bên trái',
              'top left': 'ở phía trên bên trái',
              'top center': 'ở phía trên chính giữa',
              'top right': 'ở phía trên bên phải',
              'top far right': 'ở góc trên cùng bên phải',
              
              'upper-middle far left': 'ở giữa phía trên bên trái',
              'upper-middle left': 'ở vùng trên bên trái',
              'upper-middle center': 'ở giữa phía trên',
              'upper-middle right': 'ở vùng trên bên phải',
              'upper-middle far right': 'ở giữa phía trên bên phải',

              'middle far left': 'ở chính giữa bên trái',
              'middle left': 'ở vùng bên trái',
              'center': 'ở chính giữa trung tâm',
              'middle right': 'ở vùng bên phải',
              'middle far right': 'ở chính giữa bên phải',

              'lower-middle far left': 'ở giữa phía dưới bên trái',
              'lower-middle left': 'ở vùng dưới bên trái',
              'lower-middle center': 'ở giữa phía dưới',
              'lower-middle right': 'ở vùng dưới bên phải',
              'lower-middle far right': 'ở giữa phía dưới bên phải',

              'bottom far left': 'ở góc dưới cùng bên trái',
              'bottom left': 'ở phía dưới bên trái',
              'bottom center': 'ở phía dưới chính giữa',
              'bottom right': 'ở phía dưới bên phải',
              'bottom far right': 'ở góc dưới cùng bên phải'
          };
          const sizeMap: Record<string, string> = {
              'tiny-sized': 'kích thước rất nhỏ',
              'small-sized': 'kích thước nhỏ',
              'medium-sized': 'kích thước vừa',
              'large-sized': 'kích thước lớn',
              'extra-large-sized': 'kích thước rất lớn'
          };
          
          const posText = posMap[maskPosition] || `tại vị trí ${maskPosition}`;
          const sizeText = sizeMap[maskSize || ''] || '';
          
          // English mapping for prompt injection (5x5 grid)
          const posMapEn: Record<string, string> = {
              'top far left': 'in the far top-left corner',
              'top left': 'in the top-left area',
              'top center': 'in the top-center area',
              'top right': 'in the top-right area',
              'top far right': 'in the far top-right corner',

              'upper-middle far left': 'in the upper-middle far-left area',
              'upper-middle left': 'in the upper-left area',
              'upper-middle center': 'in the upper-center area',
              'upper-middle right': 'in the upper-right area',
              'upper-middle far right': 'in the upper-middle far-right area',

              'middle far left': 'in the middle far-left area',
              'middle left': 'in the middle-left area',
              'center': 'in the exact center',
              'middle right': 'in the middle-right area',
              'middle far right': 'in the middle far-right area',

              'lower-middle far left': 'in the lower-middle far-left area',
              'lower-middle left': 'in the lower-left area',
              'lower-middle center': 'in the lower-center area',
              'lower-middle right': 'in the lower-right area',
              'lower-middle far right': 'in the lower-middle far-right area',

              'bottom far left': 'in the far bottom-left corner',
              'bottom left': 'in the bottom-left area',
              'bottom center': 'in the bottom-center area',
              'bottom right': 'in the bottom-right area',
              'bottom far right': 'in the far bottom-right corner'
          };
          const sizeMapEn: Record<string, string> = {
              'tiny-sized': 'tiny size',
              'small-sized': 'small size',
              'medium-sized': 'medium size',
              'large-sized': 'large size',
              'extra-large-sized': 'extra large size'
          };

          const posTextEn = posMapEn[maskPosition] || `at ${maskPosition}`;
          const sizeTextEn = sizeMapEn[maskSize || ''] || '';

          // Only append if not already in prompt (simple check)
          if (!finalPrompt.includes(posTextEn)) {
              finalPrompt = `${finalPrompt}, ${posTextEn}, ${sizeTextEn}, realistic, matching lighting and style.`;
          }
      }

      const results = await generateImage(
        finalPrompt, 
        style, 
        width, 
        height, 
        seedImage || undefined, 
        maskImage || undefined, 
        selectedModel.startsWith('google:') ? 'runware:100@1' : selectedModel,
        numberResults
      );

      if (results && results.length > 0) {
        setGeneratedImages(results.map(img => img.imageURL));

        // Auto-generate Title & Tags if missing
        if (!currentTitle && (!currentTags || currentTags.length === 0)) {
             try {
                 const metadata = await generateSEOMetadata(finalPrompt);
                 if (metadata.title) setCurrentTitle(metadata.title);
                 if (metadata.tags && metadata.tags.length > 0) setCurrentTags(metadata.tags);
             } catch (metaErr) {
                 console.error("Failed to auto-generate SEO metadata", metaErr);
             }
        }
      } else {
        setError("Không tạo được ảnh. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo ảnh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestFromSEO = () => {
    if (!currentTitle && (!currentTags || currentTags.length === 0)) {
        setError("Chưa có thông tin từ tab SEO. Vui lòng nhập Title hoặc Tags bên tab SEO trước.");
        return;
    }
    const seoPrompt = `Product photo of ${currentTitle}. Tags: ${currentTags.join(', ')}. Professional studio lighting, high resolution.`;
    setPrompt(seoPrompt);
    setError(null);
  };

  const handleGenerateSEO = async () => {
    if (!prompt.trim() && !seedImage) {
        setError("Vui lòng nhập Prompt hoặc tải ảnh lên trước khi tạo SEO.");
        return;
    }
    setIsLoading(true);
    try {
        const metadata = await generateSEOMetadata(prompt, seedImage || undefined);
        if (metadata.title) setCurrentTitle(metadata.title);
        if (metadata.tags && metadata.tags.length > 0) setCurrentTags(metadata.tags);
        setError(null);
    } catch (err) {
        console.error(err);
        setError("Không thể tạo SEO từ Image/Prompt.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Tạo ảnh với AI</h2>
          <p className="text-gray-600 mt-2">
            Nhập mô tả, hoặc tải ảnh lên để chỉnh sửa (Inpainting/Img2Img).
          </p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSuggestFromSEO}
                className="text-teal-600 border-teal-600 hover:bg-teal-50"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Lấy Prompt từ SEO
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateSEO}
                disabled={isLoading || (!prompt.trim() && !seedImage)}
                className="text-amber-600 border-amber-600 hover:bg-amber-50"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Tạo SEO từ Image
            </Button>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt (Mô tả)</label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              placeholder={seedImage ? "Mô tả phần bạn muốn thay đổi hoặc toàn bộ ảnh..." : "Ví dụ: product photo of a handmade wooden watch..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
             <ImageMasker 
                onImageChange={(img) => {
                    setSeedImage(img);
                    if (!img) setImageDimensions(null);
                }} 
                onMaskChange={setMaskImage} 
                onDimensionsChange={(w, h) => setImageDimensions({width: w, height: h})}
                onAnalyzeRegion={(analyzedPrompt, pos, size) => {
                    setPrompt(analyzedPrompt);
                    if (pos) setMaskPosition(pos);
                    if (size) setMaskSize(size);
                }}
                onPositionChange={(pos, size) => {
                    setMaskPosition(pos);
                    setMaskSize(size);
                }}
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Model (Bộ não)</label>
            <div className="flex gap-2">
                <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                value={selectedModel}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom_new') {
                        setShowCustomModelInput(true);
                    } else {
                        setSelectedModel(val);
                        setShowCustomModelInput(false);
                    }
                }}
                disabled={isLoading}
                >
                {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value="custom_new" className="font-bold text-teal-600">+ Thêm Model Khác...</option>
                </select>

                {/* Show delete button if selected model is custom */}
                {!defaultModels.some(dm => dm.id === selectedModel) && selectedModel !== 'custom_new' && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteCustomModel}
                        title="Xóa Model này"
                        className="flex-shrink-0 px-3 bg-red-500 hover:bg-red-600 text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </Button>
                )}
            </div>
            
            {showCustomModelInput && (
                <div className="mt-2 flex gap-2 animate-fade-in">
                    <input 
                        type="text" 
                        placeholder="Nhập Model ID (VD: runware:100@1)" 
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={customModelId}
                        onChange={(e) => setCustomModelId(e.target.value)}
                    />
                    <Button 
                        size="sm"
                        onClick={handleSaveCustomModel}
                        disabled={!customModelId.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        Lưu
                    </Button>
                     <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCustomModelInput(false)}
                        className="text-gray-500"
                    >
                        Hủy
                    </Button>
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng ảnh tạo</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
              value={numberResults}
              onChange={(e) => setNumberResults(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={1}>1 ảnh</option>
              <option value={2}>2 ảnh</option>
              <option value={3}>3 ảnh</option>
              <option value={4}>4 ảnh</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phong cách</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={isLoading}
              >
                <option>Product / Studio</option>
                <option>Minimal</option>
                <option>Lifestyle</option>
                <option>Vintage</option>
                <option>Festive</option>
                <option>Cinematic</option>
                <option>None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isLoading}
              >
                <option>Square (1:1)</option>
                <option>Landscape (4:3)</option>
                <option>Landscape (3:2)</option>
                <option>Landscape (16:9)</option>
                <option>Portrait (3:4)</option>
                <option>Portrait (2:3)</option>
                <option>Portrait (9:16)</option>
              </select>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !prompt.trim()} 
            className="w-full py-6 text-base bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? "Đang xử lý..." : (seedImage ? "Tạo lại / Chỉnh sửa" : "Tạo Ảnh")}
          </Button>
          
          <p className="text-xs text-gray-500">
            Mỗi lần tạo mất khoảng 2-5 giây.
          </p>
        </div>

        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col p-6 min-h-[400px] relative overflow-hidden">
          {/* SEO Info Display */}
          {(currentTitle || (currentTags && currentTags.length > 0)) && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-teal-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
              {currentTitle && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Gợi ý Title</label>
                    <button 
                        onClick={() => navigator.clipboard.writeText(currentTitle)}
                        className="text-gray-400 hover:text-teal-600 transition-colors"
                        title="Copy Title"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{currentTitle}</p>
                </div>
              )}
              {currentTags && currentTags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Gợi ý 13 Tags</label>
                    <button 
                        onClick={() => navigator.clipboard.writeText(currentTags.join(', '))}
                        className="text-gray-400 hover:text-teal-600 transition-colors"
                        title="Copy Tags"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {currentTags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-medium rounded-md border border-teal-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center">
                  <Loader progressMessage="Đang kết nối Runware AI..." />
               </div>
            ) : generatedImages.length > 0 ? (
              <div className={`w-full h-full overflow-y-auto grid gap-4 p-2 ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {generatedImages.map((imgUrl, index) => (
                      <div key={index} className="relative group">
                          <img 
                              src={imgUrl} 
                              alt={`Generated ${index + 1}`} 
                              className="w-full h-auto object-contain rounded-lg shadow-sm bg-white"
                          />
                          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <button
                                onClick={() => handleCopyImage(imgUrl, index)}
                                className="bg-white/90 hover:bg-white text-gray-700 hover:text-teal-600 p-1.5 rounded-md shadow-sm backdrop-blur-sm transition-colors border border-gray-200"
                                title="Copy ảnh vào clipboard"
                             >
                                {copyingIndex === index ? (
                                   <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                )}
                             </button>
                             <button
                                onClick={() => handleDownloadImage(imgUrl, index)}
                                className="bg-white/90 hover:bg-white text-gray-700 hover:text-teal-600 p-1.5 rounded-md shadow-sm backdrop-blur-sm transition-colors border border-gray-200"
                                title="Tải ảnh về máy"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             </button>
                             <a 
                                href={imgUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white/90 hover:bg-white text-gray-700 hover:text-teal-600 p-1.5 rounded-md shadow-sm backdrop-blur-sm transition-colors border border-gray-200"
                                title="Mở ảnh gốc"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                             </a>
                          </div>
                      </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                  <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-3 text-teal-500"
                  >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-5-5L5 21"></path>
                  </svg>
                  <p className="font-semibold text-gray-700">Xem trước ảnh sẽ hiển thị ở đây</p>
                  <p className="text-sm text-gray-500 mt-1">Nhập prompt và nhấn nút Tạo Ảnh để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTab;
