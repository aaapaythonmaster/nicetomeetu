# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Product intent
Nicetomeetu is a desktop-first personal resume website for recruiters and hiring teams. It presents the same candidate through independently managed product-manager and product-operations resume versions, with the owner choosing which published version is public.

## Users
- Public visitor: a recruiter or hiring manager evaluating the candidate quickly.
- Administrator: the resume owner. There is one private, allowlisted admin workflow and no public signup.

## Core experience
- The public homepage pairs basic information and section summaries on the left with a React Bits OptionWheel on the right.
- The top-level wheel contains internships, projects, campus experience, and skills.
- Selecting a summary opens its detail page. Detail pages show full resume content on the left and use another OptionWheel on the right to switch entries or internship roles.
- Product-manager and product-operations resumes are uploaded separately. Their structure is fixed while content may change.
- The source of truth is a directly uploaded DOCX. The owner reviews a generated draft before publishing it.

## Visual direction
- Desktop-only, cinematic React Bits character on a purple-black base.
- The homepage background combines ColorBends and DotField using the exact supplied motion implementations.
- The initial global accent is cyan `#06b6d4`; related motion colors derive from it unless explicitly overridden.
- Motion parameters remain editable in the private admin and can be previewed full-screen before publishing.
- Do not copy React Bits page copy or information architecture, and do not invent claims, testimonials, metrics, or assets.

## Content and privacy
- Resume data can contain personally identifiable information. Phone visibility is opt-in.
- Original DOCX and generated PDF files are private storage objects.
- Public pages expose only the selected published revision and published appearance.

## Technical boundaries
- Next.js full-stack application deployed on Vercel, with Supabase for authentication, Postgres, and private file storage.
- Appearance and resume drafts are isolated from published state.
- Public content must remain legible if WebGL or either visual effect fails.
