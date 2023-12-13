import OpenAI from "openai";

export let session: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

export const resetSession = () => {
  session = [];
};
