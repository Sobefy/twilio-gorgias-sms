require('dotenv').config({ path: '.env.local' });

async function debugDeletedTickets() {
  console.log('🔍 Debugging Deleted Tickets');
  console.log('============================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  const testPhone = '+17865166660'; // Your phone number
  
  try {
    // Find generic SMS customer
    const genericSmsEmail = 'sms@rescuelink.com';
    const customerResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(genericSmsEmail)}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      
      if (customerData.data && customerData.data.length > 0) {
        const customer = customerData.data[0];
        console.log('✅ Found SMS customer:', customer.id);
        
        // Get ALL tickets for this customer (including closed/deleted)
        const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?customer_id=${customer.id}&limit=50`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          console.log('✅ All tickets found:', ticketsData.data?.length || 0);
          
          // Show all SMS tickets for your phone
          const yourSmsTickets = ticketsData.data?.filter(ticket => 
            ticket.channel === 'sms' && ticket.subject && ticket.subject.includes(testPhone)
          ) || [];
          
          console.log(`\n📱 Your SMS tickets (${testPhone}): ${yourSmsTickets.length}`);
          
          yourSmsTickets.forEach((ticket, index) => {
            console.log(`\n${index + 1}. Ticket ID: ${ticket.id}`);
            console.log(`   Status: ${ticket.status}`);
            console.log(`   Subject: ${ticket.subject}`);
            console.log(`   Created: ${ticket.created_datetime}`);
            console.log(`   Closed: ${ticket.closed_datetime || 'N/A'}`);
            console.log(`   Trashed: ${ticket.trashed_datetime || 'N/A'}`);
          });
          
          // Check which ones would match our "open" filter
          const openSmsTickets = yourSmsTickets.filter(ticket => ticket.status === 'open');
          console.log(`\n🟢 Open SMS tickets for your phone: ${openSmsTickets.length}`);
          
          // Check with the new filter (excluding trashed)
          const openNonTrashedTickets = yourSmsTickets.filter(ticket => 
            ticket.status === 'open' && !ticket.trashed_datetime
          );
          console.log(`🟢 Open non-trashed SMS tickets: ${openNonTrashedTickets.length}`);
          
          if (openNonTrashedTickets.length > 0) {
            console.log('❌ PROBLEM: Found open non-trashed tickets when there should be none!');
            openNonTrashedTickets.forEach((ticket, index) => {
              console.log(`   ${index + 1}. ID ${ticket.id} - ${ticket.subject}`);
            });
          } else {
            console.log('✅ No open non-trashed tickets found - should create new ticket');
          }
          
        } else {
          console.log('❌ Error getting tickets:', await ticketsResponse.text());
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugDeletedTickets().catch(console.error);