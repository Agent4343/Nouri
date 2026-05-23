import Foundation
import HealthKit
import os.log

/// HealthKit integration per Story Bible §12 (V1) + §26 (mandatory).
///
/// Writes meals (calories + macros) when the user saves in Nouri. Optionally
/// reads body weight so the calorie target can stay calibrated without forcing
/// the user to type it.
///
/// All HealthKit access is gated on explicit user authorization. The bridge
/// silently no-ops on devices without HealthKit (iPad Sidecar, simulator).
@MainActor
final class HealthKitBridge: ObservableObject {
    static let shared = HealthKitBridge()

    private let store = HKHealthStore()
    private let log = Logger(subsystem: "app.nouri", category: "healthkit")

    @Published private(set) var authorized = false

    var available: Bool { HKHealthStore.isHealthDataAvailable() }

    private var writeTypes: Set<HKSampleType> {
        var types: Set<HKSampleType> = []
        for id in [
            HKQuantityTypeIdentifier.dietaryEnergyConsumed,
            .dietaryProtein,
            .dietaryCarbohydrates,
            .dietaryFatTotal,
        ] {
            if let t = HKObjectType.quantityType(forIdentifier: id) { types.insert(t) }
        }
        return types
    }

    private var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = []
        for id in [HKQuantityTypeIdentifier.stepCount, .bodyMass] {
            if let t = HKObjectType.quantityType(forIdentifier: id) { types.insert(t) }
        }
        return types
    }

    /// Request user permission. Apple's design intentionally hides whether the
    /// user actually granted write access — we always learn at first write.
    func requestAuthorization() async throws {
        guard available else { throw HealthKitError.unavailable }
        try await store.requestAuthorization(toShare: writeTypes, read: readTypes)
        authorized = true
    }

    /// Save a logged meal to HealthKit. Silently no-ops if not authorized — the
    /// user's Nouri data stays in our DB regardless (HealthKit is a mirror,
    /// not the source of truth).
    func writeMeal(
        label: String,
        calories: Int,
        proteinG: Double,
        carbsG: Double,
        fatG: Double,
        at date: Date = Date()
    ) async {
        guard available else { return }
        let metadata = ["NouriLabel": label]

        var samples: [HKSample] = []
        if let t = HKObjectType.quantityType(forIdentifier: .dietaryEnergyConsumed) {
            samples.append(
                HKQuantitySample(
                    type: t,
                    quantity: HKQuantity(unit: .kilocalorie(), doubleValue: Double(calories)),
                    start: date, end: date, metadata: metadata
                )
            )
        }
        if proteinG > 0, let t = HKObjectType.quantityType(forIdentifier: .dietaryProtein) {
            samples.append(
                HKQuantitySample(
                    type: t,
                    quantity: HKQuantity(unit: .gram(), doubleValue: proteinG),
                    start: date, end: date, metadata: metadata
                )
            )
        }
        if carbsG > 0, let t = HKObjectType.quantityType(forIdentifier: .dietaryCarbohydrates) {
            samples.append(
                HKQuantitySample(
                    type: t,
                    quantity: HKQuantity(unit: .gram(), doubleValue: carbsG),
                    start: date, end: date, metadata: metadata
                )
            )
        }
        if fatG > 0, let t = HKObjectType.quantityType(forIdentifier: .dietaryFatTotal) {
            samples.append(
                HKQuantitySample(
                    type: t,
                    quantity: HKQuantity(unit: .gram(), doubleValue: fatG),
                    start: date, end: date, metadata: metadata
                )
            )
        }

        guard !samples.isEmpty else { return }
        do {
            try await store.save(samples)
        } catch {
            log.warning("HealthKit save failed: \(String(describing: error))")
        }
    }

    /// Returns the most recent body-mass sample in kilograms, or nil.
    func latestWeightKg() async -> Double? {
        guard available, let type = HKObjectType.quantityType(forIdentifier: .bodyMass) else {
            return nil
        }
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        return await withCheckedContinuation { cont in
            let q = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, results, _ in
                if let s = results?.first as? HKQuantitySample {
                    cont.resume(returning: s.quantity.doubleValue(for: .gramUnit(with: .kilo)))
                } else {
                    cont.resume(returning: nil)
                }
            }
            self.store.execute(q)
        }
    }
}

enum HealthKitError: Error {
    case unavailable
}
