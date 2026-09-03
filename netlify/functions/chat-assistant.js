exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { messages = [], workspaceContext = {} } = JSON.parse(event.body || "{}");

    const systemPrompt = `You are ClientOS AI Assistant, an expert AI co-pilot for agency workspace management.
You assist managers, team members, and admins in navigating their clients, employee task workloads, project deadlines, and agency operations.

Current Workspace Context:
- Active Organization: ${workspaceContext.orgName || "ClientOS Agency"}
- Total Active Clients: ${workspaceContext.clientsCount || 0}
- Active Client Names: ${JSON.stringify(workspaceContext.clientNames || [])}
- Tasks Summary: Total (${workspaceContext.totalTasks || 0}), Overdue (${workspaceContext.overdueTasks || 0})
- Profiles: Podcast, Website, Email Marketing, Development

Instructions for response:
1. Always respond in clear, professional, friendly English.
2. Be concise, direct, and encouraging.
3. If asked about tasks or clients, use the workspace context provided.
4. Format lists with bullet points if multiple items are mentioned.`;

    const formattedMessages = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        system: systemPrompt,
        messages: formattedMessages,
      }),
    });

    const data = await response.json();
    const replyText = data.content?.find((b) => b.type === "text")?.text || "Sorry, I couldn't generate a response right now. Please try again.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText }),
    };
  } catch (err) {
    console.error("Chat assistant error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Chat processing error", details: err.message }),
    };
  }
};
