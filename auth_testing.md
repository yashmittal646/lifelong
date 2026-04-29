# Lifelong Health Companion – Auth Testing Playbook

JWT-based: existing email/password flow.

## Demo accounts (auto-seeded)
- parent@demo.com / demo1234 (parent role; no children seeded)
- adult@demo.com / demo1234 (individual; profile Priya, 27, female)

## Google (Emergent OAuth) flow
1. Frontend "Continue with Google" → redirects to `https://auth.emergentagent.com/?redirect=<origin>/auth/callback`
2. After Google flow → user lands at `<origin>/auth/callback#session_id=XYZ`
3. AuthCallback component sends `session_id` to `POST /api/auth/session`
4. Backend calls Emergent `/session-data`, creates/updates user, sets `session_token` httpOnly cookie, returns user JSON.
5. If `user.role` is `null`, frontend routes to `/onboarding/role` to pick parent or individual.
6. Then `/api/auth/me` returns user; subsequent calls use the session cookie OR Bearer token.

## Test session via mongosh (developer fast-path)
```
mongosh --eval "
use('test_database');
var token='test_session_'+Date.now();
db.users.insertOne({
  id:'gtest-'+Date.now(),
  email:'gtest@example.com',
  role:'parent',
  source:'google',
  picture:'https://via.placeholder.com/96',
  created_at:new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id:'gtest-'+Date.now(),
  session_token:token,
  expires_at:new Date(Date.now()+7*24*3600*1000)
});
print('TOKEN '+token);
"
```

## Curl probes
```
curl -X GET $URL/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -X POST $URL/api/auth/change-password -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' \
  -d '{"current_password":"demo1234","new_password":"demo5678"}'
```
