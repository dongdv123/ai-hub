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

export const testGeminiModel = async (modelId: string): Promise<boolean> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: "ping" }] }
        });
        return !!(response && response.text);
    } catch (error) {
        console.error(`Test failed for Gemini model ${modelId}:`, error);
        return false;
    }
};

export const testImagenModel = async (modelId: string): Promise<boolean> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: "A small red dot" }] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        
        if (response && response.candidates && response.candidates[0]?.content?.parts) {
            return response.candidates[0].content.parts.some(p => p.inlineData?.mimeType?.startsWith('image/'));
        }
        return false;
    } catch (error) {
        console.error(`Test failed for Imagen model ${modelId}:`, error);
        return false;
    }
};

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
    { label: "In-Context Close-up", description: "A detailed extreme macro shot zooming in on a specific feature (e.g., texture, logo). The background remains visible and recognizable (not heavily blurred) to provide context.", isSketch: false },
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
            "In-Context Close-up": "extreme close-up shot (showing only a corner or partial section) with visible background",
            "Creative Composition": "artistic, abstract composition view",
        };
        const angle = angleMap[plan.label] || 'undetermined angle';

        const vibeText = vibe?.trim();
        const settingDescription = plan.description;
        
        const finalSettingDescription = vibeText 
            ? `${settingDescription}. IMPORTANT: The entire scene must be infused with a specific vibe: "${vibeText}". This is a primary requirement and should dictate the mood, color palette, lighting, and any props.`
            : settingDescription;

        const criticalVibeRequirement = vibeText ? `4.  **VIBE IS PARAMOUNT (BUT RESPECT THE ANGLE):** The mood and theme of "${vibeText}" must be unmistakably present, BUT it must fit within the constraints of the requested Camera Angle (e.g., if Close-up, show the vibe in the texture/lighting, not by zooming out).` : '';

        const materialsText = Array.isArray(analysis?.materials) 
            ? analysis.materials.map(m => m.description).join(', ') 
            : 'not specified';
            
        const isCloseUp = plan.label === "In-Context Close-up";
        const taskDescription = isCloseUp
            ? `Create an extreme close-up macro photograph of a DETAIL of the product named "${productName}"`
            : `Create a professional ${angle} photograph of a product named "${productName}"`;

        const coreRequirement = isCloseUp
            ? `Focus intensely on a specific texture, material, or feature. Do NOT show the entire product. The view must be a tight partial crop, capturing only a corner or a small section of the product alongside the background.`
            : `RECREATE the product in a completely new photograph and a new setting.`;

        return `Task: ${taskDescription}, which is a "${productDescription}".
        Input: Use the provided original image(s) to clearly understand the product's design, colors, and details.
        Core Requirement: ${coreRequirement}
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


export const getVibeKeywords = (vibe: string): string => {
    const vibeMap: Record<string, string> = {
        "Minimalist & Clean": "(minimalist style:1.5), (clean white background:1.4), (soft diffused lighting:1.4), (high key:1.3)",
        "Warm & Cozy": "(warm lighting:1.5), (golden hour:1.4), (cozy atmosphere:1.4), (soft shadows:1.3), (wood textures:1.3)",
        "Luxury & Elegant": "(luxury aesthetic:1.5), (dramatic lighting:1.4), (high contrast:1.3), (elegant props:1.3), (premium feel:1.4)",
        "Vintage & Rustic": "(vintage style:1.5), (rustic textures:1.4), (warm tones:1.3), (nostalgic feel:1.3), (aged wood:1.2)",
        "Nature & Organic": "(natural lighting:1.5), (organic textures:1.4), (botanical elements:1.3), (fresh and airy:1.3), (sunlight:1.4)",
        "Vibrant & Playful": "(vibrant colors:1.5), (playful composition:1.4), (bright lighting:1.4), (color blocking:1.3), (energetic mood:1.3)",
        "Dark & Moody": "(dark moody lighting:1.5), (chiaroscuro:1.4), (dramatic shadows:1.4), (low key:1.3), (cinematic feel:1.3)",
        "Studio Professional": "(professional studio lighting:1.6), (perfectly lit:1.5), (neutral background:1.4), (commercial photography:1.4), (sharp focus:1.4)",
        "Industrial": "(industrial style:1.5), (concrete textures:1.4), (cool tones:1.3), (harsh lighting:1.3), (metallic elements:1.3)",
        "Bohemian": "(boho style:1.5), (warm earth tones:1.4), (natural fabrics:1.3), (relaxed atmosphere:1.3), (eclectic props:1.3)",
        "Pastel & Soft": "(pastel color palette:1.5), (soft dreamlike lighting:1.4), (gentle tones:1.3), (airy feel:1.3), (sweet aesthetic:1.2)"
    };
    return vibeMap[vibe] || "(bright natural lighting:1.4), (soft daylight:1.3), (true to life colors:1.4), (neutral aesthetic:1.2)";
};

export const optimizePromptWithGemini = async (
    currentPrompt: string, 
    modelId: string = '',
    angleLabel: string = '',
    vibe: string = '',
    optimizationModelId: string = 'gemini-2.0-flash',
    context: {
        productName?: string;
        productDescription?: string;
        analysis?: string;
    } = {}
): Promise<string> => {
    try {
        const isFlux = modelId.includes('runware:100') || modelId.includes('runware:101');
        const isImagen = modelId.startsWith('gemini') || modelId.startsWith('imagen');
        const isPruna = modelId.includes('pruna');
        
        let modelTarget = "AI Image Generator";
        if (isFlux) modelTarget = "Flux.1 AI";
        if (isImagen) modelTarget = "Google Imagen 3 / Gemini Image Generation";

        let optimizationPrompt = "";

        if (isPruna) {
            // PRUNA / RUNWARE OPTIMIZATION (Pure Natural Language Description)
            
            // Dynamic Vibe Logic: Feed keywords as context only
            const fixedVibeKeywords = getVibeKeywords(vibe);
            // Convert weighted tags to natural language for Pruna (e.g., "(tag:1.5)" -> "tag")
            const naturalVibeDescription = fixedVibeKeywords.replace(/\(([^:]+):[\d.]+\)/g, "$1").replace(/[()]/g, "");
            
            // Angle Logic: Convert technical angles into descriptive instructions
            const angleInstructionsMap: Record<string, string> = {
                "Front View": "Place the camera directly in front of the product at eye level. The product should look perfectly symmetrical and straight-on. Do not angle the camera down or from the side.",
                "Top-Down Flat Lay": `
                    THEORY: Knolling / Flat Lay Photography.
                    CRITICAL POSITIONING: The product is physically LYING FLAT on its back or side on the surface. Gravity pulls it down. It is NOT standing upright.
                    CAMERA ANGLE: The camera looks straight down from 90 degrees above (Bird's Eye View).
                    COMPOSITION: The product looks like a 2D graphic or illustration on a canvas. No vertical perspective.
                    BACKGROUND: The surface (table/floor) fills the entire background.`,
                "45-Degree View": `
                    THEORY: Three-Quarter Perspective. 
                    CHARACTERISTICS: The camera is positioned at a 45-degree angle relative to the product. It captures both the front face and the side face equally.
                    VISUAL GOAL: To show the product's 3D volume, depth, and dimension in a natural way that mimics human vision.`,
                "Side Profile": `
                    THEORY: Orthographic 90-Degree Lateral Profile. 
                    CHARACTERISTICS: The camera is at a STRICT 90-degree angle to the side. The front face of the product MUST BE COMPLETELY HIDDEN. Zero rotation towards the front.
                    VISUAL GOAL: A perfect 2D silhouette of the side. If it's a car, I see only two wheels. If it's a shoe, I see the heel and toe in a straight line. No perspective distortion.`,
                "In-Context Close-up": `
                    THEORY: Macro / Detail Shot with Bokeh.
                    CRITICAL COMPOSITION: TIGHTLY CROP THE IMAGE. Do NOT show the entire product. We only want to see a small SECTION or CORNER of the product (approx 20-40% of the object).
                    PLACEMENT: The product should be positioned off-center, with the background occupying a significant portion of the frame to provide context.
                    FOCUS: Razor-sharp focus on the material texture (wood grain, fabric weave, resin bubbles, metal shine).
                    BACKGROUND: The background must be visible but heavily blurred (Bokeh) to show the [Vibe] context (e.g., a cozy room, a desk).
                    GOAL: "I can feel the texture just by looking at it while seeing a glimpse of its environment."`,
                "Creative Composition": "Use a creative, artistic camera angle. You can tilt the camera (Dutch angle) or use dramatic lighting to make the product look dynamic and exciting."
            };
            const angleInstruction = angleInstructionsMap[angleLabel] || `Ensure the camera captures a ${angleLabel}.`;

            // Negative Prompt Logic
            const negativePromptMap: Record<string, string> = {
                "Front View": "side view, angled view, profile, 3/4 view",
                "Top-Down Flat Lay": "perspective view, angled view, side view, 45 degree, horizon, close up, dark background",
                "45-Degree View": "front view, top view, flat lay, side profile, straight on, symmetry",
                "Side Profile": "front view, face on, symmetry, looking at camera, top view, flat lay, angled view, 3/4 view, three quarter view, perspective, diagonal, front face visible",
                "In-Context Close-up": "full product, whole garment, entire object, complete object, zoomed out, wide shot, centered composition",
                "Creative Composition": "boring, plain, standard product shot, centered, symmetrical"
            };
            const vibeNegativeMap: Record<string, string> = {
                "Minimalist & Clean": "dark, moody, neon, clutter, busy, pattern, chaotic, shadows",
                "Warm & Cozy": "cold, blue, clinical, harsh lighting, industrial, neon",
                "Luxury & Elegant": "messy, rustic, cheap, plastic, grunge, dirty",
                "Vintage & Rustic": "modern, futuristic, neon, shiny, plastic, clean",
                "Nature & Organic": "industrial, artificial, neon, plastic, studio",
                "Vibrant & Playful": "dull, dark, moody, desaturated, grey",
                "Dark & Moody": "bright, sunny, white background, high key, overexposed",
                "Studio Professional": "messy, outdoor, natural light, uneven lighting",
                "Industrial": "soft, warm, cozy, nature, organic, vintage",
                "Bohemian": "modern, minimal, cold, clinical, industrial",
                "Pastel & Soft": "dark, harsh, high contrast, neon, black"
            };
            const vibeNegative = vibeNegativeMap[vibe] || "bad quality";
            const negativePrompt = `${negativePromptMap[angleLabel] || "bad quality"}, ${vibeNegative}`;

            optimizationPrompt = `
            You are a Photography Director explaining a shot to a CGI Artist using Pruna AI (a model that excels at natural language understanding but needs explicit instructions on composition and negative space).
            Task: Write a vivid, natural language scene description optimized specifically for Pruna AI.
            
            CONTEXT - PHOTOGRAPHY THEORY FOR THIS SHOT (${angleLabel}):
            ${angleInstruction}
            
            PRODUCT INFO:
            - Name: "${context.productName || 'Object'}"
            - Visuals: "${context.analysis || 'Generic'}"
            
            TARGET VIBE/STYLE: "${vibe || 'Neutral/Clean'}"
            VISUAL ELEMENTS OF THIS VIBE: "${naturalVibeDescription}"
            (Incorporate these specific lighting, colors, and background elements into the scene).

            INSTRUCTION:
            Apply the "Photography Theory" above to describe the scene, INFUSED with the Target Vibe.
            
            !!! CRITICAL CONFLICT RESOLUTION !!!
            If the "Target Vibe" implies a wide scene (e.g., Nature/Landscape/Industrial) but the "Photography Theory" asks for a Close-up or Flat Lay, the PHOTOGRAPHY THEORY WINS.
            - NEVER zoom out to show a landscape/room if the angle is "Close-up".
            - NEVER tilt the camera if the angle is "Flat Lay".
            - Apply the Vibe ONLY to the lighting, colors, textures, and background *within* the requested frame.

            - Explicitly describe how the product is positioned (standing, lying flat, etc.) based on the angle characteristics.
            - Describe what is visible and what is HIDDEN (e.g., for Side Profile, hide the front).
            - Use descriptive adjectives to replace technical tags.
            - The background and lighting MUST reflect the "${vibe}" style.
            - IMPORTANT FOR PRUNA AI: 
                1. Be very specific about "Negative Space" and "Cropping". Pruna tends to center everything, so explicitly say if the subject should be off-center or cropped.
                2. If the angle is "In-Context Close-up", you MUST explicitly say "Crop the image to show only a small corner or partial section of the product". CHANGE THE SUBJECT of the sentence from "The Product" to "A Macro Detail of [Material/Part]".
                3. If the angle is "Top-Down Flat Lay", you MUST explicitly say "The object is lying flat on the table".
                4. **VIBE CONSTRAINT:** If the Vibe suggests a large environment (e.g., "Nature", "Industrial"), do NOT render the whole environment. Show only a tiny slice of it in the background to hint at the vibe.
            
            OUTPUT RULES:
            1. Start with the subject.
               - IF "In-Context Close-up": Start with "A macro close-up shot of the [Material/Texture] of..."
               - OTHERWISE: Start with "A [Angle] photograph of [Product Name]..."
            2. Describe the camera angle, product position, and composition using the theory provided.
            3. Describe lighting and atmosphere based on the Target Vibe.
            4. NO technical tags (e.g., (weight:1.5)).
            5. Put all "Avoid/No" instructions in the Negative section.
            
            OUTPUT FORMAT:
            [Natural Language Description]
            ###NEGATIVE### 
            [List of things to avoid, e.g.: blurry, distorted, low quality, text, watermark, bad anatomy, (plus specific angle mistakes to avoid)]
            `;

        } else {
            // FLUX / IMAGEN OPTIMIZATION (Natural Language)
            optimizationPrompt = `You are an expert AI Prompt Engineer.
    Your task is to rewrite the following image generation prompt to be optimized for ${modelTarget}.
    
    Original Prompt:
    "${currentPrompt}"
    
    Target Camera Angle/Composition: "${angleLabel}"
    Target Style/Vibe: "${vibe}"
    
    ### PRODUCT CONTEXT (CRITICAL) ###
    - Product Name: "${context.productName || 'Not specified'}"
    - Product Description: "${context.productDescription || 'Not specified'}"
    - Visual Analysis (from Image): "${context.analysis || 'Not available'}"
    
    ### EXTREMELY IMPORTANT: OUTPUT STRUCTURE & RULES ###
    You MUST strictly follow this output structure. Do NOT add any conversational text.
    
    Task: [Action verb] a [Detailed angle description] photograph of [Product Name].
    Input: Use the product details (shape, color, material) from the Product Context and Original Prompt.
    Core Requirement: RECREATE the product in a completely new photograph.
    Angle: [Detailed angle description based on "${angleLabel}"].
    Lighting: [Detailed lighting description based on "${vibe}"].
    Background/Setting: [Detailed setting description based on "${vibe}"].
    Props & Composition: [Suggest 2-3 specific props or composition elements that match the "${vibe}"].
    !!! CRITICALLY IMPORTANT REQUIREMENTS !!!
    1. DO NOT EDIT THE ORIGINAL PHOTO: ABSOLUTELY do not cut, paste, edit, or reuse any part of the input images.
    2. CREATE 100% NEW: The final image must be a completely new creation, looking like a real photoshoot.
    3. MAINTAIN DESIGN INTEGRITY: The product's design (shape, logo, details) must be preserved as described in the Product Context.
    Image Quality: [Quality keywords based on model ${modelTarget}].
    
    ### KEY FIXES FOR ACCURACY ###
    1. **PRODUCT IDENTITY:** STRICTLY ADHERE to the "Product Context" provided above. If the analysis says it's a "Wooden Lamp", do NOT generate a "Plastic Toy". Use the specific details from the Visual Analysis (materials, dimensions, shape).
    2. **ANGLE FIDELITY:** If the angle is "${angleLabel}", use strong enforcement keywords.
       - For "Flat Lay": "Directly from above", "90-degree overhead", "2D plane", "No perspective distortion", "Knolling".
       - For "Front View": "Eye-level", "Straight-on", "Symmetrical", "No vertical angle".
       - For "Side Profile": "90-degree side view", "Profile silhouette", "No rotation", "Focus on side details".
       - For "45-Degree View": "Three-quarter view", "Isometric perspective", "Depth and dimension", "Standard product photography angle".
       - For "In-Context Close-up": "Extreme close-up", "Partial view/Crop showing only a corner or section", "Focus on specific detail", "Background visible (not plain)".
       - For "Creative Composition": "Dynamic angle", "Dutch angle", "Artistic perspective", "Rule of thirds", "Unconventional framing".
    3. **COMPOSITION CONTROL:**
         - General: Ensure the product is the CENTRAL focus (unless Creative Composition).
         - For "In-Context Close-up": "Focus on a corner or small section of the product", "Cut off most of the product", "Zoomed in", "Do NOT show full product".
         - For "Creative Composition": "Asymmetrical balance", "Dynamic flow", "Negative space".
    4. **VIBE VS ANGLE CONFLICT:**
         - If the Target Vibe implies a wide scene (e.g., "Nature", "Industrial", "Studio"), but the Angle is "In-Context Close-up", the ANGLE WINS.
         - You MUST maintain the "Extreme Close-up" crop. The Vibe should only appear in the BLURRED background or lighting. Do not zoom out to show the room/landscape.
    
    ### EXAMPLE OUTPUT (For reference only) ###
    Task: Create a professional flat-lay (top-down) photograph of the Dragon Ball resin lamp.
    Input: Use the product details (Piccolo vs Goku figures, orange/red flames, wooden base) from the original image.
    Core Requirement: RECREATE the product in a completely new photograph, strictly adhering to the requested flat-lay style.
    Angle: Strict top-down view (90 degrees overhead). The circular face of the resin disc should appear perfectly round and flat against the surface.
    Lighting: Bright, even, soft studio lighting from above. This should clearly illuminate the entire scene, minimizing shadows.
    Background/Setting: The product is placed centrally on a textured light grey/beige linen fabric surface.
    Props & Composition: Top Left: A plain envelope. Top Right: A brown river stone. Center: The lamp.
    !!! CRITICALLY IMPORTANT REQUIREMENTS !!!
    1. DO NOT EDIT THE ORIGINAL PHOTO: ABSOLUTELY do not cut, paste, edit, or reuse any part of the input images.
    2. CREATE 100% NEW: The final image must be a completely new creation, looking like a real photoshoot.
    3. MAINTAIN DESIGN INTEGRITY: The product's design must be preserved.
    Image Quality: Photorealistic, sharp focus across the entire flat plane, high resolution.
    ###########################################
    
    Requirements for Optimization:
    1.  **Analyze the Product Context** to identify the product type (e.g., "Lamp", "Bottle", "T-shirt"). Explicitly name it in the "Task" section.
    2.  **Enhance Detail:** Add specific keywords for lighting, texture, and composition matching the "${vibe}".
    3.  **Angle Optimization:** Ensure the "Angle" section strictly enforces "${angleLabel}" with technical camera terms.
    4.  **Style & Vibe Enforcement:** Ensure the "Lighting", "Background/Setting", and "Props" sections strictly reflect the "${vibe}".
    5.  **Output:** Return ONLY the rewritten prompt string in the structured format above. Do not add explanations or markdown.
    `;
        }

        const response = await ai.models.generateContent({
            model: optimizationModelId, // Use the user-selected model for optimization
            contents: { parts: [{ text: optimizationPrompt }] }
        });

        const newPrompt = response.text?.trim();
        if (!newPrompt) throw new Error("Empty response from AI");
        
        return newPrompt;

    } catch (error) {
        console.error("Error optimizing prompt:", error);
        throw error;
    }
};

export const generateFinalImages = async (
    images: ImagePayload[], 
    prompts: string[],
    onProgress: (progress: string) => void,
    modelId: string = 'gemini-2.5-flash-image'
): Promise<string[]> => {
    
    const imageStatuses = prompts.map((_, i) => `Đang chờ...`);
    
    const updateProgress = () => {
        const completed = imageStatuses.filter(s => s === 'Xong').length;
        const failed = imageStatuses.filter(s => s === 'Thất bại').length;
        const processing = imageStatuses.filter(s => s === 'Đang tạo...').length;
        
        if (completed + failed === prompts.length) {
            onProgress(`Hoàn tất: ${completed} thành công, ${failed} thất bại.`);
        } else {
            onProgress(`Đang tạo đồng thời ${prompts.length} ảnh (${completed} đã xong, ${processing} đang xử lý)...`);
        }
    };

    const generateImageWithRetry = async (prompt: string, index: number): Promise<string> => {
        const MAX_RETRIES = 3;
        // ... (rest of the imageParts logic is same)
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
                imageStatuses[index] = 'Đang tạo...';
                updateProgress();
                
                const response = await ai.models.generateContent({
                    model: modelId,
                    contents: { parts: [...imageParts, textPart] },
                    config: { responseModalities: [Modality.IMAGE] }
                });

                if (response.candidates && response.candidates[0]?.content?.parts) {
                    const imagePart = response.candidates[0].content.parts.find(part => part.inlineData?.mimeType.startsWith('image/'));
                    if (imagePart) {
                        imageStatuses[index] = 'Xong';
                        updateProgress();
                        return `data:${imagePart.inlineData!.mimeType};base64,${imagePart.inlineData!.data}`;
                    }
                }
                
                // If we reach here, it means no image was returned. Check for safety filters.
                const finishReason = response.candidates?.[0]?.finishReason;
                if (finishReason === 'SAFETY') {
                    throw new Error("Hình ảnh bị từ chối do bộ lọc an toàn của Google. Vui lòng thử đổi phong cách hoặc mô tả.");
                }
                
                throw new Error(response.candidates?.[0]?.content?.parts?.[0]?.text || "AI không trả về hình ảnh hợp lệ.");

            } catch (error: any) {
                console.warn(`Lỗi khi tạo hình ảnh ${index + 1} (lần thử ${attempt}):`, error);
                
                // Specific handling for common Google errors
                let friendlyError = error.message || String(error);
                if (friendlyError.includes("429")) friendlyError = "Hết hạn mức (Quota exceeded). Vui lòng đợi 1 phút.";
                if (friendlyError.includes("404")) friendlyError = `Model ${modelId} không khả dụng.`;
                if (friendlyError.includes("SAFETY")) friendlyError = "Nội dung bị bộ lọc an toàn chặn.";

                if (attempt < MAX_RETRIES && !friendlyError.includes("SAFETY")) {
                    imageStatuses[index] = `Thử lại ${attempt+1}...`;
                    updateProgress();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    imageStatuses[index] = 'Thất bại';
                    updateProgress();
                    const errorMessage = `Lỗi: ${friendlyError}`;
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
