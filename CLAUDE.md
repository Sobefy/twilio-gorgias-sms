# Project Context for Claude

## Project Overview
**Twilio-Gorgias SMS Integration** - A Next.js application that bridges SMS messaging between Twilio and Gorgias customer support platform.

## Architecture
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **API**: REST endpoints for SMS webhooks
- **External APIs**: Twilio SMS, Gorgias Tickets

## Key Features
- Process incoming SMS messages and create Gorgias support tickets
- Send outgoing SMS replies from Gorgias agents to customers
- Handle SMS compliance (STOP, START, HELP commands)
- Auto-responses for customer messages

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── sms/
│   │       ├── incoming/route.ts    # Handles incoming SMS webhooks from Twilio
│   │       └── outgoing/route.ts    # Handles outgoing SMS from Gorgias webhooks
│   ├── layout.tsx                   # Root layout (basic Next.js boilerplate)
│   ├── page.tsx                     # Home page (basic Next.js boilerplate)
│   └── globals.css                  # Global styles
```

## Core API Endpoints

### `/api/sms/incoming` (POST)
**Purpose**: Receives SMS webhooks from Twilio
**Key Functions**:
- `POST()` - Main handler for incoming SMS
- `sendTwiMLResponse()` - Returns TwiML XML responses
- `createGorgiasTicket()` - Creates tickets in Gorgias
- `handleUnsubscribe()` / `handleSubscribe()` - SMS compliance handlers

**Flow**:
1. Receives Twilio webhook with SMS data (Body, From, To)
2. Checks for special commands (STOP, START, HELP)
3. For general messages: creates Gorgias ticket and sends auto-response
4. Returns TwiML response

### `/api/sms/outgoing` (POST)
**Purpose**: Receives webhooks from Gorgias when agents reply
**Key Functions**:
- `POST()` - Main handler for outgoing SMS
- Extracts phone number from customer email format
- Sends SMS via Twilio API

**Flow**:
1. Receives Gorgias webhook with ticket and message data
2. Validates message is from agent and ticket channel is SMS
3. Extracts phone number from customer email (format: sms{phone}@rescuelink.com)
4. Sends SMS via Twilio

## Environment Variables
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15617259387
GORGIAS_DOMAIN=dryeyerescue
GORGIAS_API_KEY=your_gorgias_api_key
```

## Dependencies
**Production**:
- `next` (15.4.6) - React framework
- `react` (19.1.0) - React library
- `react-dom` (19.1.0) - React DOM
- `twilio` (^5.8.0) - Twilio SDK

**Development**:
- `typescript` (^5) - TypeScript compiler
- `tailwindcss` (^4) - CSS framework
- `eslint` (^9) - Linting
- Various type definitions

## Development Commands
- `npm run dev` - Start development server (with Turbopack)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Business Logic

### Customer Email Format
SMS customers are created in Gorgias with email format: `sms{phone_number}@rescuelink.com`
Example: `sms+15617259387@rescuelink.com`

### SMS Compliance Commands
- **STOP/UNSUBSCRIBE**: Opt out of SMS messages
- **START/SUBSCRIBE**: Opt back into SMS messages  
- **HELP**: Get help information

### Auto-Response Message
"Thanks for contacting Rescue Link! We've received your message and will respond shortly. For urgent matters, email support@rescuelink.com"

## Configuration Files
- `tsconfig.json` - TypeScript configuration with Next.js plugin
- `eslint.config.mjs` - ESLint configuration
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration for TailwindCSS
- `vercel.json` - Vercel deployment configuration

## Deployment
- **Platform**: Vercel (configured with vercel.json)
- **Production URL**: Configured as Twilio webhook endpoint
- **Gorgias Integration**: HTTP integration pointing to production endpoints

## Testing Notes
- Test incoming SMS by texting the Twilio number
- Test outgoing SMS by replying to tickets in Gorgias
- Test compliance commands (STOP, START, HELP)

## Important Implementation Details
- Phone number extraction uses regex: `/sms\+?([^@]+)/`
- TwiML responses are manually constructed XML strings
- Error handling returns user-friendly messages while logging technical details
- Only agent messages from SMS channel tickets trigger outgoing SMS
- All SMS interactions are logged to console for debugging