export interface UserInput {
  mainKeyword: string;
  price: string;
  currency: string;
  currentTitle: string;
  currentTags: string[];
  imageBase64: string | null;
  imageMimeType: string | null;
  currentDate: string;
}

export interface MarketAnalysisData {
  nicheAnalysis: string;
  pricePositioning: string;
}

export interface TagAuditData {
  tag: string;
  volume: string;
  volumeMagnitude: string;
  competition: string;
  competitionMagnitude: string;
  intentRelevance: string;
  reason?: string;
}

export interface TitleAuditData {
  readability: string;
  optimization: string;
  waste: string;
}

export interface AuditData {
  tagsAudit: TagAuditData[];
  titleAudit: TitleAuditData;
}

export interface OptimizationPackage {
  strategyName: string;
  newTitle: string;
  bulletPoints: string[];
  newTags: TagAuditData[];
  rationale: string;
  sellerProfileAndAds: {
    sellerProfile: string;
    adsStrategy: string;
  };
}

export interface OptimizationStrategyData {
  packages: OptimizationPackage[];
  attributeRecommendations: string[];
  relatedKeywords: TagAuditData[];
  imageCritique?: string;
}

export interface AnalysisResult {
  marketAnalysis: MarketAnalysisData;
  audit: AuditData;
  optimizationStrategy: OptimizationStrategyData;
  dataSources: string[];
}

export interface AuthUser {
  id: number;
  name: string;
  role: string;
}

