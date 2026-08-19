exports.handler = async (event) => {
  const { clientName, activityLog } = JSON.parse(event.body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Summarize this client activity log for ${clientName} in 3-4 plain sentences a busy exec can skim. Activity: ${JSON.stringify(activityLog)}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const summary = data.content?.find((b) => b.type === "text")?.text || "No summary returned.";

  return { statusCode: 200, body: JSON.stringify({ summary }) };
};
