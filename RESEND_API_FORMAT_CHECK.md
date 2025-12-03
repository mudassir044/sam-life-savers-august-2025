# Resend API Format Verification

## Current Implementation
We're using:
```javascript
await resend.emails.send({
  from: 'SAM Life Savers <hello@join.samlifesavers.org>',
  to,
  template_id: templateId,
});
```

## Possible Issues

### Option 1: Template Object Format
Some Resend versions might require:
```javascript
await resend.emails.send({
  from: '...',
  to,
  template: {
    id: templateId,
    variables: {} // Empty if no variables
  }
});
```

### Option 2: Template ID Format (Current)
```javascript
await resend.emails.send({
  from: '...',
  to,
  template_id: templateId,
});
```

### Option 3: Template Content Required
Maybe templates need explicit content even when using template_id:
```javascript
await resend.emails.send({
  from: '...',
  to,
  template_id: templateId,
  html: '', // Might need empty string?
  text: '', // Might need empty string?
});
```

## Next Steps
1. Check Resend SDK v3.2.0 documentation
2. Test with template object format
3. Verify if empty variables object is needed

