exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { clientName, industry = "", tasks = [], notes = [], assets = [] } = JSON.parse(event.body || "{}");

    if (!clientName) {
      return { statusCode: 400, body: JSON.stringify({ error: "clientName is required" }) };
    }

    const todayStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `You are a Senior Agency Account Director. Generate a polished, executive-grade Weekly Client Status Report for our client "${clientName}".

Report Date: ${todayStr}
Client Industry: ${industry || "General"}
Client Context:
- Active Deliverables / Tasks: ${JSON.stringify(tasks)}
- Recent Notes & Updates: ${JSON.stringify(notes)}
- Assets On File: ${JSON.stringify(assets)}

Please format the status report in clean, professional markdown with the following sections:
1. **Executive Summary** (2-3 sentences high-level overview of momentum and health)
2. **Key Achievements & Delivered Items** (bullet points of completed or on-track milestones)
3. **In-Progress Deliverables & Next Steps** (what the team is currently actively building)
4. **Action Items for Client Approval** (any feedback, assets, or approvals needed from client)
5. **Upcoming Milestones (Next 7-14 Days)**

Keep the tone confident, transparent, professional, and client-ready.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const reportMarkdown = data.content?.find((b) => b.type === "text")?.text || "Unable to generate report at this time.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report: reportMarkdown, generatedDate: todayStr }),
    };
  } catch (err) {
    console.error("Generate client report error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Report generation error", details: err.message }),
    };
  }
};
