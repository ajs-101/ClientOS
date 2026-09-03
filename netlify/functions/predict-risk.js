exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { tasks = [], profiles = [], clients = [] } = JSON.parse(event.body || "{}");

    const prompt = `You are a Senior Agency Risk & Predictive Operations Advisor.
Analyze the following workspace metrics and predict operational bottlenecks:

Data Summary:
- Total Tasks: ${tasks.length}
- Tasks Breakdown: ${JSON.stringify(tasks.map((t) => ({ title: t.title, profile: t.profile, status: t.status, dueDate: t.dueDate })))}
- Profiles List: ${JSON.stringify(profiles)}
- Total Clients: ${clients.length}

Instructions:
1. Provide a crisp 3-4 point Executive Risk Analysis in English.
2. Identify overloaded team departments (e.g. Website team has 4 active tasks while Dev team has 0).
3. Call out high-risk overdue items and suggest task re-allocations (e.g. "Re-assign Task X from Website to Dev team to rebalance capacity").
4. Give an overall Operational Health Grade (e.g. "Grade: A - Smooth", "Grade: B - Minor Delay Risk", "Grade: C - Action Required").`;

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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();
    const predictions = data.content?.find((b) => b.type === "text")?.text || "No risk analysis generated.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictions }),
    };
  } catch (err) {
    console.error("Predict risk error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate risk predictions", details: err.message }),
    };
  }
};
