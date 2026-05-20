import SwiftUI

// Calm palette per Story Bible §9. Soft, generous, quiet.
enum CalmTheme {
    static let cream = Color(red: 0.980, green: 0.969, blue: 0.949)   // #FAF7F2
    static let sand  = Color(red: 0.945, green: 0.921, blue: 0.878)   // #F1EBE0
    static let ink   = Color(red: 0.180, green: 0.165, blue: 0.149)   // #2E2A26
    static let muted = Color(red: 0.435, green: 0.408, blue: 0.384)   // #6F6862
    static let sage  = Color(red: 0.545, green: 0.663, blue: 0.541)   // #8BA98A
    static let sageDark = Color(red: 0.431, green: 0.549, blue: 0.431) // #6E8C6E
    static let warmth = Color(red: 0.851, green: 0.651, blue: 0.475) // #D9A679
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
