import SwiftUI

// Dark, warm palette. `cream` is the page bg, `card` is the raised surface,
// `ink` is bright text. Sage and warmth are lifted to pop on the dark bg.
enum CalmTheme {
    static let cream = Color(red: 0.102, green: 0.090, blue: 0.078)   // #1A1714 — page bg
    static let card  = Color(red: 0.165, green: 0.145, blue: 0.125)   // #2A2520 — cards / inputs
    static let sand  = Color(red: 0.227, green: 0.196, blue: 0.169)   // #3A322B — borders
    static let ink   = Color(red: 0.961, green: 0.937, blue: 0.898)   // #F5EFE5 — primary text
    static let muted = Color(red: 0.761, green: 0.718, blue: 0.659)   // #C2B7A8 — secondary text
    static let sage  = Color(red: 0.616, green: 0.780, blue: 0.624)   // #9DC79F — accent
    static let sageDark = Color(red: 0.478, green: 0.682, blue: 0.490) // #7AAE7D — hover
    static let warmth = Color(red: 0.898, green: 0.690, blue: 0.478)  // #E5B07A — warm amber
}

struct CalmCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(16)
            .background(CalmTheme.card)
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
            // Bright sage button with dark page-bg text — high contrast pop on dark.
            .foregroundColor(CalmTheme.cream)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(configuration.isPressed ? CalmTheme.sageDark : CalmTheme.sage)
            .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}
