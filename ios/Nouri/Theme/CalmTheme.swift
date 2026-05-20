import SwiftUI

// Calm palette per Story Bible §9. Soft, generous, quiet — but still legible.
enum CalmTheme {
    static let cream = Color(red: 0.980, green: 0.969, blue: 0.949)   // #FAF7F2
    static let sand  = Color(red: 0.910, green: 0.875, blue: 0.812)   // #E8DFCF
    static let ink   = Color(red: 0.122, green: 0.106, blue: 0.090)   // #1F1B17
    static let muted = Color(red: 0.290, green: 0.271, blue: 0.251)   // #4A4540
    static let sage  = Color(red: 0.373, green: 0.502, blue: 0.376)   // #5F8060
    static let sageDark = Color(red: 0.263, green: 0.380, blue: 0.282) // #436148
    static let warmth = Color(red: 0.690, green: 0.478, blue: 0.290)  // #B07A4A
}

struct CalmCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(16)
            .background(.white.opacity(0.8))
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
