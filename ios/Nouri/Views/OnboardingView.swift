import SwiftUI

// First 60 Seconds (Story Bible §8). Warm, no quiz, no shame.
struct OnboardingView: View {
    @EnvironmentObject var session: Session
    var onFinish: () -> Void

    @State private var step = 0
    @State private var age = ""
    @State private var weight = ""
    @State private var height = ""
    @State private var goal = "maintain"
    @State private var target: Int?
    @State private var saving = false

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
                .foregroundColor(CalmTheme.muted)
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
        VStack(alignment: .leading, spacing: 16) {
            Text("A few light details")
                .font(.title2.weight(.medium))
            Text("Every field is optional.")
                .foregroundColor(CalmTheme.muted)
                .font(.footnote)

            field("Age", text: $age, keyboard: .numberPad)
            field("Weight (kg)", text: $weight, keyboard: .decimalPad)
            field("Height (cm)", text: $height, keyboard: .numberPad)

            Text("Goal").font(.footnote).foregroundColor(CalmTheme.muted)
            HStack(spacing: 8) {
                ForEach(["lose", "maintain", "gain"], id: \.self) { g in
                    Button { goal = g } label: {
                        Text(g)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .background(goal == g ? CalmTheme.sage.opacity(0.15) : .white.opacity(0.7))
                    .foregroundColor(goal == g ? CalmTheme.ink : CalmTheme.muted)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(goal == g ? CalmTheme.sage : CalmTheme.sand, lineWidth: 1)
                    )
                }
            }
            Spacer()
            Button {
                Task { await save() }
            } label: {
                Text(saving ? "Saving…" : "Continue")
            }
            .buttonStyle(CalmPrimaryButtonStyle())
            .disabled(saving)
        }
    }

    private var targetView: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("A rough number to start")
                .font(.title2.weight(.medium))
            Text(target.map { "Here's a rough target: ~\($0) cal a day. We'll adjust as we learn." }
                 ?? "No target yet — that's fine. You can track without one.")
                .foregroundColor(CalmTheme.muted)
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
            TextField("—", text: text)
                .keyboardType(keyboard)
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(.white.opacity(0.7))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(CalmTheme.sand, lineWidth: 1))
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        let body = ProfileIn(
            device_id: session.deviceId,
            age: Int(age),
            weight_kg: Double(weight),
            height_cm: Double(height),
            goal: goal
        )
        do {
            let p = try await APIClient.shared.upsertProfile(body)
            target = p.calorieTarget
            step = 2
        } catch {
            // Failure is calm. Still let them move on.
            step = 2
        }
    }
}
