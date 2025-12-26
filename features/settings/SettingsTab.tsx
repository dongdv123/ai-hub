import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CheckIcon from '../product-image/components/icons/CheckIcon';

const SETTINGS_KEY = 'app_api_settings';

export interface ApiSettings {
    geminiApiKey: string;
    runwareApiKey: string;
}

export const getApiSettings = (): ApiSettings => {
    return {
        geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        runwareApiKey: import.meta.env.VITE_RUNWARE_API_KEY || '',
    };
};

const SettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<ApiSettings>({ geminiApiKey: '', runwareApiKey: '' });
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(getApiSettings());
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/save-env', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });
            
            if (response.ok) {
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            } else {
                console.error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (key: keyof ApiSettings) => {
        setSettings(prev => ({ ...prev, [key]: '' }));
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Thiết lập hệ thống</h2>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="gemini-api">Google Gemini API Key</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="gemini-api"
                            type="password"
                            placeholder="Nhập Google Gemini API Key..."
                            value={settings.geminiApiKey}
                            onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                            className="font-mono flex-1"
                        />
                        <Button 
                            variant="outline" 
                            onClick={() => handleDelete('geminiApiKey')}
                            className="px-3 text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                            title="Xóa Key"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Được sử dụng cho Trợ lý SEO và Trợ lý sản phẩm. Lấy tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">Google AI Studio</a>.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="runware-api">Runware API Key</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="runware-api"
                            type="password"
                            placeholder="Nhập Runware API Key..."
                            value={settings.runwareApiKey}
                            onChange={(e) => setSettings({ ...settings, runwareApiKey: e.target.value })}
                            className="font-mono flex-1"
                        />
                        <Button 
                            variant="outline" 
                            onClick={() => handleDelete('runwareApiKey')}
                            className="px-3 text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                            title="Xóa Key"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Được sử dụng để tạo hình ảnh AI. Lấy tại <a href="https://runware.ai/" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">Runware.ai</a>.
                    </p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <Button onClick={handleSave} className="px-8" disabled={isSaving}>
                        {isSaving ? 'Đang lưu...' : 'Lưu thiết lập'}
                    </Button>
                    {isSaved && (
                        <span className="flex items-center gap-1 text-green-600 font-medium animate-fade-in">
                            <CheckIcon className="h-5 w-5" />
                            Đã lưu vào .env.local!
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-blue-800 font-bold text-sm mb-1">Thông tin lưu trữ:</h3>
                <p className="text-blue-700 text-xs leading-relaxed">
                    API Key sẽ được lưu vào file <code>.env.local</code> trên máy của bạn. Server sẽ tự động khởi động lại để áp dụng thay đổi.
                </p>
            </div>
        </div>
    );
};

export default SettingsTab;
