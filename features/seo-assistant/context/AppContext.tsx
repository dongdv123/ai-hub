import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
    currentTitle: string;
    setCurrentTitle: (title: string) => void;
    currentTags: string[];
    setCurrentTags: (tags: string[]) => void;
    mainKeyword: string;
    setMainKeyword: (keyword: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    const [mainKeyword, setMainKeyword] = useState('');

    return (
        <AppContext.Provider value={{ 
            currentTitle, 
            setCurrentTitle, 
            currentTags, 
            setCurrentTags,
            mainKeyword,
            setMainKeyword
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
