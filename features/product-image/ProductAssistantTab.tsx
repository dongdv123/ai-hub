import React, { useState, useCallback, useEffect } from 'react';
import { 
  analyzeProductAndGenerateSeo, 
  generateFinalImages, 
  ProductAnalysis, 
  EtsySeoResult, 
  createImageGenerationPlan, 
  EditableImagePlan, 
  constructPromptsFromPlan,
  testGeminiModel,
  testImagenModel
} from './services/geminiService';
import { 
  generateImage as generateRunwareImage, 
  generateBatchImages,
  testRunwareModel
} from '../image-generator/services/runwareService';
import { fileToBase64, fileToDataURL } from './utils/fileUtils';
import ImageUploader from './components/ImageUploader';
import ImageGrid from './components/ImageGrid';
import Spinner from './components/Spinner';
import AnalysisEditor from './components/AnalysisEditor';
import UploadIcon from './components/icons/UploadIcon';
import AnalyzeIcon from './components/icons/AnalyzeIcon';
import GenerateIcon from './components/icons/GenerateIcon';
import EtsySeoDisplay from './components/EtsySeoDisplay';
import Tooltip from './components/Tooltip';
import QuestionMarkIcon from './components/icons/QuestionMarkIcon';
import { Task, getUserTasks, addTask, getTasks } from './services/taskService';
import TaskHistory from './components/TaskHistory';
import CommunityHistory from './components/CommunityHistory';
import ImageMasker from '../image-generator/components/ImageMasker';
import { Button } from '@/components/ui/button';


type Step = 'upload' | 'analyzing' | 'editing' | 'results';
const USER_HASH = 'default_user'; // For single-user localStorage persistence

const ProductAssistantTab: React.FC = () => {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [analysisData, setAnalysisData] = useState<ProductAnalysis | null>(null);
  const [imagePlan, setImagePlan] = useState<EditableImagePlan[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [vibe, setVibe] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  const [etsySeoData, setEtsySeoData] = useState<EtsySeoResult | null>(null);

  const [isTestingApis, setIsTestingApis] = useState<boolean>(false);
  const [apiTestResults, setApiTestResults] = useState<Record<string, 'success' | 'failed' | 'testing'>>({});

  const [allImagePlans, setAllImagePlans] = useState<EditableImagePlan[]>([]);
  const [selectedPlanIndexes, setSelectedPlanIndexes] = useState<number[]>([0, 1, 2, 3]);
  const [maskUrls, setMaskUrls] = useState<(string | null)[]>([null, null, null]);
  const [maskingIndex, setMaskingIndex] = useState<number | null>(null);
  const [tempImageBase64, setTempImageBase64] = useState<string | null>(null);

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Mới nhất, Siêu nhanh)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Mới nhất, Thông minh nhất)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Ổn định, Mạnh mẽ)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Cân bằng)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Kế thừa)' },
    { id: 'gemini-pro-latest', name: 'Gemini Pro Latest (Ổn định cao)' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest (Nhanh)' },
  ];
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);

  const imageModels = [
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image (Mới nhất, Đẹp nhất)' },
    { id: 'gemini-2.5-flash-image', name: 'Imagen 3 (Google - Nhanh)' },
    { id: 'runware:100@1', name: 'Flux.1 Schnell (Runware - Siêu nhanh)' },
    { id: 'runware:101@1', name: 'Flux.1 Dev (Runware - Chi tiết)' },
    { id: 'prunaai:1@1', name: 'Pruna AI (Tối ưu)' },
  ];
  const [selectedImageModel, setSelectedImageModel] = useState<string>(imageModels[0].id);

  useEffect(() => {
    setTasks(getUserTasks(USER_HASH));
    setAllTasks(getTasks());
    setAllImagePlans(createImageGenerationPlan());

    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []); // Initial load and cleanup

  const refreshTasks = () => {
    setTasks(getUserTasks(USER_HASH));
    setAllTasks(getTasks());
  };

  const handleFilesChange = (newFiles: File[]) => {
    const combinedFiles = [...selectedFiles, ...newFiles];
    const limitedFiles = combinedFiles.slice(0, 3);
    
    setSelectedFiles(limitedFiles);

    previewUrls.forEach(url => URL.revokeObjectURL(url));
    const newPreviewUrls = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);

    setGeneratedImages([]);
    setAnalysisData(null);
    setEtsySeoData(null);
    setError(null);
    if (step !== 'upload') {
        setStep('upload');
    }
  };

  const handleTestApis = async () => {
    setIsTestingApis(true);
    setApiTestResults({});
    
    const results: Record<string, 'success' | 'failed' | 'testing'> = {};
    
    [...models, ...imageModels].forEach(m => {
      results[m.id] = 'testing';
    });
    setApiTestResults({...results});

    const brainTests = models.map(async (m) => {
      const ok = await testGeminiModel(m.id);
      setApiTestResults(prev => ({ ...prev, [m.id]: ok ? 'success' : 'failed' }));
    });

    const imageTests = imageModels.map(async (m) => {
      let ok = false;
      if (m.id.startsWith('runware') || m.id.startsWith('prunaai')) {
        ok = await testRunwareModel(m.id);
      } else {
        ok = await testImagenModel(m.id);
      }
      setApiTestResults(prev => ({ ...prev, [m.id]: ok ? 'success' : 'failed' }));
    });

    await Promise.all([...brainTests, ...imageTests]);
    setIsTestingApis(false);
  };

  const renderApiTestResults = () => {
    if (Object.keys(apiTestResults).length === 0 && !isTestingApis) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Kết quả kiểm tra API</h3>
          {isTestingApis && <span className="text-xs text-teal-600 animate-pulse">Đang kiểm tra...</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
          {[...models, ...imageModels].map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 text-xs">
              <span className="text-gray-600 truncate mr-2">{m.name}</span>
              {apiTestResults[m.id] === 'testing' && <div className="h-3 w-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>}
              {apiTestResults[m.id] === 'success' && <span className="text-green-500 font-bold">✓ OK</span>}
              {apiTestResults[m.id] === 'failed' && <span className="text-red-500 font-bold">✕ Lỗi</span>}
            </div>
          ))}
        </div>
        {!isTestingApis && (
            <button 
                onClick={() => setApiTestResults({})}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
            >
                Đóng kết quả
            </button>
        )}
      </div>
    );
  };

  const startMasking = async (index: number) => {
    setMaskingIndex(index);
    setTempImageBase64(null); // Clear previous image while loading
    const file = selectedFiles[index];
    if (file) {
      try {
        const dataUrl = await fileToDataURL(file);
        setTempImageBase64(dataUrl);
      } catch (err) {
        console.error("Lỗi khi đọc file ảnh:", err);
        setError("Không thể hiển thị ảnh để tạo vùng chọn.");
        setMaskingIndex(null);
      }
    }
  };

  const handleMaskSave = (maskBase64: string | null) => {
    if (maskingIndex !== null) {
      const newMaskUrls = [...maskUrls];
      newMaskUrls[maskingIndex] = maskBase64;
      setMaskUrls(newMaskUrls);
    }
  };

  const handleFileRemove = (indexToRemove: number) => {
    const remainingFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(remainingFiles);

    const remainingMasks = maskUrls.filter((_, index) => index !== indexToRemove);
    setMaskUrls([...remainingMasks, null]); // Keep length at least 3

    previewUrls.forEach(url => URL.revokeObjectURL(url));
    const newPreviewUrls = remainingFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError("Vui lòng chọn ít nhất một hình ảnh.");
      return;
    }
     if (selectedPlanIndexes.length === 0) {
      setError("Vui lòng chọn ít nhất một góc chụp ảnh.");
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const imagePayloads = await Promise.all(
        selectedFiles.map(async (file, index) => ({
          base64: await fileToBase64(file),
          mimeType: file.type,
          maskBase64: maskUrls[index],
        }))
      );
      
      const { analysis, seo } = await analyzeProductAndGenerateSeo(imagePayloads, productName, productDescription, selectedModel);
      
      const selectedPlans = allImagePlans.filter((_, index) => selectedPlanIndexes.includes(index));
      const initialPrompts = constructPromptsFromPlan(selectedPlans, analysis, productName, productDescription, vibe);

      setAnalysisData(analysis);
      setEtsySeoData(seo);
      setImagePlan(selectedPlans);
      setPrompts(initialPrompts);
      setStep('editing');

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định trong quá trình phân tích.");
      setStep('upload');
    }
  }, [selectedFiles, productName, productDescription, vibe, allImagePlans, selectedPlanIndexes, maskUrls, selectedModel]);
  
  const handlePlanSelectionChange = (index: number) => {
    const newSelection = [...selectedPlanIndexes];
    if (newSelection.includes(index)) {
        if (newSelection.length > 1) {
            setSelectedPlanIndexes(newSelection.filter(i => i !== index));
        } else {
            setError("Bạn phải chọn ít nhất một góc chụp ảnh.");
            setTimeout(() => setError(null), 3000);
        }
    } else {
        setError(null); // Clear error if they add a new one
        newSelection.push(index);
        setSelectedPlanIndexes(newSelection);
    }
  };


  const handleAnalysisChange = (newAnalysis: ProductAnalysis) => {
    setAnalysisData(newAnalysis);
  };
  
  const handleSeoChange = (newSeo: EtsySeoResult) => {
    setEtsySeoData(newSeo);
  };


  const handleFinalGenerateClick = useCallback(async () => {
    if (selectedFiles.length === 0 || !analysisData || imagePlan.length === 0) {
      setError("Dữ liệu phân tích hoặc kế hoạch tạo ảnh bị thiếu. Vui lòng bắt đầu lại.");
      setStep('upload');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGenerationStatus("Đang bắt đầu quá trình tạo hình ảnh...");

    try {
        const imagePayloads = await Promise.all(
          selectedFiles.map(async (file, index) => ({
            base64: await fileToBase64(file),
            mimeType: file.type,
            maskBase64: maskUrls[index] || undefined,
          }))
        );
        
        const selectedPlans = allImagePlans.filter((_, index) => selectedPlanIndexes.includes(index));
        const prompts = constructPromptsFromPlan(selectedPlans, analysisData!, productName, productDescription, vibe);
        let images: string[] = [];

        if (selectedImageModel.startsWith('gemini-')) {
          // Use Gemini (Imagen) for generation
          images = await generateFinalImages(
            imagePayloads, 
            prompts,
            (progress: string) => setGenerationStatus(progress),
            selectedImageModel
          );
        } else {
          // Use Runware/Pruna AI for generation - TRUE PARALLEL
          const seedImage = imagePayloads[0]?.base64;
          const maskImage = maskUrls[0] || undefined;
          
          setGenerationStatus(`Đang gửi yêu cầu tạo ĐỒNG THỜI ${prompts.length} ảnh đến server AI...`);
          
          // Use generateBatchImages instead of a for-loop to ensure server-side parallelism
          const results = await generateBatchImages(
            prompts,
            '', // style
            1024, // width
            1024, // height
            seedImage,
            maskImage,
            selectedImageModel
          );
          
          images = results.map(result => result.imageURL);
          
          if (images.length === 0) {
            throw new Error("Không có hình ảnh nào được tạo ra thành công từ AI.");
          }
        }

      setGeneratedImages(images);

      const newTask: Task = {
        userHash: USER_HASH,
        timestamp: Date.now(),
        outputImageUrls: images,
        productName: productName || 'Sản phẩm không tên',
      };
      await addTask(newTask);
      refreshTasks();
      
      setStep('results');

    } catch (err: unknown) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định khi tạo hình ảnh cuối cùng.";
        
        const promptRegex = /Prompt: (.*)/s;
        const match = errorMessage.match(promptRegex);
        const failedPrompt = match ? match[1] : null;
        
        let detailedError = "Rất tiếc, không thể tạo được hình ảnh sau nhiều lần thử. Vui lòng thử lại sau.";
        if (failedPrompt) {
            detailedError = `Rất tiếc, một trong những hình ảnh không thể tạo được sau nhiều lần thử.
Bạn có thể thử lại, hoặc để khắc phục tạm thời, hãy sao chép prompt bên dưới và sử dụng trực tiếp trong Gemini Chat để tự tạo hình ảnh:

--- PROMPT ---
${failedPrompt}
--------------`;
        }
        setError(detailedError);
    } finally {
        setIsLoading(false);
        setGenerationStatus(null);
    }
  }, [selectedFiles, analysisData, imagePlan, prompts, productName, maskUrls, allImagePlans, selectedPlanIndexes, selectedImageModel]);
  
  const handleReset = () => {
    setStep('upload');
    setSelectedFiles([]);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setGeneratedImages([]);
    setAnalysisData(null);
    setImagePlan([]);
    setPrompts([]);
    setProductName('');
    setProductDescription('');
    setVibe('');
    setError(null);
    setIsLoading(false);
    setIsDownloading(false);
    setGenerationStatus(null);
    setEtsySeoData(null);
    setSelectedPlanIndexes([0, 1, 2, 3]);
    setMaskUrls([null, null, null]);
    setMaskingIndex(null);
    setTempImageBase64(null);
  };

  const handleDownloadAll = useCallback(() => {
    if (generatedImages.length === 0) return;

    setIsDownloading(true);
    setError(null);

    try {
      generatedImages.forEach((imageSrc, index) => {
        const link = document.createElement('a');
        link.href = imageSrc;

        const mimeType = imageSrc.match(/data:(image\/[a-z]+);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        
        link.download = `product-image-${index + 1}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } catch (err) {
      console.error("Failed to download images.", err);
      setError(err instanceof Error ? err.message : "Could not download images.");
    } finally {
      setIsDownloading(false);
    }
  }, [generatedImages]);

  const renderContent = () => {
    switch (step) {
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Spinner />
            <p className="mt-4 text-lg text-gray-500 animate-pulse">Đang phân tích sản phẩm & tạo SEO...</p>
            <p className="text-sm text-gray-500">Xác định hình dạng, vật liệu và tạo tiêu đề & thẻ tối ưu hóa.</p>
          </div>
        );
      case 'editing':
        return analysisData && etsySeoData && (
          <AnalysisEditor
            analysis={analysisData}
            etsySeo={etsySeoData}
            previewUrls={previewUrls}
            imagePlan={imagePlan}
            prompts={prompts}
            onAnalysisChange={handleAnalysisChange}
            onSeoChange={handleSeoChange}
            onPromptsChange={setPrompts}
            onGenerate={handleFinalGenerateClick}
            onBack={handleReset}
            isGenerating={isLoading}
            generationStatus={generationStatus}
            error={error}
          />
        );
      case 'results':
        return (
          <div className="w-full text-center animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ảnh sản phẩm của bạn</h2>
            <ImageGrid images={generatedImages} />

             {etsySeoData && (
                <div className="mt-12 text-left animate-fade-in">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Gợi ý Tiêu đề/Thẻ Etsy (Để tham khảo)</h2>
                    <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <EtsySeoDisplay data={etsySeoData} disabled={true} />
                    </div>
                </div>
              )}

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading || generatedImages.length === 0}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                {isDownloading ? <Spinner className="h-5 w-5" /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>}
                {isDownloading ? 'Đang tải...' : 'Tải xuống tất cả'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 5.312a.75.75 0 010 1.061L11.06 10.625l4.252 4.252a.75.75 0 11-1.06 1.06L10 11.687l-4.252 4.252a.75.75 0 01-1.06-1.06L8.939 10.625 4.688 6.373a.75.75 0 011.06-1.061L10 9.564l4.252-4.252a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
                Bắt đầu lại
              </button>
            </div>
            
             
          </div>
        );
      default:
        return null;
    }
  };

  const currentStepInfo = {
    upload: { number: 1, title: 'Tải lên hình ảnh của bạn' },
    analyzing: { number: 2, title: 'Đang phân tích sản phẩm' },
    editing: { number: 2, title: 'Phân tích & Tinh chỉnh' },
    results: { number: 3, title: 'Tải xuống ảnh của bạn' }
  };
  
  const currentStep = currentStepInfo[step];

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Trợ lý sản phẩm AI</h2>
          <p className="text-gray-600 mt-2">
            Phân tích sản phẩm và tạo ảnh thương mại chuyên nghiệp với AI.
          </p>
        </div>
      </div>

      <main className="w-full">
        {step === 'upload' ? (
             <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-gray-200 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-teal-100 text-teal-700 font-bold text-sm px-3 py-1 rounded-full mb-2">
                        Bước 1
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Tải lên hình ảnh sản phẩm</h2>
                    <p className="text-gray-500 mt-2">
                        Cung cấp tối đa 3 hình ảnh sản phẩm của bạn. Sử dụng ảnh rõ nét, đủ ánh sáng từ các góc độ khác nhau để có kết quả tốt nhất.
                    </p>
                </div>

                <ImageUploader 
                    onFilesChange={handleFilesChange}
                    previewUrls={previewUrls}
                    onFileRemove={handleFileRemove}
                    maskUrls={maskUrls}
                    onMaskClick={startMasking}
                />
                
                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm <span className="text-gray-400">(Tùy chọn)</span></label>
                        <input
                            id="product-name"
                            type="text"
                            placeholder="vd: 'Ly gốm thủ công'"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        />
                    </div>
                     <div>
                        <label htmlFor="product-desc" className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm <span className="text-gray-400">(Tùy chọn)</span></label>
                        <textarea
                            id="product-desc"
                            rows={3}
                            placeholder="vd: 'Một chiếc ly cà phê mộc mạc, được làm bằng tay với lớp men xanh đốm. Hoàn hảo cho cà phê buổi sáng của bạn.'"
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        />
                    </div>
                     <div>
                        <label htmlFor="product-vibe" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            Phong cách / Thẩm mỹ mong muốn 
                            <span className="text-gray-400">(Tùy chọn)</span>
                             <Tooltip content="Mô tả tâm trạng, phong cách hoặc cảm giác tổng thể bạn muốn trong các bức ảnh cuối cùng. Ví dụ: 'tối giản và sạch sẽ', 'tối và tâm trạng', 'ấm áp và ấm cúng', 'sôi động và vui tươi', 'sang trọng và thanh lịch'.">
                                <QuestionMarkIcon className="h-4 w-4 text-gray-400 cursor-help" />
                            </Tooltip>
                        </label>
                        <input
                            id="product-vibe"
                            type="text"
                            placeholder="vd: 'Tối giản và sạch sẽ', 'ấm áp và ấm cúng'"
                            value={vibe}
                            onChange={(e) => setVibe(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="ai-model" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            AI Model (Bộ não)
                            <Tooltip content="Chọn phiên bản Gemini AI để phân tích hình ảnh và tạo nội dung SEO. Gemini 2.0 Flash là lựa chọn tốt nhất hiện tại.">
                                <QuestionMarkIcon className="h-4 w-4 text-gray-400 cursor-help" />
                            </Tooltip>
                        </label>
                        <select
                            id="ai-model"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        >
                            {models.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="image-model" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            Model tạo ảnh (Họa sĩ)
                            <Tooltip content="Chọn phiên bản AI để tạo hình ảnh sản phẩm cuối cùng. Imagen 3 là model tạo ảnh tiên tiến nhất của Google.">
                                <QuestionMarkIcon className="h-4 w-4 text-gray-400 cursor-help" />
                            </Tooltip>
                        </label>
                        <select
                            id="image-model"
                            value={selectedImageModel}
                            onChange={(e) => setSelectedImageModel(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        >
                            {imageModels.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleTestApis}
                            disabled={isTestingApis}
                            className="mt-2 text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isTestingApis ? <div className="h-3 w-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div> : '🔍'}
                            Kiểm tra kết nối API cho tất cả models
                        </button>

                        {renderApiTestResults()}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Góc chụp ảnh ({selectedPlanIndexes.length}/6)</label>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allImagePlans.map((plan, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePlanSelectionChange(index)}
                                    className={`p-2 rounded-md text-xs sm:text-sm text-left transition-colors border ${
                                        selectedPlanIndexes.includes(index)
                                            ? 'bg-teal-100 border-teal-400 text-teal-800 font-semibold'
                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {plan.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}

                <div className="mt-8 text-center">
                    <button
                        onClick={handleAnalyzeClick}
                        disabled={selectedFiles.length === 0 || selectedPlanIndexes.length === 0}
                        className="px-8 py-3 bg-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center mx-auto"
                    >
                        <AnalyzeIcon className="h-6 w-6 mr-3" />
                        Bước 2: Phân tích & Tạo SEO
                    </button>
                </div>
            </div>
        ) : (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-200">
                {renderContent()}
            </div>
        )}

        {step !== 'upload' && (
          <div className="mt-8">
            <TaskHistory tasks={tasks} />
          </div>
        )}

        {step === 'upload' && (
          <div className="mt-8">
            <TaskHistory tasks={tasks} />
            <CommunityHistory tasks={allTasks} />
          </div>
        )}
      </main>

      {maskingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Tạo vùng chọn (Ảnh {maskingIndex + 1})</h3>
              <button 
                onClick={() => setMaskingIndex(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="max-w-2xl mx-auto">
                <ImageMasker 
                  initialImage={tempImageBase64}
                  initialMask={maskUrls[maskingIndex]}
                  hideUpload={true}
                  onImageChange={() => {}}
                  onMaskChange={handleMaskSave}
                />
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Hướng dẫn:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tô màu đỏ lên khu vực bạn muốn AI thay đổi (ví dụ: nền xung quanh sản phẩm).</li>
                  <li>Sản phẩm gốc nên được giữ nguyên (không tô màu).</li>
                  <li>Sau khi tô xong, hãy nhấn nút "Xong" bên dưới.</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <Button variant="outline" onClick={() => setMaskingIndex(null)}>Hủy</Button>
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                onClick={() => setMaskingIndex(null)}
              >
                Xong
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAssistantTab;
