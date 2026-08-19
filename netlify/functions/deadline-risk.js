exports.handler = async (event) => {
  const { clients } = JSON.parse(event.body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `In one short sentence, note that these clients are on file and worth a deadline check: ${clients.join(", ")}. Keep it plain and useful, no fluff.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const summary = data.content?.find((b) => b.type === "text")?.text || "No summary returned.";

  return { statusCode: 200, body: JSON.stringify({ summary }) };
};
