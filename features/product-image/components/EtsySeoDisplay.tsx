import React, { useState } from 'react';
import { EtsySeoResult } from '../services/geminiService';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface EtsySeoDisplayProps {
  data: EtsySeoResult;
  onSeoChange?: (newData: EtsySeoResult) => void;
  disabled: boolean;
}

type CopiedState = {
    [key in 'title1' | 'tags1' | 'title2' | 'tags2']?: boolean;
};

const EtsySeoDisplay: React.FC<EtsySeoDisplayProps> = ({ data, onSeoChange, disabled }) => {
    const { title1, tags1, title2, tags2 } = data;
    const [copied, setCopied] = useState<CopiedState>({});

    const handleCopy = (field: keyof CopiedState, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied({ ...copied, [field]: true });
        setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
    };

    const handleTitleChange = (field: 'title1' | 'title2', value: string) => {
        if (onSeoChange) {
            onSeoChange({ ...data, [field]: value });
        }
    };

    const handleTagsChange = (field: 'tags1' | 'tags2', value: string) => {
        if (onSeoChange) {
            onSeoChange({ ...data, [field]: value.split(',').map(tag => tag.trim()) });
        }
    };

    const disabledClasses = "disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-default disabled:border-gray-200";

    const CopyButton: React.FC<{ field: keyof CopiedState; text: string }> = ({ field, text }) => (
        <button
            type="button"
            onClick={() => handleCopy(field, text)}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-teal-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label={`Copy ${field}`}
        >
            {copied[field] ? <CheckIcon className="h-5 w-5 text-green-500" /> : <ClipboardIcon className="h-5 w-5" />}
        </button>
    );

    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 gap-6">
                {/* Phiên bản 1 */}
                <div className="space-y-4">
                    <div>
                         <label htmlFor="title-1" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề 1</label>
                         <div className="relative">
                            <input
                                id="title-1"
                                type="text"
                                value={title1}
                                onChange={(e) => handleTitleChange('title1', e.target.value)}
                                className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition ${disabledClasses}`}
                                disabled={disabled}
                            />
                            <CopyButton field="title1" text={title1} />
                         </div>
                    </div>
                     <div>
                         <label htmlFor="tags-1" className="block text-sm font-medium text-gray-700 mb-1">Thẻ 1 ({tags1.length})</label>
                         <div className="relative">
                            <textarea
                                id="tags-1"
                                rows={4}
                                value={tags1.join(', ')}
                                onChange={(e) => handleTagsChange('tags1', e.target.value)}
                                className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm ${disabledClasses}`}
                                disabled={disabled}
                            />
                            <CopyButton field="tags1" text={tags1.join(', ')} />
                        </div>
                    </div>
                </div>

                {/* Phiên bản 2 */}
                <div className="space-y-4">
                    <div>
                         <label htmlFor="title-2" className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề 2</label>
                         <div className="relative">
                            <input
                                id="title-2"
                                type="text"
                                value={title2}
                                onChange={(e) => handleTitleChange('title2', e.target.value)}
                                className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition ${disabledClasses}`}
                                disabled={disabled}
                            />
                            <CopyButton field="title2" text={title2} />
                        </div>
                    </div>
                     <div>
                         <label htmlFor="tags-2" className="block text-sm font-medium text-gray-700 mb-1">Thẻ 2 ({tags2.length})</label>
                         <div className="relative">
                            <textarea
                                id="tags-2"
                                rows={4}
                                value={tags2.join(', ')}
                                onChange={(e) => handleTagsChange('tags2', e.target.value)}
                                className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-sm ${disabledClasses}`}
                                disabled={disabled}
                            />
                            <CopyButton field="tags2" text={tags2.join(', ')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EtsySeoDisplay;
