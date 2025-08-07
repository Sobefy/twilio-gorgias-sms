require('dotenv').config({ path: '.env.local' });

async function testCustomerCreation() {
  console.log('🧪 Testing Customer Creation with Phone');
  console.log('=====================================');
  
  // Create customer first
  const customerData = {
    email: "sms+15551234567@rescuelink.com",
    phone: "+15551234567",
    channels: [
      {
        type: "phone",
        address: "+15551234567"
      },
      {
        type: "email", 
        address: "sms+15551234567@rescuelink.com"
      }
    ]
  };
  
  console.log('Customer data:', JSON.stringify(customerData, null, 2));
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  try {
    // Create customer
    console.log('Creating customer...');
    const customerResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(customerData)
    });
    
    console.log('Customer creation response:', customerResponse.status);
    const customerResult = await customerResponse.text();
    console.log('Customer result:', customerResult);
    
    if (customerResponse.ok) {
      const customer = JSON.parse(customerResult);
      console.log('✅ Customer created with ID:', customer.id);
      
      // Now create ticket with this customer
      const ticketData = {
        customer: {
          id: customer.id
        },
        messages: [{
          source: {
            to: [{ address: "+15617259387" }],
            from: { address: "+15551234567" },
            type: "phone"
          },
          body_text: "Test with existing customer",
          channel: "sms",
          from_agent: false,
          via: "api"
        }],
        channel: "sms",
        from_agent: false,
        status: "open",
        via: "api",
        subject: "SMS from +15551234567"
      };
      
      console.log('Creating ticket with existing customer...');
      const ticketResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(ticketData)
      });
      
      console.log('Ticket creation response:', ticketResponse.status);
      const ticketResult = await ticketResponse.text();
      console.log('Ticket result:', ticketResult.substring(0, 500));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCustomerCreation().catch(console.error);