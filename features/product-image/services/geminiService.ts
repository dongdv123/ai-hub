import { GoogleGenAI, Modality, Type, Part } from "@google/genai";

const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }
    return "";
};

const API_KEY = getApiKey();
if (!API_KEY) {
    console.warn("API_KEY not found. Please set VITE_GEMINI_API_KEY in .env.local");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface ProductAnalysis {
  sketch: string;
  dimensions: { label: string; description: string; value: string }[];
  materials: { label: string; location: string; description: string }[];
}

export interface EtsySeoResult {
  title1: string;
  tags1: string[];
  title2: string;
  tags2: string[];
}

export interface EditableImagePlan {
  label: string;
  description: string;
  isSketch: boolean;
}

interface ImagePayload {
    base64: string;
    mimeType: string;
    maskBase64?: string;
}

const combinedSchema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.OBJECT,
      properties: {
        sketch: {
          type: Type.STRING,
          description: "A text description of the product's geometric shape and form, in English."
        },
        dimensions: {
          type: Type.ARRAY,
          description: "An array of the product's key dimensions.",
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "A letter label for the dimension (e.g., 'a', 'b')." },
              description: { type: Type.STRING, description: "A clear description in English of what the edge is (e.g., 'Overall height', 'Bottle mouth diameter')." },
              value: { type: Type.STRING, description: "The estimated measurement of the dimension, in 'cm' (e.g., '15 cm')." }
            },
            required: ['label', 'description', 'value']
          }
        },
        materials: {
          type: Type.ARRAY,
          description: "An array of identified materials on the product.",
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "A number label for the material location (e.g., '1', '2')." },
              location: { type: Type.STRING, description: "A clear description in English of the material's location (e.g., 'Main body', 'Lid section')." },
              description: { type: Type.STRING, description: "A description of the material (e.g., 'Brushed aluminum', 'Matte black plastic')." }
            },
            required: ['label', 'location', 'description']
          }
        }
      },
      required: ['sketch', 'dimensions', 'materials']
    },
    seo: {
      type: Type.OBJECT,
      properties: {
        title1: { type: Type.STRING, description: "The first SEO-optimized Etsy title, under 140 characters, with the first letter of every word capitalized." },
        tags1: { type: Type.ARRAY, description: "An array of 13 SEO-optimized Etsy tags, each under 20 characters and all lowercase.", items: { type: Type.STRING } },
        title2: { type: Type.STRING, description: "The second SEO-optimized Etsy title, under 140 characters, with the first letter of every word capitalized." },
        tags2: { type: Type.ARRAY, description: "An array of 13 SEO-optimized Etsy tags, each under 20 characters and all lowercase.", items: { type: Type.STRING } }
      },
      required: ['title1', 'tags1', 'title2', 'tags2']
    }
  },
  required: ['analysis', 'seo']
};

const createCombinedPrompt = (productName: string, productDescription: string) => `Analyze the product in the provided images and generate Etsy SEO content.
Product information:
- Name: "${productName || 'Not provided'}"
- Description: "${productDescription || 'Not provided'}"

Perform the following steps IN ENGLISH and return the data in a single, valid JSON object:

Part 1: Product Analysis
1.  **Geometric Sketch:** Synthesize information from all views to create a simple geometric sketch of the product's 3D form. Write a text description of this sketch.
2.  **Dimensions:** Identify key dimensions. Label them with lowercase letters (a, b, ...), provide a clear description, and estimate the measurement in 'cm'.
3.  **Materials:** Identify primary materials. Number their locations (1, 2, ...), describe the location, and then describe the material.

Part 2: Etsy SEO Generation
1.  **Generate SEO:** Create 2 SEO-optimized Etsy product titles (under 140 characters) and 2 sets of 13 tags (each tag under 20 characters).
2.  **Formatting Rules:**
    - Titles: Capitalize The First Letter Of Every Word.
    - Tags: All lowercase.
3.  **SEO Rules:**
    - If the product is a stained glass suncatcher, include keywords like: "Acrylic Window Hanging", "Faux Stained Glass", or "Acrylic Suncatcher".
    - Match keywords specifically to the product.

Your output MUST strictly adhere to the provided JSON schema. Do not include any markdown formatting like \`\`\`json.`;

export const analyzeProductAndGenerateSeo = async (
  images: ImagePayload[], 
  productName: string, 
  productDescription: string,
  modelId: string = 'gemini-2.0-flash'
): Promise<{ analysis: ProductAnalysis; seo: EtsySeoResult }> => {
    try {
        const imageParts: Part[] = images.map(image => ({
            inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
            },
        }));

        const textPart: Part = {
            text: createCombinedPrompt(productName, productDescription),
        };

        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: combinedSchema,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (!result.analysis || !result.seo) {
            throw new Error("AI response was missing 'analysis' or 'seo' fields.");
        }
        
        return result;

    } catch (error) {
        console.error("Error calling Gemini API for combined analysis and SEO:", error);
        
        let userFacingError = "Phân tích sản phẩm và tạo SEO thất bại. AI không thể hiểu (các) hình ảnh. Vui lòng thử lại với hình ảnh rõ ràng hơn.";

        if (error instanceof Error) {
            // Check for specific error messages from the API client
            if (error.message.toLowerCase().includes('safety')) {
                userFacingError = "Yêu cầu đã bị chặn do lo ngại về an toàn. Điều này có thể xảy ra với hình ảnh có người hoặc một số đồ vật nhất định. Vui lòng thử hình ảnh sản phẩm khác.";
            } else if (error.message.includes('400') || error.message.toLowerCase().includes('invalid')) {
                userFacingError = "Đã xảy ra sự cố với yêu cầu, có thể là do định dạng hoặc kích thước hình ảnh không hợp lệ. Vui lòng đảm bảo bạn đang sử dụng tệp PNG, JPG hoặc WEBP tiêu chuẩn và thử lại.";
            } else if (error.message.includes('500') || error.message.toLowerCase().includes('internal')) {
                userFacingError = "Đã xảy ra lỗi nội bộ với dịch vụ AI. Vui lòng chờ một lát và thử lại.";
            } else if (error.message.includes("JSON")) {
                userFacingError = "AI đã trả về định dạng không mong muốn. Vui lòng thử phân tích lại sản phẩm.";
            }
        }
        
        throw new Error(userFacingError);
    }
};

export const createImageGenerationPlan = (): EditableImagePlan[] => {
  return [
    { label: "Front View", description: "A high-end studio setting with soft, diffused lighting. The background is clean and minimalist, often with subtle geometric shapes or a gentle color gradient.", isSketch: false },
    { label: "Side Profile", description: "Shot on a reflective surface like dark marble or polished concrete. A dramatic, single light source from the side highlights the product's contours and texture.", isSketch: false },
    { label: "45-Degree View", description: "An authentic lifestyle scene, e.g., on a rustic wooden desk with elegant accessories (a plant, notebook) to give a sense of the product in a real-world context.", isSketch: false },
    { label: "Top-Down Flat Lay", description: "Arranged on a clean, modern surface with textures that complement the product (e.g., linen, matte paper). Props are minimal and related to the product's function.", isSketch: false },
    { label: "In-Context Close-up", description: "A detailed macro shot focusing on a specific feature (e.g., a logo, texture, button). The background is softly blurred (bokeh) to draw all attention to the detail.", isSketch: false },
    { label: "Creative Composition", description: "An artistic, abstract shot. The product might be interacting with dynamic elements like water splashes, floating fabric, or colored smoke for a high-fashion feel.", isSketch: false },
  ];
};

export const constructPromptsFromPlan = (
  plans: EditableImagePlan[],
  analysis: ProductAnalysis,
  productName: string,
  productDescription: string,
  vibe?: string
): string[] => {
  return plans.map(plan => {
    if (plan.isSketch) {
        return `Use the provided product image(s) as a reference.
Create a technical sketch based on this description: "${plan.description}".
Requirements:
- Include only clean, crisp outlines.
- No color, shading, or gradients.
- Do not add any text, numbers, or annotations to the image.
- This is a new technical drawing creation task, not an edit of the original photo.
Style: Minimalist product design drawing.`;
    } else {
        const angleMap: { [key: string]: string } = {
            "Front View": "straight-on front view",
            "Side Profile": "side profile view",
            "45-Degree View": "45-degree perspective view",
            "Top-Down Flat Lay": "top-down flat-lay view",
            "In-Context Close-up": "detailed macro close-up view",
            "Creative Composition": "artistic, abstract composition view",
        };
        const angle = angleMap[plan.label] || 'undetermined angle';

        const vibeText = vibe?.trim();
        const settingDescription = plan.description;
        
        const finalSettingDescription = vibeText 
            ? `${settingDescription}. IMPORTANT: The entire scene must be infused with a specific vibe: "${vibeText}". This is a primary requirement and should dictate the mood, color palette, lighting, and any props.`
            : settingDescription;

        const criticalVibeRequirement = vibeText ? `4.  **VIBE IS PARAMOUNT:** The mood and theme of "${vibeText}" must be unmistakably present in the final image. This is not optional.` : '';

        const materialsText = Array.isArray(analysis?.materials) 
            ? analysis.materials.map(m => m.description).join(', ') 
            : 'not specified';
            
        return `Task: Create a professional marketing photo for a product named "${productName}", which is a "${productDescription}".
Input: Use the provided original image(s) to clearly understand the product's design, colors, and details.
Core Requirement: RECREATE the product in a completely new photograph and a new setting.
Angle: ${angle}.
Background/Setting: ${finalSettingDescription}
Additional Product Info:
- Basic Shape: "${analysis?.sketch || 'unknown'}".
- Key Materials: ${materialsText}.
!!! CRITICALLY IMPORTANT REQUIREMENTS !!!
1.  **DO NOT EDIT THE ORIGINAL PHOTO:** ABSOLUTELY do not cut, paste, edit, or reuse any part of the original image (neither the product nor the background).
2.  **CREATE 100% NEW:** The final image must be a completely new creation, looking like a real photoshoot.
3.  **MAINTAIN DESIGN INTEGRITY:** The product's design, colors, logos, and details must be perfectly preserved.
${criticalVibeRequirement}
Image Quality: Professional studio lighting, photorealistic, sharp, high resolution.`;
    }
  });
};


export const generateFinalImages = async (
    images: ImagePayload[], 
    prompts: string[],
    onProgress: (progress: string) => void,
    modelId: string = 'gemini-2.5-flash-image'
): Promise<string[]> => {
    
    const generateImageWithRetry = async (prompt: string, index: number): Promise<string> => {
        const MAX_RETRIES = 3;
        const imageParts: Part[] = images.flatMap(image => {
            const parts: Part[] = [{
                inlineData: {
                    data: image.base64,
                    mimeType: image.mimeType,
                },
            }];
            if (image.maskBase64) {
                const base64Data = image.maskBase64.includes(',') 
                    ? image.maskBase64.split(',')[1] 
                    : image.maskBase64;
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/png',
                    },
                });
            }
            return parts;
        });

        // Add mask instruction to the prompt if masks are present
        const hasMasks = images.some(img => !!img.maskBase64);
        const finalPrompt = hasMasks 
            ? `${prompt}\n\nNote: Some input images have accompanying masks (black and white images). The white areas in the masks indicate the primary product to preserve and recreate accurately. Ignore elements outside these white areas.`
            : prompt;

        const textPart: Part = { text: finalPrompt };

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                onProgress(`Đang tạo hình ảnh ${index + 1}/${prompts.length}... (Lần thử ${attempt}/${MAX_RETRIES})`);
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: { parts: [...imageParts, textPart] },
                    config: { responseModalities: [Modality.IMAGE] }
                });

                if (response.candidates && response.candidates[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData?.mimeType.startsWith('image/')) {
                            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                }
                throw new Error("AI không trả về hình ảnh hợp lệ.");

            } catch (error) {
                console.warn(`Lỗi khi tạo hình ảnh ${index + 1} (lần thử ${attempt}):`, error);
                if (attempt < MAX_RETRIES) {
                    onProgress(`Lỗi ở hình ảnh ${index + 1}. Đang thử lại sau 5 giây... (Lần thử ${attempt + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    const errorMessage = `Không thể tạo hình ảnh ${index + 1} sau ${MAX_RETRIES} lần thử. Lỗi: ${error instanceof Error ? error.message : String(error)}`;
                    throw new Error(`${errorMessage}. Prompt: ${prompt}`);
                }
            }
        }
        throw new Error(`Could not generate image ${index + 1} after all attempts.`);
    };

    try {
        const imageGenerationPromises = prompts.map((prompt, index) => 
            generateImageWithRetry(prompt, index)
        );
        const generatedImages = await Promise.all(imageGenerationPromises);
        return generatedImages;

    } catch (error) {
        console.error("Critical error during image generation process:", error);
        throw error;
    }
};