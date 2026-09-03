exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { clientName, clientIndustry, activityLog = [], notes = [], assets = [] } = JSON.parse(event.body || "{}");

    const prompt = `You are a professional account executive writing a polished, clear status update email to a client.
Client Name: ${clientName || "Valued Client"}
Industry: ${clientIndustry || "General"}

Client Context:
- Asset Files Uploaded: ${JSON.stringify(assets)}
- Notes & Deliverables: ${JSON.stringify(notes)}
- Activity Log: ${JSON.stringify(activityLog)}

Instructions:
1. Write a professional status update email.
2. Include a catchy Subject Line (prefixed with "Subject: ").
3. Structure with a polite greeting, Key Accomplishments & Deliverables, Items Needing Client Review/Input (if any), and Next Milestones for this week.
4. Keep the tone warm, confident, and executive-ready.
5. Return JSON with keys: "subject", "body", "formattedEmail".`;

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
    const rawText = data.content?.find((b) => b.type === "text")?.text || "";

    let subject = `Project Progress Update — ${clientName}`;
    let body = rawText;

    if (rawText.includes("Subject:")) {
      const parts = rawText.split("\n");
      const subjectLine = parts.find((p) => p.startsWith("Subject:"));
      if (subjectLine) {
        subject = subjectLine.replace("Subject:", "").trim();
        body = parts.filter((p) => !p.startsWith("Subject:")).join("\n").trim();
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        body,
        formattedEmail: `Subject: ${subject}\n\n${body}`,
      }),
    };
  } catch (err) {
    console.error("Email generation error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate email", details: err.message }),
    };
  }
};
