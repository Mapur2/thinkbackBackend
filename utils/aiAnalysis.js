import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: `${"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"}`,
});
export const generateAIAnalyzedTimeline = async ({prompt}) => {
  try {
   
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    const analysis = response;
    
    return {
      summary: analysis.summary,
      detectedMood: analysis.detectedMood,
      topics: analysis.topics || [],
      suggestedTags: analysis.suggestedTags || ''
    };
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return {
      summary: 'AI analysis unavailable',
      detectedMood: mood || 'unknown',
      topics: [],
      suggestedTags: ''
    };
  }
};
export const generateAIAnalysis = async ({ transcription, title, mood }) => {
  try {
    const prompt = `
      Analyze this voice memory and provide insights:

      Transcription: "${transcription || 'No transcription available'}"
      Title: "${title || 'Untitled'}"
      User Mood: "${mood || 'Not specified'}"

      Please provide:
      1. A concise summary (2-3 sentences)
      2. Detected emotion from the content (joy, sadness, excitement, calm, anxiety, gratitude, curious, regret)
      3. Key topics mentioned
      4. Suggested tags (comma-separated)

      Format your response as JSON:
      {
        "summary": "your summary here",
        "detectedMood": "emotion",
        "topics": ["topic1", "topic2"],
        "suggestedTags": "tag1, tag2, tag3"
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    const analysis = JSON.parse(response);
    
    return {
      summary: analysis.summary,
      detectedMood: analysis.detectedMood,
      topics: analysis.topics || [],
      suggestedTags: analysis.suggestedTags || ''
    };
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return {
      summary: 'AI analysis unavailable',
      detectedMood: mood || 'unknown',
      topics: [],
      suggestedTags: ''
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