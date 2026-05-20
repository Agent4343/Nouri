# Nouri — Story Bible v6

*(Working name. Strongest candidate for the reasons in §27.)*

## 1. The Real Insight

Most nutrition apps fight calories. This one fights **emotional exhaustion**.

People quit nutrition apps emotionally before they quit functionally. The real competitors aren't MyFitnessPal or Noom — they're shame, friction, perfectionism, and recovery failure.

The product's core promise, in one sentence: **permission to track imperfectly.**

That sentence explains the audience, the UX, the tone, the retention strategy, and the differentiation.

## 2. What We Don't Do

Identity is sharpened by what's refused, not just what's offered. These are brand-level commitments:

- We don't punish missed days.
- We don't demand perfect tracking.
- We don't turn nutrition into guilt.
- We don't optimize for obsession.
- We don't sell transformation.
- We don't shame the body.
- We don't fake AI certainty.
- We don't reward streaks at the cost of recovery.

These can become public-facing brand statements (App Store description, website hero, onboarding screen). They double as internal product filters — any feature proposal that violates one is rejected.

## 3. Human-in-the-Loop Philosophy

**The AI assists. The user decides.**

Every AI surface in the product follows this rule:

- AI suggests, never asserts
- Confidence is always visible
- Corrections are always one tap away
- Defaults favor the user's judgment, not the model's
- No silent decisions — if the AI changed something, the user sees it

This philosophy makes the AI feel like a calm assistant, not an authority. It also aligns with the trust principles and reinforces the brand positioning.

## 4. Positioning

**Not a diet app. A frictionless, forgiving nutrition tracker.**

**Wedge audience:** ADHD users. Underserved, high-pain, perfectly aligned.

**Ceiling audience:** Anyone wanting low-guilt, low-friction, imperfect tracking. ADHD is the entry point, not the cap.

**Marketing strategy:** Lean hard into ADHD early for word-of-mouth and credibility. Broaden messaging over time without changing the product.

**Core promise:** Faster than MyFitnessPal. Calmer than anything else.

**Tagline direction:** "Nutrition tracking without perfectionism."

## 5. The Bigger Category (Future Expansion)

The long-term opportunity isn't fitness optimization. It's **cognitive relief**.

Potential expansions, all consistent with the brand:

- Grocery suggestions based on what gets eaten
- Decision simplification for daily meals
- Recurring meal planning (low-effort templates)
- ADHD meal scaffolding (low-energy meal ideas, executive function support)
- Low-energy food recommendations on hard days

That's a much bigger category than calorie counting. Calorie tracking is the wedge. **Cognitive relief is the platform.**

## 6. Calm Accountability

The product is forgiving, not indifferent. Users still want improvement and momentum. The tone is **supportive honesty**, not "nothing matters."

- ❌ "You failed today."
- ❌ "Doesn't matter, no pressure."
- ✅ "Today was heavier than usual. Tomorrow resets."

Progress framing stays grounded — softer language, not lower standards.

## 7. Trust Principles

1. Never fake precision.
1. Always allow correction.
1. Never punish imperfect tracking.
1. Confidence shown transparently.
1. User stays in control.

## 8. First 60 Seconds (Onboarding Hook)

The most important screen-time in the product. Target emotional outcome: *"This feels lighter than other nutrition apps."*

**Sequence**

- **0–10s:** Warm one-line welcome. No quiz, no shame, no transformation pitch.
- **10–30s:** Minimum viable profile (age, weight, height, goal). Skippable fields marked clearly.
- **30–45s:** Calorie target with calm framing: "Here's a rough number. We'll adjust as we learn."
- **45–60s:** First snap demo. Show the magic — let the user photograph anything and watch the AI work.

**Tone rules**

- No before/after imagery
- No body shame language
- No "perfect plan" promises
- No urgency or countdowns
- Microcopy treated as first-class design

**Success criterion:** within 60 seconds, the user has logged something and felt something different from every competitor.

## 9. Emotional Design

**Visual**

- Calm UI — soft colors, generous spacing
- No red warning colors
- No alarm notifications
- No aggressive numbers or progress bars
- Quiet typography

**Language**

- No punishment phrasing
- No streak anxiety
- Recovery prompts replace guilt prompts

**Examples**

- "Today was heavier than usual. Tomorrow resets."
- "Welcome back. Picking up where you left off."
- "You're tracking. That's the win."

**Avoid entirely**

- Heavy gamification
- Aggressive streaks
- Leaderboards
- Macro obsession
- Daily failure framing
- Body shame imagery

## 10. Execution Risk: The UX Must Actually Feel Calm

This is the hardest part to execute. Many apps say "simple" and ship clutter, graphs everywhere, anxiety notifications, optimization overload.

Design discipline must stay ruthless. Every screen, every notification, every microcopy line gets the same filter:

- Does this add cognitive load?
- Does this feel like pressure?
- Could a tired person handle this?
- Does this honor the trust principles?

Anything that fails goes back.

## 11. Moat

- **Correction dataset** — every Quick Correct improves the model
- **Photo history behavior data** — real eating patterns by region, time, context
- **Behavioral UX dataset** — when users abandon, which recovery prompts work, which wording reduces churn, what notification timing works for ADHD users. Likely the most valuable long-term asset.
- **UX quality and speed** — hard to copy "feels right"
- **Habit loops and Saved Meals** — switching cost compounds
- **Identity moat** — "the only nutrition app that doesn't make me feel bad" is harder to copy than AI
- **ADHD community brand trust** — credibility Big Tech can't manufacture

## 12. V1 Feature Scope

- First 60 Seconds onboarding
- Photo logging with confidence score
- Low-confidence fallback UX
- Quick Correct
- Saved Meals + Repeat Yesterday
- Barcode scanning
- Weight tracking
- Basic analytics (daily totals, weekly chart)
- Calm reminders
- HealthKit integration

## 13. Deferred to V2+

- Good Enough Mode (V1.1 priority)
- Passive Logging
- Restaurant Mode
- Cognitive relief features (grocery suggestions, meal scaffolding)
- Social features
- Badges and streaks (likely never)
- Recipe builder
- Apple Watch
- Water tracking
- International expansion

## 14. Saved Meals

- Repeat Yesterday button
- Favorite Meals (pinned)
- "Usual breakfast?" prompt at typical times
- Recent meal suggestions in camera
- Saved Meals bypass AI entirely → cost savings

## 15. Low-Confidence Fallback UX

When AI isn't sure:

1. "We're not confident on this meal yet."
1. Show top 3 likely matches
1. Ask portion question
1. Switch to assisted logging
1. User input trains the model

## 16. Photo Logging Flow

1. Tap camera → snap meal
1. AI identifies + estimates
1. Confidence score shown
1. High confidence → confirm or Quick Correct
1. Low confidence → fallback UX
1. Logged to daily total
1. Correction feeds the model

## 17. Good Enough Mode (V1.1)

Perfectionism kills consistency. Explicit permission to track imprecisely is a positioning weapon competitors can't match without contradicting their own brand.

Options:

- "Quick estimate only"
- "Track roughly"
- "Close enough logging"

Imprecision framed as a feature, not a failure.

## 18. Passive Logging (V2)

- Detects recurring meal patterns
- Predicts lunch from history and time of day
- Pre-fills likely foods, user confirms with one tap
- Surfaces suggestions at typical eating times

Logging becomes confirmation.

## 19. Restaurant Food (Biggest Technical Risk)

V1: manual entry + chain menu search
V2: Restaurant Mode with chain integrations (Chipotle, Subway, Starbucks), "best estimate" framing leaning on trust principles, photo recognition trained on restaurant plating.

## 20. Hybrid AI Architecture

- **Layer 1:** Vision model (third-party API at launch)
- **Layer 2:** Nutrition database lookup (USDA FoodData Central + Open Food Facts)
- **Layer 3:** Lightweight correction logic (own model from user corrections)

Reduce Layer 1 dependency as Layer 3 strengthens.

## 21. AI Cost Management

- Free tier capped at 3 photos/day
- Compress images before API calls
- Cache common recognitions
- Saved Meals bypass AI entirely
- Track per-user margin
- Hard spend caps with alerts

## 22. Barcode Scanning

- ZXing or MLKit
- USDA FoodData Central (US) + Open Food Facts (Canada + global)
- Manual fallback
- Architecture supports regional database swaps

## 23. Monetization

**Sell reduced cognitive load, not analytics.** ADHD users pay to reduce stress.

**Premium messaging direction**

- Unlimited snaps
- Smarter repeat meals
- Faster confirmations
- Predictive logging
- Calmer experience
- Less effort

**Free Tier**

- 3 photo logs/day
- Unlimited manual entry
- Unlimited barcode scans
- Saved Meals (5 max)
- Weight tracking
- Basic weekly chart
- Calm reminders

**Premium Tier**

- Unlimited photo logs
- Unlimited Saved Meals
- Predictive logging (when V2 ships)
- Photo meal history timeline
- Priority AI processing
- Full analytics (secondary sell)
- Data export
- Ad-free

**Pricing**

- Monthly: $9.99
- Yearly: $49–69 sweet spot
- 7-day premium trial on signup

## 24. Photo Meal History (Hidden Killer Feature)

- Calm progress motivation (no numbers needed)
- Pattern recognition without judgment
- AI training data
- Strong visual differentiator

First-class feature.

## 25. Privacy & Security

- iOS native encrypted storage
- Photos not stored long-term unless user opts in
- Encrypted at rest and in transit
- Clear privacy policy at signup
- HIPAA-adjacent best practices
- Full data export and delete
- GDPR-ready

## 26. Tech Stack

- iOS first — SwiftUI
- Apple Camera APIs
- HealthKit (mandatory)
- Backend: AWS or Google Cloud
- PostgreSQL + object storage for photos
- Apple Watch: phase 2

## 27. Naming: Nouri

**Working name: Nouri.**

Why it works:

- Soft sounding, emotionally safe
- Non-clinical, non-fitness
- Doesn't trap the brand in calorie culture
- Scales beyond ADHD positioning
- Supports cognitive-relief expansion
- Not overtly AI-branded
- Memorable and easy to pronounce

Avoid: anything with "snap" or "cal," anything overtly AI. Those feel transactional. The positioning is emotional.

Final confirmation after brand testing with beta users.

## 28. Business Risk Reality

**Retention is the biggest risk, not acquisition.**

Optimize for: speed, forgiveness, low guilt, low friction, easy recovery.

Do NOT optimize for discipline. Every failed competitor did.

## 29. Launch Strategy

**Beta (50–100 ADHD users)**

- Recruit from r/ADHD, ADHD Twitter, ADHD TikTok
- Free premium for feedback + corrections
- Key questions:
  - "Is this faster than MyFitnessPal?"
  - "Did this feel forgiving when you missed a day?"
  - "Did you feel judged at any point?"
  - "How did the first 60 seconds feel?"

**Public launch**

- iOS App Store first
- ASO: photo calorie tracker, ADHD nutrition, easy food logging
- TikTok content: speed demos + emotional positioning
- Target frustrated MyFitnessPal/Noom users in ads
- Lean into ADHD word-of-mouth
- Google Play after iOS validation

**Audience expansion (post-PMF)**

- Broaden messaging to "anyone who wants forgiving tracking"
- Keep product unchanged
- ADHD community remains brand anchor

## 30. Success Metrics

- DAU / MAU
- Photo logs per active user per day
- Time-to-log (key competitive metric)
- Saved Meals usage rate
- Free → premium conversion (target 3–5%)
- 30-day retention (target 40%+)
- Quick Correct usage rate
- ARPU vs AI cost per user
- Annual plan adoption
- **Recovery rate after missed days** (strongest retention predictor)
- First 60 Seconds completion rate

## 31. Still To Decide

- Final confirmation of Nouri after brand testing
- Vision API vendor (test Google Vision vs Clarifai vs open-source)
- Final pricing after beta
- Confidence score thresholds and UI treatment
- ADHD-specific onboarding microcopy
- Exact V1.1 timeline for Good Enough Mode

## 32. Core Principle

Do not overbuild before testing.

Minimum loop:

1. First 60 Seconds onboarding
1. Snap photo
1. Calorie estimate with confidence
1. Quick Correct or fallback UX
1. Saved Meals for repeats
1. Daily total with forgiving language

Ship to 50 ADHD users. Listen. Iterate.

## 33. The North Star

The win isn't more features. The win is speed, forgiveness, and trust.

The real product isn't a calorie tracker. It's **permission to track imperfectly** — delivered with the speed and calm that everything else in this category is missing.

The bigger product, eventually, isn't even nutrition. It's **cognitive relief**.
