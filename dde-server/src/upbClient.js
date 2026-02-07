import OpenAI from "openai";

export function makeUpbClient() {
    const apiKey = process.env.UPB_API_KEY;
    const baseURL = process.env.UPB_BASE_URL;

    if (!apiKey) throw new Error("Missing UPB_API_KEY in .env");
    if (!baseURL) throw new Error("Missing UPB_BASE_URL in .env");

    return new OpenAI({
        apiKey,
        baseURL, // OpenAI SDK uses baseURL
    });
}
