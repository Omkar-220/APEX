Figma AI Prompt – Enterprise Assessment Suite (Proctor Edition)
🧠 Role & Context
You are a Senior Product Designer building a secure, on-premise assessment platform for up to 2,000 concurrent users.
Tech stack: React + .NET 9 + Azure (on-prem capable).
Inspiration: Vue Pearson (test interface), Kahoot (gamification), Microsoft Teams workflows, modern proctoring dashboards (ProctorU, Mettl).

✅ Mandatory Screens & Flows (Design Every Single One)
1. Login & Identity Screen
Office 365 SSO as the only login method (populate name, email, profile pic via Microsoft Graph).

Role-based landing:

Candidate → Upcoming tests + history

Admin → Batch management + analytics

Co-owner → Limited batch access (no delete batch)

On-prem deployment badge (subtle, bottom right).

2. Candidate Test-Taking Interface (Pearson Vue style)
Layout:

Fullscreen lock (simulate via visual: no browser chrome, Esc disabled message).

Left sidebar: Vertical numbered question grid (1 to N).

Current question highlighted.

Answered questions

limit this to 5k characters
Here is a focused, 5k-character version of the prompt, keeping all critical requirements while being concise enough for Figma AI.

🎯 Figma AI Prompt – Enterprise Assessment Suite (Proctor Edition)
Role: Senior Product Designer
Stack: React + .NET 9 + Azure (on-prem capable, 2,000 users)
Inspiration: Vue Pearson (test UI), Kahoot (gamification), Teams workflows

✅ Screens to Design (8 total)
1. Login Screen
Office 365 SSO only – populate name/email via Microsoft Graph

Role-based landing: Candidate / Admin / Co-owner

2. Candidate Dashboard
Upcoming tests calendar (syncs with Teams calendar)

History tab: Past scores + question-wise review (submitted vs correct vs incorrect answers)

Scores chart (line/bar graph over time)

Achievements & leaderboards (Kahoot-style badges, XP points)

Notes section (drawing/rough work canvas)

3. Test-Taking Interface (Pearson Vue style)
Fullscreen lock – no tab switching, no Esc. If focus lost → test auto-submits

Left sidebar: Numbered question grid (1 to N). Current = highlighted, answered = checkmark

Center: Single MCQ question + randomized options

Top bar: Countdown timer (toast alerts at 5 min & 1 min)

Right corner: Fake camera + mic indicator (on but not saving)

Bottom: Save & Next, Previous, Submit

Disabled: Right-click, copy, paste, screenshot (hardware acceleration note)

Submit success modal with score preview

4. Admin Dashboard
Batch list (students) – attributes: domain, topic, difficulty, last used, created on

Question batch list – edit, duplicate, save as new batch

Test assignment panel: Pick question batch → assign time → schedule → assign to batch or single candidate

Candidate status table: Finished / Yet to appear / In progress (with real-time notifications)

Export scores to Excel (by batch + test ID) – download locally or via Teams workflow

Duplicate warning when questions repeat within a batch

5. Batch Editor (Admin/Co-owner)
Add/remove candidates from batch

Share batch access → assign co-owner (owner remains original creator)

Bulk upload questions (Excel/CSV) with correct options marked

6. Test Guidelines Modal
Shown before test starts – must accept to proceed

Includes: fullscreen lock, no tab switch, camera/mic on, auto-submit rules

7. Teams Integration Visuals
Adaptive card preview (test link sent 5 min before start)

Test added to Teams calendar automatically

Teams notification for upcoming tests

8. Candidate History Detail View
Expandable past test: shows each question, candidate's answer, correct answer, incorrect flag

Test cannot be retaken (disabled state)

🎨 Visual Style & UX Details
Dark/light mode toggle (default: light with subtle shadows)

Toast notifications for timer warnings (5 min / 1 min) and test submission

Gamification elements: Leaderboard, badges (e.g., "Fast Finisher", "Perfect Score"), XP progression bar

Responsive but test interface is fixed-width (1200px centered)

Accessibility: Keyboard navigation, screen reader hints

🔄 Flows to Show
Candidate flow: Login → Dashboard → Start test (guidelines) → Fullscreen test → Answer (one at a time) → Timer expires or submit → Success modal → History updates

Admin flow: Login → Create question batch (upload) → Create candidate batch → Assign test → Schedule → Export scores → View real-time status

Co-owner flow: Access shared batch → View/edit questions (no delete batch)

⚠️ Edge Cases to Design For
Duplicate question warning (popup)

Test link expired (message)

No question batch assigned (test cannot be published – show error)

Candidate tries to tab out (test auto-submit warning screen)

🚀 Innovative Additions (Optional but encouraged)
Heatmap of time spent per question (admin analytics)

Live proctor view (admin sees who is currently taking test with camera feed placeholder)

AI-powered difficulty suggestion for question batches based on past performance

Dark mode for test takers (eye strain reduction)

Output requirement: Produce a high-fidelity, clickable mockup with all 8 screens linked via flows. Use modern card-based UI, rounded corners, subtle gradients, and Microsoft Fluent UI / Mantine design language.

