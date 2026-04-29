# Lifelong Health Companion – PRD

## Original problem statement
Build a production-ready, multi-page web app for India that supports children, parents, and adults across their entire life, with health education, vaccination reminders, and safe puberty/sexuality guidance. The app adapts features and tone as the user grows from child → teen → adult, is privacy-respecting, and culturally appropriate for India. AI Q&A uses NVIDIA NIM (meta/llama-3.1-8b-instruct via build.nvidia.com).

## User personas
- **Parent** of children (0-17) managing multiple child profiles
- **Child** (8-10) using a playful, kid-friendly interface
- **Teen** (11-17, or puberty_started) with neutral, mature educational content and anonymous AI
- **Adult** (18+) with professional health dashboard, women's/men's health, AI Q&A

## Core requirements (static)
- JWT email/password auth; roles: parent / individual
- Life-stage computation: age<11 & no puberty → child; age 11-17 or puberty_started → puberty_teen; age ≥18 → adult
- Profiles with name/dob/gender/is_child/puberty_started; parent has many child profiles
- Health logs (sickness / visit / vaccine / note)
- "Frequently sick" rule: ≥4 sickness entries in past 90 days
- India IAP-inspired vaccination schedule (static JSON)
- Adult-age children become inaccessible to parent
- AI Q&A via NVIDIA NIM with safety prompt & disclaimer; teen asks are private
- Responsive design evolving per stage (child playful, teen neutral, adult professional)

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT, bcrypt, httpx for NVIDIA NIM
- Frontend: React + Tailwind + shadcn primitives + Fraunces/IBM Plex/Nunito fonts
- Routes: /login, /signup, /parent/dashboard, /parent/child/:id, /child/:id, /adult/dashboard, /settings

## Implemented (2026-02)
- ✅ JWT auth (signup, login, me)
- ✅ Profiles CRUD, puberty toggle, stage computation, access control
- ✅ Health logs CRUD, stats endpoint (frequently_sick flag)
- ✅ India vaccination schedule endpoint
- ✅ Adult checkups endpoint (gender-aware)
- ✅ NVIDIA NIM /api/ai/ask (model meta/llama-3.1-8b-instruct) with safety prompt; teen questions not stored
- ✅ Seed data: parent@demo.com (children Aarav age 9, Diya age 14), adult@demo.com (Priya age 27)
- ✅ Frontend: Login, Signup, Parent Dashboard (bento cards, stage badge, sick alert), Child Detail (timeline, puberty toggle, vaccine timeline, AI Q&A), Child View (playful hygiene/mood/stories) & Teen View (puberty/periods/consent/sex basics + anonymous AI), Adult Dashboard (checkups, logs, women's/men's, AI), Settings
- ✅ AI disclaimer banner on every AI answer
- ✅ Design guidelines followed: sage/ivory palette, Fraunces display font, stage-specific styling

## Backlog
- P1: Mood journal history for children
- P1: Ability for adults to subscribe children who turn 18 (account transfer)
- P2: Push/email reminders for upcoming vaccines
- P2: Teen can create own login at 13+ to keep AI Q&A truly private
- P2: Internationalisation (Hindi, Tamil, Bengali)
