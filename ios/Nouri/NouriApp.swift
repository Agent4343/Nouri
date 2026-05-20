import SwiftUI

@main
struct NouriApp: App {
    @StateObject private var session = Session()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(session)
                .tint(CalmTheme.sage)
        }
    }
}
