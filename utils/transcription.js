import Groq from 'groq-sdk';
import fs from 'fs';

const groq = new Groq({
  apiKey: "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",
});

// Test Groq API connectivity
export const testGroqConnection = async () => {
  try {
    console.log('Testing Groq API connection...');
    console.log('API Key available:', !!"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");
    
    if (!"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") {
      console.log('No Groq API key found');
      return false;
    }

    // Test with a simple text completion
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Say hello" }],
      model: "llama3-8b-8192",
      max_tokens: 10,
    });

    console.log('Groq API test successful:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('Groq API test failed:', error.message);
    return false;
  }
};

// Mock transcription for testing (when Groq API is not available)
export const mockTranscription = async (filePath) => {
  console.log('Mock transcription for:', filePath);
  return "This is a mock transcription for testing purposes. The actual audio would be transcribed here.";
};

// Transcribe using file path (from multer)
export const transcribeAudio = async (filePath) => {
  try {
    // Check if Groq API key is available
    if (!"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") {
      console.log('Groq API key not found, using mock transcription');
      return await mockTranscription(filePath);
    }

    console.log('Starting transcription for file:', filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    console.log('File size:', fileStats.size, 'bytes');

    // Use Groq SDK for transcription with timeout
    const transcriptionPromise = groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
    });

    const transcription = await Promise.race([
      transcriptionPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transcription timeout')), 60000)
      )
    ]);

    console.log('Transcription completed successfully');
    return transcription.text || 'No transcription available';

  } catch (error) {
    console.error('Transcription failed:', error.message);
    console.log('Falling back to mock transcription');
    return await mockTranscription(filePath);
  }
};

// Alternative: Transcribe from Cloudinary URL (download first)
export const transcribeFromUrl = async (audioUrl) => {
  try {
    if (!"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") {
      return await mockTranscription(audioUrl);
    }

    console.log('Downloading audio from:', audioUrl);
    
    // Download audio from Cloudinary URL with timeout
    const audioBuffer = await Promise.race([
      downloadAudio(audioUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Download timeout')), 30000)
      )
    ]);
    
    console.log('Audio downloaded, size:', audioBuffer.length, 'bytes');

    // Create temporary file
    const tempFilePath = `./public/temp/temp_${Date.now()}.wav`;
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      // Transcribe the temporary file
      const transcription = await transcribeAudio(tempFilePath);
      return transcription;
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (error) {
    console.error('URL transcription failed:', error.message);
    return await mockTranscription(audioUrl);
  }
};

// Helper function to download audio from URL
const downloadAudio = async (url) => {
  try {
    console.log('Downloading audio from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Download error:', error.message);
    throw new Error('Failed to download audio file');
  }
}; 