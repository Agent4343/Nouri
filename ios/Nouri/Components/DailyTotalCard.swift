import SwiftUI

struct DailyTotalCard: View {
    let summary: TodaySummary

    private var pct: Double {
        guard let target = summary.targetCalories, target > 0 else { return 0 }
        return min(1.0, Double(summary.totalCalories) / Double(target))
    }

    var body: some View {
        CalmCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Today").font(.footnote).foregroundColor(CalmTheme.muted)
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text("\(summary.totalCalories)")
                                .font(.system(size: 32, weight: .medium))
                                .foregroundColor(CalmTheme.ink)
                            if let target = summary.targetCalories {
                                Text("of ~\(target) cal")
                                    .foregroundColor(CalmTheme.muted)
                            } else {
                                Text("cal").foregroundColor(CalmTheme.muted)
                            }
                        }
                    }
                    Spacer()
                }

                if summary.targetCalories != nil {
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule().fill(CalmTheme.sand).frame(height: 8)
                            Capsule().fill(CalmTheme.sage).frame(width: proxy.size.width * pct, height: 8)
                        }
                    }
                    .frame(height: 8)
                }

                Text(summary.message)
                    .foregroundColor(CalmTheme.ink)
                    .font(.footnote)
            }
        }
    }
}
