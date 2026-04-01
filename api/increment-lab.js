import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const owner = "badirnakid";
  const repo = "triggui-content";
  const path = "lab-pulse.json";

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    let currentTotal = 0;
    let sha;

    try {
      const { data: file } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      const content = Buffer.from(file.content, "base64").toString("utf8");
      const json = JSON.parse(content);

      currentTotal = Number(json.total || 0);
      sha = file.sha;
    } catch (err) {
      if (err.status !== 404) {
        throw err;
      }
    }

    const total = currentTotal + 1;

    const payload = {
      total,
      updatedAt: new Date().toISOString(),
    };

    const encoded = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `increment lab pulse to ${total}`,
      content: encoded,
      ...(sha ? { sha } : {}),
    });

    return res.status(200).json({ success: true, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message || "Error incrementando lab pulse",
    });
  }
}
