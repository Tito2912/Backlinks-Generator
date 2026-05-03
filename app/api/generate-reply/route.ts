import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, link } = body;

    if (!title || !link) {
      return new Response(
        JSON.stringify({ error: "Missing title or link" }),
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: `Write a helpful Reddit reply for this topic: ${title}.
Include this link naturally: ${link}.
Tone: human, helpful, not spammy.`,
        },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("OpenAI error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate reply",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}