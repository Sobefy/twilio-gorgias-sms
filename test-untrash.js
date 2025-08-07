require('dotenv').config({ path: '.env.local' });

async function testUntrashTicket() {
  console.log('🗑️ Testing Ticket Untrash');
  console.log('========================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  // Use one of the trashed ticket IDs from our previous test
  const ticketId = 218411991;
  
  try {
    console.log(`Testing untrash for ticket ID: ${ticketId}`);
    
    // First, let's see the current state
    const getResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    if (getResponse.ok) {
      const ticketData = await getResponse.json();
      console.log('Current ticket state:');
      console.log('- Status:', ticketData.status);
      console.log('- Trashed:', ticketData.trashed_datetime ? 'Yes' : 'No');
      console.log('- Closed:', ticketData.closed_datetime ? 'Yes' : 'No');
      
      if (ticketData.trashed_datetime) {
        console.log('\n🔄 Attempting to untrash ticket...');
        
        // Try to untrash by setting trashed_datetime to null
        const untrashData = {
          trashed_datetime: null
        };
        
        const untrashResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets/${ticketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          body: JSON.stringify(untrashData)
        });
        
        console.log('Untrash response status:', untrashResponse.status);
        
        if (untrashResponse.ok) {
          const updatedTicket = await untrashResponse.json();
          console.log('✅ Ticket untrashed successfully!');
          console.log('New state:');
          console.log('- Status:', updatedTicket.status);
          console.log('- Trashed:', updatedTicket.trashed_datetime ? 'Yes' : 'No');
        } else {
          const errorText = await untrashResponse.text();
          console.log('❌ Untrash failed:', errorText);
        }
      } else {
        console.log('Ticket is not trashed, nothing to do');
      }
    } else {
      console.log('❌ Failed to get ticket:', await getResponse.text());
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUntrashTicket().catch(console.error);