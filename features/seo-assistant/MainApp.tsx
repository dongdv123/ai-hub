import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { getEtsyAnalysis } from './services/geminiService';
import type { AnalysisResult, UserInput, AuthUser } from './types';
import InputForm from './components/InputForm';
import AnalysisDisplay from './components/AnalysisDisplay';
import Loader from './components/Loader';
import HeroSection from './components/HeroSection';
import ImageTab from '../image-generator/ImageTab';
import ProductAssistantTab from '../product-image/ProductAssistantTab';
import HistoryTab from '../product-image/HistoryTab';
import SettingsTab from '../settings/SettingsTab';
import { Button } from '@/components/ui/button';
import { AppProvider, useAppContext } from './context/AppContext';

interface MainAppProps {
    user: AuthUser;
}

const HowToUseCard: React.FC = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
        <h3 className="font-bold text-lg text-gray-800 mb-4">How to Use</h3>
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">1</div>
                <div>
                    <h4 className="font-semibold text-gray-700">Điền Thông Tin</h4>
                    <p className="text-sm text-gray-500">Cung cấp từ khóa, giá, tiêu đề, tags và ảnh thumbnail hiện tại của bạn.</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">2</div>
                <div>
                    <h4 className="font-semibold text-gray-700">Nhấn Phân Tích</h4>
                    <p className="text-sm text-gray-500">AI sẽ thực hiện phân tích 360 độ từ thị trường, đối thủ đến listing của bạn.</p>
                </div>
            </div>
             <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">3</div>
                <div>
                    <h4 className="font-semibold text-gray-700">Áp Dụng Chiến Lược</h4>
                    <p className="text-sm text-gray-500">Chọn gói tối ưu Title & Tags phù hợp và áp dụng các đề xuất để tăng hạng.</p>
                </div>
            </div>
        </div>
    </div>
);

type TabKey = 'seo' | 'image' | 'ads' | 'pricing' | 'inventory' | 'reports' | 'settings';

const SidebarNav: React.FC = () => (
    <nav className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sticky top-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Menu chức năng</h3>
        <ul className="space-y-2">
            <li>
                <NavLink
                    to="/seo"
                    className={({ isActive }) => `w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                >
                    Trợ Lý SEO AI
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/image"
                    className={({ isActive }) => `w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                >
                    Tạo Ảnh (beta)
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/product-assistant"
                    className={({ isActive }) => `w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                >
                    Trợ lý sản phẩm
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/history"
                    className={({ isActive }) => `w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                >
                    Lịch sử tạo
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `w-full text-left block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                >
                    Thiết lập
                </NavLink>
            </li>
        </ul>
    </nav>
);

const MainContent: React.FC<MainAppProps> = ({ user }) => {
    const { 
        currentTitle, setCurrentTitle, 
        currentTags, setCurrentTags, 
        mainKeyword, setMainKeyword 
    } = useAppContext();

    const [formData, setFormData] = useState({
        mainKeyword: mainKeyword,
        price: '',
        currency: 'VND',
        currentTitle: currentTitle,
    });

    // Sync local formData with Context
    useEffect(() => {
        setCurrentTitle(formData.currentTitle);
        setMainKeyword(formData.mainKeyword);
    }, [formData.currentTitle, formData.mainKeyword, setCurrentTitle, setMainKeyword]);

    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState<UserInput | null>(null);

    const PlaceholderCard: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-4">{desc}</p>
            <Button disabled className="py-3 px-4">Đang phát triển</Button>
        </div>
    );

    const handleImageProcessing = (file: File) => {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setFormError('Kích thước ảnh không được vượt quá 4MB.');
            return;
        }
        setFormError(null);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setImagePreview(dataUrl);
    
          const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
          if (supportedTypes.includes(file.type)) {
            setImageBase64(dataUrl.split(',')[1]);
            setImageMimeType(file.type);
          } else {
            const image = new Image();
            image.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(image, 0, 0);
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setImageBase64(jpegDataUrl.split(',')[1]);
                setImageMimeType('image/jpeg');
              } else {
                  setFormError("Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác.");
                  setImageBase64(null);
                  setImageMimeType(null);
              }
            };
            image.onerror = () => {
              setFormError("Không thể tải ảnh để xử lý. Vui lòng kiểm tra lại file ảnh.");
              setImageBase64(null);
              setImageMimeType(null);
            };
            image.src = dataUrl;
          }
        };
        reader.readAsDataURL(file);
    }

    const handleAnalyze = async (userInputToAnalyze: UserInput) => {
        setIsLoading(true);
        setAnalysisError(null);
        setAnalysisResult(null);
        setProgressMessage("Khởi tạo phân tích...");

        try {
            const result = await getEtsyAnalysis(userInputToAnalyze, setProgressMessage);
            setAnalysisResult(result);
        } catch (err) {
            console.error(err);
            setAnalysisError(err instanceof Error ? `Lỗi Phân Tích: ${err.message}` : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.currentTitle) {
            setFormError("Vui lòng điền đầy đủ trường bắt buộc: Tiêu đề hiện tại.");
            return;
        }
        setFormError(null);

        const fullUserInput: UserInput = {
            ...formData,
            currentTags,
            imageBase64,
            imageMimeType,
            currentDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        };

        setUserInput(fullUserInput);
        handleAnalyze(fullUserInput);
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            <main className="w-full px-4 sm:px-6 lg:px-10 py-6">
                <div className="grid lg:grid-cols-[260px,1fr] gap-6">
                    <aside className="hidden lg:block">
                        <SidebarNav />
                    </aside>

                    <div className="space-y-6">
                        <Routes>
                            <Route path="/" element={<Navigate to="/seo" replace />} />
                            <Route path="/seo" element={
                                <>
                                    <div id="hero">
                                        <HeroSection />
                                    </div>

                                    <div id="input-form" className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg">
                                        <div className="mb-6">
                                            <p className="text-lg text-gray-600">
                                                Welcome, <span className="font-bold text-gray-900">{user.name}</span> (Role: <span className="font-semibold text-teal-600">{user.role}</span>)
                                            </p>
                                        </div>
                                        
                                        <form onSubmit={handleSubmit}>
                                            <div className="grid lg:grid-cols-2 gap-8 items-start">
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <InputForm 
                                                        formData={formData}
                                                        setFormData={setFormData}
                                                        currentTags={currentTags}
                                                        setCurrentTags={setCurrentTags}
                                                        imagePreview={imagePreview}
                                                        handleImageProcessing={handleImageProcessing}
                                                        imageError={formError}
                                                    />
                                                </div>
                                                <HowToUseCard />
                                            </div>
                                            
                                            <div className="mt-6 text-center">
                                                {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
                                                <Button 
                                                    type="submit" 
                                                    disabled={isLoading}
                                                    className="w-1/2 mx-auto py-6 text-base"
                                                >
                                                {isLoading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Đang phân tích...
                                                    </>
                                                ) : "Analyze..."}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>

                                    {isLoading && <Loader progressMessage={progressMessage} />}
                                    
                                    {analysisError && (
                                    <div className="mt-8 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-center">
                                        <p className="font-bold">Lỗi!</p>
                                        <p>{analysisError}</p>
                                    </div>
                                    )}

                                    {analysisResult && !isLoading && (
                                    <div className="mt-12">
                                        <h2 className="text-3xl font-bold text-center text-teal-600 mb-8">Kết Quả Phân Tích SEO 360°</h2>
                                        {userInput && <AnalysisDisplay result={analysisResult} userInput={userInput} />}
                                    </div>
                                    )}
                                </>
                            } />
                            <Route path="/image" element={<ImageTab />} />
                            <Route path="/product-assistant" element={<ProductAssistantTab />} />
                            <Route path="/history" element={<HistoryTab />} />
                            <Route path="/settings" element={<SettingsTab />} />
                        </Routes>
                    </div>
                </div>
            </main>
            <footer className="text-center py-6 text-sm text-gray-500">
                <p>Created by TBM Ideas Commercial & Foundation Internal Only.</p>
            </footer>
        </div>
    );
};

const MainApp: React.FC<MainAppProps> = (props) => {
    return (
        <AppProvider>
            <MainContent {...props} />
        </AppProvider>
    );
};

export default MainApp;

