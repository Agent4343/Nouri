import Foundation

enum Units: String {
    case metric
    case imperial
}

enum UnitConvert {
    static func lbToKg(_ lb: Double) -> Double { lb * 0.45359237 }
    static func ftInToCm(_ ft: Double, _ inch: Double) -> Double { (ft * 12 + inch) * 2.54 }
}
