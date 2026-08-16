import { createApp } from "./app.js";
import { createRealAgent } from "./app.js";

const PORT = Number(process.env.PORT ?? 8081);
if (!process.env.GROQ_API_KEY) {
  console.warn("[sage] GROQ_API_KEY is not set — the LLM will reject requests");
}
createApp(createRealAgent()).listen(PORT, () => {
  console.log(`[sage] listening on :${PORT}`);
});
