require('dotenv').config({ path: '.env.local' });

async function checkActualCustomers() {
  console.log('🔍 Checking Actual Customer Emails');
  console.log('==================================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  try {
    // Get recent customers
    const response = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?limit=20`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Total customers found:', data.data?.length || 0);
      
      // Look for SMS customers (broader search)
      const smsCustomers = data.data?.filter(c => c.email && (c.email.includes('sms') || c.email.includes('rescuelink'))) || [];
      console.log('SMS/rescuelink customers found:', smsCustomers.length);
      
      // Also show all customers for debugging
      console.log('\nAll customer emails:');
      data.data?.forEach((customer, index) => {
        if (index < 10) { // Show first 10
          console.log(`${index + 1}. ${customer.email} (ID: ${customer.id})`);
        }
      });
      
      smsCustomers.forEach((customer, index) => {
        console.log(`\nSMS Customer ${index + 1}:`);
        console.log('- ID:', customer.id);
        console.log('- Email:', customer.email);
        console.log('- Created:', customer.created_datetime);
        console.log('- Channels:', customer.channels?.map(c => `${c.type}: ${c.address}`).join(', ') || 'none');
      });
      
      // Also check recent tickets
      console.log('\n📋 Checking Recent Tickets...');
      const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?limit=10`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        console.log('SMS tickets found:', ticketsData.data?.length || 0);
        console.log('Tickets response status:', ticketsResponse.status);
        
        ticketsData.data?.forEach((ticket, index) => {
          console.log(`\nTicket ${index + 1}:`);
          console.log('- ID:', ticket.id);
          console.log('- Channel:', ticket.channel);
          console.log('- Status:', ticket.status);
          console.log('- Customer email:', ticket.customer?.email || ticket.requester?.email);
          console.log('- Subject:', ticket.subject);
          console.log('- Created:', ticket.created_datetime);
        });
        
        // Filter for SMS tickets
        const smsTickets = ticketsData.data?.filter(t => t.channel === 'sms') || [];
        console.log(`\n📱 SMS Tickets specifically: ${smsTickets.length}`);
        smsTickets.forEach((ticket, index) => {
          console.log(`SMS Ticket ${index + 1}: ID ${ticket.id}, Customer: ${ticket.customer?.email || ticket.requester?.email}`);
        });
      }
      
    } else {
      console.log('Error:', await response.text());
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkActualCustomers().catch(console.error);