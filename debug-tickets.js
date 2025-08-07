require('dotenv').config({ path: '.env.local' });

async function debugTicketLookup() {
  console.log('🔍 Debugging Ticket Lookup');
  console.log('=========================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  // Test with the actual phone number from logs
  const testPhone = '+17865166660';
  const customerEmail = `sms${testPhone}@rescuelink.com`;
  
  // Also test the format Gorgias is actually using
  const actualCustomerEmail = 'sms@rescuelink.com';
  
  console.log('Looking for customer with email:', customerEmail);
  
  try {
    // Step 1: Search for customer
    const customerResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(customerEmail)}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    console.log('Customer search status:', customerResponse.status);
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log('Customer search result:', customerData.data?.length || 0, 'customers found');
      
      if (customerData.data && customerData.data.length > 0) {
        const customer = customerData.data[0];
        console.log('Found customer ID:', customer.id);
        console.log('Customer email:', customer.email);
        console.log('Customer channels:', customer.channels?.length || 0);
        
        // Step 2: Search for tickets
        console.log('\nSearching for tickets...');
        const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?customer_id=${customer.id}&limit=10`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        console.log('Tickets search status:', ticketsResponse.status);
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          console.log('Total tickets found:', ticketsData.data?.length || 0);
          
          if (ticketsData.data && ticketsData.data.length > 0) {
            ticketsData.data.forEach((ticket, index) => {
              console.log(`\nTicket ${index + 1}:`);
              console.log('- ID:', ticket.id);
              console.log('- Status:', ticket.status);
              console.log('- Channel:', ticket.channel);
              console.log('- Subject:', ticket.subject);
              console.log('- Created:', ticket.created_datetime);
              console.log('- Messages:', ticket.messages?.length || 'N/A');
            });
            
            // Look specifically for open SMS tickets
            const openSmsTickets = ticketsData.data.filter(t => t.status === 'open' && t.channel === 'sms');
            console.log('\n📱 Open SMS tickets found:', openSmsTickets.length);
            
            if (openSmsTickets.length > 0) {
              console.log('✅ Should use existing ticket:', openSmsTickets[0].id);
            } else {
              console.log('❌ No open SMS tickets - would create new');
            }
          } else {
            console.log('No tickets found for this customer');
          }
        } else {
          const errorText = await ticketsResponse.text();
          console.log('Tickets search error:', errorText);
        }
      } else {
        console.log('No customer found with phone-specific email');
        
        // Now try with the actual format Gorgias uses
        console.log('\nTrying with actual format:', actualCustomerEmail);
        const actualResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(actualCustomerEmail)}`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        if (actualResponse.ok) {
          const actualData = await actualResponse.json();
          console.log('Customers with actual format:', actualData.data?.length || 0);
          
          if (actualData.data && actualData.data.length > 0) {
            const customer = actualData.data[0];
            console.log('Found customer with generic SMS email:', customer.id);
            
            // Check for tickets for this customer
            const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?customer_id=${customer.id}&status=open&channel=sms&limit=10`, {
              headers: {
                'Authorization': `Basic ${credentials}`
              }
            });
            
            if (ticketsResponse.ok) {
              const ticketsData = await ticketsResponse.json();
              console.log('Open SMS tickets for generic customer:', ticketsData.data?.length || 0);
              
              ticketsData.data?.forEach((ticket, index) => {
                console.log(`Ticket ${index + 1}: ID ${ticket.id}, Subject: ${ticket.subject}`);
              });
            }
          }
        }
      }
    } else {
      const errorText = await customerResponse.text();
      console.log('Customer search error:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTicketLookup().catch(console.error);