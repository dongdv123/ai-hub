import React from 'react';

interface ResultSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ResultSection: React.FC<ResultSectionProps> = ({ title, icon, children }) => {
  return (
    <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="bg-teal-100 text-teal-600 p-2 rounded-full mr-4 border border-teal-200">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="pl-14">
        {children}
      </div>
    </section>
  );
};

export default ResultSection;

