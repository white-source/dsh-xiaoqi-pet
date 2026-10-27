import AppKit
import Foundation

if CommandLine.arguments.contains("--diagnose") {
    let semaphore = DispatchSemaphore(value: 0)
    var outcome = "unknown"
    let client = BridgeClient()
    client.fetchState { result in
        switch result {
        case .success(let state):
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            if let data = try? encoder.encode(state), let text = String(data: data, encoding: .utf8) {
                outcome = text
            } else {
                outcome = "decode-encode-failed"
            }
        case .failure(let error):
            outcome = "error: \(error.localizedDescription)"
        }
        semaphore.signal()
    }
    if semaphore.wait(timeout: .now() + 6) == .timedOut {
        outcome = "timeout"
    }
    print(outcome)
    exit(0)
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
