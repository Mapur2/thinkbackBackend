import axios from "axios";
import fs from "node:fs/promises";
import path from "path";
import { ApiError } from "./ApiError.js";

async function generateSuggestionImage(prompt) {
    if (!process.env.STABILITY_API_KEY) {
        console.warn("STABILITY_API_KEY is not set. Skipping image generation.");
        return null;
    }

    try {
        const payload = {
            prompt: `${prompt}, digital art, vibrant, hopeful`,
            output_format: "webp"
        };

        const response = await axios.postForm(
            `https://api.stability.ai/v2beta/stable-image/generate/core`,
            axios.toFormData(payload),
            {
                validateStatus: undefined,
                responseType: "arraybuffer",
                headers: {
                    Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                    Accept: "image/*"
                },
                timeout: 15000 // 15 seconds timeout
            },
        );

        if (response.status === 200) {
            const buffer = Buffer.from(response.data);
            const tempDir = './public/temp';
            await fs.mkdir(tempDir, { recursive: true }); // Ensure directory exists
            const tempFilePath = path.join(tempDir, `stability-${Date.now()}.webp`);
            await fs.writeFile(tempFilePath, buffer);
            return tempFilePath; // Return path to the temporary file
        } else {
            const errorText = response.data.toString();
            console.error(`Stability AI Error: ${response.status}: ${errorText}`);
            // Don't throw an ApiError here, just return null so the primary operation can continue
            return null; 
        }
    } catch (error) {
        console.error("Error calling Stability AI:", error.message);
        return null;
    }
}

export { generateSuggestionImage }; 