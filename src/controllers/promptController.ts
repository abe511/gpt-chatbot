import { Request, Response } from "express";
import OpenAI from "openai";
import GPT4Tokenizer from "gpt4-tokenizer";
import { session, resetSession } from "../database/db";


const countTokens = (str: string | null | OpenAI.Chat.Completions.ChatCompletionContentPart[], model: string = process.env.MODEL || "gpt-3.5-turbo") => {
  const tokenizer = new GPT4Tokenizer({type: model.includes("gpt-4") ? "gpt4" : "gpt3"});
  if(str) {
    const estimatedTokenCount: number = tokenizer.estimateTokenCount(str.toString());
    return estimatedTokenCount;
  }
  return 0;
};


const setContext = (messages: OpenAI.Chat.Completions.ChatCompletionMessage[]) => {

  if(session.length === 0) {
    const msg: string = "You are a helpful assistant.";
    session.push({role: "system", content: msg});
  }

  // update session with "user" messages
  // "system" message resets the session
  messages.forEach((msg: OpenAI.Chat.Completions.ChatCompletionMessageParam) => {
    if(msg.role === "system") {
      resetSession();
      session[0] = {role: "system", content: msg.content};
    } else {
      session.push({role: "user", content: msg.content});
    }
  })
}


async function completion() {

  const openai: OpenAI = new OpenAI(
    {apiKey: process.env.OPENAI_API_KEY}
  );
  
  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: session,
    model: process.env.MODEL || "gpt-3.5-turbo",
  };
  
  try {
    const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
    return chatCompletion;
  }
  catch(e: any) {
    console.log(e.error.message);
  }
} 


const trimSession = (messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) => {
  let total = 0;
  let limit = Number(process.env.TOKEN_LIMIT) ? Number(process.env.TOKEN_LIMIT) : 0;
  let completionBuffer = Math.floor(limit / 4);
  let i = messages.length - 1;

  for(; i > 0; --i) {
    total += countTokens(messages[i].content);
    if(total >= limit - completionBuffer) {
      break;
    }
  }

  while(i--) {
    session.shift();
  }
  // 12 tokens for this instruction
  session.push({role: "user", content: `Use no more than ${limit - total - 12} tokens for the answer.`});

  return total;
};


export const prompt = (req: Request, res: Response) => {

  try {
    
    if(req.method === "GET") {
      return res.json("use a POST request");
    }
  
    if(!req.body.messages.length || !("role" in req.body.messages[0] && "content" in req.body.messages[0])) {
      return res.json("please provide a correctly formatted JSON object")
    }
    setContext(req.body.messages);
    trimSession(session);
    completion().then((data) => {
      if (data?.choices[0]?.message) {
        session.push(data.choices[0].message);
        return res.json(session[session.length - 1].content);
      } else {
        throw Error("No data");
      }
    })
    .catch((err) => {
      return res.json(`error: ${err}`);
    });
  } catch (e) {
    console.log(e);
  }
};
