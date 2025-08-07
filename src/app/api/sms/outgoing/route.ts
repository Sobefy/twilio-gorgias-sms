import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Gorgias webhook received:', JSON.stringify(body, null, 2));
    
    const { ticket, message } = body;
    
    console.log('Processing outgoing SMS:');
    console.log('- Message from agent:', message?.from_agent);
    console.log('- Ticket channel:', ticket?.channel);
    console.log('- Customer email:', ticket?.customer?.email);
    
    // Only process outgoing agent messages for SMS tickets
    if (!message.from_agent || ticket.channel !== 'sms') {
      console.log('Ignoring: not agent message or not SMS channel');
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Try multiple ways to get the phone number
    let customerPhone = ticket.customer.phone || 
                       ticket.original_message?.from ||
                       ticket.customer.channels?.[0]?.address ||
                       ticket.messages?.[0]?.source?.from?.address;
    
    if (customerPhone) {
      console.log('Using phone from ticket data:', customerPhone);
    } else {
      // Fallback: Extract phone number from customer email (sms+15617259387@rescuelink.com)
      const customerEmail = ticket.customer.email;
      console.log('Extracting phone from email:', customerEmail);
      
      // More flexible regex to handle different formats
      const phoneMatch = customerEmail.match(/sms([^@]*?)@/) || customerEmail.match(/(\+\d+)/);
      
      if (!phoneMatch) {
        console.error('Could not extract phone number from:', customerEmail);
        console.error('Full ticket data:', JSON.stringify(ticket, null, 2));
        return NextResponse.json({ error: 'Could not extract phone number' }, { status: 400 });
      }
      
      customerPhone = phoneMatch[1];
      console.log('Extracted phone from email:', customerPhone);
    }
    
    // Ensure phone has + prefix
    if (!customerPhone.startsWith('+')) {
      customerPhone = '+' + customerPhone;
    }
    
    console.log('Final phone number:', customerPhone);
    
    // Send SMS via Twilio
    console.log('Sending SMS via Twilio:');
    console.log('- From:', process.env.TWILIO_PHONE_NUMBER);
    console.log('- To:', customerPhone);
    console.log('- Body:', message.body_text);
    
    const twilioMessage = await client.messages.create({
      body: message.body_text,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone
    });
    
    console.log('SMS sent successfully:', twilioMessage.sid);
    
    return NextResponse.json({ 
      success: true, 
      messageSid: twilioMessage.sid,
      to: customerPhone
    });
    
  } catch (error: unknown) {
    console.error('Error sending SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      error: error
    });
    return NextResponse.json({ 
      error: 'Failed to send SMS', 
      details: errorMessage
    }, { status: 500 });
  }
}