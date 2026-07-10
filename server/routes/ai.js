import { Router } from 'express';

const router = Router();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-8b-instruct';

function buildSystemPrompt(context) {
  const { campaigns = [], orders = [], currentPage = 'dashboard', userName = 'Admin' } = context;

  const campaignSummary = campaigns.length > 0
    ? campaigns.map(c => `- ID: ${c.id}, Name: "${c.campaignName || 'Untitled'}", Status: ${c.status}, Contacts: ${c.contactCount || 0}, Created: ${c.createdAt}`).join('\n')
    : 'No campaigns created yet.';

  const orderSummary = orders.length > 0
    ? orders.map(o => `- ID: ${o.id}, Campaign: "${o.campaignName || 'Untitled'}", Status: ${o.status}, Contacts: ${o.contactCount || 0}, Cost: $${o.estimatedCost || '0.00'}, Created: ${o.createdAt}`).join('\n')
    : 'No orders created yet.';

  return `You are the XPAC AI Assistant, an intelligent operations manager for the XPAC IVR Calling Platform. You help users manage their voice campaigns, orders, analytics, and settings using natural language.

## Your Role
- You are a friendly, professional, business-focused assistant
- You help non-technical users perform actions without navigating through multiple pages
- You are concise but thorough when needed
- You explain everything simply, avoiding technical jargon
- You are the central brain of the XPAC platform

## Current User
- Name: ${userName}
- Current Page: ${currentPage}

## Application Data

### Campaigns (${campaigns.length} total)
${campaignSummary}

### Orders (${orders.length} total)
${orderSummary}

## Available Actions
You can help users with these actions. When a user asks for something, respond with both a helpful message AND a JSON action block if an action should be performed.

### Order Management
- Show orders (all, pending, completed, failed)
- Track specific order by ID (format: IVR-YYYY-XXXXXX)
- Get order details and status
- Delete orders
- Duplicate campaigns from orders

### Campaign Management  
- Show campaigns (all, running, paused, completed)
- View campaign details
- Launch new campaigns (navigate to wizard)
- Pause/resume campaigns
- Clone/duplicate campaigns
- Cancel campaigns

### Reports & Analytics
- Show reports and summaries
- Display analytics (calls, success rate, duration)
- Compare campaigns
- Download reports

### Navigation
- Navigate to Dashboard, Campaigns, Orders, Reports, Analytics, Settings
- Open the campaign creation wizard

## Response Format

Always respond in this exact JSON structure:
{
  "message": "Your conversational response here. Use markdown for formatting.",
  "action": {
    "type": "navigate" | "show_orders" | "show_campaigns" | "show_analytics" | "show_reports" | "track_order" | "delete_order" | "launch_campaign" | "none",
    "data": { /* relevant data for the action */ }
  },
  "cards": [
    {
      "type": "order" | "campaign" | "analytics" | "report",
      "data": { /* card data */ }
    }
  ],
  "suggestions": ["follow up suggestion 1", "follow up suggestion 2"]
}

## Rules
1. ALWAYS respond with valid JSON
2. The "message" field should contain your conversational response
3. Use markdown formatting in the message field (**bold**, \`code\`, etc.)
4. When showing orders or campaigns, include them in the "cards" array
5. Include relevant follow-up "suggestions" for the user
6. If the user asks to navigate, set action.type to "navigate" with the path in data
7. If the user asks about a specific order ID, look it up in the orders data
8. If the user asks about campaigns, filter and show relevant ones
9. For analytics questions, calculate from the available data
10. If you can't find something, say so kindly and suggest alternatives
11. Keep responses concise (2-4 sentences typically)
12. Be proactive - suggest next steps when appropriate

## Examples

User: "Where is my latest order?"
Response: {
  "message": "Your latest order is **${orders[0]?.id || 'IVR-2026-000001'}** for campaign **${orders[0]?.campaignName || 'Untitled'}**. It's currently **${orders[0]?.status || 'Created'}**.",
  "action": { "type": "track_order", "data": { "orderId": "${orders[0]?.id || ''}" } },
  "cards": [{ "type": "order", "data": ${JSON.stringify(orders[0] || {})} }],
  "suggestions": ["View order details", "Track live", "Show all orders"]
}

User: "Show me running campaigns"
Response: {
  "message": "You have **${campaigns.filter(c => c.status === 'Running').length}** running campaign(s). Here they are:",
  "action": { "type": "show_campaigns", "data": { "filter": "Running" } },
  "cards": ${JSON.stringify(campaigns.filter(c => c.status === 'Running').map(c => ({ type: 'campaign', data: c })))},
  "suggestions": ["View campaign details", "Pause a campaign", "Launch new campaign"]
}

User: "How many calls today?"
Response: {
  "message": "Today's summary: **${orders.length}** total orders with **${orders.reduce((s,o) => s + (o.contactCount||0), 0)}** contacts across all campaigns.",
  "action": { "type": "show_analytics" },
  "cards": [{ "type": "analytics", "data": { "totalOrders": ${orders.length}, "totalContacts": ${orders.reduce((s,o) => s + (o.contactCount||0), 0)}, "completed": ${orders.filter(o => o.status === 'Completed').length}, "failed": ${orders.filter(o => o.status === 'Failed').length} } }],
  "suggestions": ["View detailed analytics", "Download report", "Compare campaigns"]
}`;
}

router.post('/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemPrompt = buildSystemPrompt(context || {});

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('NVIDIA API Error:', response.status, errorData);
      return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          message: aiContent,
          action: { type: 'none' },
          cards: [],
          suggestions: ['Show my orders', 'View campaigns', 'Help me with analytics'],
        };
      }
    } catch {
      parsed = {
        message: aiContent,
        action: { type: 'none' },
        cards: [],
        suggestions: ['Show my orders', 'View campaigns', 'Help me with analytics'],
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/suggestions', async (req, res) => {
  const { partial, context } = req.body;
  const suggestions = generateSuggestions(partial, context);
  res.json({ suggestions });
});

function generateSuggestions(partial, context) {
  const { campaigns = [], orders = [] } = context || {};
  const lower = (partial || '').toLowerCase();

  const staticSuggestions = [
    'Show my orders',
    'Show running campaigns',
    'How many calls today?',
    'Create a new campaign',
    'Download latest report',
    'View analytics',
    'Track my latest order',
    'Show failed orders',
    'What is the success rate?',
    'Show completed campaigns',
  ];

  const dynamicSuggestions = [];

  if (lower.includes('order') || lower.includes('ivr')) {
    orders.forEach(o => {
      if (o.id.toLowerCase().includes(lower) || (o.campaignName || '').toLowerCase().includes(lower)) {
        dynamicSuggestions.push(`Track ${o.id}`);
      }
    });
  }

  if (lower.includes('campaign') || lower.includes('cmp')) {
    campaigns.forEach(c => {
      if (c.id.toLowerCase().includes(lower) || (c.campaignName || '').toLowerCase().includes(lower)) {
        dynamicSuggestions.push(`View ${c.campaignName || c.id}`);
      }
    });
  }

  const all = [...dynamicSuggestions, ...staticSuggestions.filter(s => s.toLowerCase().includes(lower))];
  return all.slice(0, 6);
}

export default router;
