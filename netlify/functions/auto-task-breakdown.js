exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { projectPrompt, clientName = "" } = JSON.parse(event.body || "{}");

    if (!projectPrompt || !projectPrompt.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "projectPrompt is required" }),
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const systemPrompt = `You are an AI Agency Operations Manager for ClientOS.
Your task is to break down a high-level project goal or client onboarding brief into 4-6 specific, actionable tasks for a digital agency team.

Target Profiles Available:
- "website" (Website Design, UI/UX, Page updates, SEO)
- "email" (Email Marketing, Newsletters, Automations, Copywriting)
- "development" (Custom Backend, APIs, Frontend Features, Integration)
- "podcast" (Audio Editing, Show Notes, Podcast Publishing, Media)
- "aeo" (AEO Systems and Visibility, Optimization, AI Search)

Today's Date: ${todayStr}

Output Format Instructions:
Return ONLY a valid JSON array of objects inside a "tasks" key.
Each task object MUST have:
- "title": Short action-oriented title (string)
- "description": 1-2 sentence detailed deliverable instructions (string)
- "profile": Exactly one of ["website", "email", "development", "podcast", "aeo"]
- "daysFromNow": Integer from 2 to 21 indicating target deadline days from today.

Example JSON output structure:
{
  "tasks": [
    {
      "title": "Design E-commerce Homepage Wireframes",
      "description": "Create desktop and mobile wireframes for client approval.",
      "profile": "website",
      "daysFromNow": 3
    }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Break down this project into team tasks for client "${clientName}": ${projectPrompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const rawText = data.content?.find((b) => b.type === "text")?.text || "{}";

    let parsedTasks = [];
    try {
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = rawText.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonString);
        parsedTasks = parsed.tasks || [];
      }
    } catch (e) {
      console.error("JSON parse error from Claude output:", e);
    }

    // Format due dates
    const formattedTasks = parsedTasks.map((t) => {
      const days = t.daysFromNow || 5;
      const targetDate = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
      const validProfiles = ["website", "email", "development", "podcast", "aeo"];
      return {
        title: t.title || "New Deliverable",
        description: t.description || "",
        profile: validProfiles.includes(t.profile) ? t.profile : "website",
        dueDate: targetDate,
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: formattedTasks }),
    };
  } catch (err) {
    console.error("Auto task breakdown error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to break down project tasks", details: err.message }),
    };
  }
};
