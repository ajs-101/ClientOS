exports.handler = async (event) => {
  const { grouped } = JSON.parse(event.body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 350,
      messages: [
        {
          role: "user",
          content: `You're briefing a busy admin on their whole team's workload across four profiles (Podcast, Website, Email Marketing, Development). In 4-6 plain sentences, call out what's overdue or needs attention first, then a quick note on the rest. Data: ${grouped}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const summary = data.content?.find((b) => b.type === "text")?.text || "No summary returned.";

  return { statusCode: 200, body: JSON.stringify({ summary }) };
};
