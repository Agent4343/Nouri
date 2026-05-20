import SwiftUI

struct ContentView: View {
    @EnvironmentObject var session: Session
    @AppStorage("nouri.onboarded") private var onboarded: Bool = false

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Today", systemImage: "sun.max") }
            SnapView()
                .tabItem { Label("Snap", systemImage: "camera") }
            SavedMealsView()
                .tabItem { Label("Saved", systemImage: "bookmark") }
        }
        .fullScreenCover(isPresented: .constant(!onboarded)) {
            OnboardingView(onFinish: { onboarded = true })
        }
        .background(CalmTheme.cream.ignoresSafeArea())
    }
}
