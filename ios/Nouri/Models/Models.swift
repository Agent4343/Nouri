import Foundation

struct Profile: Codable {
    let deviceId: UUID
    var age: Int?
    var weightKg: Double?
    var heightCm: Double?
    var goal: String?
    var calorieTarget: Int?

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case age
        case weightKg = "weight_kg"
        case heightCm = "height_cm"
        case goal
        case calorieTarget = "calorie_target"
    }
}

struct MealAlternative: Codable, Identifiable {
    var id: String { label }
    let label: String
    let calories: Int
}

struct Meal: Codable, Identifiable {
    let id: UUID
    let deviceId: UUID
    var label: String
    var calories: Int
    var proteinG: Double
    var carbsG: Double
    var fatG: Double
    var confidence: Double
    var photoUrl: String?
    var source: String
    var corrected: Bool
    var loggedAt: Date
    var alternatives: [MealAlternative]?

    enum CodingKeys: String, CodingKey {
        case id
        case deviceId = "device_id"
        case label
        case calories
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
        case confidence
        case photoUrl = "photo_url"
        case source
        case corrected
        case loggedAt = "logged_at"
        case alternatives
    }
}

struct TodaySummary: Codable {
    let deviceId: UUID
    let totalCalories: Int
    let totalProteinG: Double
    let totalCarbsG: Double
    let totalFatG: Double
    let targetCalories: Int?
    let meals: [Meal]
    let message: String

    enum CodingKeys: String, CodingKey {
        case deviceId = "device_id"
        case totalCalories = "total_calories"
        case totalProteinG = "total_protein_g"
        case totalCarbsG = "total_carbs_g"
        case totalFatG = "total_fat_g"
        case targetCalories = "target_calories"
        case meals
        case message
    }
}

struct SavedMeal: Codable, Identifiable {
    let id: UUID
    let name: String
    let calories: Int
    let proteinG: Double
    let carbsG: Double
    let fatG: Double

    enum CodingKeys: String, CodingKey {
        case id, name, calories
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
    }
}
