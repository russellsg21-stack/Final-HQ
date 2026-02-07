import { GoogleGenAI } from "@google/genai";
import { Room } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOccupancyReport = async (rooms: Room[]): Promise<string> => {
  const roomData = rooms.map(r => ({
    room: r.roomNumber,
    status: r.status,
    guest: r.guestName || 'N/A',
    timeLeft: r.endTime ? Math.max(0, r.endTime - Date.now()) : 0
  }));

  const prompt = `
    As a professional hotel operations manager, provide a very brief (2-3 sentences) executive summary of the current room occupancy status.
    Current Data: ${JSON.stringify(roomData)}
    Highlight if the hotel is nearly full or mostly empty, and maybe a professional tip for the front desk.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a concise hotel management AI. Keep responses brief and professional.",
        temperature: 0.7,
      },
    });

    return response.text || "Report unavailable at this time.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "Could not generate AI insights at the moment.";
  }
};