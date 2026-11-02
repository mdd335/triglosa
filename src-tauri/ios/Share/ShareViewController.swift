/* Triglosa in the share menu of Safari, Mail, Books, Photos or any app that
shares text or a picture: the text is handed to the app in its own address
(`triglosa://read?text=…`), which reads it at once as the paste button does,
and the share menu closes. A picture's text is recognised here, on the
iPhone (Recognition.swift), and handed over as its lines
(`triglosa://read?lines=…`), which the page puts in order as it does a
screenshot's. Nothing is shown here and nothing is kept.

The same extension stands in the menu twice: as Triglosa, which reads, and
as a flashcard (`triglosa://card?…`), which makes a card of what was shared.
Which one this is says its Info.plist (`TriglosaOpens`, scripts/ios.mjs).

An extension may not open its app by Apple's own word; the application
found along the responder chain does, which is what share extensions that
open their app do (the risk taken knowingly: an iOS update or the
review could stop it). Without it the share menu would close and the reader
would have to open the app and paste. */

import UIKit
import UniformTypeIdentifiers

@objc(ShareViewController)
final class ShareViewController: UIViewController {
    /* Long enough for a page of text; an address of this length still opens. */
    private let mostCharacters = 20000
    /* A picture's lines carry their boxes, a few characters more a line. */
    private let mostLineCharacters = 40000

    /* What the address asks of the app: "read", or "card". */
    private var opens: String {
        Bundle.main.object(forInfoDictionaryKey: "TriglosaOpens") as? String == "card" ? "card" : "read"
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        Task { @MainActor in
            let text = await sharedText()
            if !text.isEmpty {
                if let address = address("text", String(text.prefix(mostCharacters))) { open(address) }
            } else if let lines = await sharedPictureLines(), let address = address("lines", lines) {
                open(address)
            }
            extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private var attachments: [NSItemProvider] {
        let items = extensionContext?.inputItems.compactMap { $0 as? NSExtensionItem } ?? []
        return items.flatMap { $0.attachments ?? [] }
    }

    /* The text shared: an attachment of plain text, or the item's own text
    where an app hands it over that way. A web page shared without a
    selection brings an address and no text, and nothing is read. */
    private func sharedText() async -> String {
        let items = extensionContext?.inputItems.compactMap { $0 as? NSExtensionItem } ?? []
        for item in items {
            for provider in item.attachments ?? [] where provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                if let loaded = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) {
                    if let text = loaded as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        return text
                    }
                    if let data = loaded as? Data, let text = String(data: data, encoding: .utf8), !text.isEmpty {
                        return text
                    }
                }
            }
            if let text = item.attributedContentText?.string, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return text
            }
        }
        return ""
    }

    /* The lines of the first picture shared, recognised in the languages the
    iPhone is set to; nothing where there is no picture or no text in it.
    Cut at a whole line where they would make the address too long. */
    private func sharedPictureLines() async -> String? {
        for provider in attachments where provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
            guard let loaded = try? await provider.loadItem(forTypeIdentifier: UTType.image.identifier) else { continue }
            var picture: CGImage?
            if let url = loaded as? URL, let data = try? Data(contentsOf: url) {
                picture = uprightPicture(data)
            } else if let data = loaded as? Data {
                picture = uprightPicture(data)
            } else if let image = loaded as? UIImage {
                picture = uprightPicture(image)
            }
            guard let picture else { continue }
            let languages = Locale.preferredLanguages.compactMap { Locale(identifier: $0).language.languageCode?.identifier }
            guard let lines = try? await recognizedLines(picture, languages),
                  !lines.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
            var kept = ""
            for line in lines.split(separator: "\n") {
                if kept.count + line.count + 1 > mostLineCharacters { break }
                kept += (kept.isEmpty ? "" : "\n") + line
            }
            return kept
        }
        return nil
    }

    /* The app's own address for what was shared. A plus is written out: the
    page reads the address as a form does, where a plus is a space. */
    private func address(_ name: String, _ value: String) -> URL? {
        var parts = URLComponents()
        parts.scheme = "triglosa"
        parts.host = opens
        parts.queryItems = [URLQueryItem(name: name, value: value)]
        parts.percentEncodedQuery = parts.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        return parts.url
    }

    private func open(_ address: URL) {
        var responder: UIResponder? = self
        while let current = responder {
            if let application = current as? UIApplication {
                application.open(address, options: [:], completionHandler: nil)
                return
            }
            responder = current.next
        }
    }
}
