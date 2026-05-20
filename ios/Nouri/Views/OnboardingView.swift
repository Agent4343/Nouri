import SwiftUI

// First 60 Seconds (Story Bible §8). Warm, no quiz, no shame.
struct OnboardingView: View {
    @EnvironmentObject var session: Session
    var onFinish: () -> Void

    @AppStorage("nouri.units") private var unitsRaw: String = defaultUnits()

    @State private var step = 0
    @State private var age = ""
    @State private var weightKg = ""
    @State private var heightCm = ""
    @State private var weightLb = ""
    @State private var heightFt = ""
    @State private var heightIn = ""
    @State private var goal = "maintain"
    @State private var target: Int?
    @State private var saving = false

    private var units: Units {
        get { Units(rawValue: unitsRaw) ?? .metric }
    }

    var body: some View {
        ZStack {
            CalmTheme.cream.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 20) {
                switch step {
                case 0: welcome
                case 1: profile
                default: targetView
                }
            }
            .padding(20)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding(.top, 24)
        }
    }

    private var welcome: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Welcome.")
                .font(.system(size: 34, weight: .medium))
                .foregroundColor(CalmTheme.ink)
            Text("This is a calmer way to track. No streaks, no shame, no perfect plan. You're tracking. That's the win.")
                .foregroundColor(CalmTheme.ink)
            Spacer()
            Button { step = 1 } label: { Text("Let's start") }
                .buttonStyle(CalmPrimaryButtonStyle())
            Button {
                onFinish()
            } label: {
                Text("Skip and just try it")
                    .font(.footnote)
                    .foregroundColor(CalmTheme.muted)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private var profile: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("A few light details")
                    .font(.title2.weight(.medium))
                Text("Every field is optional.")
                    .foregroundColor(CalmTheme.muted)
                    .font(.footnote)

                unitsToggle

                field("Age", text: $age, keyboard: .numberPad)

                if units == .metric {
                    field("Weight (kg)", text: $weightKg, keyboard: .decimalPad)
                    field("Height (cm)", text: $heightCm, keyboard: .numberPad)
                } else {
                    field("Weight (lb)", text: $weightLb, keyboard: .decimalPad)
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Height").font(.footnote).foregroundColor(CalmTheme.muted)
                        HStack(spacing: 8) {
                            inputBox(placeholder: "ft", text: $heightFt, keyboard: .numberPad)
                            inputBox(placeholder: "in", text: $heightIn, keyboard: .numberPad)
                        }
                    }
                }

                Text("Goal").font(.footnote).foregroundColor(CalmTheme.muted)
                HStack(spacing: 8) {
                    ForEach(["lose", "maintain", "gain"], id: \.self) { g in
                        Button { goal = g } label: {
                            Text(g)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 10)
                        }
                        .background(goal == g ? CalmTheme.sage.opacity(0.15) : Color.white)
                        .foregroundColor(goal == g ? CalmTheme.ink : CalmTheme.muted)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(goal == g ? CalmTheme.sage : CalmTheme.sand, lineWidth: 1)
                        )
                    }
                }
                Button {
                    Task { await save() }
                } label: {
                    Text(saving ? "Saving…" : "Continue")
                }
                .buttonStyle(CalmPrimaryButtonStyle())
                .disabled(saving)
            }
        }
    }

    private var unitsToggle: some View {
        HStack(spacing: 8) {
            ForEach(Units.allCases, id: \.self) { u in
                Button { unitsRaw = u.rawValue } label: {
                    Text(u == .metric ? "Metric (kg · cm)" : "Imperial (lb · ft/in)")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .font(.footnote)
                }
                .background(units == u ? CalmTheme.sage.opacity(0.15) : Color.white)
                .foregroundColor(units == u ? CalmTheme.ink : CalmTheme.muted)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(units == u ? CalmTheme.sage : CalmTheme.sand, lineWidth: 1)
                )
            }
        }
    }

    private var targetView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("A rough number to start")
                .font(.title2.weight(.medium))
            Text(target.map { "Here's a rough target: ~\($0) cal a day. We'll adjust as we learn." }
                 ?? "No target yet — that's fine. You can track without one.")
                .foregroundColor(CalmTheme.ink)
            Spacer()
            Button {
                onFinish()
            } label: { Text("Snap your first meal") }
            .buttonStyle(CalmPrimaryButtonStyle())
        }
    }

    private func field(_ label: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.footnote).foregroundColor(CalmTheme.muted)
            inputBox(placeholder: "—", text: text, keyboard: keyboard)
        }
    }

    private func inputBox(placeholder: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        TextField(placeholder, text: text)
            .keyboardType(keyboard)
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(CalmTheme.sand, lineWidth: 1))
    }

    private func save() async {
        saving = true
        defer { saving = false }

        let weight: Double? = {
            if units == .metric { return Double(weightKg) }
            return Double(weightLb).map(UnitConvert.lbToKg)
        }()

        let height: Double? = {
            if units == .metric { return Double(heightCm) }
            let ft = Double(heightFt) ?? 0
            let inch = Double(heightIn) ?? 0
            return (ft == 0 && inch == 0) ? nil : UnitConvert.ftInToCm(ft, inch)
        }()

        let body = ProfileIn(
            device_id: session.deviceId,
            age: Int(age),
            weight_kg: weight,
            height_cm: height,
            goal: goal
        )
        do {
            let p = try await APIClient.shared.upsertProfile(body)
            target = p.calorieTarget
            step = 2
        } catch {
            step = 2
        }
    }
}

extension Units: CaseIterable {}

private func defaultUnits() -> String {
    // US locale → imperial, everyone else → metric.
    let isUS = Locale.current.region?.identifier == "US"
    return isUS ? Units.imperial.rawValue : Units.metric.rawValue
}
