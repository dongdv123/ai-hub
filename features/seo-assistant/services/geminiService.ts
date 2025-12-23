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

// --- Schemas for Sequential Calls ---

const marketAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        nicheAnalysis: { type: Type.STRING, description: 'Phân tích từ khóa chính và thị trường ngách.' },
        pricePositioning: { type: Type.STRING, description: 'Phân tích định vị giá của người dùng dựa trên kiến thức về ngách. KHÔNG đưa ra khoảng giá cụ thể.' },
        dataSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các nguồn dữ liệu đã sử dụng cho phân tích thị trường.'
        }
    },
    required: ['nicheAnalysis', 'pricePositioning', 'dataSources']
};

const auditSchema = {
    type: Type.OBJECT,
    properties: {
        tagsAudit: { 
            type: Type.ARRAY, 
            items: tagSchema,
            description: 'Danh sách kiểm toán cho TẤT CẢ các tag hiện tại của người dùng.'
        },
        titleAudit: {
            type: Type.OBJECT,
            properties: {
                readability: { type: Type.STRING, description: 'Phân tích độ dễ đọc của tiêu đề.' },
                optimization: { type: Type.STRING, description: 'Phân tích tối ưu hóa từ khóa trong tiêu đề.' },
                waste: { type: Type.STRING, description: 'Phân tích các từ lãng phí trong tiêu đề.' }
            },
            required: ['readability', 'optimization', 'waste']
        },
        dataSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Danh sách các nguồn dữ liệu đã sử dụng cho việc kiểm toán.'
        }
    },
    required: ['tagsAudit', 'titleAudit', 'dataSources']
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
                items: tagSchema, 
                description: '13 tag mới được đề xuất kèm phân tích chi tiết.' 
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

// --- Helper Functions ---

const extractJSON = (text: string) => {
    try {
        // Find the first '{' and last '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        
        if (start !== -1 && end !== -1 && end > start) {
            let jsonStr = text.substring(start, end + 1);
            
            // Basic cleanup for common issues
            jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            
            // Attempt to balance brackets if truncated
            let openBraces = 0;
            let openBrackets = 0;
            let validEnd = -1;
            
            for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') openBraces++;
                else if (jsonStr[i] === '}') openBraces--;
                else if (jsonStr[i] === '[') openBrackets++;
                else if (jsonStr[i] === ']') openBrackets--;
                
                if (openBraces === 0 && openBrackets === 0 && i > 0) {
                    validEnd = i;
                    break;
                }
            }
            
            if (validEnd !== -1) {
                jsonStr = jsonStr.substring(0, validEnd + 1);
            }
            
            return JSON.parse(jsonStr);
        }
        throw new Error("No valid JSON found in response");
    } catch (e) {
        console.error("JSON Extraction Error:", e, "Original text:", text);
        throw e;
    }
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
    const auditTags = userInput.currentTags.filter(tag => tag.trim() !== '');

    return `
    You are an expert Etsy SEO and marketing strategist. Your task is to perform a Title & Tags Audit for a user's Etsy listing.
    IMPORTANT: Your entire response must be in Vietnamese.
    DATA SOURCING: For search volume and competition data, prioritize information from Google Trends and Google Search using operators like "site:etsy.com ${keywordForSourcing}".

    CONTEXT FROM MARKET ANALYSIS (Use this to inform your audit):
    ${marketAnalysisContext}

    **REQUIRED JSON STRUCTURE:**
    You must return a JSON object exactly like this (fill with actual analysis):
    {
      "tagsAudit": [
        {
          "tag": "tên tag 1",
          "volume": "1.2k/tháng",
          "volumeMagnitude": "Trung bình",
          "competition": "15k listings",
          "competitionMagnitude": "Trung bình",
          "intentRelevance": "Cao",
          "reason": ""
        }
        ... (exactly ${auditTags.length} items)
      ],
      "titleAudit": {
        "readability": "...",
        "optimization": "...",
        "waste": "..."
      },
      "dataSources": ["Google Trends", "Etsy Search"]
    }

    **USER LISTING TO AUDIT:**
    - Current Title: "${userInput.currentTitle}"
    - Current Tags (${auditTags.length} total):
        ${auditTags.map((t, i) => `${i + 1}. ${t.trim()}`).join('\n        ')}

    Structure your entire response strictly according to the provided JSON schema. 
    Double check that \`tagsAudit\` has exactly ${auditTags.length} items before responding.
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
    1.  **Title + Tags Packages:** Create exactly THREE distinct optimization packages. The three strategies are:
        - **Balanced Strategy (Chiến lược Cân bằng)**
        - **Super-Niche Strategy (Chiến lược Siêu ngách)**
        - **Broad Traffic Strategy (Chiến lược Kéo Traffic)**

        For each package, you MUST provide:
        - A **new, buyer-friendly Title (in English)**. ${titleInstruction} AVOID keyword stuffing.
        - 3-5 bullet points (in English).
        - A 'rationale' and a 'sellerProfileAndAds' object.
        - A new set of 13 tags with full analysis (volume, competition, etc.).
        
        **CRITICAL: THE "3-BUCKET" TAG STRATEGY (2025 METHOD)**
        For each package, the 13 tags **MUST** be a strategic mix from these three buckets to ensure a balanced portfolio:
        -   **Bucket 1: Visibility Keywords (Từ khóa Hiển thị):** Keywords with HIGH search volume and LOW competition. These are your "low-hanging fruit".
        -   **Bucket 2: Reach Keywords (Từ khóa Tiếp cận):** Keywords with HIGH search volume and MEDIUM competition.
        -   **Bucket 3: Bestseller Keywords (Từ khóa Bán chạy):** Keywords with HIGH search volume and HIGH competition. You use these strategically to compete directly with top listings.

        **ABSOLUTE RULES FOR TAGS (CÁC ĐIỀU CẤM KỴ):**
        -   **NO REPETITION:** Do NOT use the same word in multiple tags (e.g., "bird art" and "bird design" is bad).
        -   **NO ATTRIBUTE/CATEGORY REPETITION:** Do NOT use a tag for something already in the product's attributes (color, material) or category. This is the biggest waste of space.
        -   **NO PLURALS/MISSPELLINGS:** Do NOT add both "mug" and "mugs". Etsy handles this automatically.
        -   **NO GENERIC TERMS:** Do NOT use single, vague tags like "gift", "art", "shirt".
        -   **THINK CONCEPTUALLY:** Use multi-word phrases, synonyms (e.g., "tee" for "shirt"), regional terms (e.g., "grey" vs "gray"), and conceptual tags describing the style ("cottagecore clothing"), occasion ("housewarming gift"), or recipient ("gift for gardener").

    2.  **Top 10 Related Keywords:** First, identify the primary subject from "${productConcept}" (e.g., for 'peacock suncatcher', the subject is 'peacock'). Then, generate a list of the top 10 most effective related keywords for that subject. These should be creative and useful for expanding reach. For each keyword, provide a full analysis (volume, competition, intent relevance).
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
            contents: { parts: [{ text: `${instruction}\n\n${fullInput}` }] }
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
            contents: { 
                parts: [
                    { text: "Analyze the area highlighted in white in the mask image relative to the original image. Describe only the object or element that needs to be replaced or modified in the highlighted area. Provide a short, concise description in English suitable for an image generation prompt." },
                    { inlineData: { mimeType: "image/png", data: imageBase64.split(',')[1] } },
                    { inlineData: { mimeType: "image/png", data: maskBase64.split(',')[1] } }
                ] 
            }
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
            contents: { 
                parts: [{ text: `Based on this image description (prompt), generate a SEO-optimized Etsy Title and exactly 13 Tags.
                    Everything must be in English.
                    The title should be clear and descriptive.
                    The tags should be relevant long-tail keywords.
                    Prompt: ${prompt}` }] 
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        // Use property .text if available (demo style), else fallback to .response.text()
        const responseText = response.text || (response.response && typeof response.response.text === 'function' ? response.response.text() : "");
        const result = extractJSON(responseText);
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
    
    // Stable model names for 2025
    const fastModel = "gemini-2.0-flash"; 
    const highQualityModel = "gemini-2.0-flash"; // Using flash for both to improve speed and reliability

    try {
        // Step 1: Market Analysis
        updateProgress("Giai đoạn 1: Phân tích Thị trường & Định giá...");
        const marketAnalysisResponse = await ai.models.generateContent({
            model: fastModel,
            contents: { parts: [{ text: buildMarketAnalysisPrompt(userInput) }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: marketAnalysisSchema,
                maxOutputTokens: 2048,
            },
        });
        
        const marketAnalysisText = marketAnalysisResponse.text || (marketAnalysisResponse.response && typeof marketAnalysisResponse.response.text === 'function' ? marketAnalysisResponse.response.text() : "");
        
        if (!marketAnalysisText) {
            console.error("No response from AI at Stage 1. Response object:", marketAnalysisResponse);
            throw new Error("Không nhận được phản hồi từ AI ở Giai đoạn 1. Vui lòng thử lại.");
        }

        let marketAnalysisData;
        try {
            marketAnalysisData = extractJSON(marketAnalysisText);
            console.log("Stage 1 Data:", marketAnalysisData);
        } catch (e) {
            console.error("Failed to parse marketAnalysisData:", marketAnalysisText);
            throw new Error("Không thể phân tích kết quả Phân tích thị trường. Vui lòng thử lại.");
        }

    // Step 2: Audit, using context from Step 1
    updateProgress("Giai đoạn 2: Kiểm toán Title & Tags...");
    const auditResponse = await ai.models.generateContent({
        model: fastModel,
        contents: { parts: [{ text: buildAuditPrompt(userInput, JSON.stringify(marketAnalysisData)) }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: auditSchema,
            maxOutputTokens: 8192,
        },
    });
    
    const auditText = auditResponse.text || (auditResponse.response && typeof auditResponse.response.text === 'function' ? auditResponse.response.text() : "");
    
    if (!auditText) {
        console.error("No response from AI at Stage 2. Response object:", auditResponse);
        throw new Error("Không nhận được phản hồi từ AI ở Giai đoạn 2. Vui lòng thử lại.");
    }

    let auditData;
    try {
        auditData = extractJSON(auditText);
        console.log("Stage 2 Data:", auditData);
        console.log(`Audit Stage 2 - Parsed ${auditData?.tagsAudit?.length || 0} tags.`);
    } catch (e) {
        console.error("Failed to parse auditData:", auditText);
        throw new Error("Không thể phân tích kết quả Kiểm toán. Vui lòng thử lại.");
    }

        // Step 3: Optimization Strategy, using context from Steps 1 & 2
        updateProgress("Giai đoạn 3: Tạo Chiến lược Tối ưu 360°...");
        const optimizationParts: any[] =
            [{ text: buildOptimizationPrompt(userInput, JSON.stringify(marketAnalysisData), auditText) }];

        if (userInput.imageBase64 && userInput.imageMimeType) {
            optimizationParts.push({
                inlineData: {
                    mimeType: userInput.imageMimeType,
                    data: userInput.imageBase64.split(',')[1] || userInput.imageBase64,
                },
            });
        }
        
    const optimizationResponse = await ai.models.generateContent({
        model: highQualityModel,
        contents: { parts: optimizationParts },
        config: {
            responseMimeType: "application/json",
            responseSchema: buildOptimizationSchema(withImage),
            maxOutputTokens: 8192,
        },
    });
    
    const optimizationText = optimizationResponse.text || (optimizationResponse.response && typeof optimizationResponse.response.text === 'function' ? optimizationResponse.response.text() : "");
    
    if (!optimizationText) {
        console.error("No response from AI at Stage 3. Response object:", optimizationResponse);
        throw new Error("Không nhận được phản hồi từ AI ở Giai đoạn 3. Vui lòng thử lại.");
    }

    let optimizationData;
    try {
        optimizationData = extractJSON(optimizationText);
    } catch (e) {
        console.error("Failed to parse optimizationData:", optimizationText);
        throw new Error("Không thể phân tích kết quả Tối ưu hóa. Vui lòng thử lại.");
    }

        updateProgress("Đang tổng hợp kết quả...");

        const allDataSources = [
            ...(marketAnalysisData.dataSources || []),
            ...(auditData.dataSources || []),
            ...(optimizationData.dataSources || [])
        ];

        const finalResult: AnalysisResult = {
            marketAnalysis: {
                nicheAnalysis: marketAnalysisData.nicheAnalysis,
                pricePositioning: marketAnalysisData.pricePositioning
            },
            audit: {
                tagsAudit: auditData.tagsAudit,
                titleAudit: auditData.titleAudit
            },
            optimizationStrategy: optimizationData.optimizationStrategy,
            dataSources: [...new Set(allDataSources)], // Remove duplicates
        };
        
        if (!finalResult.marketAnalysis.nicheAnalysis || !finalResult.audit.tagsAudit || !finalResult.optimizationStrategy) {
             throw new Error("Cấu trúc phản hồi không hợp lệ từ AI. Vui lòng thử lại.");
        }

        return finalResult;

    } catch (error) {
        console.error("Error during sequential Gemini API calls:", error);
        if (error instanceof Error) {
            if (error.message.includes('404')) {
                throw new Error("Model Gemini không tìm thấy (404). Vui lòng kiểm tra quyền truy cập API Key.");
            }
            if (error.message.includes('429')) {
                throw new Error("Hết hạn ngạch API (Rate limit). Vui lòng đợi một lát rồi thử lại.");
            }
            throw error;
        }
        throw new Error("Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra đầu vào và thử lại.");
    }
};
