
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateVideo, generateImage, VidtoryVideoRequest, VidtoryImageRequest } from './services/vidtoryService';
import Loader from '@/features/seo-assistant/components/Loader';
import ImageUploader from '../product-image/components/ImageUploader';
import { fileToDataURL, fileToBase64 } from '../product-image/utils/fileUtils';

import { GoogleGenAI } from "@google/genai";

const getGeminiApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    return "";
};

const optimizePrompt = async (originalPrompt: string, images: File[] = []): Promise<string> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.warn("Gemini API Key missing, skipping optimization");
        return originalPrompt;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const imageParts = await Promise.all(images.map(async (file) => ({
            inlineData: {
                data: await fileToBase64(file),
                mimeType: file.type
            }
        })));

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: {
                role: 'user',
                parts: [
                    ...imageParts,
                    {
                        text: `You are an expert AI Prompt Engineer for Video and Image generation.
                        
                        Task: Create a comprehensive, detailed, and optimized prompt based on the provided image(s) (if any) and the user's input text.
                        
                        User Input: "${originalPrompt}"
                        
                        Instructions:
                        1. Analyze the uploaded images (if any) to understand the subject, style, lighting, composition, and key elements.
                        2. Combine the visual information from the images with the user's text intent.
                        3. If the user input is empty, generate a prompt that best describes the images.
                        4. Focus on visual details: lighting, camera movement (for video), textures, colors, mood, and style.
                        5. Output ONLY the optimized prompt text. Do not include any explanations or markdown formatting.`
                    }
                ]
            }
        });

        const text = response.text;
        return text ? text.trim() : originalPrompt;
    } catch (e) {
        console.error("Prompt optimization failed:", e);
        // Fallback to simpler error handling or just return original
        return originalPrompt;
    }
};

const Veo3ChinaTab: React.FC = () => {
    const [mode, setMode] = useState<'VIDEO' | 'IMAGE'>('VIDEO');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<string>('VIDEO_ASPECT_RATIO_LANDSCAPE');
    const [generationMode, setGenerationMode] = useState<'START_ONLY' | 'START_AND_END' | 'REFERENCE_IMAGES'>('REFERENCE_IMAGES');
    const [upscale, setUpscale] = useState(false);
    const [cleanup, setCleanup] = useState(false);
    const [batchSize, setBatchSize] = useState<number>(1);

    // Upload states for Video modes
    const [startImageFiles, setStartImageFiles] = useState<File[]>([]);
    const [startImagePreview, setStartImagePreview] = useState<string[]>([]);

    const [endImageFiles, setEndImageFiles] = useState<File[]>([]);
    const [endImagePreview, setEndImagePreview] = useState<string[]>([]);

    const [refImageFiles, setRefImageFiles] = useState<File[]>([]);
    const [refImagePreview, setRefImagePreview] = useState<string[]>([]);

    // const [subjectImageUrl, setSubjectImageUrl] = useState(''); // Replaced by upload
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handlePromptOptimization = async () => {
        // if (!prompt) return; 
        setIsOptimizing(true);
        try {
            let imagesToOptimize: File[] = [];

            if (mode === 'IMAGE') {
                imagesToOptimize = [...selectedFiles];
            } else {
                // VIDEO
                if (generationMode === 'START_ONLY' || generationMode === 'START_AND_END') {
                    imagesToOptimize.push(...startImageFiles);
                }
                if (generationMode === 'START_AND_END') {
                    imagesToOptimize.push(...endImageFiles);
                }
                if (generationMode === 'REFERENCE_IMAGES') {
                    imagesToOptimize.push(...refImageFiles);
                }
            }

            if (!prompt && imagesToOptimize.length === 0) {
                // Nothing to optimize
                setIsOptimizing(false);
                return;
            }

            const optimized = await optimizePrompt(prompt, imagesToOptimize);
            setPrompt(optimized);
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleStartImageChange = (files: File[]) => {
        if (files.length > 0) {
            setStartImageFiles([files[files.length - 1]]);
            if (startImagePreview.length > 0) URL.revokeObjectURL(startImagePreview[0]);
            setStartImagePreview([URL.createObjectURL(files[files.length - 1])]);
        }
    };

    const handleEndImageChange = (files: File[]) => {
        if (files.length > 0) {
            setEndImageFiles([files[files.length - 1]]);
            if (endImagePreview.length > 0) URL.revokeObjectURL(endImagePreview[0]);
            setEndImagePreview([URL.createObjectURL(files[files.length - 1])]);
        }
    };

    const handleRefImageChange = (files: File[]) => {
        // Append new files instead of replacing for reference images? Or replace?
        // Docs say max 3 images usually? Let's allow multiple upload.
        setRefImageFiles(prev => [...prev, ...files]);
        const newUrls = files.map(f => URL.createObjectURL(f));
        setRefImagePreview(prev => [...prev, ...newUrls]);
    };

    const handleRefImageRemove = (index: number) => {
        setRefImageFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(refImagePreview[index]);
        setRefImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleFilesChange = (newFiles: File[]) => {
        // We only take the last file to simulate single file selection behavior for now, 
        // or we can just replace the list.
        // Let's allow replacing the current file.
        if (newFiles.length > 0) {
            const file = newFiles[newFiles.length - 1];
            setSelectedFiles([file]);

            // Cleanup old URL
            if (previewUrls.length > 0) {
                URL.revokeObjectURL(previewUrls[0]);
            }
            const newUrl = URL.createObjectURL(file);
            setPreviewUrls([newUrl]);
        }
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles([]);
        if (previewUrls.length > 0) {
            URL.revokeObjectURL(previewUrls[0]);
        }
        setPreviewUrls([]);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedUrls([]);

        try {
            if (mode === 'VIDEO') {
                const request: VidtoryVideoRequest = {
                    prompt,
                    aspectRatio: aspectRatio as any,
                    generationMode,
                    upscale: upscale,
                    cleanup: cleanup
                };

                if (generationMode === 'START_ONLY' || generationMode === 'START_AND_END') {
                    let url = '';
                    if (startImageFiles.length > 0) {
                        try {
                            url = await fileToDataURL(startImageFiles[0]);
                        } catch (e) { throw new Error("Failed to process start image file."); }
                    }
                    if (!url) throw new Error("Start Image is required (Please upload an image).");
                    request.startImage = { url };
                }

                if (generationMode === 'START_AND_END') {
                    let url = '';
                    if (endImageFiles.length > 0) {
                        try {
                            url = await fileToDataURL(endImageFiles[0]);
                        } catch (e) { throw new Error("Failed to process end image file."); }
                    }
                    if (!url) throw new Error("End Image is required (Please upload an image).");
                    request.endImage = { url };
                }

                if (generationMode === 'REFERENCE_IMAGES') {
                    const urls: string[] = [];
                    if (refImageFiles.length > 0) {
                        for (const file of refImageFiles) {
                            urls.push(await fileToDataURL(file));
                        }
                    }
                    if (urls.length === 0) throw new Error("At least one reference image is required (Please upload an image).");

                    request.referenceImages = urls.map(url => ({
                        url,
                        imageUsageType: 'IMAGE_USAGE_TYPE_SUBJECT'
                    }));
                }

                // Batch Generation Logic
                const requests = Array.from({ length: batchSize }).map(() => generateVideo(request));
                const results = await Promise.allSettled(requests);

                const allUrls: string[] = [];
                const errors: string[] = [];

                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        allUrls.push(...result.value);
                    } else {
                        errors.push(result.reason.message || "Unknown error");
                    }
                });

                if (errors.length > 0 && allUrls.length === 0) {
                    throw new Error(`All requests failed: ${errors[0]}`);
                }

                setGeneratedUrls(allUrls);
            } else {
                let subjectUrl = '';
                if (selectedFiles.length > 0) {
                    try {
                        subjectUrl = await fileToDataURL(selectedFiles[0]);
                    } catch (e) {
                        console.error("Failed to convert file to data URL", e);
                        throw new Error("Failed to process uploaded image.");
                    }
                }

                if (!subjectUrl) {
                    throw new Error("Please upload a product image.");
                }

                const request: VidtoryImageRequest = {
                    prompt,
                    aspectRatio: aspectRatio as any,
                    image: subjectUrl,
                    strength: 0.75 // Default strength for img2img
                };
                const urls = await generateImage(request);
                setGeneratedUrls(urls);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred during generation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mt-1">Veo3 China (Vidtory)</h2>
                    <p className="text-gray-600 mt-2">
                        Tạo ảnh hoặc video chất lượng cao sử dụng Vidtory API.
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => {
                            setMode('VIDEO');
                            setAspectRatio('VIDEO_ASPECT_RATIO_LANDSCAPE');
                            setGeneratedUrls([]);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'VIDEO' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Video
                    </button>
                    <button
                        onClick={() => {
                            setMode('IMAGE');
                            setAspectRatio('IMAGE_ASPECT_RATIO_SQUARE');
                            setGeneratedUrls([]);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'IMAGE' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Image
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt (Mô tả)
                        <button
                            onClick={handlePromptOptimization}
                            disabled={isOptimizing}
                            className="ml-2 text-xs text-teal-600 hover:text-teal-700 disabled:opacity-50 underline"
                        >
                            {isOptimizing ? 'Optimizing...' : 'Optimize with Gemini'}
                        </button>
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'VIDEO' ? "Mô tả video bạn muốn tạo..." : "Mô tả hình ảnh bạn muốn tạo..."}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition min-h-[100px]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio (Tỷ lệ)</label>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                        >
                            {mode === 'VIDEO' ? (
                                <>
                                    <option value="VIDEO_ASPECT_RATIO_LANDSCAPE">Landscape (16:9)</option>
                                    <option value="VIDEO_ASPECT_RATIO_PORTRAIT">Portrait (9:16)</option>
                                </>
                            ) : (
                                <>
                                    <option value="IMAGE_ASPECT_RATIO_SQUARE">Square (1:1)</option>
                                    <option value="IMAGE_ASPECT_RATIO_LANDSCAPE">Landscape (4:3)</option>
                                    <option value="IMAGE_ASPECT_RATIO_PORTRAIT">Portrait (3:4)</option>
                                </>
                            )}
                        </select>
                    </div>

                    {mode === 'IMAGE' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image (Ảnh sản phẩm)</label>
                            <ImageUploader
                                onFilesChange={handleFilesChange}
                                previewUrls={previewUrls}
                                onFileRemove={handleFileRemove}
                            />
                        </div>
                    )}

                    {mode === 'VIDEO' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Generation Mode (Chế độ tạo)</label>
                            <select
                                value={generationMode}
                                onChange={(e) => setGenerationMode(e.target.value as any)}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                            >
                                <option value="REFERENCE_IMAGES">Reference Images (Ảnh tham khảo)</option>
                                <option value="START_ONLY">Start Image Only (Ảnh bắt đầu)</option>
                                <option value="START_AND_END">Start & End Image (Ảnh đầu & cuối)</option>

                            </select>
                        </div>
                    )}

                    {mode === 'VIDEO' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Số lượng cùng lúc)</label>
                            <select
                                value={batchSize}
                                onChange={(e) => setBatchSize(Number(e.target.value))}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                            >
                                <option value="1">1 video</option>
                                <option value="2">2 videos</option>
                                <option value="3">3 videos</option>
                                <option value="4">4 videos</option>
                            </select>
                        </div>
                    )}
                </div>

                {mode === 'VIDEO' && (
                    <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={upscale}
                                onChange={(e) => setUpscale(e.target.checked)}
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">Upscale (Nâng cao chất lượng - Tốn thêm thời gian)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cleanup}
                                onChange={(e) => setCleanup(e.target.checked)}
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">Cleanup (Làm sạch ảnh - Tốn thêm thời gian)</span>
                        </label>
                    </div>
                )}

                {mode === 'VIDEO' && (
                    <>

                        {generationMode === 'REFERENCE_IMAGES' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Images (Ảnh tham khảo)</label>
                                <div className="space-y-2">
                                    <ImageUploader
                                        onFilesChange={handleRefImageChange}
                                        previewUrls={refImagePreview}
                                        onFileRemove={handleRefImageRemove}
                                    />
                                </div>
                            </div>
                        )}

                        {(generationMode === 'START_ONLY' || generationMode === 'START_AND_END') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Image (Ảnh bắt đầu)</label>
                                <div className="space-y-2">
                                    <ImageUploader
                                        onFilesChange={handleStartImageChange}
                                        previewUrls={startImagePreview}
                                        onFileRemove={() => {
                                            setStartImageFiles([]);
                                            setStartImagePreview([]);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {generationMode === 'START_AND_END' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Image (Ảnh kết thúc)</label>
                                <div className="space-y-2">
                                    <ImageUploader
                                        onFilesChange={handleEndImageChange}
                                        previewUrls={endImagePreview}
                                        onFileRemove={() => {
                                            setEndImageFiles([]);
                                            setEndImagePreview([]);
                                        }}
                                    />
                                </div>
                            </div>
                        )}


                    </>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full py-6 text-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                    {isLoading ? `Đang tạo ${mode === 'VIDEO' ? 'video' : 'ảnh'}...` : `Generate ${mode === 'VIDEO' ? 'Video' : 'Image'}`}
                </Button>

                {isLoading && <Loader progressMessage={`Đang xử lý ${mode === 'VIDEO' ? 'video' : 'ảnh'}...`} />}

                {generatedUrls.length > 0 && (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-xl font-bold text-gray-800">Kết quả</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {generatedUrls.map((url, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    {mode === 'VIDEO' ? (
                                        <div className="relative pt-[56.25%] bg-black">
                                            <video
                                                controls
                                                playsInline
                                                className="absolute top-0 left-0 w-full h-full"
                                                crossOrigin="anonymous"
                                            >
                                                <source src={url} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ) : (
                                        <img src={url} alt={`Generated result ${index}`} className="w-full h-auto" />
                                    )}
                                    <div className="p-3 bg-gray-50 flex justify-between items-center">
                                        <span className="text-sm text-gray-500">{mode === 'VIDEO' ? 'Video' : 'Image'} {index + 1}</span>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-sm font-medium">
                                            Tải xuống / Mở tab mới
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Veo3ChinaTab;
