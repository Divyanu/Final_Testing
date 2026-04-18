export default async function handler(req, res) {
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
  
      // Build the CAPI payload
      const payload = {
        test_mode: true, // ← set to false in production
        events: [
          {
            event_at: new Date().toISOString(),
            event_type: {
              tracking_type: event_type // 'SignUp', 'AddToCart', 'Purchase'
            },
            event_metadata: {
              item_count: 1,
              value_decimal: value || 0,
              currency: currency || 'USD',
              ...(order_id && { order_id }),
              ...(product_id && {
                products: [{ id: product_id }]
              })
            },
            user: {
              // Reddit uses click_id for matching
              // passed from frontend via URL param
              ...(click_id && { click_id }),
              // You can also pass hashed email here later
            }
          }
        ]
      };
  
      // Add event_id for deduplication
      if (event_id) {
        payload.events[0].event_metadata.conversion_id = event_id;
      }
  
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
  
      console.log('Reddit CAPI response:', JSON.stringify(data));
  
      return res.status(200).json({
        success: true,
        reddit_response: data
      });
  
    } catch (error) {
      console.error('CAPI error:', error);
      return res.status(500).json({ error: error.message });
    }
  }