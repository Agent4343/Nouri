import SwiftUI

// Honesty surface — confidence is always visible (Story Bible §3, §7).
struct ConfidenceBadge: View {
    let value: Double

    private var label: String {
        if value >= 0.8 { return "Confident" }
        if value >= 0.65 { return "Best guess" }
        return "Not sure yet"
    }
    private var background: Color {
        if value >= 0.8 { return CalmTheme.sage.opacity(0.15) }
        if value >= 0.65 { return CalmTheme.warmth.opacity(0.15) }
        return CalmTheme.sand
    }
    private var foreground: Color {
        if value >= 0.8 { return CalmTheme.sageDark }
        return CalmTheme.muted
    }

    var body: some View {
        HStack(spacing: 6) {
            Text(label).font(.footnote.weight(.medium))
            Text("\(Int((value * 100).rounded()))%").font(.footnote).opacity(0.7)
        }
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(background)
        .foregroundColor(foreground)
        .clipShape(Capsule())
    }
}
