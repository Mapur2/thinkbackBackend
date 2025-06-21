import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: `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`,
});
export const generateAIAnalyzedTimeline = async ({prompt}) => {
  try {
   
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const response = completion.choices[0]?.message?.content || '[]';
    console.log("Raw AI response for timeline:", response); // Log the raw AI response

    // Add a robust parsing block
    try {
      const parsedResponse = response;
      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse AI timeline response as JSON:', parseError);
      console.error('AI response that failed parsing:', response);
      // Return a structured error instead of an empty array
      return { error: "Failed to parse AI response.", details: parseError.message, rawResponse: response };
    }
    
  } catch (error) {
    console.error('AI Timeline generation failed:', error);
    // Return a structured error here as well
    return { error: "AI timeline generation failed.", details: error.message };
  }
};
export const generateAIAnalysis = async ({ textContent }) => {
  try {
    const prompt = `
      Analyze the following text and provide a concise analysis.
      Text: "${textContent}"

      Your tasks:
      1.  Generate a very short, one-sentence summary (max 15 words).
      2.  Identify the single most dominant mood.
      3.  Provide a suitable emoji for that mood.

      Format your response as a single, clean JSON object. Do not include any extra text or markdown.

      Example Response:
      {
        "summary": "A nostalgic reflection on a past journey and its lasting impact.",
        "mood": "😊 Nostalgic"
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });

    const rawResponse = completion.choices[0]?.message?.content || '{}';
    console.log("Raw AI analysis response:", rawResponse);

    // Find and extract the JSON object from the response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : '{}';

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI analysis response as JSON:', parseError);
      console.error('AI response that failed parsing:', rawResponse);
      return {
        summary: 'AI analysis could not be completed.',
        mood: '😐 Neutral',
      };
    }
    
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return {
      summary: 'AI analysis could not be completed.',
      mood: '😐 Neutral',
    };
  }
};

export const generateMemoryTitle = async (transcription) => {
  try {
    const prompt = `
      Generate a short, engaging title (max 50 characters) for this voice memory:
      "${transcription}"
      
      Return only the title, nothing else.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() || 'Untitled Memory';
  } catch (error) {
    console.error('Title generation failed:', error);
    return 'Untitled Memory';
  }
};

export const analyzeDreamContent = async (dreamText) => {
  try {
    const prompt = `
      Analyze this dream and provide insights:

      Dream: "${dreamText}"

      Please provide:
      1. Dream summary (2-3 sentences)
      2. Possible interpretations
      3. Emotional tone
      4. Recurring themes or symbols

      Format as JSON:
      {
        "summary": "dream summary",
        "interpretations": ["interpretation1", "interpretation2"],
        "emotionalTone": "emotion",
        "themes": ["theme1", "theme2"]
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    return JSON.parse(response);
  } catch (error) {
    console.error('Dream analysis failed:', error);
    return {
      summary: 'Dream analysis unavailable',
      interpretations: [],
      emotionalTone: 'unknown',
      themes: []
    };
  }
}; 

export const analyzeMoodTrend = async (moods) => {
  if (!moods || moods.length < 3) {
    return { trend: 'Neutral', confidence: 100 };
  }

  try {
    const prompt = `
      Analyze the following sequence of user moods from the past 48 hours. Identify the single most dominant emotional trend.
      Your response must be a clean, single-line JSON object with two keys: "trend" (e.g., 'Consistently Happy', 'Slightly Stressed', 'Increasingly Sad', 'Energetic', 'Neutral') and "confidence" (a score from 0 to 100).
      Do not add any extra text.
      Moods: ${JSON.stringify(moods)}
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192", // Using the smaller, faster model for analysis
    });

    const response = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(response);

  } catch (error) {
    console.error('Mood trend analysis failed:', error);
    return { trend: 'Neutral', confidence: 0 }; // Default on error
  }
}

export const generateWellbeingSuggestion = async (trend) => {
  try {
    const suggestionTypes = ['an uplifting movie', 'a lighthearted joke', 'a simple 5-minute mindfulness exercise'];
    const suggestionRequest = suggestionTypes[Math.floor(Math.random() * suggestionTypes.length)];

    const prompt = `
      A user's emotional trend is "${trend}". Provide a helpful, concise suggestion for ${suggestionRequest}.
      Your response must be a clean, single-line JSON object with two keys: "suggestionType" (e.g., "Movie", "Joke", "Exercise") and "suggestion" (the actual content).
      The suggestion should be short, positive, and encouraging.
      Do not add any extra text.
    `;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192", // Using the more creative model for suggestions
    });

    const response = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(response);

  } catch (error) {
    console.error('Wellbeing suggestion generation failed:', error);
    return null; // Return null on error
  }
} 