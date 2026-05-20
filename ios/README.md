# Nouri iOS

SwiftUI source for the minimum loop (Story Bible §32). No Xcode project is
checked in — the source files are ready to drop into a new Xcode project on
your Mac. Keeping the project file out of source control sidesteps merge
churn in `.pbxproj` and lets you pick your own bundle id, signing team, etc.

## Files

```
Nouri/
  NouriApp.swift          App entry, wires Session
  ContentView.swift       Tab nav, presents onboarding on first run
  Theme/CalmTheme.swift   Palette + reusable card / button styles (§9)
  Services/
    Session.swift         Anonymous device UUID, persisted in UserDefaults
    APIClient.swift       Typed FastAPI client
  Models/Models.swift     Profile, Meal, TodaySummary, SavedMeal
  Views/
    OnboardingView.swift  First 60 Seconds (§8)
    HomeView.swift        Today's total + meal list
    SnapView.swift        Hint → mock vision → CorrectView
    CorrectView.swift     Quick Correct + low-confidence alternatives (§15, §16)
    SavedMealsView.swift  Saved Meals, "Log again" (§14)
  Components/
    ConfidenceBadge.swift
    MealRow.swift
    DailyTotalCard.swift
```

## Create the Xcode project

1. Xcode → **File → New → Project → iOS App**
   - Product name: `Nouri`
   - Interface: SwiftUI
   - Language: Swift
   - Bundle id: your choice (e.g. `com.you.nouri`)
   - **Uncheck** "Use Core Data" and "Include Tests" if you want a leaner start.
2. Create the project at `ios/` (parallel to the `Nouri/` folder here) and
   delete the auto-generated `NouriApp.swift` / `ContentView.swift` Xcode
   created.
3. In the Project navigator, right-click the `Nouri` group → **Add Files to
   "Nouri"…** → select everything inside `ios/Nouri/` (use "Create groups",
   not folder references) and add it.
4. Set deployment target to **iOS 17.0** (uses `NavigationStack`,
   `.navigationDestination(item:)`, and `Date.formatted`).
5. Run on the simulator.

## API URL

The client reads the API base URL from, in order:

1. `NOURI_API_URL` env var (set in the scheme's **Run → Arguments →
   Environment Variables** for local dev).
2. `NouriApiUrl` in `Info.plist` (for built TestFlight / App Store builds).
3. `http://localhost:8000` (default for `uvicorn`).

For local dev against a Mac running the backend, point the env var at
`http://localhost:8000`. The simulator can reach `localhost` on the host.

For builds against Railway, set `NouriApiUrl` in `Info.plist` to the
backend's public URL.

> NOTE: ATS blocks plain HTTP in release builds. The Railway backend is
> served over HTTPS so you don't need an exception. For local dev only, if
> you must hit plain HTTP, add `NSAllowsArbitraryLoads` to `Info.plist` and
> remove it before submitting.

## What's not here yet (V2+)

- Real camera capture / photo upload (§13). Today the snap flow sends a
  text hint to the mock vision layer so the full correction loop can be
  tested.
- HealthKit (§12). Mandatory for V1 launch — wire after a working loop is
  validated with beta users.
- Apple Sign-In. Intentionally absent so the first 60 seconds has zero
  signup friction (§8).
