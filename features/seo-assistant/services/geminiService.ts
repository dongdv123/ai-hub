import { GoogleGenAI, Type } from "@google/genai";
import type { UserInput, AnalysisResult } from '../types';

// --- Reusable Schema Parts ---
const tagSchema = {
    type: Type.OBJECT,
    properties: {
        tag: { type: Type.STRING },
        volume: { type: Type.STRING, description: "Ước tính khối lượng tìm kiếm trung bình hàng tháng, ví dụ: '1.5k/tháng'" },
        volumeMagnitude: { type: Type.STRING, description: "Đánh giá mức độ Khối lượng: Cao, Trung bình, hoặc Thấp" },
        competition: { type: Type.STRING, description: "Ước tính số lượng listing cạnh tranh trên Etsy, ví dụ: '25k listings'" },
        competitionMagnitude: { type: Type.STRING, description: "Đánh giá mức độ Cạnh tranh: Cao, Trung bình, hoặc Thấp" },
        intentRelevance: { type: Type.STRING, description: 'Đánh giá độ phù hợp ý định: Cao, Trung bình, hoặc Thấp' },
        reason: { type: Type.STRING, description: 'Nếu Độ Phù hợp Ý định là "Thấp", hãy giải thích ngắn gọn tại sao tag này không hiệu quả.' }
    },
    required: ['tag', 'volume', 'volumeMagnitude', 'competition', 'competitionMagnitude', 'intentRelevance']
};

const simpleTagSchema = {
    type: Type.OBJECT,
    properties: {
        tag: { type: Type.STRING },
        bucket: { type: Type.STRING, description: 'Bucket 1, 2, or 3' }
    },
    required: ['tag', 'bucket']
};

// --- Schemas for Sequential Calls ---

const marketAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        marketAnalysis: {
            type: Type.OBJECT,
            properties: {
                nicheAnalysis: { type: Type.STRING, description: 'Phân tích từ khóa chính và thị trường ngách.' },
                pricePositioning: { type: Type.STRING, description: 'Phân tích định vị giá của người dùng dựa trên kiến thức về ngách. KHÔNG đưa ra khoảng giá cụ thể.' }
            },
            required: ['nicheAnalysis', 'pricePositioning']
        },
        dataSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các nguồn dữ liệu đã sử dụng cho phân tích thị trường.'
        }
    },
    required: ['marketAnalysis', 'dataSources']
};

const auditSchema = {
    type: Type.OBJECT,
    properties: {
        audit: {
            type: Type.OBJECT,
            properties: {
                tagsAudit: { type: Type.ARRAY, items: tagSchema },
                titleAudit: {
                    type: Type.OBJECT,
                    properties: {
                        readability: { type: Type.STRING, description: 'Phân tích độ dễ đọc của tiêu đề.' },
                        optimization: { type: Type.STRING, description: 'Phân tích tối ưu hóa từ khóa trong tiêu đề.' },
                        waste: { type: Type.STRING, description: 'Phân tích các từ lãng phí trong tiêu đề.' }
                    },
                    required: ['readability', 'optimization', 'waste']
                }
            },
            required: ['tagsAudit', 'titleAudit']
        },
        dataSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các nguồn dữ liệu đã sử dụng cho việc kiểm toán.'
        }
    },
    required: ['audit', 'dataSources']
};

const buildOptimizationSchema = (withImage: boolean) => {
    const optimizationStrategyProperties: any = {
        packages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              strategyName: { type: Type.STRING, description: 'Tên của một trong sáu chiến lược được yêu cầu.' },
              newTitle: { type: Type.STRING, description: 'Tiêu đề mới được đề xuất BẰNG TIẾNG ANH, tối ưu cho chiến lược này.' },
              bulletPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 gạch đầu dòng mô tả ngắn gọn BẰNG TIẾNG ANH, theo phong cách Amazon.'
              },
              newTags: { 
                type: Type.ARRAY, 
                items: simpleTagSchema, 
                description: '13 tag mới được đề xuất.' 
              },
              rationale: { type: Type.STRING, description: 'Phân tích ngắn gọn về ưu/nhược điểm của chiến lược này, tệp khách hàng mục tiêu, và tại sao seller nên chọn nó.' },
              sellerProfileAndAds: {
                type: Type.OBJECT,
                properties: {
                    sellerProfile: { type: Type.STRING, description: 'Hồ sơ người bán lý tưởng cho chiến lược này (ví dụ: "Shop mới", "Shop đã có doanh thu ổn định").' },
                    adsStrategy: { type: Type.STRING, description: 'Chiến lược Etsy Ads được đề xuất (ví dụ: "Sử dụng chế độ Cân bằng (Balance) để...") và giải thích ngắn gọn.' }
                },
                required: ['sellerProfile', 'adsStrategy']
              }
            },
            required: ['strategyName', 'newTitle', 'bulletPoints', 'newTags', 'rationale', 'sellerProfileAndAds']
          }
        },
        relatedKeywords: {
            type: Type.ARRAY,
            items: tagSchema,
            description: 'Top 20 từ khóa liên quan hiệu quả nhất dựa trên chủ thể sản phẩm.'
        },
        attributeRecommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Danh sách các thuộc tính Etsy quan trọng cần điền, ví dụ: "Occasion: Birthday".'
        }
    };

    const optimizationStrategyRequired = ['packages', 'relatedKeywords', 'attributeRecommendations'];

    if (withImage) {
        optimizationStrategyProperties.imageCritique = { type: Type.STRING, description: 'Phê bình mang tính xây dựng về ảnh thumbnail và đề xuất cải thiện.' };
        optimizationStrategyRequired.push('imageCritique');
    }

    return {
      type: Type.OBJECT,
      properties: {
        optimizationStrategy: {
          type: Type.OBJECT,
          properties: optimizationStrategyProperties,
          required: optimizationStrategyRequired
        },
        dataSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các nguồn dữ liệu đã sử dụng để tạo chiến lược.'
        }
      },
      required: ['optimizationStrategy', 'dataSources']
    };
};

// --- Prompts for Sequential Calls ---

const buildMarketAnalysisPrompt = (userInput: UserInput): string => {
    const keywordLine = userInput.mainKeyword ? `- Main Keyword: "${userInput.mainKeyword}"` : '- Main Keyword: Not provided. The analysis will be based on the title.';
    const priceLine = userInput.price ? `- User's Price: ${userInput.price} ${userInput.currency}` : "- User's Price: Not provided.";

    const priceAnalysisInstruction = userInput.price
        ? `2.  **Price Positioning:** Based on your knowledge of the niche on Etsy, analyze the user's price. State if their price is likely perceived as budget-friendly, mid-range, or premium. **DO NOT provide a specific competitor price range.**`
        : `2.  **Price Positioning:** User did not provide a price. Provide general pricing strategy advice for the niche based on the current title.`;
    
    const nicheAnalysisInstruction = userInput.mainKeyword
        ? `1.  **Niche Analysis:** Analyze the main keyword. Describe the niche, customer profile, and what they are looking for.`
        : `1.  **Niche Analysis:** User did not provide a main keyword. Analyze the niche based on the current title: "${userInput.currentTitle}". Describe the niche, customer profile, and what they are looking for.`;

    const dataSourcingKeyword = userInput.mainKeyword || userInput.currentTitle;

    return `
    You are an expert Etsy SEO and marketing strategist. Your task is to perform a Market and Pricing Analysis for a user's Etsy listing.
    IMPORTANT: Your entire response must be in Vietnamese.
    DATA SOURCING: For market analysis, prioritize information from Google Trends and Google Search using operators like "site:etsy.com [keyword]".
    
    User's Listing Information:
    ${keywordLine}
    - Current Title: "${userInput.currentTitle}"
    ${priceLine}

    Perform the following analysis and structure your response strictly according to the provided JSON schema.
    
    **Stage 1: Market & Pricing Analysis**
    ${nicheAnalysisInstruction}
    ${priceAnalysisInstruction}
    
    **Stage 2: Data Sources**
    - List the primary data sources you used for this analysis in the \`dataSources\` field. Be specific (e.g., "Google Trends for '${dataSourcingKeyword}'").
`;
};


const buildAuditPrompt = (userInput: UserInput, marketAnalysisContext: string): string => {
    const keywordForSourcing = userInput.mainKeyword || userInput.currentTitle;

    return `
    You are an expert Etsy SEO and marketing strategist. Your task is to perform a Title & Tags Audit for a user's Etsy listing.
    IMPORTANT: Your entire response must be in Vietnamese.
    DATA SOURCING: For search volume and competition data, prioritize information from Google Trends and Google Search using operators like "site:etsy.com ${keywordForSourcing}".

    CONTEXT FROM MARKET ANALYSIS (Use this to inform your audit):
    ${marketAnalysisContext}

    User's Listing Information:
    - Current Title: "${userInput.currentTitle}"
    - Current 13 Tags: "${userInput.currentTags.filter(tag => tag.trim() !== '').join(', ')}"

    Perform the following analysis and structure your response strictly according to the provided JSON schema.

    **Stage 1: Title & Tags Audit**
    1.  **Tags Audit:** For each of the user's 13 tags, create an audit. Evaluate each tag on the following criteria:
        -   **Search Volume (Khối lượng):** Provide an estimated monthly search volume, for example: '1.5k/tháng'.
        -   **Volume Magnitude (Mức độ Khối lượng):** Classify the volume as "Cao", "Trung bình", or "Thấp" based on these rules: >5k/month is Cao, 1k-5k/month is Trung bình, <1k/month is Thấp.
        -   **Competition (Độ Cạnh Tranh):** Provide an estimated number of competing listings, for example: '25k listings'.
        -   **Competition Magnitude (Mức độ Cạnh tranh):** Classify the competition as "Cao", "Trung bình", or "Thấp" based on these rules: >50k listings is Cao, 10k-50k listings is Trung bình, <10k listings is Thấp.
        -   **Intent Relevance (Độ Phù hợp Ý định):** Use "Cao", "Trung bình", or "Thấp" for evaluation.
        **CRITICAL:** If a tag has 'Thấp' Intent Relevance, you **MUST** provide a brief explanation in the \`reason\` field explaining why it is not suitable.
    2.  **Title Audit:** "Score" the current title based on Readability, Optimization, and Waste.

    **Stage 2: Data Sources**
    - List the primary data sources you used for this analysis.
`;
};

const buildOptimizationPrompt = (userInput: UserInput, marketAnalysisContext: string, auditContext: string): string => {
    const { imageBase64, currentDate, mainKeyword, currentTitle } = userInput;
    const imageProvided = !!imageBase64;
    const productConcept = mainKeyword || currentTitle;

    const imageCritiquePrompt = imageProvided
    ? `4.  **Image Critique:** Analyze the provided thumbnail image. Give 1-2 constructive, actionable critiques.`
    : `4. **Image Critique:** No image was provided, so skip this step.`;
    
    const titleInstruction = mainKeyword 
        ? `Place the main keyword ("${mainKeyword}") first if it makes sense, but the priority is a title that is clear and easy to read.`
        : `Create a title based on the product concept derived from the current title ("${currentTitle}"). The title must be clear and easy to read.`;

    return `
    You are an expert Etsy SEO and marketing strategist specializing in the 2025 Etsy algorithm. Your task is to provide a comprehensive 360° optimization strategy based on the principle of a "Holistic Listing Ecosystem".
    IMPORTANT: Your entire response must be in Vietnamese, EXCEPT for the 'newTitle' and 'bulletPoints' fields which MUST be in English.
    
    CORE ETSY 2025 PHILOSOPHY TO FOLLOW:
    - The Etsy algorithm has evolved. It no longer relies on simple keyword matching. It takes a holistic view of the entire listing.
    - **Title's Role:** The title's primary function is CONVERSION and BUYER TRUST, not keyword stuffing. It must be clear, concise, and human-friendly.
    - **Tags' Role:** Tags are now the SEO heavy-lifters for DISCOVERY, especially for long-tail keywords.
    - **Attributes & Categories:** These act as "secret tags". You must avoid wasting tag space on terms already covered by attributes (color, material, etc.) or the category itself.
    
    FULL CONTEXT FROM PREVIOUS ANALYSIS (Use this to create superior strategies):
    --- Market & Pricing Analysis ---
    ${marketAnalysisContext}
    ---
    --- Title & Tags Audit ---
    ${auditContext}
    ---

    CONTEXT: LATEST ETSY ADS STRATEGIES FOR 2024/2025
    - Balance Mode (Cân bằng): Default for budgets <$25/day.
    - Expand Mode (Mở rộng): For budgets >$25/day. Maximizes sales.
    - Efficiency Mode (Hiệu quả): For budgets >$25/day. Maximizes profit.

    User's Product Concept (based on Main Keyword or Title): "${productConcept}"
    Thumbnail image provided: ${imageProvided ? 'Yes' : 'No'}
    Current Date for analysis: ${currentDate}

    Perform the following and structure your response strictly according to the provided JSON schema.

    **Stage 1: 360° Optimization Strategy**
    1.  **Title + Tags Packages:** Create exactly SIX distinct optimization packages. The six strategies are:
        - **Balanced Strategy (Chiến lược Cân bằng)**
        - **Super-Niche Strategy (Chiến lược Siêu ngách)**
        - **Broad Traffic Strategy (Chiến lược Kéo Traffic)**
        - **Question-Based Strategy (Chiến lược Dựa trên câu hỏi)**
        - **Event-Driven Strategy (Chiến lược Theo sự kiện):** Use current date (${currentDate}) for *upcoming* holidays.
        - **Competitor-Angle Strategy (Chiến lược Góc nhìn đối thủ)**

        For each package, you MUST provide:
        - A **new, buyer-friendly Title (in English)**. ${titleInstruction} AVOID keyword stuffing.
        - 3-5 bullet points (in English).
        - A 'rationale' and a 'sellerProfileAndAds' object.
        - A new set of 13 tags using the simple tag schema (tag + bucket).
        
        **CRITICAL: THE "3-BUCKET" TAG STRATEGY (2025 METHOD)**
        For each package, the 13 tags **MUST** be a strategic mix from these three buckets to ensure a balanced portfolio:
        -   **Bucket 1 (Visibility):** High volume, low competition.
        -   **Bucket 2 (Reach):** High volume, medium competition.
        -   **Bucket 3 (Bestseller):** High volume, high competition.
        
        **ABSOLUTE RULES FOR TAGS:**
        -   **NO REPETITION:** Do NOT use the same word in multiple tags.
        -   **NO ATTRIBUTE/CATEGORY REPETITION:** Do NOT use a tag for something already in the product's attributes or category.
        -   **NO PLURALS/MISSPELLINGS:** Do NOT add both "mug" and "mugs".
        -   **NO GENERIC TERMS:** Do NOT use single, vague tags like "gift", "art".

    2.  **Top 20 Related Keywords:** First, identify the primary subject from "${productConcept}" (e.g., for 'peacock suncatcher', the subject is 'peacock'). Then, generate a list of the top 20 most effective related keywords for that subject. These should be creative and useful for expanding reach. For each keyword, provide a full analysis (volume, competition, intent relevance).
    3.  **Attribute Recommendations:** Suggest important Etsy Attributes. These are critical for filtered searches.
    ${imageCritiquePrompt}
    
    **Stage 2: Data Sources**
    - List the primary data sources you used.
  `;
}

export const refinePrompt = async (prompt: string, style?: string, position?: string, size?: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";
    if (!apiKey) return prompt;
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";
    
    try {
        let instruction = `You are an expert at writing prompts for high-quality product photography using AI models like FLUX or Midjourney. 
                    Enhance the following basic prompt into a professional, detailed, and visually descriptive prompt. 
                    Focus on lighting, texture, camera angle, and professional studio settings.
                    Keep the core subject the same.
                    IMPORTANT: Ensure the prompt describes a visual scene and does NOT result in any text, labels, or watermarks appearing on the image.
                    Output ONLY the enhanced prompt in English.`;

        let fullInput = `Basic Prompt: ${prompt}`;
        if (style && style !== 'None') fullInput += `\nStyle: ${style}`;
        if (position) fullInput += `\nPosition in image: ${position}`;
        if (size) fullInput += `\nSize: ${size}`;

        const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: `${instruction}\n\n${fullInput}` }] }]
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error refining prompt:", error);
        return prompt;
    }
};

export const analyzeImageRegion = async (imageBase64: string, maskBase64: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";
    if (!apiKey) return "";
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ 
                role: 'user',
                parts: [
                    { text: "Analyze the area highlighted in white in the mask image relative to the original image. Describe only the object or element that needs to be replaced or modified in the highlighted area. Provide a short, concise description in English suitable for an image generation prompt." },
                    { inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } },
                    { inlineData: { mimeType: "image/png", data: maskBase64.split(',')[1] } }
                ] 
            }]
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing image region:", error);
        return "";
    }
};

export const generateSEOMetadata = async (prompt: string): Promise<{ title: string; tags: string[] }> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";
    if (!apiKey) return { title: "", tags: [] };
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A SEO-optimized Etsy title in English." },
            tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 13 SEO-optimized Etsy tags in English." 
            }
        },
        required: ["title", "tags"]
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ 
                role: 'user', 
                parts: [{ text: `Based on this image description (prompt), generate a SEO-optimized Etsy Title and exactly 13 Tags.
                    Everything must be in English.
                    The title should be clear and descriptive.
                    The tags should be relevant long-tail keywords.
                    
                    Prompt: ${prompt}` }] 
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        const result = JSON.parse(response.text);
        return {
            title: result.title || "",
            tags: result.tags || []
        };
    } catch (error) {
        console.error("Error generating SEO metadata:", error);
        return { title: "", tags: [] };
    }
};

// --- Main Orchestrator Function ---

export const getEtsyAnalysis = async (
    userInput: UserInput, 
    updateProgress: (message: string) => void
): Promise<AnalysisResult> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : "") || "";
    if (!apiKey) {
        throw new Error("API Key Gemini chưa được cấu hình. Vui lòng kiểm tra file .env.local");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const withImage = !!userInput.imageBase64;
    const model = "gemini-2.0-flash";

    try {
        // Step 1: Market Analysis
        updateProgress("Giai đoạn 1: Phân tích Thị trường & Định giá...");
        const marketAnalysisResponse = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: buildMarketAnalysisPrompt(userInput) }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: marketAnalysisSchema,
                maxOutputTokens: 2048,
            },
        });
        const marketAnalysisText = marketAnalysisResponse.text;

        // Step 2: Audit, using context from Step 1
        updateProgress("Giai đoạn 2: Kiểm toán Title & Tags...");
        const auditResponse = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: buildAuditPrompt(userInput, marketAnalysisText) }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: auditSchema,
                maxOutputTokens: 4096,
            },
        });
        const auditText = auditResponse.text;

        // Step 3: Optimization Strategy, using context from Steps 1 & 2
        updateProgress("Giai đoạn 3: Tạo Chiến lược Tối ưu 360°...");
        const optimizationParts: any[] =
            [{ text: buildOptimizationPrompt(userInput, marketAnalysisText, auditText) }];

        if (userInput.imageBase64 && userInput.imageMimeType) {
            optimizationParts.push({
                inlineData: {
                    mimeType: userInput.imageMimeType,
                    data: userInput.imageBase64.split(',')[1] || userInput.imageBase64,
                },
            });
        }
        
        const optimizationResponse = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: optimizationParts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: buildOptimizationSchema(withImage),
                maxOutputTokens: 8192,
            },
        });
        const optimizationText = optimizationResponse.text;

        updateProgress("Đang tổng hợp kết quả...");

        // Combine all results
        let marketAnalysisData, auditData, optimizationData;
        
        try {
            marketAnalysisData = JSON.parse(marketAnalysisText);
        } catch (e) {
            console.error("Failed to parse marketAnalysisData:", marketAnalysisText);
            throw e;
        }

        try {
            auditData = JSON.parse(auditText);
        } catch (e) {
            console.error("Failed to parse auditData:", auditText);
            throw e;
        }

        try {
            optimizationData = JSON.parse(optimizationText);
        } catch (e) {
            // Try to fix common JSON issues if parsing fails
            const fixedText = optimizationText.trim();
            try {
                optimizationData = JSON.parse(fixedText);
            } catch (e2) {
                console.error("Failed to parse optimizationData even after trim:", optimizationText);
                throw e2;
            }
        }
        
        const allDataSources = [
            ...(marketAnalysisData.dataSources || []),
            ...(auditData.dataSources || []),
            ...(optimizationData.dataSources || [])
        ];

        const finalResult: AnalysisResult = {
            marketAnalysis: marketAnalysisData.marketAnalysis,
            audit: auditData.audit,
            optimizationStrategy: optimizationData.optimizationStrategy,
            dataSources: [...new Set(allDataSources)], // Remove duplicates
        };
        
        if (!finalResult.marketAnalysis || !finalResult.audit || !finalResult.optimizationStrategy) {
             throw new Error("Invalid response structure from sequential API calls.");
        }

        return finalResult;

    } catch (error) {
        console.error("Error during sequential Gemini API calls:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
            throw new Error("Failed to parse the response from the AI. The AI might have returned an unexpected format.");
        }
        throw new Error("An error occurred while communicating with the AI. Please check your inputs and try again.");
    }
};

