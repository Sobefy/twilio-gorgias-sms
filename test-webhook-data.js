// This simulates what should happen when an agent replies to a ticket
require('dotenv').config({ path: '.env.local' });

async function testWebhookCall() {
  console.log('🧪 Testing Outgoing SMS Webhook Call');
  console.log('===================================');
  
  // Simulate the data that Gorgias SHOULD send based on our template
  const testWebhookData = {
    "ticket": {
      "id": "218411991",
      "channel": "sms",
      "customer": {
        "email": "sms@rescuelink.com"
      },
      "messages": [
        {
          "source": {
            "from": {
              "address": "+17865166660"
            }
          }
        }
      ]
    },
    "message": {
      "body_text": "Hi! Thanks for contacting us. How can I help you today?",
      "from_agent": "True",  // Capital T like Gorgias sends
      "sender_type": "agent"
    }
  };
  
  console.log('Test webhook data:');
  console.log(JSON.stringify(testWebhookData, null, 2));
  
  try {
    // Call our own endpoint to test
    const response = await fetch('http://localhost:3000/api/sms/outgoing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testWebhookData)
    });
    
    console.log('\n📋 Response Status:', response.status);
    
    const responseData = await response.json();
    console.log('Response Data:', responseData);
    
    if (response.ok) {
      if (responseData.success) {
        console.log('✅ SMS would be sent successfully!');
        console.log('- To:', responseData.to);
        console.log('- Message SID:', responseData.messageSid);
      } else if (responseData.status === 'ignored') {
        console.log('❌ Request was ignored (this is the problem)');
      }
    } else {
      console.log('❌ Request failed:', responseData);
    }
    
  } catch (error) {
    console.error('Error testing webhook:', error.message);
    console.log('\n💡 Make sure to run "npm run dev" first to start the local server');
  }
}

testWebhookCall().catch(console.error);