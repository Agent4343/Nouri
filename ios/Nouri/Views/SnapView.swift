import SwiftUI

// Real camera capture is V2; for V1 we send a hint string so the rest
// of the loop (Quick Correct, daily total, Saved Meals) can be tested.
struct SnapView: View {
    @EnvironmentObject var session: Session
    @State private var hint = ""
    @State private var loading = false
    @State private var fresh: Meal?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Text("Snap a meal").font(.title2.weight(.medium))
                Text("Real camera upload comes next. For now, give it a hint — or just tap to log a quick estimate.")
                    .foregroundColor(CalmTheme.muted)
                    .font(.footnote)

                VStack(alignment: .leading, spacing: 6) {
                    Text("What is it? (optional)").font(.footnote).foregroundColor(CalmTheme.muted)
                    TextField("e.g. chicken bowl", text: $hint)
                        .padding(.horizontal, 12).padding(.vertical, 10)
                        .background(.white.opacity(0.7))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(CalmTheme.sand, lineWidth: 1))
                }

                Button {
                    Task { await snap() }
                } label: {
                    Text(loading ? "Estimating…" : "Log it")
                }
                .buttonStyle(CalmPrimaryButtonStyle())
                .disabled(loading)

                Spacer()
            }
            .padding(20)
            .background(CalmTheme.cream)
            .navigationDestination(item: $fresh) { meal in
                CorrectView(meal: meal, onSaved: { fresh = nil })
            }
        }
    }

    private func snap() async {
        loading = true
        defer { loading = false }
        do {
            let m = try await APIClient.shared.snap(deviceId: session.deviceId, hint: hint.isEmpty ? nil : hint)
            hint = ""
            fresh = m
        } catch {
            // Stay calm. UI doesn't shout.
        }
    }
}

extension Meal: Hashable {
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
    static func == (lhs: Meal, rhs: Meal) -> Bool { lhs.id == rhs.id }
}
