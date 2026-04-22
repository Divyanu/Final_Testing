export default async function handler(req, res) {
    const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
    const requestOrigin = req.headers.origin || '';

    // Add CORS headers (allow only configured origin when provided)
    if (ALLOWED_ORIGIN && requestOrigin === ALLOWED_ORIGIN) {
      res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const {
        event_type,
        event_id,
        value,
        currency,
        product_id,
        order_id,
        click_id
      } = req.body;
  
      const REDDIT_PIXEL_ID = process.env.REDDIT_PIXEL_ID;
      const REDDIT_ACCESS_TOKEN = process.env.REDDIT_ACCESS_TOKEN;

      if (!REDDIT_PIXEL_ID || !REDDIT_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Server not configured for Reddit CAPI' });
      }
  
      const payload = {
        test_mode: true,
        events: [
          {
            event_at: new Date().toISOString(),
            event_type: {
              tracking_type: event_type
            },
            event_metadata: {
              item_count: 1,
              value_decimal: value || 0,
              currency: currency || 'USD',
              conversion_id: event_id,
              ...(order_id && { order_id }),
              ...(product_id && {
                products: [{ id: product_id }]
              })
            },
            user: {
              ...(click_id && { click_id })
            }
          }
        ]
      };
  
      const response = await fetch(
        `https://ads-api.reddit.com/api/v2.0/conversions/events/${REDDIT_PIXEL_ID}`,
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
        // Log status only; avoid leaking raw provider payloads or credentials.
        console.error('Reddit CAPI failed with status:', response.status);
        return res.status(502).json({ error: 'Upstream conversion API request failed' });
      }

      return res.status(200).json({ success: true, reddit_response: data, pixel_used: REDDIT_PIXEL_ID });
  
    } catch (error) {
      console.error('CAPI handler error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  }