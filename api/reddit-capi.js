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
  
    if (!REDDIT_PIXEL_ID || !REDDIT_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Missing credentials' });
    }
  
    const { event_type, event_id, value, currency, product_id, order_id, click_id } = req.body;
  
    const payload = {
        test_mode: false,
      events: [{
        event_at: new Date().toISOString(),
        event_type: { tracking_type: event_type },
        event_metadata: {
          ...(event_type !== 'SignUp' && { item_count: 1 }),
          value_decimal: value || 0,
          currency: currency || 'USD',
          conversion_id: event_id,
          ...(order_id && { order_id }),
          ...(product_id && { products: [{ id: product_id }] })
        },
        user: {
          ...(click_id && { click_id })
        }
      }]
    };
  
    const response = await fetch(
      `https://ads-api.reddit.com/api/v2.0/conversions/events/${REDDIT_PIXEL_ID}?account_id=t2_2ckc6upnuy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${REDDIT_ACCESS_TOKEN}`
        },
        body: JSON.stringify(payload)
      }
    );
  
    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ success: false, reddit_response: data });
    }
    return res.status(200).json({ success: true, reddit_response: data });
  }