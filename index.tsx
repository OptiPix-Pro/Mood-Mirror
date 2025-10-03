
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

declare global {
    interface Window {
        userPhotoData: string | null;
        selectedEmojis: { emoji: string; x: number; y: number; fontSize: number }[];
        handleCaptionChange: () => void;
        generateAiCaptions: () => void;
    }
}

async function generateAiCaptions() {
    const aiCaptionBtn = document.getElementById('aiCaptionBtn') as HTMLButtonElement;
    if (!aiCaptionBtn) return;

    const { userPhotoData, selectedEmojis } = window;

    if (!userPhotoData) {
        alert("Please upload or capture a photo first.");
        return;
    }

    aiCaptionBtn.textContent = 'Generating...';
    aiCaptionBtn.disabled = true;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: userPhotoData.split(',')[1], // Remove the base64 prefix
            },
        };

        const emojiString = selectedEmojis.map(e => e.emoji).join(' ');
        const textPrompt = `Analyze the person's expression in the image and these emojis: ${emojiString}. Generate an array of 5 short, witty, and viral-style meme captions suitable for social media.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: textPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        captions: {
                            type: Type.ARRAY,
                            description: "An array of 5 meme captions.",
                            items: {
                                type: Type.STRING,
                                description: 'A witty meme caption.',
                            }
                        }
                    }
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        const captions = jsonResponse.captions;

        if (captions && captions.length > 0) {
            const captionSelect = document.getElementById('captionSelect') as HTMLSelectElement;
            
            // Remove existing AI captions
            const existingAIGroup = captionSelect.querySelector('#ai-optgroup');
            if (existingAIGroup) {
                existingAIGroup.remove();
            }

            // Add new AI captions
            const aiOptGroup = document.createElement('optgroup');
            aiOptGroup.id = 'ai-optgroup';
            aiOptGroup.label = '🤖 AI Generated Captions';

            captions.forEach((caption: string) => {
                const option = document.createElement('option');
                option.value = caption;
                option.textContent = caption;
                aiOptGroup.appendChild(option);
            });

            captionSelect.appendChild(aiOptGroup);
            captionSelect.value = captions[0]; // Select the first generated caption
            window.handleCaptionChange(); // Trigger update in the main script
        } else {
            throw new Error("AI did not return valid captions.");
        }

    } catch (error) {
        console.error("Error generating AI captions:", error);
        alert("Sorry, we couldn't generate captions right now. Please try again later.");
    } finally {
        aiCaptionBtn.textContent = '✨ Generate with AI';
        aiCaptionBtn.disabled = false;
    }
}

// Expose the function to the global window object so it can be called from onclick
window.generateAiCaptions = generateAiCaptions;
