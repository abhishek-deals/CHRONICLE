# Custom OTP Engine Implementation

- `[x]` **Backend: Send OTP**
  - `[x]` Reinstate in-memory `otpStore` in `/api/auth/send-otp`
  - `[x]` Replaced Resend with Firebase Firestore Trigger Email for hybrid email send
  - `[x]` Add terminal logging fallback for the OTP code (true Developer Bypass)
- `[x]` **Backend: Verify OTP & Magic Link**
  - `[x]` Update `/api/auth/verify-otp` to validate against `otpStore`
  - `[x]` Use `SUPABASE_SERVICE_ROLE_KEY` to call `generateLink` on success
  - `[x]` Return the `action_link` to the client
- `[x]` **Frontend: Login & Signup**
  - `[x]` Update `login/page.tsx` to call custom verification endpoint instead of Supabase client
  - `[x]` Update `signup/page.tsx` to use the same logic
  - `[x]` Handle the redirect to `action_link` to seamlessly establish the session
