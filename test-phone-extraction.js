// Simulate the ticket data structure from Gorgias
const mockTicketData = {
  "ticket": {
    "id": "218409140",
    "channel": "sms",
    "customer": {
      "email": "sms@rescuelink.com"
    },
    "messages": [
      {
        "source": {
          "type": "phone",
          "to": [{"name": "", "address": "+1 561-725-9387"}],
          "from": {"name": "", "address": "+1 555-123-4567"}
        }
      }
    ]
  },
  "message": {
    "body_text": "Test reply from agent",
    "from_agent": true
  }
};

console.log('🧪 Testing Phone Number Extraction');
console.log('=================================');

// Test our extraction logic
const { ticket } = mockTicketData;

// Try multiple ways to get the phone number
let customerPhone = ticket.customer.phone || 
                   ticket.original_message?.from ||
                   ticket.customer.channels?.[0]?.address;

console.log('Phone from customer.phone:', ticket.customer.phone);
console.log('Phone from original_message:', ticket.original_message?.from);
console.log('Phone from customer channels:', ticket.customer.channels?.[0]?.address);

if (!customerPhone) {
  // Check if we have messages array with source
  if (ticket.messages && ticket.messages[0] && ticket.messages[0].source) {
    customerPhone = ticket.messages[0].source.from.address;
    console.log('Phone from messages[0].source.from.address:', customerPhone);
  }
}

if (!customerPhone) {
  // Fallback: Extract phone number from customer email
  const customerEmail = ticket.customer.email;
  console.log('Extracting phone from email:', customerEmail);
  
  // More flexible regex to handle different formats
  const phoneMatch = customerEmail.match(/sms([^@]*?)@/) || customerEmail.match(/(\+\d+)/);
  
  if (phoneMatch) {
    customerPhone = phoneMatch[1];
    console.log('Extracted phone from email:', customerPhone);
  }
}

// Ensure phone has + prefix
if (customerPhone && !customerPhone.startsWith('+')) {
  customerPhone = '+' + customerPhone;
}

console.log('\n✅ Final phone number:', customerPhone);
console.log('Would send SMS to:', customerPhone);