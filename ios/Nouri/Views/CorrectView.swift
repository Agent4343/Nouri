import SwiftUI

// Quick Correct (§16) + Low-Confidence Fallback (§15).
struct CorrectView: View {
    let meal: Meal
    var onSaved: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var label: String
    @State private var calories: String
    @State private var saving = false

    init(meal: Meal, onSaved: @escaping () -> Void) {
        self.meal = meal
        self.onSaved = onSaved
        _label = State(initialValue: meal.label)
        _calories = State(initialValue: String(meal.calories))
    }

    private var lowConfidence: Bool { meal.confidence < 0.65 && !meal.corrected }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(lowConfidence ? "Not sure yet" : "Looks like…")
                            .font(.title2.weight(.medium))
                        Text(lowConfidence
                             ? "Pick a closer match or fix it below."
                             : "Anything off? One tap away.")
                            .foregroundColor(CalmTheme.muted)
                            .font(.footnote)
                    }
                    Spacer()
                    if !meal.corrected {
                        ConfidenceBadge(value: meal.confidence)
                    }
                }

                if lowConfidence, let alts = meal.alternatives, !alts.isEmpty {
                    VStack(spacing: 8) {
                        ForEach(alts) { alt in
                            Button {
                                Task { await save(label: alt.label, calories: alt.calories) }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(alt.label).foregroundColor(CalmTheme.ink)
                                        Text("\(alt.calories) cal").foregroundColor(CalmTheme.muted).font(.footnote)
                                    }
                                    Spacer()
                                }
                                .padding(14)
                                .background(.white.opacity(0.8))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(CalmTheme.sand, lineWidth: 1))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                CalmCard {
                    VStack(alignment: .leading, spacing: 12) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("What was it?").font(.footnote).foregroundColor(CalmTheme.muted)
                            TextField("", text: $label)
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(CalmTheme.cream)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(CalmTheme.sand, lineWidth: 1))
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Calories").font(.footnote).foregroundColor(CalmTheme.muted)
                            TextField("", text: $calories)
                                .keyboardType(.numberPad)
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(CalmTheme.cream)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(CalmTheme.sand, lineWidth: 1))
                        }
                    }
                }

                HStack(spacing: 12) {
                    Button {
                        onSaved()
                        dismiss()
                    } label: {
                        Text("Looks right").frame(maxWidth: .infinity).padding(.vertical, 14)
                    }
                    .background(.white.opacity(0.7))
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(CalmTheme.sand, lineWidth: 1))

                    Button {
                        Task { await save(label: label, calories: Int(calories) ?? meal.calories) }
                    } label: {
                        Text(saving ? "Saving…" : "Save fix")
                    }
                    .buttonStyle(CalmPrimaryButtonStyle())
                    .disabled(saving)
                }
            }
            .padding(20)
        }
        .background(CalmTheme.cream)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func save(label: String, calories: Int) async {
        saving = true
        defer { saving = false }
        do {
            _ = try await APIClient.shared.correct(
                mealId: meal.id,
                label: label != meal.label ? label : nil,
                calories: calories != meal.calories ? calories : nil
            )
            onSaved()
            dismiss()
        } catch {
            // Calm failure — leave the form open.
        }
    }
}
