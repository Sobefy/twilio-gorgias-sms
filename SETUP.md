# Twilio-Gorgias SMS Integration

A Next.js application that integrates Twilio SMS with Gorgias customer support platform.

## Features

- **Incoming SMS Handling**: Processes SMS messages and creates Gorgias tickets
- **Outgoing SMS**: Sends SMS replies from Gorgias agents to customers
- **Auto-responses**: Handles STOP, START, and HELP commands
- **Compliance**: Built-in SMS compliance with unsubscribe handling

## Setup Instructions

### 1. Environment Variables

Update `.env.local` with your actual credentials:

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15617259387
GORGIAS_DOMAIN=dryeyerescue
GORGIAS_API_KEY=your_gorgias_api_key
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

### 3. Configure Twilio Webhook

1. Go to Twilio Console → Phone Numbers
2. Select your phone number (+15617259387)
3. Set "A message comes in" webhook to: `https://your-app.vercel.app/api/sms/incoming`

### 4. Configure Gorgias HTTP Integration

1. Go to Gorgias → Settings → Integrations → HTTP Integrations
2. Create new integration with:
   - **URL**: `https://your-app.vercel.app/api/sms/outgoing`
   - **Method**: POST
   - **Triggers**: "Ticket message created"
   - **Conditions**: Message from agent AND ticket channel = "sms"

## API Endpoints

### Incoming SMS: `/api/sms/incoming`
- Handles incoming SMS messages from customers
- Creates Gorgias tickets for general messages
- Processes STOP, START, and HELP commands
- Returns TwiML responses

### Outgoing SMS: `/api/sms/outgoing`
- Receives webhooks from Gorgias when agents reply
- Sends SMS responses via Twilio
- Only processes agent messages for SMS tickets

## SMS Commands

- **STOP/UNSUBSCRIBE**: Opt out of SMS messages
- **START/SUBSCRIBE**: Opt back into SMS messages  
- **HELP**: Get help information

## Testing

1. **Test incoming SMS**: Text your Twilio number
2. **Test outgoing SMS**: Reply to a ticket in Gorgias
3. **Test commands**: Text "STOP", "START", or "HELP"

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Customer Email Format

SMS customers are created in Gorgias with email format: `sms{phone_number}@rescuelink.com`

Example: `sms+15617259387@rescuelink.com`