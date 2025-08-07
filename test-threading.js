require('dotenv').config({ path: '.env.local' });

async function testThreadingLogic() {
  console.log('🧪 Testing SMS Threading Logic');
  console.log('==============================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  const testPhone = '+17865166660'; // Phone from existing tickets
  
  try {
    console.log('Testing logic for phone:', testPhone);
    
    // Step 1: Find generic SMS customer
    const genericSmsEmail = 'sms@rescuelink.com';
    const customerResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?email=${encodeURIComponent(genericSmsEmail)}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (customerResponse.ok) {
      const customerData = await customerResponse.json();
      console.log('✅ Generic SMS customer found:', customerData.data?.length || 0);
      
      if (customerData.data && customerData.data.length > 0) {
        const customer = customerData.data[0];
        console.log('Customer ID:', customer.id);
        
        // Step 2: Get tickets for this customer (will filter manually)
        const ticketsResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets?customer_id=${customer.id}&limit=20`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        console.log('Tickets response status:', ticketsResponse.status);
        
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          console.log('✅ All tickets found:', ticketsData.data?.length || 0);
          
          // Filter for open SMS tickets first
          const openSmsTickets = ticketsData.data?.filter(ticket => 
            ticket.status === 'open' && ticket.channel === 'sms'
          ) || [];
          
          console.log('📱 Open SMS tickets:', openSmsTickets.length);
          openSmsTickets.forEach((ticket, index) => {
            console.log(`  ${index + 1}. ID: ${ticket.id}, Subject: ${ticket.subject}`);
          });
          
          // Step 3: Filter by phone number
          const phoneSpecificTickets = openSmsTickets.filter(ticket => 
            ticket.subject && ticket.subject.includes(testPhone)
          );
          
          console.log('📱 Phone-specific tickets found:', phoneSpecificTickets.length);
          
          if (phoneSpecificTickets.length > 0) {
            console.log('✅ Would add message to existing ticket:', phoneSpecificTickets[0].id);
            console.log('   Subject:', phoneSpecificTickets[0].subject);
            console.log('   Status:', phoneSpecificTickets[0].status);
          } else {
            console.log('❌ No phone-specific tickets found - would create new ticket');
            console.log('   (This means threading is not working properly)');
          }
        } else {
          const errorText = await ticketsResponse.text();
          console.log('❌ Tickets API error:', ticketsResponse.status, errorText);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testThreadingLogic().catch(console.error);