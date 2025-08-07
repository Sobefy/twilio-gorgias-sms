require('dotenv').config({ path: '.env.local' });

async function testGorgiasAPI(authMethod = 'Bearer') {
  console.log('🧪 Testing Gorgias API Integration');
  console.log('================================');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- GORGIAS_DOMAIN:', process.env.GORGIAS_DOMAIN || '❌ MISSING');
  console.log('- GORGIAS_API_KEY:', process.env.GORGIAS_API_KEY ? '✅ Present' : '❌ MISSING');
  console.log();
  
  if (!process.env.GORGIAS_DOMAIN || !process.env.GORGIAS_API_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  // Test data with phone number
  const testData = {
    customer: {
      email: "sms+15551234567@rescuelink.com",
      phone: "+15551234567"
    },
    messages: [{
      source: {
        to: [{ address: "+15617259387" }],
        from: { address: "+15551234567" },
        type: "phone"
      },
      body_text: "Test message from API script",
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
  
  const apiUrl = `https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api/tickets`;
  
  console.log('API Request Details:');
  console.log('- URL:', apiUrl);
  console.log('- Method: POST');
  console.log('- Authorization: Bearer [API_KEY]');
  console.log('- Payload:', JSON.stringify(testData, null, 2));
  console.log();
  
  try {
    console.log(`🚀 Making API request using ${authMethod} authentication...`);
    
    let headers = { 'Content-Type': 'application/json' };
    
    // Set auth header based on working method
    switch (authMethod) {
      case 'Bearer':
        headers['Authorization'] = `Bearer ${process.env.GORGIAS_API_KEY}`;
        break;
      case 'Basic':
        const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'BasicDirect':
        const directCredentials = Buffer.from(process.env.GORGIAS_API_KEY).toString('base64');
        headers['Authorization'] = `Basic ${directCredentials}`;
        break;
      case 'ApiKey':
        headers['X-API-Key'] = process.env.GORGIAS_API_KEY;
        break;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testData)
    });
    
    console.log('📋 Response Details:');
    console.log('- Status:', response.status, response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    console.log();
    
    const responseText = await response.text();
    console.log('📝 Response Body:');
    console.log(responseText);
    console.log();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Ticket created successfully!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('📮 Ticket ID:', jsonResponse.id);
        console.log('📧 Customer Email:', jsonResponse.customer?.email);
      } catch (e) {
        console.log('Note: Response is not valid JSON');
      }
    } else {
      console.log('❌ FAILED: API request failed');
      
      // Try to parse error response
      try {
        const errorJson = JSON.parse(responseText);
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Raw error response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('💥 Request Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test different authentication methods
async function testGorgiasAuth() {
  console.log('\n🔍 Testing Gorgias Authentication Methods');
  console.log('==========================================');
  
  const baseUrl = `https://${process.env.GORGIAS_DOMAIN}.gorgias.com/api`;
  const testUrl = `${baseUrl}/account`;
  
  // Method 1: Bearer token
  console.log('1. Testing Bearer token authentication...');
  try {
    const response = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${process.env.GORGIAS_API_KEY}` }
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 200) {
      console.log('   ✅ Bearer token works!');
      return 'Bearer';
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  // Method 2: Basic auth with username:password (correct Gorgias format)
  console.log('2. Testing Basic auth (username:password)...');
  try {
    const credentials = Buffer.from(`${process.env.GORGIAS_USERNAME}:${process.env.GORGIAS_API_KEY}`).toString('base64');
    const response = await fetch(testUrl, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 200) {
      console.log('   ✅ Basic auth with username:password works!');
      return 'Basic';
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  // Method 3: Basic auth with username:apikey format
  console.log('3. Testing Basic auth (if API key contains username:key)...');
  try {
    const credentials = Buffer.from(process.env.GORGIAS_API_KEY).toString('base64');
    const response = await fetch(testUrl, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 200) {
      console.log('   ✅ Basic auth with username:apikey works!');
      return 'BasicDirect';
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  // Method 4: API key in header
  console.log('4. Testing API key in custom header...');
  try {
    const response = await fetch(testUrl, {
      headers: { 'X-API-Key': process.env.GORGIAS_API_KEY }
    });
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.status === 200) {
      console.log('   ✅ X-API-Key header works!');
      return 'ApiKey';
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
  
  console.log('❌ No authentication method worked');
  return null;
}

// Run tests
async function runTests() {
  const authMethod = await testGorgiasAuth();
  if (authMethod) {
    await testGorgiasAPI(authMethod);
  }
}

runTests().catch(console.error);