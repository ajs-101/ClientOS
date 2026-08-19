exports.handler = async (event) => {
  const { profileName, tasks } = JSON.parse(event.body);

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
          content: `Summarize the current workload for the ${profileName} profile in 3-4 plain sentences a manager can skim in a few seconds. Mention anything overdue or needing attention first. Tasks: ${JSON.stringify(tasks)}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const summary = data.content?.find((b) => b.type === "text")?.text || "No summary returned.";

  return { statusCode: 200, body: JSON.stringify({ summary }) };
};
