import React, { useCallback } from 'react';
import type { UserInput } from '../types';
import TagInput from './TagInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the props that this component will receive
interface InputFormProps {
  formData: Omit<UserInput, 'currentTags' | 'imageBase64' | 'imageMimeType'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<UserInput, 'currentTags' | 'imageBase64' | 'imageMimeType'>>>;
  currentTags: string[];
  setCurrentTags: (tags: string[]) => void;
  imagePreview: string | null;
  handleImageProcessing: (file: File) => void;
  imageError: string | null;
}


const InputForm: React.FC<InputFormProps> = ({
  formData,
  setFormData,
  currentTags,
  setCurrentTags,
  imagePreview,
  handleImageProcessing,
  imageError
}) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = useCallback((tags: string[]) => {
    setCurrentTags(tags);
  }, [setCurrentTags]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageProcessing(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if(file) {
              handleImageProcessing(file);
            }
            break;
        }
    }
  };
  
  const FormLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
    <Label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </Label>
  );

  return (
    <div className="space-y-6">
       <div>
        <FormLabel>Từ khoá chính (tùy chọn)</FormLabel>
        <p className="text-xs text-gray-500 mb-2">Từ khóa quan trọng nhất, cụ thể nhất mô tả sản phẩm của bạn.</p>
        <Input
          type="text"
          name="mainKeyword"
          value={formData.mainKeyword}
          onChange={handleChange}
          placeholder="Ví dụ: personalized wooden watch"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div>
          <FormLabel>Giá của sản phẩm (tùy chọn)</FormLabel>
          <p className="text-xs text-gray-500 mb-2">Giá niêm yết của sản phẩm trên Etsy.</p>
          <div className="flex">
            <Input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ví dụ: 250000"
              className="rounded-r-none"
            />
            <Select
              value={formData.currency}
              onValueChange={(val) => setFormData(prev => ({ ...prev, currency: val }))}
            >
              <SelectTrigger className="w-28 rounded-l-none border-l-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VND">VND</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="HUF">HUF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div>
        <FormLabel required>Tiêu đề hiện tại</FormLabel>
        <p className="text-xs text-gray-500 mb-2">Dán toàn bộ tiêu đề từ listing Etsy của bạn.</p>
        <Input
          type="text"
          name="currentTitle"
          value={formData.currentTitle}
          onChange={handleChange}
          placeholder="Ví dụ: Personalized Wooden Watch, Engraved Watch, Gift for Him..."
        />
      </div>
      
      <div>
        <FormLabel>13 Tags hiện tại (tùy chọn) <span className="font-normal text-gray-500">({currentTags.length}/13)</span></FormLabel>
        <p className="text-xs text-gray-500 mb-2">Nhập từng tag rồi nhấn Enter hoặc dấu phẩy, hoặc dán một danh sách các tag.</p>
        <TagInput tags={currentTags} onTagsChange={handleTagsChange} />
      </div>

      <div>
        <FormLabel>Ảnh thumbnail chính (tùy chọn)</FormLabel>
        <div 
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
          onPaste={handlePaste}
        >
            <div className="space-y-1 text-center">
                {imagePreview ? (
                    <img src={imagePreview} alt="Xem trước" className="mx-auto h-32 w-32 object-cover rounded-md" />
                ) : (
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500 px-1">
                        <span>Tải ảnh lên</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp, image/avif" />
                    </label>
                    <p className="pl-1">hoặc dán ảnh (Ctrl+V)</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP, AVIF tối đa 4MB</p>
            </div>
        </div>
         {imageError && <p className="text-red-500 text-sm text-center mt-2">{imageError}</p>}
      </div>
    </div>
  );
};

export default InputForm;

