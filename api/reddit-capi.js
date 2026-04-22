export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const REDDIT_PIXEL_ID = process.env.REDDIT_PIXEL_ID;
    const REDDIT_ACCESS_TOKEN = process.env.REDDIT_ACCESS_TOKEN;
  
    // TEMPORARY DEBUG — remove after fixing
    return res.status(200).json({
      pixel_id: REDDIT_PIXEL_ID,
      token_length: REDDIT_ACCESS_TOKEN ? REDDIT_ACCESS_TOKEN.length : 0,
      token_first10: REDDIT_ACCESS_TOKEN ? REDDIT_ACCESS_TOKEN.substring(0, 10) : 'EMPTY',
      token_last5: REDDIT_ACCESS_TOKEN ? REDDIT_ACCESS_TOKEN.slice(-5) : 'EMPTY'
    });
  }