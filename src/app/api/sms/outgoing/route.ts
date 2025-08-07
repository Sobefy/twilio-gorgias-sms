import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { ticket, message } = await req.json();
    
    // Only process outgoing agent messages for SMS tickets
    if (!message.from_agent || ticket.channel !== 'sms') {
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Extract phone number from customer email (sms+15617259387@rescuelink.com)
    const customerEmail = ticket.customer.email;
    const phoneMatch = customerEmail.match(/sms\+?([^@]+)/);
    
    if (!phoneMatch) {
      return NextResponse.json({ error: 'Could not extract phone number' }, { status: 400 });
    }
    
    const customerPhone = phoneMatch[1];
    
    // Send SMS via Twilio
    const twilioMessage = await client.messages.create({
      body: message.body_text,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone
    });
    
    return NextResponse.json({ 
      success: true, 
      messageSid: twilioMessage.sid 
    });
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}