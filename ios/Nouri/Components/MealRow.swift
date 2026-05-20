import SwiftUI

struct MealRow: View {
    let meal: Meal

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(meal.label).foregroundColor(CalmTheme.ink)
                Text("\(meal.calories) cal · \(Int(meal.proteinG))p / \(Int(meal.carbsG))c / \(Int(meal.fatG))f")
                    .font(.footnote)
                    .foregroundColor(CalmTheme.ink)
                Text(meal.loggedAt.formatted(date: .omitted, time: .shortened)
                     + (meal.corrected ? " · corrected" : ""))
                    .font(.caption2)
                    .foregroundColor(CalmTheme.muted)
            }
            Spacer()
            if !meal.corrected {
                ConfidenceBadge(value: meal.confidence)
            }
        }
        .padding(14)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(CalmTheme.sand, lineWidth: 1))
    }
}
