import React from 'react';
import type { AnalysisResult, UserInput } from '../types';
import MarketAnalysis from './MarketAnalysis';
import AuditAnalysis from './AuditAnalysis';
import OptimizationStrategy from './OptimizationStrategy';
import HowToApply from './HowToApply';
import DataSources from './DataSources';

interface AnalysisDisplayProps {
  result: AnalysisResult;
  userInput: UserInput;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, userInput }) => {
  return (
    <div className="space-y-12">
      <section id="how-to-apply">
        <HowToApply />
      </section>
      <section id="market-analysis">
        <MarketAnalysis data={result.marketAnalysis} />
      </section>
      <section id="audit">
        <AuditAnalysis data={result.audit} />
      </section>
      <section id="optimization">
        <OptimizationStrategy data={result.optimizationStrategy} userInput={userInput} />
      </section>
      <section id="data-sources">
        <DataSources sources={result.dataSources} />
      </section>
    </div>
  );
};

export default AnalysisDisplay;

