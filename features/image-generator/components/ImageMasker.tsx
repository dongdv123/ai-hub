import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { analyzeImageRegion } from '../../seo-assistant/services/geminiService';

interface ImageMaskerProps {
    onImageChange: (imageBase64: string | null) => void;
    onMaskChange: (maskBase64: string | null) => void;
    onAnalyzeRegion?: (prompt: string) => void;
}

const ImageMasker: React.FC<ImageMaskerProps> = ({ onImageChange, onMaskChange, onAnalyzeRegion }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(30);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImageSrc(result);
                onImageChange(result);
                // Reset mask
                clearMask();
            };
            reader.readAsDataURL(file);
        }
    };

    const clearMask = useCallback(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                onMaskChange(null);
            }
        }
    }, [onMaskChange]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!imageSrc) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        // Save mask state
        saveMask();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { x, y } = getMousePos(e);

        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // White mask
        ctx.fill();
    };

    const saveMask = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Check if canvas is empty
            const ctx = canvas.getContext('2d');
            // If we really need to check if it's empty we can look at pixel data, 
            // but for now just returning the dataURL is fine. 
            // If the user hasn't drawn, it's a transparent image.
            // However, Runware might expect a black background with white mask?
            // Usually masking APIs expect white for the area to modify, black for the rest.
            
            // Create a temp canvas to composite against black if needed, 
            // but often PNG with transparency is accepted.
            // Let's assume standard mask: white = edit, black = keep.
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                // Fill with black (keep)
                tempCtx.fillStyle = 'black';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Draw our transparent-white drawing on top
                tempCtx.drawImage(canvas, 0, 0);
                
                onMaskChange(tempCanvas.toDataURL('image/png'));
            }
        }
    };

    useEffect(() => {
        if (imageSrc && imageRef.current && canvasRef.current && containerRef.current) {
            // Resize canvas to match image natural size or container size
            // For simplicity, let's use the displayed size or intrinsic size.
            // Runware usually prefers matching dimensions.
            
            // We wait for image to load naturally via src
        }
    }, [imageSrc]);

    const onImageLoad = () => {
        if (imageRef.current && canvasRef.current) {
            canvasRef.current.width = imageRef.current.width;
            canvasRef.current.height = imageRef.current.height;
            clearMask();
        }
    };

    const handleAnalyze = async () => {
        if (!imageSrc || !canvasRef.current || !onAnalyzeRegion) return;
        
        setIsAnalyzing(true);
        try {
            const canvas = canvasRef.current;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                tempCtx.fillStyle = 'black';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                
                const maskBase64 = tempCanvas.toDataURL('image/png');
                const analysisResult = await analyzeImageRegion(imageSrc, maskBase64);
                if (analysisResult) {
                    onAnalyzeRegion(analysisResult);
                }
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-4">
            {!imageSrc ? (
                <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                        Ảnh gốc (Upload để chỉnh sửa)
                    </Label>
                    <div 
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-teal-500 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('image-upload')?.click()}
                    >
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-600 justify-center">
                                <label htmlFor="image-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none px-1">
                                    <span>Tải ảnh lên</span>
                                    <input 
                                        id="image-upload" 
                                        name="image-upload" 
                                        type="file" 
                                        className="sr-only" 
                                        onChange={handleImageUpload} 
                                        accept="image/png, image/jpeg, image/webp" 
                                    />
                                </label>
                                <p className="pl-1">hoặc dán ảnh (Ctrl+V)</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP tối đa 10MB</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded border border-gray-300 overflow-hidden bg-white">
                                <img src={imageSrc} alt="Thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Đã tải ảnh lên</p>
                                <button 
                                    onClick={() => {
                                        setImageSrc(null);
                                        onImageChange(null);
                                        onMaskChange(null);
                                    }}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Thay đổi ảnh
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-medium text-gray-600">Cỡ cọ: {brushSize}px</Label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={brushSize} 
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleAnalyze} 
                                disabled={isAnalyzing}
                                className="text-xs h-8 border-purple-500 text-purple-600 hover:bg-purple-50"
                            >
                                {isAnalyzing ? "Đang phân tích..." : "Phân tích vùng chọn"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearMask} className="text-xs h-8">
                                Xóa vùng chọn
                            </Button>
                        </div>
                    </div>

                    <div 
                        ref={containerRef}
                        className="relative border border-gray-300 rounded-lg overflow-hidden cursor-crosshair inline-block max-w-full shadow-inner bg-gray-100"
                        style={{ maxHeight: '500px' }}
                    >
                        <img 
                            ref={imageRef}
                            src={imageSrc} 
                            alt="Original" 
                            className="max-w-full block"
                            onLoad={onImageLoad}
                            style={{ maxHeight: '500px' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 touch-none opacity-60"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded text-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[11px]">
                            Vẽ lên vùng ảnh bạn muốn thay đổi. Vùng được tô trắng sẽ được AI vẽ lại.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageMasker;
