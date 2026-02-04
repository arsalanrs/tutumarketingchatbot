# n8n Setup Guide: Parsing Completion Webhook

This guide shows you how to add a node in your n8n Pinecone ingestion workflow to notify the frontend when parsing is complete.

## ⚠️ Important: Pinecone Workflow is Triggered by Google Sheets

Since your Pinecone ingestion workflow is triggered by a **Google Sheets trigger** (not the form submission), the `sessionId` from the form is not directly available.

## ✅ Two Solutions:

### Solution 1: Write SessionId to Google Sheet (RECOMMENDED)
- Add `Session ID` column to your Google Sheet
- In initial workflow: Write sessionId when saving form data
- In Pinecone workflow: Read sessionId from sheet

### Solution 2: Use Company Name as Identifier (SIMPLE)
- In Pinecone workflow: Extract Company Name from sheet data
- Generate sessionId: `CompanyName` (without timestamp)
- Frontend will match by Company Name prefix

## Step 1: Add HTTP Request Node After Pinecone Vector Store

In your Pinecone ingestion workflow, add an **HTTP Request** node right after the **Pinecone Vector Store** node completes.

### Node Configuration:

1. **Node Type**: HTTP Request
2. **Method**: POST
3. **URL**: 
   ```
   https://your-domain.com/api/parsing-status
   ```
   Or for local development:
   ```
   http://localhost:3002/api/parsing-status
   ```

4. **Authentication**: None (or add if you want to secure it)

5. **Send Headers**: Yes
   - Add header: `Content-Type: application/json`

6. **Send Body**: Yes
   - Body Content Type: JSON

7. **JSON Body** - Since Pinecone workflow is triggered by Google Sheets, generate sessionId from sheet data:
   ```json
   {
     "sessionId": "={{ $('Get row(s) in sheet').item.json['Company Name'].replace(/\\s+/g, '_') }}_{{ $now.format('X') }}",
     "status": "completed",
     "completed": true
   }
   ```

   **OR** if you have Company Name in the merged data:
   ```json
   {
     "sessionId": "={{ $json['Company Name'] || $json.Company_Name || $('Code in JavaScript5').item.json.offers[0]['Company Name'] }}",
     "status": "completed",
     "completed": true
   }
   ```

   **BEST OPTION**: Add a Code node before the HTTP Request to extract Company Name and generate sessionId:
   
   **Code Node (Extract Session ID)**:
   ```javascript
   // Get Company Name from the first row of any library
   const companyName = $input.first().json['Company Name'] || 
                      $input.first().json.Company_Name ||
                      $input.first().json.offers?.[0]?.['Company Name'] ||
                      'default';
   
   // Generate sessionId matching frontend format: CompanyName_timestamp
   const sessionId = `${companyName.replace(/\s+/g, '_')}_${Math.floor(Date.now() / 1000)}`;
   
   return [{
     json: {
       sessionId: sessionId,
       companyName: companyName
     }
   }];
   ```
   
   Then in HTTP Request node, use:
   ```json
   {
     "sessionId": "={{ $json.sessionId }}",
     "status": "completed",
     "completed": true
   }
   ```

### Important: Matching Session ID Format

The frontend generates sessionId as: `${companyName}_${timestamp}`

To match this in n8n, you need:
1. **Company Name** from the sheet data
2. **Timestamp** - but since we don't have the exact timestamp, we have two options:

   **Option A**: Use Company Name only (simpler, but less precise):
   ```json
   {
     "sessionId": "={{ $json['Company Name'].replace(/\\s+/g, '_') }}",
     "status": "completed",
     "completed": true
   }
   ```
   Then update frontend to match by Company Name prefix.

   **Option B**: Write sessionId to Google Sheet in initial workflow (recommended):
   - In your initial workflow, add sessionId to the data before writing to Google Sheets
   - Add a new column "Session ID" to your sheet
   - In Pinecone workflow, read sessionId from the sheet

## Step 2: Complete Workflow Structure

Your Pinecone ingestion workflow should look like this:

```
Google Sheets Trigger
  ↓
Wait Nodes (for rate limiting)
  ↓
Get Rows from Sheets (5 parallel)
  ↓
Code Nodes (format data)
  ↓
Merge
  ↓
Code (combine all data)
  ↓
Code (Extract Session ID) ← ADD THIS NODE to get Company Name and generate sessionId
  ↓
HTTP Request (DELETE namespace) [optional]
  ↓
Wait (7 seconds)
  ↓
Pinecone Vector Store (insert data)
  ↓
HTTP Request (POST to /api/parsing-status) ← ADD THIS NODE
```

**Alternative**: If you write sessionId to Google Sheet in the initial workflow:
```
Google Sheets Trigger
  ↓
Get Rows from Sheets (5 parallel)
  ↓
... (rest of workflow)
  ↓
Code (Extract Session ID from sheet) ← Read from 'Session ID' column
  ↓
Pinecone Vector Store
  ↓
HTTP Request (POST to /api/parsing-status)
```

## Step 3: Error Handling (Optional)

Add an **IF** node before the HTTP Request to check if Pinecone insertion was successful:

```
IF: {{ $json.success === true }}
  ↓ (true)
HTTP Request (notify completion)
  ↓ (false)
HTTP Request (notify error)
```

## Step 4: Testing

1. Trigger your workflow manually or via the Google Sheets trigger
2. Check the HTTP Request node execution
3. Verify the frontend receives the status update

## Alternative: Using n8n Webhook Response

If you want to use n8n's built-in webhook response capability:

1. Add a **Respond to Webhook** node after Pinecone Vector Store
2. Set response code: `200`
3. Response body:
   ```json
   {
     "status": "completed",
     "message": "Data successfully ingested to Pinecone"
   }
   ```

However, this requires the frontend to maintain a connection, which is more complex.

## Recommended Approach: Write SessionId to Google Sheet

**BEST SOLUTION**: In your initial workflow (form submission), add the sessionId to the Google Sheet:

1. **In your initial workflow**, after receiving form data:
   - Add a **Set** node: Add field `Session ID` = `={{ $json.sessionId }}`
   - When writing to Google Sheets, include the `Session ID` column

2. **In your Pinecone ingestion workflow**:
   - When reading from sheets, the sessionId will be in `$json['Session ID']`
   - Use it in the HTTP Request:
   ```json
   {
     "sessionId": "={{ $json['Session ID'] }}",
     "status": "completed",
     "completed": true
   }
   ```

**Alternative (Simpler)**: Use Company Name as identifier:
- In HTTP Request, use Company Name (without timestamp):
  ```json
  {
    "sessionId": "={{ $json['Company Name'].replace(/\\s+/g, '_') }}",
    "status": "completed",
    "completed": true
  }
  ```
- Frontend will match by Company Name prefix

The **HTTP Request** approach is recommended because:
- ✅ Simple to implement
- ✅ Works with polling
- ✅ No need for persistent connections
- ✅ Easy to debug
- ✅ Can handle multiple concurrent requests

## Security Note

For production, consider:
- Adding authentication to the API endpoint
- Using environment variables for the callback URL
- Adding rate limiting
- Using a queue system (Redis, RabbitMQ) instead of in-memory storage

