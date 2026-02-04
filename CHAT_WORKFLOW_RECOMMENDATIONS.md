# Chat Workflow Recommendations

## Current Issues

### 1. **Output Format is Too Rigid** ❌

**Problem:**
- System message forces AI to ALWAYS return JSON with all creative fields
- Even simple questions like "What offers do you have?" must return JSON
- This breaks natural conversation flow

**Current System Message Forces:**
```json
{
  "rows": [{
    "NAME": "...",
    "FIRST DRAFT DUE DATE": "...",
    // ... all 11 fields required
  }]
}
```

**Impact:**
- User asks: "What formats are available?"
- AI must return: JSON with NAME, FORMAT, etc. (doesn't make sense)
- Code node tries to extract JSON → fails or creates invalid rows

### 2. **OpenAI is NOT Strictly Database-Only** ⚠️

**Current Setup:**
- ✅ Pinecone Vector Store (database knowledge)
- ✅ SerpAPI (web search tool)

**Reality:**
- AI can search the web via SerpAPI
- AI can use general knowledge (not just Pinecone)
- System message says "NEVER answer from memory" but AI still has access to web

**Recommendation:**
- If you want STRICTLY database-only, remove SerpAPI tool
- Or update system message to clarify: "Use Pinecone for library data, SerpAPI only for current market trends"

### 3. **Sheet Append Happens Always** ❌

**Problem:**
- Code node always tries to extract JSON and append to sheet
- Even for general questions, it tries to create a sheet row
- This creates invalid/empty rows in your Creative Pipeline

## Recommended Solutions

### Solution 1: Make Output Format Conditional (RECOMMENDED)

**Update System Message:**
```
You are Tutu Marketing Creative Assistant.

You have access to:
- Pinecone Vector Database (Offers, Formats, Angles, Creative Matrix, Creative Pipeline)
- SerpAPI (for current market research)

RESPONSE MODES:

1. GENERAL QUESTIONS (discussions, queries, reviews):
   - Answer naturally in plain text
   - Use Pinecone data when relevant
   - Be conversational and helpful
   - NO JSON required

2. CREATIVE GENERATION (when asked to create, generate, draft ads):
   - MUST call Pinecone retrieval tool FIRST
   - Return ONLY valid JSON with this structure:
   {
     "rows": [{
       "NAME": "...",
       "FIRST DRAFT DUE DATE": "YYYY-MM-DD",
       "FORMAT": "...",
       "TARGET ICP": "...",
       "OFFER / ANGLE": "...",
       "SIZING": "...",
       "BRIEF DESCRIPTION": "...",
       "INSPO": "...",
       "IMAGE(S) TO USE": "...",
       "COPY / SCRIPT": "...",
       "OTHER NOTES": "..."
     }]
   }
   - Use ONLY items from retrieved libraries
   - Fill ALL fields

3. REVISIONS (when user approves/changes):
   - Return updated JSON rows only
   - No explanations needed
```

### Solution 2: Make Sheet Append Conditional

**Update Code Node:**
```javascript
// Check if output contains creative JSON
let rawOutput = $input.first().json.output;

if (!rawOutput) {
  // No output - might be general chat, return as-is
  return [{
    json: {
      output: rawOutput,
      isCreative: false
    }
  }];
}

// Try to detect JSON
const cleaned = rawOutput.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

if (cleaned.startsWith('{') && cleaned.includes('"rows"')) {
  // It's creative JSON - parse and validate
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.rows && parsed.rows.length > 0) {
      const row = parsed.rows[0];
      
      // Validate required fields
      const requiredFields = [
        'NAME', 'FIRST DRAFT DUE DATE', 'FORMAT', 'TARGET ICP',
        'OFFER / ANGLE', 'SIZING', 'BRIEF DESCRIPTION', 'INSPO',
        'IMAGE(S) TO USE', 'COPY / SCRIPT', 'OTHER NOTES'
      ];
      
      const isValid = requiredFields.every(field => 
        row[field] !== undefined && 
        row[field] !== null && 
        String(row[field]).trim() !== ''
      );
      
      if (isValid) {
        return [{
          json: {
            ...row,
            isCreative: true
          }
        }];
      }
    }
  } catch (e) {
    // Not valid JSON
  }
}

// Not creative JSON - return as plain text
return [{
  json: {
    output: rawOutput,
    isCreative: false
  }
}];
```

**Add IF Node Before Sheet Append:**
```
IF: {{ $json.isCreative === true }}
  ↓ (true)
Append row in sheet
  ↓ (false)
Respond to Webhook (return plain text response)
```

### Solution 3: Two Separate Workflows (ADVANCED)

**Option A: General Chat Workflow**
- Simple webhook → AI Agent → Respond to Webhook
- No sheet append
- Natural conversation

**Option B: Creative Generation Workflow**
- Webhook → AI Agent → Code → Sheet Append → Respond
- Only for ad creation requests
- Returns confirmation message

**Route requests based on user intent:**
- Add IF node after webhook to detect intent
- Route to appropriate workflow

## Recommended Approach

**For your use case (monthly runs, general chat + ad creation):**

1. ✅ **Update System Message** - Make output conditional (Solution 1)
2. ✅ **Update Code Node** - Detect creative vs general (Solution 2)
3. ✅ **Add IF Node** - Only append to sheet when creative JSON is valid
4. ⚠️ **Consider Removing SerpAPI** - If you want strictly database-only responses

## Testing

After implementing:
1. Test general question: "What offers do you have?"
   - Should return: Plain text list of offers
   - Should NOT: Create sheet row

2. Test creative request: "Create an ad for luxury luggage"
   - Should return: JSON with all fields
   - Should: Create sheet row

3. Test follow-up: "Make it more premium"
   - Should return: Updated JSON
   - Should: Update sheet row

## Current Frontend Handling

The frontend now:
- ✅ Detects JSON responses and formats them nicely
- ✅ Shows plain text for general responses
- ✅ Displays creative ad details when JSON is detected
- ✅ Handles both formats seamlessly



