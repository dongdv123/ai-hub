import React from 'react';

interface DataSourcesProps {
    sources: string[];
}

const DataSources: React.FC<DataSourcesProps> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-12 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-gray-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Nguồn Dữ Liệu Phân Tích
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                {sources.map((source, index) => (
                    <li key={index}>{source}</li>
                ))}
            </ul>
        </div>
    );
};

export default DataSources;
