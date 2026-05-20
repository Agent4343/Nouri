import SwiftUI

struct HomeView: View {
    @EnvironmentObject var session: Session
    @State private var summary: TodaySummary?
    @State private var loadError: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let summary {
                        DailyTotalCard(summary: summary)

                        NavigationLink {
                            SnapView()
                        } label: {
                            Text("Snap a meal").frame(maxWidth: .infinity)
                        }
                        .buttonStyle(CalmPrimaryButtonStyle())

                        if summary.meals.isEmpty {
                            CalmCard {
                                Text("Nothing logged yet. Whenever you're ready.")
                                    .foregroundColor(CalmTheme.muted)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        } else {
                            VStack(spacing: 10) {
                                ForEach(summary.meals) { meal in
                                    NavigationLink {
                                        CorrectView(meal: meal, onSaved: { Task { await load() } })
                                    } label: {
                                        MealRow(meal: meal)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    } else if loadError {
                        Text("Couldn't reach the server. We'll try again next time.")
                            .foregroundColor(CalmTheme.muted)
                    } else {
                        Text("Loading today…").foregroundColor(CalmTheme.muted)
                    }
                }
                .padding(20)
            }
            .background(CalmTheme.cream)
            .navigationTitle("Nouri")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        loadError = false
        do {
            summary = try await APIClient.shared.today(deviceId: session.deviceId)
        } catch {
            loadError = true
        }
    }
}
