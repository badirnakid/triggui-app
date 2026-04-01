export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({
      success: false,
      error: "Missing GITHUB_TOKEN",
    });
  }

  try {
    const { Octokit } = await import("@octokit/rest");

    const owner = "badirnakid";
    const repo = "triggui-content";
    const path = "lab-pulse.json";

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    try {
      const { data: file } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      const content = Buffer.from(file.content, "base64").toString("utf8");
      const json = JSON.parse(content);

      return res.status(200).json({
        total: Number(json.total || 0),
      });
    } catch (err) {
      if (err.status === 404) {
        return res.status(200).json({ total: 0 });
      }
      throw err;
    }
  } catch (err) {
    console.error("get-lab error:", {
      message: err.message,
      status: err.status,
      name: err.name,
      response: err.response?.data || null,
    });

    return res.status(500).json({
      success: false,
      error: err.message || "Error obteniendo lab pulse",
      status: err.status || null,
      name: err.name || null,
    });
  }
}
