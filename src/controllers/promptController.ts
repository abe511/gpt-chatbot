import { Request, Response } from "express";
import OpenAI from "openai";
import { session, resetSession } from "../database/db";


const setContext = (messages: OpenAI.Chat.Completions.ChatCompletionMessage[]) => {

  if(session.length === 0) {
    const msg: string = "You are a helpful assistant.";
    session.push({role: "system", content: msg});
  }

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


export const prompt = (req: Request, res: Response) => {

  if(req.method === "GET") {
    return res.json("use a POST request");
  }

  if(!req.body.messages.length || !("role" in req.body.messages[0] && "content" in req.body.messages[0])) {
    return res.json("please provide a correctly formatted JSON object")
  }
  
  setContext(req.body.messages);
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
};
