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
      // Find or create Gorgias ticket for help requests
      await findOrCreateGorgiasTicket(From, To, 'Customer requested help via SMS');
      return sendTwiMLResponse("Hi! You can text us anytime and someone from our Rescue Link team will respond. Please include your name in your message so we can assist you better. Reply STOP to opt out or email support@dryeyerescue.com");
    }
    
    // Find or create Gorgias ticket for general messages
    const ticketResult = await findOrCreateGorgiasTicket(From, To, Body);
    
    // Send auto-response based on what happened
    const isNewTicket = ticketResult?.isNewTicket !== false;
    const wasRestored = ticketResult?.wasRestored === true;
    
    if (isNewTicket) {
      return sendTwiMLResponse("Thanks for contacting Rescue Link! We've received your message and will respond shortly. If this is your first time messaging us, please include your name so we can assist you better. For urgent matters, email support@dryeyerescue.com");
    } else if (wasRestored) {
      return sendTwiMLResponse("Thanks for your message! We've restored your previous conversation and added your new message.");
    } else {
      return sendTwiMLResponse("Thanks for your message! We've added it to your existing conversation.");
    }
    
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
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  // Create individual customer for this phone number
  const customer = await createOrUpdateCustomer(from, credentials);
  
  const ticketData = {
    customer: {
      email: customer.email,
      phone: from
    },
    messages: [{
      source: {
        to: [{ address: to }],
        from: { address: from },
        type: "phone"
      },
      body_text: body,
      channel: "sms",
      from_agent: false,
      via: "api"
    }],
    channel: "sms",
    from_agent: false,
    status: "open",
    via: "api",
    subject: `SMS from ${from}`
  };
  
  console.log('Creating Gorgias ticket with data:', JSON.stringify(ticketData, null, 2));
  console.log('API endpoint:', `https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets`);
  console.log('Auth header:', process.env.GORGIAS_API_KEY ? 'API key present' : 'API key missing');
  
  const response = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    },
    body: JSON.stringify(ticketData)
  });
  
  console.log('Gorgias API response status:', response.status);
  console.log('Gorgias API response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gorgias API error response:', errorText);
    throw new Error(`Gorgias API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Gorgias ticket created successfully:', result);
  return result;
}

async function createOrUpdateCustomer(phoneNumber: string, credentials: string) {
  try {
    console.log('Creating/finding individual customer for phone:', phoneNumber);
    
    // Create unique email for each phone number (remove + and use different format)
    const cleanPhone = phoneNumber.replace('+', '');
    const customerEmail = `sms-${cleanPhone}@rescuelink.com`;
    
    // First check if customer already exists for this specific phone number
    const searchResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(customerEmail)}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      
      if (searchData.data && searchData.data.length > 0) {
        // Customer exists for this phone number
        const customer = searchData.data[0];
        console.log('✅ Found existing customer for phone:', customer.id);
        return {
          id: customer.id,
          email: customer.email,
          phone: phoneNumber
        };
      } else {
        // Customer doesn't exist, create new one for this phone number
        console.log('Creating new customer for phone:', phoneNumber);
        
        const createData = {
          email: customerEmail,
          name: `SMS Customer ${phoneNumber}`,
          channels: [{
            type: "phone",
            address: phoneNumber
          }],
          note: `Customer contacted via SMS from ${phoneNumber}`
        };
        
        const createResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          body: JSON.stringify(createData)
        });
        
        if (createResponse.ok) {
          const newCustomer = await createResponse.json();
          console.log('✅ New customer created successfully:', newCustomer.id);
          return {
            id: newCustomer.id,
            email: newCustomer.email,
            phone: phoneNumber
          };
        } else {
          const errorText = await createResponse.text();
          console.log('⚠️ Failed to create customer:', errorText);
          
          // Fallback: return the expected structure for ticket creation
          return {
            id: null,
            email: customerEmail,
            phone: phoneNumber
          };
        }
      }
    } else {
      console.log('⚠️ Customer search failed:', await searchResponse.text());
      
      // Fallback: return the expected structure for ticket creation
      return {
        id: null,
        email: customerEmail,
        phone: phoneNumber
      };
    }
  } catch (error) {
    console.error('Error creating/finding customer:', error);
    
    // Fallback: return the expected structure for ticket creation
    const cleanPhone = phoneNumber.replace('+', '');
    return {
      id: null,
      email: `sms-${cleanPhone}@rescuelink.com`,
      phone: phoneNumber
    };
  }
}

async function findOrCreateGorgiasTicket(from: string, to: string, body: string) {
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  try {
    console.log('Looking for existing customer and tickets for phone:', from);
    
    // Look for individual customer for this specific phone number
    const cleanPhone = from.replace('+', '');
    const customerEmail = `sms-${cleanPhone}@rescuelink.com`;
    const customerResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(customerEmail)}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log('Individual customer search result:', customerData.data?.length || 0, 'customers found');
      
      if (customerData.data && customerData.data.length > 0) {
        const customer = customerData.data[0];
        console.log('Found individual customer for phone:', customer.id);
        
        // Look for existing tickets for this specific customer
        const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?customer_id=${customer.id}&limit=20`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          console.log('All tickets found for this customer:', ticketsData.data?.length || 0);
          
          // PRIORITY 1: Look for open SMS tickets first (active conversations)
          const openSmsTickets = ticketsData.data?.filter((ticket: { status?: string; channel?: string; trashed_datetime?: string }) => 
            ticket.status === 'open' && ticket.channel === 'sms' && !ticket.trashed_datetime
          ) || [];
          
          console.log('Open SMS tickets found for this customer:', openSmsTickets.length);
          
          if (openSmsTickets.length > 0) {
            const existingTicket = openSmsTickets[0];
            console.log('Adding message to existing active ticket:', existingTicket.id);
            
            // Add message to existing active ticket
            const result = await addMessageToTicket(existingTicket.id, from, to, body, credentials);
            return { ...result, isNewTicket: false };
          }
          
          // PRIORITY 2: Only if no open tickets, then look for trashed tickets to restore
          const trashedSmsTickets = ticketsData.data?.filter((ticket: { status?: string; channel?: string; trashed_datetime?: string }) => 
            ticket.channel === 'sms' && ticket.trashed_datetime
          ) || [];
          
          console.log('Trashed SMS tickets found for this customer:', trashedSmsTickets.length);
          
          if (trashedSmsTickets.length > 0) {
            // Untrash the most recent ticket and add message to it
            const ticketToRestore = trashedSmsTickets[0]; // Most recent first
            console.log('No active tickets found, untrashing and restoring ticket:', ticketToRestore.id);
            
            const result = await untrashAndAddMessage(ticketToRestore.id, from, to, body, credentials);
            return { ...result, isNewTicket: false, wasRestored: true };
          }
        }
      }
    }
    
    // If no existing customer or ticket found, create new ticket (which will create individual customer)
    console.log('Creating new ticket and customer for phone:', from);
    const result = await createGorgiasTicket(from, to, body);
    return { ...result, isNewTicket: true };
    
  } catch (error) {
    console.error('Error in findOrCreateGorgiasTicket:', error);
    // Fallback to creating new ticket
    const result = await createGorgiasTicket(from, to, body);
    return { ...result, isNewTicket: true };
  }
}

async function addMessageToTicket(ticketId: number, from: string, to: string, body: string, credentials: string) {
  const messageData = {
    source: {
      to: [{ address: to }],
      from: { address: from },
      type: "phone"
    },
    body_text: body,
    channel: "sms",
    from_agent: false,
    via: "api"
  };
  
  console.log('Adding message to ticket', ticketId, ':', JSON.stringify(messageData, null, 2));
  
  const response = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    },
    body: JSON.stringify(messageData)
  });
  
  console.log('Add message response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to add message to ticket:', errorText);
    throw new Error(`Failed to add message: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Message added successfully to ticket:', ticketId);
  return result;
}

async function untrashAndAddMessage(ticketId: number, from: string, to: string, body: string, credentials: string) {
  try {
    console.log('Step 1: Untrashing ticket', ticketId);
    
    // Untrash the ticket by setting trashed_datetime to null
    const untrashResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({ trashed_datetime: null })
    });
    
    console.log('Untrash response status:', untrashResponse.status);
    
    if (!untrashResponse.ok) {
      const errorText = await untrashResponse.text();
      console.error('Failed to untrash ticket:', errorText);
      throw new Error(`Failed to untrash ticket: ${untrashResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Ticket untrashed successfully');
    console.log('Step 2: Adding message to restored ticket');
    
    // Now add the message to the untrashed ticket
    return await addMessageToTicket(ticketId, from, to, body, credentials);
    
  } catch (error) {
    console.error('Error in untrashAndAddMessage:', error);
    throw error;
  }
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