
import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { GoogleGenerativeAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async (req, res) => {
  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;

    if (name === 'ask') {
      const prompt = options[0].value;
      
      res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const reply = response.text || "Mujhe iska answer nahi mila.";

        await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: reply }),
        });
      } catch (error) {
        console.error(error);
        await fetch(`https://discord.com/api/v10/webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: "AI response generate karne me error aaya." }),
        });
      }
    }
  }
});

app.listen(PORT, () => {
  console.log('Server is listening on port', PORT);
});
