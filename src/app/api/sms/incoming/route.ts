import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const Body = formData.get('Body') as string;
    const From = formData.get('From') as string;
    const To = formData.get('To') as string;
    
    // Handle different message types
    const messageBody = Body.trim().toLowerCase();
    
    if (messageBody === 'stop' || messageBody === 'unsubscribe') {
      await handleUnsubscribe(From);
      return sendTwiMLResponse("CONFIRMED: You've been unsubscribed from Rescue Link SMS notifications. You will not receive any more automated messages. Text START to resubscribe or email support@rescuelink.com for assistance.");
    }
    
    if (messageBody === 'start' || messageBody === 'subscribe') {
      await handleSubscribe(From);
      return sendTwiMLResponse("Welcome back! You're subscribed to Rescue Link updates. Reply STOP to opt out.");
    }
    
    if (messageBody === 'help') {
      // Create Gorgias ticket for help requests
      await createGorgiasTicket(From, To, 'Customer requested help via SMS');
      return sendTwiMLResponse("Hi! You can text us anytime and someone from our Rescue Link team will respond. Please include your name in your message so we can assist you better. Reply STOP to opt out or email support@rescuelink.com");
    }
    
    // Create Gorgias ticket for general messages
    await createGorgiasTicket(From, To, Body);
    
    // Send auto-response
    return sendTwiMLResponse("Thanks for contacting Rescue Link! We've received your message and will respond shortly. If this is your first time messaging us, please include your name so we can assist you better. For urgent matters, email support@rescuelink.com");
    
  } catch (error) {
    console.error('Error processing SMS:', error);
    return sendTwiMLResponse("Thanks for your message. We'll get back to you soon!");
  }
}

function sendTwiMLResponse(message: string) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${message}</Message>
</Response>`;
  
  return new NextResponse(twiml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

async function createGorgiasTicket(from: string, to: string, body: string) {
  const ticketData = {
    customer: {
      email: `sms${from}@rescuelink.com`
    },
    messages: [{
      source: {
        to: [{ address: to }],
        from: { address: from },
        type: "phone"
      },
      body_html: body,
      body_text: body,
      channel: "sms",
      from_agent: false,
      stripped_text: body,
      via: "api"
    }],
    channel: "sms",
    from_agent: false,
    status: "open",
    via: "api",
    subject: `SMS from ${from}`
  };
  
  const response = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GORGIAS_API_KEY}`
    },
    body: JSON.stringify(ticketData)
  });
  
  if (!response.ok) {
    throw new Error(`Gorgias API error: ${response.status}`);
  }
  
  return response.json();
}

async function handleUnsubscribe(phoneNumber: string) {
  try {
    // Log unsubscribe for compliance tracking
    console.log(`SMS Unsubscribe: ${phoneNumber} at ${new Date().toISOString()}`);
    
    // Store unsubscribe in a database or service if needed
    // For now, we'll just log it for compliance purposes
    // TODO: Implement persistent storage for unsubscribe list
    
  } catch (error) {
    console.error(`Error handling unsubscribe for ${phoneNumber}:`, error);
  }
}

async function handleSubscribe(phoneNumber: string) {
  console.log(`Subscribed: ${phoneNumber}`);
}