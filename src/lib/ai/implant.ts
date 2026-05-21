// IMPLANT: Replace the person in a scene photo with a new entity
// Unlike VTON (which puts clothes on a person), IMPLANT puts a person INTO the scene

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_RETRIES = 3;

export interface ImplantRequest {
  entityImage: string;  // Base64 data URL of the person/entity to implant
  sceneImage: string;   // Base64 data URL of the collection scene photo
}

export interface ImplantResponse {
  resultImage: string;  // Base64 encoded result
  processingTime: number;
}

function extractBase64(dataUrl: string): { data: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  if (!dataUrl.startsWith('data:') && dataUrl.length > 100) {
    return { mimeType: 'image/jpeg', data: dataUrl };
  }
  return null;
}

async function callGeminiImageAPI(
  parts: any[],
  aspectRatio: string = '3:4',
  imageSize: string = '1K'
): Promise<any> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Gemini API] Error response:', errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Three prompt levels for retry on content filter
function buildImplantPrompt(): string {
  return [
    `CRITICAL INSTRUCTION — SCENE FIDELITY IS THE TOP PRIORITY:`,
    `You MUST preserve the EXACT scene from the SECOND image with 100% accuracy.`,
    ``,
    `SCENE DETAILS TO PRESERVE EXACTLY:`,
    `- Exact same background, environment, and location`,
    `- Exact same lighting, shadows, and atmosphere`,
    `- Exact same camera angle, perspective, and composition`,
    `- Exact same clothing/outfit worn by the person in the scene`,
    `- Exact same pose and body position`,
    `- Exact same color grading and film look`,
    ``,
    `TASK: Replace ONLY the face/identity of the person in the SECOND image (scene photo) with the person from the FIRST image (entity photo).`,
    `The FIRST image shows the entity — use their EXACT face, facial features, skin tone, and hair.`,
    `The SECOND image is the scene — keep EVERYTHING about this image exactly the same, except swap in the entity's face.`,
    ``,
    `The result should look like the entity from image 1 was the one originally photographed in the scene from image 2.`,
    `Maintain the exact same outfit, pose, background, lighting, atmosphere, and film quality.`,
    `CRITICAL: Generate EXACTLY ONE single image. No collages, split views, or before/after comparisons.`,
    `CRITICAL: DO NOT render any text, labels, watermarks, or words on the image.`,
    `CRITICAL: The background and scene must be IDENTICAL to the second image.`,
  ].filter(Boolean).join(' ');
}

function buildSimplifiedImplantPrompt(): string {
  return `Face swap: Replace the face of the person in the SECOND image with the face from the FIRST image. Keep everything else in the second image exactly the same — same outfit, same background, same pose, same lighting, same atmosphere. The result should look like the person from image 1 was photographed in the scene from image 2. One image only, no collages.`;
}

function buildMinimalImplantPrompt(): string {
  return `Swap the face from image 1 onto the person in image 2. Keep the same outfit, background, pose, and lighting from image 2. Single image output.`;
}

export async function generateImplant(request: ImplantRequest): Promise<ImplantResponse> {
  const startTime = Date.now();

  const imageParts: any[] = [];

  // Entity image first (the face to implant)
  const entityData = extractBase64(request.entityImage);
  if (!entityData) {
    throw new Error('Invalid entity image data');
  }
  imageParts.push({
    inline_data: { mime_type: entityData.mimeType, data: entityData.data },
  });

  // Scene image second (the collection photo to implant into)
  const sceneData = extractBase64(request.sceneImage);
  if (!sceneData) {
    throw new Error('Invalid scene image data');
  }
  imageParts.push({
    inline_data: { mime_type: sceneData.mimeType, data: sceneData.data },
  });

  const promptVariants = [
    buildImplantPrompt(),
    buildSimplifiedImplantPrompt(),
    buildMinimalImplantPrompt(),
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = promptVariants[attempt] || promptVariants[promptVariants.length - 1];
      console.log(`[IMPLANT] Attempt ${attempt + 1}/${MAX_RETRIES}...`);

      const parts = [{ text: prompt }, ...imageParts];
      const data = await callGeminiImageAPI(parts, '3:4', '1K');
      const processingTime = Date.now() - startTime;

      const candidates = data.candidates || [];
      const finishReason = candidates[0]?.finishReason;

      if (finishReason === 'IMAGE_PROHIBITED_CONTENT') {
        console.log(
          `[IMPLANT] Content filter on attempt ${attempt + 1}, ${attempt + 1 < MAX_RETRIES ? 'retrying...' : 'no more retries'}`
        );
        lastError = new Error(`IMAGE_PROHIBITED_CONTENT on attempt ${attempt + 1}`);
        if (attempt + 1 < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000));
        }
        continue;
      }

      // Extract generated image
      for (const candidate of candidates) {
        const responseParts = candidate.content?.parts || [];
        for (const part of responseParts) {
          const inlineData = part.inline_data || part.inlineData;
          if (inlineData?.data) {
            const base64 = inlineData.data;
            const mimeType = inlineData.mime_type || inlineData.mimeType || 'image/png';
            console.log(
              `[IMPLANT] Success on attempt ${attempt + 1}, size: ${base64.length}`
            );
            return {
              resultImage: `data:${mimeType};base64,${base64}`,
              processingTime,
            };
          }
        }
      }

      lastError = new Error(`No image in response. finishReason=${finishReason}`);
    } catch (error) {
      console.error(`[IMPLANT] Attempt ${attempt + 1} error:`, error);
      lastError = error as Error;
    }
  }

  throw new Error(`IMPLANT failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
}
