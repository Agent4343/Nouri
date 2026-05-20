import SwiftUI

// Calm palette per Story Bible §9. Soft, generous, quiet — but still legible.
enum CalmTheme {
    static let cream = Color(red: 0.980, green: 0.969, blue: 0.949)   // #FAF7F2
    static let sand  = Color(red: 0.867, green: 0.820, blue: 0.733)   // #DDD1BB
    static let ink   = Color(red: 0.059, green: 0.051, blue: 0.043)   // #0F0D0B
    static let muted = Color(red: 0.169, green: 0.153, blue: 0.133)   // #2B2722
    static let sage  = Color(red: 0.290, green: 0.420, blue: 0.298)   // #4A6B4C
    static let sageDark = Color(red: 0.204, green: 0.314, blue: 0.216) // #345037
    static let warmth = Color(red: 0.580, green: 0.376, blue: 0.200)  // #946033
}

struct CalmCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(16)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(CalmTheme.sand, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

struct CalmPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundColor(.white)
            .background(configuration.isPressed ? CalmTheme.sageDark : CalmTheme.sage)
            .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
