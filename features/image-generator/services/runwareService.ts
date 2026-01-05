export interface RunwareImageResponse {
    imageURL: string;
    seed: number;
    NSFWContent: boolean;
    cost?: number;
    taskUUID: string;
}

interface RunwareRequest {
    taskType: string;
    taskUUID: string;
    model: string;
    positivePrompt: string;
    negativePrompt?: string;
    width: number;
    height: number;
    numberResults: number;
    outputType: string;
    outputFormat: string;
    includeCost?: boolean;
    steps?: number;
    scheduler?: string;
    CFGScale?: number;
    seedImage?: string;
    maskImage?: string;
    strength?: number;
    inputs?: {
        referenceImages?: string[];
    };
}

export const testRunwareModel = async (modelId: string): Promise<boolean> => {
    try {
        const apiKey = import.meta.env.VITE_RUNWARE_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_API_KEY : undefined);
        const endpoint = import.meta.env.VITE_RUNWARE_ENDPOINT || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_ENDPOINT : "https://api.runware.ai/v1/image/inference");

        if (!apiKey) return false;

        const payload = [{
            taskType: "imageInference",
            taskUUID: crypto.randomUUID(),
            model: modelId,
            positivePrompt: "ping",
            width: 512,
            height: 512,
            numberResults: 1,
            outputType: "URL",
            outputFormat: "WEBP"
        }];

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return response.ok && data.data && data.data.length > 0 && !!data.data[0].imageURL;
    } catch (error) {
        console.error(`Test failed for Runware model ${modelId}:`, error);
        return false;
    }
};

export const generateImage = async (
    prompt: string,
    style: string,
    width: number,
    height: number,
    seedImage?: string,
    maskImage?: string,
    modelId?: string,
    numberResults: number = 1
): Promise<RunwareImageResponse[]> => {
    // Check both import.meta.env and process.env for compatibility
    const apiKey = import.meta.env.VITE_RUNWARE_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_API_KEY : undefined);
    const modelFromEnv = import.meta.env.VITE_RUNWARE_MODEL || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_MODEL : undefined);
    const taskType = import.meta.env.VITE_RUNWARE_TASK_TYPE || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_TASK_TYPE : "imageInference");
    const endpoint = import.meta.env.VITE_RUNWARE_ENDPOINT || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_ENDPOINT : "https://api.runware.ai/v1");

    let model = modelId || modelFromEnv || "runware:100@1";

    // Pruna AI specific logic: 
    // prunaai:2@1 is for Image-to-Image (Edit)
    // prunaai:1@1 is for Text-to-Image
    if (model.includes("prunaai")) {
        // if (!seedImage && model === "prunaai:2@1") {
        //     console.log("Switching to prunaai:1@1 for text-to-image generation");
        //     model = "prunaai:1@1";
        // } else 
        if (seedImage && model === "prunaai:2@1") {
            console.log("Switching to prunaai:2@1 for image-to-image/editing");
            model = "prunaai:2@1";
        }
    }

    console.log("Runware Request - Model:", model);
    console.log("Runware Request - TaskType:", taskType);

    if (!apiKey) {
        throw new Error("Missing Runware API Key. Please check your .env.local file.");
    }

    // Helper to ensure clean base64 string (remove data:image/...;base64, prefix if present)
    const cleanBase64 = (str: string) => {
        if (!str) return str;
        // Check if it's a data URL
        if (str.includes(';base64,')) {
            return str.split(';base64,')[1];
        }
        return str;
    };

    // Parse Negative Prompt if present (Format: "Positive prompt... ###NEGATIVE### Negative prompt...")
    let finalPositivePrompt = prompt;
    let finalNegativePrompt = "";

    if (prompt.includes("###NEGATIVE###")) {
        const parts = prompt.split("###NEGATIVE###");
        finalPositivePrompt = parts[0].trim();
        finalNegativePrompt = parts[1].trim();
    }

    // Enhance prompt with style
    const fullPrompt = style && style !== 'None' 
        ? `${finalPositivePrompt}, ${style} style, high quality, detailed` 
        : `${finalPositivePrompt}, high quality, detailed`;

    // Determine effective parameters based on task
    let effectiveModel = model;
    let effectiveStrength: number | undefined;
    let effectiveSteps: number | undefined;
    let effectiveScheduler: string | undefined;
    let effectiveCFGScale: number | undefined;

    if (seedImage) {
        effectiveStrength = maskImage ? 1.0 : 0.75;
        
        // Prunaai does not support strength parameter in the standard way
        if (effectiveModel && effectiveModel.includes("prunaai")) {
            // Ensure strength is applied for batch generation too
            effectiveStrength = 0.85;
        }
    }

    const createTask = () => ({
        taskType: taskType,
        taskUUID: crypto.randomUUID(),
        model: effectiveModel,
        positivePrompt: fullPrompt,
        ...(finalNegativePrompt && { negativePrompt: finalNegativePrompt }),
        width: width,
        height: height,
        numberResults: 1, // Each task generates 1 image for maximum parallelism
        outputType: "URL",
        outputFormat: "WEBP",
        includeCost: true,
        // Thêm seed ngẫu nhiên rõ ràng cho mỗi task để đảm bảo tính đa dạng
        seed: Math.floor(Math.random() * 1000000),
        ...(effectiveSteps && { steps: effectiveSteps }),
        ...(effectiveScheduler && { scheduler: effectiveScheduler }),
        ...(seedImage && !effectiveModel.includes("prunaai") && { seedImage: cleanBase64(seedImage), strength: effectiveStrength }),
        ...(seedImage && effectiveModel.includes("prunaai") && { inputs: { referenceImages: [cleanBase64(seedImage)] } }),
        ...(maskImage && !effectiveModel.includes("prunaai") && { maskImage: cleanBase64(maskImage) })
    });

    // Create an array of tasks to be executed in parallel by Runware
    const payload = Array.from({ length: numberResults }, () => createTask());

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Runware API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Handle Runware response format
        // Usually returns object with "data" array containing results
        if (data.errors && data.errors.length > 0) {
            throw new Error(data.errors[0].message);
        }

        if (data.data && Array.isArray(data.data)) {
             return data.data as RunwareImageResponse[];
        }
        
        // If response is directly an array
        if (Array.isArray(data)) {
            return data as RunwareImageResponse[];
        }

        throw new Error("Unexpected response format from Runware");

    } catch (error) {
        console.error("Runware API Error:", error);
        throw error;
    }
};

export const generateBatchImages = async (
    prompts: string[],
    style: string,
    width: number,
    height: number,
    seedImage?: string,
    maskImage?: string,
    modelId?: string
): Promise<RunwareImageResponse[]> => {
    // Check both import.meta.env and process.env for compatibility
    const apiKey = import.meta.env.VITE_RUNWARE_API_KEY || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_API_KEY : undefined);
    const modelFromEnv = import.meta.env.VITE_RUNWARE_MODEL || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_MODEL : undefined);
    const taskType = import.meta.env.VITE_RUNWARE_TASK_TYPE || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_TASK_TYPE : "imageInference");
    const endpoint = import.meta.env.VITE_RUNWARE_ENDPOINT || (typeof process !== 'undefined' ? process.env.VITE_RUNWARE_ENDPOINT : "https://api.runware.ai/v1");

    let model = modelId || modelFromEnv || "runware:100@1";

    if (model.includes("prunaai")) {
        // if (!seedImage && model === "prunaai:2@1") {
        //     model = "prunaai:1@1";
        // } else 
        if (seedImage && model === "prunaai:2@1") {
            model = "prunaai:2@1";
        }
    }

    console.log(`[Runware Batch] Starting batch for ${prompts.length} prompts`);

    if (!apiKey) {
        throw new Error("Missing Runware API Key. Please check your .env.local file.");
    }

    // Helper to ensure clean base64 string
    const cleanBase64 = (str: string) => {
        if (!str) return str;
        if (str.includes(';base64,')) {
            return str.split(';base64,')[1];
        }
        return str;
    };

    // Determine effective parameters
    let effectiveModel = model;
    let effectiveStrength: number | undefined;
    
    if (seedImage) {
        effectiveStrength = maskImage ? 1.0 : 0.75;
        if (effectiveModel && effectiveModel.includes("prunaai")) {
            // Ensure strength is applied for batch generation too
            effectiveStrength = 0.85;
        }
    }

    const tasks = prompts.map(prompt => {
        // Parse Negative Prompt if present
        let finalPositivePrompt = prompt;
        let finalNegativePrompt = "";

        if (prompt.includes("###NEGATIVE###")) {
            const parts = prompt.split("###NEGATIVE###");
            finalPositivePrompt = parts[0].trim();
            finalNegativePrompt = parts[1].trim();
        }

        const fullPrompt = style && style !== 'None' 
            ? `${finalPositivePrompt}, ${style} style, high quality, detailed` 
            : `${finalPositivePrompt}, high quality, detailed`;

        return {
            taskType: taskType,
            taskUUID: crypto.randomUUID(),
            model: effectiveModel,
            positivePrompt: fullPrompt,
            ...(finalNegativePrompt && { negativePrompt: finalNegativePrompt }),
            width: width,
            height: height,
            numberResults: 1,
            outputType: "URL",
            outputFormat: "PNG",
            includeCost: true,
            seed: Math.floor(Math.random() * 1000000),
            ...(seedImage && !model.includes("prunaai") && { seedImage: cleanBase64(seedImage), strength: effectiveStrength }),
            ...(seedImage && model.includes("prunaai") && { inputs: { referenceImages: [cleanBase64(seedImage)] } }),
            ...(maskImage && !model.includes("prunaai") && { maskImage: cleanBase64(maskImage) })
        };
    });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(tasks)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Runware API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            const errorMsg = data.errors.map((e: any) => e.message).join(", ");
            throw new Error(`Runware API Errors: ${errorMsg}`);
        }

        let rawResults: RunwareImageResponse[] = [];
        if (data.data && Array.isArray(data.data)) {
            rawResults = data.data;
        } else if (Array.isArray(data)) {
            rawResults = data as RunwareImageResponse[];
        } else {
             throw new Error("Không nhận được dữ liệu hình ảnh từ Runware.");
        }

        // Sort results to match the order of tasks using taskUUID
        // This ensures that the generated images correspond correctly to the input prompts
        const resultMap = new Map(rawResults.map(item => [item.taskUUID, item]));
        
        return tasks.map(task => {
            const result = resultMap.get(task.taskUUID);
            if (!result) {
                console.warn(`Result not found for task ${task.taskUUID}`);
                return {
                    imageURL: "", // Indicate failure for this specific image
                    seed: 0,
                    NSFWContent: false,
                    taskUUID: task.taskUUID,
                    cost: 0
                } as RunwareImageResponse;
            }
            return result;
        });

    } catch (error) {
        console.error("Runware API Batch Error:", error);
        throw error;
    }
};
