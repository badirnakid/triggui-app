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

  try {
    const url = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/lab-pulse.json";
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return res.status(200).json({ total: 0 });
    }

    const data = await response.json();
    return res.status(200).json({ total: Number(data.total || 0) });
  } catch (err) {
    return res.status(200).json({ total: 0 });
  }
}
