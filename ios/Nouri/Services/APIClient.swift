import Foundation

enum APIError: Error {
    case badStatus(Int, String)
    case decoding(Error)
    case transport(Error)
}

@MainActor
final class APIClient {
    static let shared = APIClient()

    // Set NOURI_API_URL in your Xcode scheme's environment variables for local dev,
    // or in Info.plist as NouriApiUrl for builds.
    private let baseURL: URL = {
        if let s = ProcessInfo.processInfo.environment["NOURI_API_URL"], let u = URL(string: s) {
            return u
        }
        if let s = Bundle.main.object(forInfoDictionaryKey: "NouriApiUrl") as? String,
           let u = URL(string: s) {
            return u
        }
        return URL(string: "http://localhost:8000")!
    }()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    // MARK: - Profile

    func upsertProfile(_ body: ProfileIn) async throws -> Profile {
        try await send("/profile", method: "POST", body: body)
    }

    // MARK: - Meals

    func snap(deviceId: UUID, hint: String?) async throws -> Meal {
        struct Body: Encodable {
            let device_id: UUID
            let hint: String?
            let photo_url: String?
        }
        return try await send("/meals", method: "POST", body: Body(device_id: deviceId, hint: hint, photo_url: nil))
    }

    func correct(mealId: UUID, label: String?, calories: Int?) async throws -> Meal {
        struct Body: Encodable {
            let label: String?
            let calories: Int?
        }
        return try await send("/meals/\(mealId.uuidString.lowercased())", method: "PATCH",
                              body: Body(label: label, calories: calories))
    }

    func today(deviceId: UUID) async throws -> TodaySummary {
        try await fetch("/meals/today?device_id=\(deviceId.uuidString.lowercased())")
    }

    // MARK: - Saved

    func listSaved(deviceId: UUID) async throws -> [SavedMeal] {
        try await fetch("/saved?device_id=\(deviceId.uuidString.lowercased())")
    }

    func createSaved(deviceId: UUID, name: String, calories: Int) async throws -> SavedMeal {
        struct Body: Encodable {
            let device_id: UUID
            let name: String
            let calories: Int
        }
        return try await send("/saved", method: "POST", body: Body(device_id: deviceId, name: name, calories: calories))
    }

    func logFromSaved(deviceId: UUID, savedMealId: UUID) async throws -> Meal {
        struct Body: Encodable {
            let device_id: UUID
            let saved_meal_id: UUID
        }
        return try await send("/saved/log", method: "POST", body: Body(device_id: deviceId, saved_meal_id: savedMealId))
    }

    // MARK: - Transport

    private func fetch<T: Decodable>(_ path: String) async throws -> T {
        var req = URLRequest(url: makeURL(path))
        req.httpMethod = "GET"
        return try await run(req)
    }

    private func send<B: Encodable, T: Decodable>(_ path: String, method: String, body: B) async throws -> T {
        var req = URLRequest(url: makeURL(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "content-type")
        req.httpBody = try encoder.encode(body)
        return try await run(req)
    }

    private func makeURL(_ path: String) -> URL {
        if let qIdx = path.firstIndex(of: "?") {
            let pathPart = String(path[..<qIdx]).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            let queryPart = String(path[path.index(after: qIdx)...])
            var comps = URLComponents(url: baseURL.appendingPathComponent(pathPart), resolvingAgainstBaseURL: false)!
            comps.query = queryPart
            return comps.url!
        }
        return baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
    }

    private func run<T: Decodable>(_ req: URLRequest) async throws -> T {
        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.badStatus(0, "no response")
            }
            guard (200..<300).contains(http.statusCode) else {
                throw APIError.badStatus(http.statusCode, String(data: data, encoding: .utf8) ?? "")
            }
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decoding(error)
            }
        } catch let err as APIError {
            throw err
        } catch {
            throw APIError.transport(error)
        }
    }
}

struct ProfileIn: Encodable {
    let device_id: UUID
    let age: Int?
    let weight_kg: Double?
    let height_cm: Double?
    let goal: String?
}
