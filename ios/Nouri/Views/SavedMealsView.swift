import SwiftUI

struct SavedMealsView: View {
    @EnvironmentObject var session: Session
    @State private var items: [SavedMeal] = []
    @State private var loading = false
    @State private var name = ""
    @State private var calories = ""
    @State private var saving = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("One tap to log a regular.")
                        .foregroundColor(CalmTheme.muted)
                        .font(.footnote)

                    if loading && items.isEmpty {
                        Text("Loading…").foregroundColor(CalmTheme.muted)
                    } else if items.isEmpty {
                        CalmCard {
                            Text("No saved meals yet. Add one below.")
                                .foregroundColor(CalmTheme.muted)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    } else {
                        VStack(spacing: 8) {
                            ForEach(items) { item in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(item.name).foregroundColor(CalmTheme.ink)
                                        Text("\(item.calories) cal").foregroundColor(CalmTheme.muted).font(.footnote)
                                    }
                                    Spacer()
                                    Button {
                                        Task { await logAgain(item.id) }
                                    } label: {
                                        Text("Log again")
                                            .font(.footnote)
                                            .padding(.horizontal, 12).padding(.vertical, 6)
                                            .background(CalmTheme.sage.opacity(0.15))
                                            .foregroundColor(CalmTheme.sageDark)
                                            .clipShape(Capsule())
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(14)
                                .background(.white.opacity(0.8))
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(CalmTheme.sand, lineWidth: 1))
                            }
                        }
                    }

                    CalmCard {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Add a saved meal").font(.footnote).foregroundColor(CalmTheme.muted)
                            TextField("Name (e.g. usual breakfast)", text: $name)
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(CalmTheme.cream)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(CalmTheme.sand, lineWidth: 1))
                            TextField("Calories", text: $calories)
                                .keyboardType(.numberPad)
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(CalmTheme.cream)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10).stroke(CalmTheme.sand, lineWidth: 1))
                            Button {
                                Task { await create() }
                            } label: {
                                Text(saving ? "Saving…" : "Save")
                            }
                            .buttonStyle(CalmPrimaryButtonStyle())
                            .disabled(saving || name.isEmpty || calories.isEmpty)
                        }
                    }
                }
                .padding(20)
            }
            .background(CalmTheme.cream)
            .navigationTitle("Saved")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            items = try await APIClient.shared.listSaved(deviceId: session.deviceId)
        } catch {
            items = []
        }
    }

    private func create() async {
        guard let cal = Int(calories) else { return }
        saving = true
        defer { saving = false }
        do {
            _ = try await APIClient.shared.createSaved(deviceId: session.deviceId, name: name, calories: cal)
            name = ""; calories = ""
            await load()
        } catch {}
    }

    private func logAgain(_ id: UUID) async {
        do {
            _ = try await APIClient.shared.logFromSaved(deviceId: session.deviceId, savedMealId: id)
        } catch {}
    }
}
