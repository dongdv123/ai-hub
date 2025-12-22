import React, { useState, useRef } from 'react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTags = (tagsToAdd: string[]) => {
    const lowercasedExistingTags = tags.map(t => t.toLowerCase());
    const newTags = tagsToAdd
      .map(tag => tag.trim())
      // Filter out empty, too long, or duplicate tags
      .filter(tag => tag && tag.length <= 20 && !lowercasedExistingTags.includes(tag.toLowerCase()));

    // Handle duplicates within the pasted list itself (e.g., "tag, tag")
    const uniqueNewTags = Array.from(new Set(newTags.map(t => t.toLowerCase()))).map(lowerTag => {
      return newTags.find(t => t.toLowerCase() === lowerTag)!;
    });

    if (uniqueNewTags.length > 0) {
      const updatedTags = [...tags, ...uniqueNewTags].slice(0, 13);
      onTagsChange(updatedTags);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue) {
        addTags([inputValue]);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      onTagsChange(tags.slice(0, tags.length - 1));
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedTags = pastedText.split(/[,;\n]/).map(tag => tag.trim());
    addTags(pastedTags);
  };
  
  const handleComposition = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(e.type === 'compositionstart');
  };

  return (
    <div
      className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 flex items-center flex-wrap gap-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <div key={index} className="flex items-center bg-teal-100 text-teal-800 text-sm font-medium pl-3 pr-2 py-1 rounded-full">
          <span>{tag}</span>
          <button
            type="button"
            className="ml-2 p-0.5 text-teal-600 hover:text-teal-800 focus:outline-none focus:bg-teal-200 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(index);
            }}
            aria-label={`Remove ${tag}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={handleComposition}
        onCompositionUpdate={handleComposition}
        onCompositionEnd={handleComposition}
        className="flex-grow bg-transparent text-gray-900 outline-none min-w-[120px] text-sm py-1"
        placeholder={tags.length < 13 ? 'Thêm tag...' : 'Tối đa 13 tags'}
        disabled={tags.length >= 13}
        maxLength={20}
      />
    </div>
  );
};

export default TagInput;

