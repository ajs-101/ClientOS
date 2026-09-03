exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { todayStr, profileName, tasks = [], events = [], internalProjects = [] } = JSON.parse(event.body || "{}");

    const prompt = `You are an AI Workspace Manager for ClientOS.
Today's Date: ${todayStr}
Target Profile / Scope: ${profileName || "All Workspace"}

Data to Analyze:
- Employee Tasks: ${JSON.stringify(tasks)}
- Calendar Events / Deadlines: ${JSON.stringify(events)}
- Internal Projects: ${JSON.stringify(internalProjects)}

Instructions:
1. Provide a concise, highly engaging 3-4 sentence daily executive briefing in clear, professional English.
2. Highlight overdue items first as high priority (🔴 Urgent).
3. Mention today's tasks and scheduled events (🟡 Today).
4. Give 2 quick actionable tips for maximum productivity today.
5. Return JSON object with keys: "briefing" (text string), "urgentCount" (number), "todayCount" (number).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data.content?.find((b) => b.type === "text")?.text || "No summary returned.";

    const urgentCount = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "green").length;
    const todayCount = tasks.filter((t) => t.dueDate === todayStr).length + events.filter((e) => e.date === todayStr).length;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefing: rawText,
        urgentCount,
        todayCount,
      }),
    };
  } catch (err) {
    console.error("Today tasks AI error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate today tasks briefing", details: err.message }),
    };
  }
};
