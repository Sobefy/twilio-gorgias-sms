require('dotenv').config({ path: '.env.local' });

async function checkExistingCustomer() {
  console.log('🔍 Checking Existing Customer Data');
  console.log('=================================');
  
  const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
  
  try {
    // Get customers
    console.log('Fetching customers...');
    const response = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers?limit=10`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    const result = await response.text();
    console.log('Customers response:', response.status);
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('Number of customers:', data.data?.length || 0);
      
      // Find SMS customer
      const smsCustomer = data.data?.find(c => c.email && c.email.includes('sms'));
      if (smsCustomer) {
        console.log('\n📱 Found SMS Customer:');
        console.log('ID:', smsCustomer.id);
        console.log('Email:', smsCustomer.email);
        console.log('Channels:', JSON.stringify(smsCustomer.channels, null, 2));
        
        // Get more details about this customer
        const detailResponse = await fetch(`https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/customers/${smsCustomer.id}`, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        
        if (detailResponse.ok) {
          const customerDetail = await detailResponse.json();
          console.log('\n📋 Customer Details:');
          console.log(JSON.stringify(customerDetail, null, 2));
        }
      } else {
        console.log('No SMS customer found');
      }
    } else {
      console.log('Error response:', result);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkExistingCustomer().catch(console.error);