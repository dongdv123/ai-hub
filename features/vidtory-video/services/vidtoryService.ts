
export interface VidtoryVideoRequest {
    prompt: string;
    aspectRatio?: 'VIDEO_ASPECT_RATIO_LANDSCAPE' | 'VIDEO_ASPECT_RATIO_PORTRAIT';
    generationMode: 'START_ONLY' | 'START_AND_END' | 'REFERENCE_IMAGES';
    startImage?: { url: string };
    endImage?: { url: string };
    referenceImages?: { url: string; imageUsageType: string }[];
    upscale?: boolean;
    cleanup?: boolean;
}

export interface VidtoryImageRequest {
    prompt: string;
    aspectRatio?: 'IMAGE_ASPECT_RATIO_LANDSCAPE' | 'IMAGE_ASPECT_RATIO_PORTRAIT' | 'IMAGE_ASPECT_RATIO_SQUARE';
    model?: string;
    subjects?: { url: string }[];
    styles?: { url: string }[];
    image?: string;
    strength?: number;
}

export interface VidtoryVideoResponse {
    status?: string; // 'pending' | 'done'
    jobId?: string;
    urls?: string[]; // If sync or done
    outputs?: { url: string; contentType: string }[]; // If following nano structure
    error?: string;
}

const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VIDTORY_API_KEY) {
        return import.meta.env.VITE_VIDTORY_API_KEY;
    }
    // Fallback or check process.env if needed
    return "";
};

const BASE_URL = "/vidtory-api";

export const generateVideo = async (request: VidtoryVideoRequest): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Missing Vidtory API Key. Please set VITE_VIDTORY_API_KEY.");
    }

    const response = await fetch(`${BASE_URL}/api/video/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Origin': 'https://oldapi84.vidtory.net',
            'Referer': 'https://oldapi84.vidtory.net/'
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vidtory API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Vidtory API Response:", JSON.stringify(data, null, 2));
    
    // Handle sync response (like Image classic)
    if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
        return data.urls;
    }

    // Handle single url response common patterns
    if (typeof data.url === 'string') return [data.url];
    if (typeof data.video_url === 'string') return [data.video_url];
    if (typeof data.videoUrl === 'string') return [data.videoUrl];
    if (typeof data.output === 'string') return [data.output];

    // Handle async response (like Nano2) or Vidtory Video format
    if (data.status === 'pending' && data.jobId) {
        // Poll for result
        return await pollVideoJob(data.jobId, apiKey, data.pollIntervalMs);
    }
    
    // Handle Vidtory Video specific format (PROCESSING status)
    if (data.status === 'PROCESSING' && data.jobId) {
        // Check if videoUrl is already available in payload (sometimes it is instantly)
        if (data.payload && data.payload.videoUrl) {
            // Check if the URL is accessible and not empty/broken (optional, but good practice)
            if (data.payload.ready === true) {
                 return [data.payload.videoUrl];
            }
        }
        // If not ready, poll
        return await pollVideoJob(data.jobId, apiKey, data.pollIntervalMs);
    }

    // Handle done response immediate
    if (data.status === 'done' && data.outputs) {
        return data.outputs.map((o: any) => o.url);
    }

    throw new Error("Unknown response format from Vidtory API");
};

export const generateImage = async (request: VidtoryImageRequest): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Missing Vidtory API Key. Please set VITE_VIDTORY_API_KEY.");
    }

    // Using Image Classic for sync response as per docs
    const response = await fetch(`${BASE_URL}/api/image/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Origin': 'https://oldapi84.vidtory.net',
            'Referer': 'https://oldapi84.vidtory.net/'
        },
        body: JSON.stringify({
            prompt: request.prompt,
            aspectRatio: request.aspectRatio || 'IMAGE_ASPECT_RATIO_SQUARE',
            subjects: request.subjects,
            styles: request.styles,
            image: request.image,
            strength: request.strength
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vidtory API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Vidtory Image API Response:", JSON.stringify(data, null, 2));

    if (data.urls && Array.isArray(data.urls)) {
        return data.urls;
    }

    if (data.url) return [data.url];
    
    throw new Error("Unknown image response format from Vidtory API");
};

const pollVideoJob = async (jobId: string, apiKey: string, pollIntervalMs: number = 3000): Promise<string[]> => {
    // Increase polling duration: 300 attempts * interval ~ 15-25 minutes
    const maxAttempts = 300; 
    const interval = pollIntervalMs;

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, interval));

        const pollUrl = `${BASE_URL}/api/video/jobs/${jobId}`; 
        
        try {
            const response = await fetch(pollUrl, {
                headers: { 
                    'X-API-Key': apiKey,
                    'Origin': 'https://oldapi84.vidtory.net',
                    'Referer': 'https://oldapi84.vidtory.net/'
                }
            });
            
            if (response.status === 404) {
                 throw new Error("Polling endpoint not found or job expired.");
            }

            if (response.ok) {
                const data = await response.json();
                console.log("Polling Response:", JSON.stringify(data, null, 2));

                // Check ready status in payload for Vidtory Video
                if (data.payload && data.payload.ready === true && data.payload.videoUrl) {
                    return [data.payload.videoUrl];
                }

                if (data.status === 'done' || data.status === 'COMPLETED') {
                     // Check various output locations
                    if (data.outputs && Array.isArray(data.outputs)) return data.outputs.map((o: any) => o.url);
                    if (data.payload && data.payload.videoUrl) return [data.payload.videoUrl];
                    if (data.videoUrl) return [data.videoUrl];
                    if (data.url) return [data.url];
                } else if (data.status === 'failed' || data.status === 'FAILED') {
                    throw new Error(`Video generation failed: ${data.error || 'Unknown error'}`);
                }
            }
        } catch (e) {
            console.warn("Polling error:", e);
        }
    }
    throw new Error("Video generation timed out.");
};
