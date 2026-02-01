import { AssemblyAI } from "assemblyai";
import { config } from "../config";
import { log } from "../utils";

let client: AssemblyAI | null = null;

function getClient(): AssemblyAI {
  if (!config.assemblyAiApiKey) {
    throw new Error("ASSEMBLYAI_API_KEY is not configured");
  }

  if (!client) {
    client = new AssemblyAI({
      apiKey: config.assemblyAiApiKey,
    });
  }

  return client;
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const assemblyClient = getClient();

  log("info", "Starting transcription", { audioUrl });

  const transcript = await assemblyClient.transcripts.transcribe({
    audio: audioUrl,
    language_detection: true,
  });

  if (transcript.status === "error") {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }

  log("info", "Transcription completed", {
    text: transcript.text,
    confidence: transcript.confidence,
    language: transcript.language_code,
  });

  return transcript.text || "";
}
