# AUTO-REPLY EMAIL AUDIT REPORT
**Date:** Current  
**Issue:** Submitters not receiving auto-reply/welcome emails despite `{ok: true}` response

---

## EXECUTIVE SUMMARY

**Root Cause Identified:** The `sendAutoReply()` functions in all three API endpoints (`api/lead.js`, `api/volunteer.js`, `api/newsletter.js`) contain a silent failure path. If the template ID environment variable is missing or empty, the function returns early without throwing an error, causing the API to return `{ok: true}` even though no auto-reply email was sent.

**Evidence:**
- Admin emails ARE arriving (confirmed)
- API returns `{ok: true}` (confirmed)
- Auto-reply emails are NOT arriving (confirmed)
- Code shows silent return when `templateId` is falsy (lines 141 in lead.js, 104 in volunteer.js, 104 in newsletter.js)

---

## DETAILED CODE AUDIT

### 1. API ENDPOINT ANALYSIS

#### `api/lead.js` (Contact Form)

**Email Detection (Lines 79-101):**
- Uses regex pattern to find email in fields
- First checks keys containing "email" (case-insensitive)
- Falls back to scanning all values
- ✅ Should work correctly with `name="email"` field

**Admin Email Sending (Lines 127-136):**
- Sends to `ADMIN_EMAILS` array
- Uses `reply_to: replyTo || undefined`
- ✅ Working (confirmed by user)

**Auto-Reply Sending (Lines 138-147):**
```javascript
async function sendAutoReply(intent, to) {
  const templateId = TEMPLATE_MAP[intent] || TEMPLATE_MAP.default;
  const from = FROM_MAP[intent] || FROM_MAP.default;
  if (!templateId) return;  // ⚠️ SILENT FAILURE POINT
  await resend.emails.send({
    from,
    to,
    template_id: templateId,
  });
}
```

**Problem:**
- Line 141: If `templateId` is `undefined`, `null`, or empty string, function returns early
- No error is thrown
- No logging occurs
- Caller (line 180) continues normally
- API returns `{ok: true}` (line 181)

**Error Handling (Lines 178-185):**
- Try-catch wraps both `sendAdminEmail` and `sendAutoReply`
- If `sendAutoReply` throws (e.g., Resend API error), it's caught
- Generic error message: "Failed to send emails"
- ❌ Does NOT distinguish between admin email failure vs auto-reply failure
- ❌ Does NOT catch the silent return case (no error thrown)

#### `api/volunteer.js` (Volunteer Form)

**Auto-Reply Sending (Lines 102-110):**
```javascript
async function sendAutoReply(to) {
  const templateId = process.env.TEMPLATE_VOLUNTEER;
  if (!templateId) return;  // ⚠️ SILENT FAILURE POINT
  await resend.emails.send({
    from: 'SAM Life Savers <hello@join.samlifesavers.org>',
    to,
    template_id: templateId,
  });
}
```

**Same Problem:**
- Line 104: Silent return if `TEMPLATE_VOLUNTEER` env var is missing/empty
- No error thrown, no logging
- API still returns `{ok: true}`

#### `api/newsletter.js` (Newsletter Signup)

**Auto-Reply Sending (Lines 102-110):**
```javascript
async function sendAutoReply(to) {
  const templateId = process.env.TEMPLATE_NEWSLETTER;
  if (!templateId) return;  // ⚠️ SILENT FAILURE POINT
  await resend.emails.send({
    from: 'SAM Life Savers <newsletter@join.samlifesavers.org>',
    to,
    template_id: templateId,
  });
}
```

**Same Problem:**
- Line 104: Silent return if `TEMPLATE_NEWSLETTER` env var is missing/empty

---

### 2. FRONTEND ANALYSIS

#### `js/forms.js`

**Form Data Collection (Lines 69-85):**
- Uses `FormData` API
- Collects all fields including honeypot
- ✅ Correctly sends `company` field for honeypot check
- ✅ Handles duplicate field names as arrays

**API Communication (Lines 87-111):**
- POSTs JSON to correct endpoints
- ✅ Shows success only when `result.ok === true`
- ✅ Shows error on failure

**Field Names Verified:**
- Contact.html: `name="email"` ✅
- Volunteer-Form.html: `name="email"` ✅
- index.html: `name="email"` ✅

---

### 3. ENVIRONMENT VARIABLE DEPENDENCIES

**Required Env Vars:**
1. `RESEND_API_KEY` - Used to initialize Resend client
2. `ADMIN_EMAILS` - Used for admin notifications
3. `TEMPLATE_VOLUNTEER` - Used in volunteer.js and lead.js (volunteer intent)
4. `TEMPLATE_DONOR` - Used in lead.js (donor intent)
5. `TEMPLATE_SPONSOR` - Used in lead.js (sponsor intent)
6. `TEMPLATE_COLLAB` - Used in lead.js (collaboration intent, default)
7. `TEMPLATE_NEWSLETTER` - Used in newsletter.js

**Potential Issues:**
- If any template ID env var is missing/empty, auto-reply silently fails
- Vercel Preview deployments may have different env vars than Production
- Env vars might be set but contain empty strings or whitespace

---

### 4. RESEND API BEHAVIOR ANALYSIS

**Expected Behavior:**
- `resend.emails.send()` with `template_id` should send email using template
- If template doesn't exist or is unpublished, Resend should return error
- If `from` address is not verified, Resend should return error

**Actual Behavior (Inferred):**
- Admin emails work → Resend API key is valid
- Admin emails work → `from: hello@join.samlifesavers.org` is verified
- Auto-replies don't work → Likely template ID issue OR silent return

---

## ROOT CAUSE ANALYSIS

### Primary Hypothesis: Missing Template ID Environment Variables

**Scenario 1: Template IDs Not Set in Vercel**
- If `TEMPLATE_VOLUNTEER`, `TEMPLATE_NEWSLETTER`, etc. are not set in Vercel dashboard
- Code evaluates: `process.env.TEMPLATE_VOLUNTEER` → `undefined`
- Line 104: `if (!templateId) return;` → function exits silently
- No error thrown → try-catch doesn't catch it
- API returns `{ok: true}` → frontend shows success
- Admin email sent successfully → admins receive notification
- Auto-reply never sent → submitter receives nothing

**Scenario 2: Template IDs Set But Empty**
- Env vars exist but contain empty strings `""`
- Code evaluates: `process.env.TEMPLATE_VOLUNTEER` → `""`
- Line 104: `if (!templateId) return;` → `""` is falsy, function exits
- Same result as Scenario 1

**Scenario 3: Preview vs Production Env Vars**
- Testing on `*.vercel.app` preview deployment
- Preview deployment has different env vars than Production
- Template IDs only set in Production, not Preview
- Same silent failure

### Secondary Hypothesis: Resend API Error (Less Likely)

**If template ID exists but Resend rejects:**
- `resend.emails.send()` would throw an error
- Error would be caught by try-catch (line 182)
- API would return `{ok: false, error: 'Failed to send emails.'}`
- Frontend would show error message
- ❌ This is NOT happening (user reports `{ok: true}`)

---

## VERIFICATION CHECKLIST

To confirm the root cause, check:

1. **Vercel Environment Variables:**
   - [ ] Log into Vercel dashboard
   - [ ] Check Project → Settings → Environment Variables
   - [ ] Verify all template IDs are set:
     - `TEMPLATE_VOLUNTEER=d72d8b4d-34cb-42e5-8e44-8c2beb8863bb`
     - `TEMPLATE_DONOR=fead88fe-1548-4887-bba3-7304eec7db41`
     - `TEMPLATE_SPONSOR=393ca902-aeea-479f-aeb9-ebd2da9897f6`
     - `TEMPLATE_COLLAB=c55bba5d-f277-42f2-a28b-b5f8adb56b2b`
     - `TEMPLATE_NEWSLETTER=7180389a-7412-4284-af1e-1ae54eb9d0e8`
   - [ ] Check if they're set for Production, Preview, or both
   - [ ] Verify no extra whitespace or quotes

2. **Vercel Function Logs:**
   - [ ] Check Vercel dashboard → Deployments → Function Logs
   - [ ] Look for any errors related to Resend
   - [ ] Check if `sendAutoReply` is being called
   - [ ] Look for any console.error messages

3. **Resend Dashboard Logs:**
   - [ ] Log into Resend dashboard
   - [ ] Check Logs/Activity section
   - [ ] For each form submission, verify:
     - [ ] 2 email sends (admin + auto-reply) OR
     - [ ] 1 email send (admin only) - confirms auto-reply not sent
   - [ ] Check status of auto-reply attempts (if any)

4. **Code Execution Flow:**
   - [ ] Add temporary logging to `sendAutoReply` functions
   - [ ] Log when function is called
   - [ ] Log template ID value
   - [ ] Log if early return occurs
   - [ ] Log Resend API response

---

## RECOMMENDED FIX

### Fix 1: Add Explicit Error for Missing Template ID

**Change:**
```javascript
async function sendAutoReply(intent, to) {
  const templateId = TEMPLATE_MAP[intent] || TEMPLATE_MAP.default;
  const from = FROM_MAP[intent] || FROM_MAP.default;
  if (!templateId) {
    throw new Error(`Template ID missing for intent: ${intent}`);
  }
  await resend.emails.send({
    from,
    to,
    template_id: templateId,
  });
}
```

**Result:**
- Missing template ID now throws error
- Error caught by try-catch
- API returns `{ok: false, error: '...'}`
- Frontend shows error
- Admin email still sent (happens before auto-reply)

### Fix 2: Add Logging for Debugging

**Add before early return:**
```javascript
if (!templateId) {
  console.error(`[AUTO-REPLY FAILED] Template ID missing for intent: ${intent}, env var: TEMPLATE_${intent.toUpperCase()}`);
  throw new Error(`Template ID missing for intent: ${intent}`);
}
```

**Result:**
- Vercel logs will show exact missing env var
- Easier to diagnose in production

### Fix 3: Validate Template IDs at Startup

**Add at top of each file:**
```javascript
const TEMPLATE_VOLUNTEER = process.env.TEMPLATE_VOLUNTEER;
if (!TEMPLATE_VOLUNTEER) {
  console.error('CRITICAL: TEMPLATE_VOLUNTEER environment variable is not set');
}
```

**Result:**
- Immediate visibility if env vars missing
- Appears in Vercel build logs

---

## CONCLUSION

**Most Likely Cause:** Template ID environment variables are not set in Vercel (or set incorrectly), causing `sendAutoReply()` to silently return without sending emails.

**Evidence Supporting This:**
1. Admin emails work → Resend API key valid
2. API returns `{ok: true}` → No errors thrown
3. Code has silent return path → Matches observed behavior
4. No Resend logs for auto-reply → Emails never sent

**Next Steps:**
1. Verify env vars in Vercel dashboard
2. Add explicit error throwing (Fix 1)
3. Add logging (Fix 2)
4. Test and verify auto-reply emails arrive

---

**Report Generated:** Current  
**Status:** Ready for Implementation

