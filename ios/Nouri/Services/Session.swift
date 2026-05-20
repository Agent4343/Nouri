import Foundation
import SwiftUI

// Anonymous device identity — no signup wall in the first 60 seconds (§8).
@MainActor
final class Session: ObservableObject {
    @Published private(set) var deviceId: UUID

    init() {
        if let stored = UserDefaults.standard.string(forKey: "nouri.deviceId"),
           let id = UUID(uuidString: stored) {
            self.deviceId = id
        } else {
            let id = UUID()
            UserDefaults.standard.set(id.uuidString, forKey: "nouri.deviceId")
            self.deviceId = id
        }
    }
}
