/* A picture cut to the part to be read, before its text is recognised
   (author 2026-11-06): the picture over the whole screen with a frame on it,
   at first around all of it, so a picture that needs no cutting costs one
   tap more. Where the text recognised in it is clearly in one part —
   a sign, a label, a packet's instructions without the price sticker below
   (`suggestedCut` in Frame.swift) — the frame glides onto it a moment
   later, unless the reader has already taken hold of it (author
   2026-11-14). A corner or an edge of the frame is dragged, the frame itself
   moved by its inside. Nothing where the reader cancels. The page names the
   two buttons in its own language (`/pick?…&cancel=…&done=…`). */

import AVFoundation
import UIKit

@MainActor
final class CropController: UIViewController {
  private let picture: CGImage
  private let cancelWord: String
  private let doneWord: String
  private var finish: ((CGImage?) -> Void)?

  private let pictureView = UIImageView()
  private let shade = CAShapeLayer()
  private let marks = CAShapeLayer()
  private let bar = UIStackView()

  /* Where the picture lies, and the frame on it, in the view's points. */
  private var shown = CGRect.zero
  private var cut = CGRect.zero
  /* The edges a drag holds (left, top, right, bottom); none of them is the
     whole frame moved. Where the drag began, and the frame then. */
  private var held = (left: false, top: false, right: false, bottom: false, move: false)
  private var started = CGRect.zero
  /* Whether the reader has taken hold of the frame: a frame suggested
     after that is not used. The suggestion in the picture's pixels, and
     the glide onto it. */
  private var touched = false
  private var suggested: CGRect?
  private var glide: (from: CGRect, to: CGRect, start: CFTimeInterval, link: CADisplayLink)?

  /* How far from an edge a finger still takes it: outside, and further
  inside, where a finger aiming at a corner tends to land (author
  2026-11-10); the smallest frame: a word or two of small print (author
  2026-11-06). Inside, an edge is held at most from its outer third, so
  that the frame's middle still moves it. */
  private let reach: CGFloat = 44
  private let reachInside: CGFloat = 72
  private let smallest: CGFloat = 12

  init(_ picture: CGImage, cancel: String, done: String, finish: @escaping (CGImage?) -> Void) {
    self.picture = picture
    cancelWord = cancel
    doneWord = done
    self.finish = finish
    super.init(nibName: nil, bundle: nil)
    modalPresentationStyle = .fullScreen
    overrideUserInterfaceStyle = .dark
  }

  required init?(coder: NSCoder) { nil }

  override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    pictureView.image = UIImage(cgImage: picture)
    pictureView.contentMode = .scaleAspectFit
    view.addSubview(pictureView)

    shade.fillRule = .evenOdd
    shade.fillColor = UIColor(white: 0, alpha: 0.55).cgColor
    view.layer.addSublayer(shade)
    marks.strokeColor = UIColor.white.cgColor
    marks.fillColor = UIColor.clear.cgColor
    view.layer.addSublayer(marks)

    var cancel = UIButton.Configuration.plain()
    cancel.title = cancelWord
    cancel.baseForegroundColor = .white
    cancel.buttonSize = .large
    let cancelButton = UIButton(configuration: cancel, primaryAction: UIAction { [weak self] _ in self?.end(nil) })

    /* The app's one accent, as its buttons that lead on have it. */
    var done = UIButton.Configuration.filled()
    done.title = doneWord
    done.baseBackgroundColor = UIColor(red: 0x18 / 255, green: 0xda / 255, blue: 0xf1 / 255, alpha: 1)
    done.baseForegroundColor = .black
    done.cornerStyle = .capsule
    done.buttonSize = .large
    let doneButton = UIButton(configuration: done, primaryAction: UIAction { [weak self] _ in self?.end(self?.cutPicture()) })
    doneButton.accessibilityIdentifier = "crop-done"

    bar.axis = .horizontal
    bar.distribution = .equalSpacing
    bar.alignment = .center
    bar.addArrangedSubview(cancelButton)
    bar.addArrangedSubview(doneButton)
    bar.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(bar)
    NSLayoutConstraint.activate([
      bar.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
      bar.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
      bar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
    ])

    view.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: #selector(dragged(_:))))

    let whole = picture
    Task { [weak self] in
      guard let cut = await suggestedCut(whole) else { return }
      self?.suggested = cut
      self?.glideToSuggestion()
    }
  }

  /* The frame moved onto the suggested part in a quarter of a second, once
     the picture has its place and while the frame is still untouched. */
  private func glideToSuggestion() {
    guard !touched, glide == nil, let suggested, shown.width > 0 else { return }
    let scale = shown.width / CGFloat(picture.width)
    let target = CGRect(x: shown.minX + suggested.minX * scale, y: shown.minY + suggested.minY * scale,
                        width: suggested.width * scale, height: suggested.height * scale)
    self.suggested = nil
    let link = CADisplayLink(target: self, selector: #selector(gliding(_:)))
    glide = (cut, target, CACurrentMediaTime(), link)
    link.add(to: .main, forMode: .common)
  }

  @objc private func gliding(_ link: CADisplayLink) {
    guard let glide else { return link.invalidate() }
    let done = min(1, (CACurrentMediaTime() - glide.start) / 0.25)
    let eased = done * done * (3 - 2 * done)
    func step(_ a: CGFloat, _ b: CGFloat) -> CGFloat { a + (b - a) * eased }
    cut = CGRect(x: step(glide.from.minX, glide.to.minX), y: step(glide.from.minY, glide.to.minY),
                 width: step(glide.from.width, glide.to.width), height: step(glide.from.height, glide.to.height))
    draw()
    if done >= 1 { stopGliding() }
  }

  private func stopGliding() {
    glide?.link.invalidate()
    glide = nil
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    /* Room around the picture for a finger on its corners, and the bar under it. */
    let safe = view.bounds.inset(by: view.safeAreaInsets)
    let area = CGRect(x: safe.minX + 24, y: safe.minY + 24, width: safe.width - 48,
                      height: max(0, safe.height - 24 - bar.frame.height - 32))
    let size = CGSize(width: picture.width, height: picture.height)
    let place = AVMakeRect(aspectRatio: size, insideRect: area)
    if place != shown {
      /* A new place, at first or turned: the frame keeps its share of the picture. */
      if shown.width > 0, shown.height > 0 {
        let share = CGRect(x: (cut.minX - shown.minX) / shown.width, y: (cut.minY - shown.minY) / shown.height,
                           width: cut.width / shown.width, height: cut.height / shown.height)
        cut = CGRect(x: place.minX + share.minX * place.width, y: place.minY + share.minY * place.height,
                     width: share.width * place.width, height: share.height * place.height)
      } else {
        cut = place
      }
      shown = place
    }
    pictureView.frame = shown
    draw()
    glideToSuggestion()
  }

  private func draw() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    let outside = UIBezierPath(rect: view.bounds)
    outside.append(UIBezierPath(rect: cut))
    shade.path = outside.cgPath

    /* A hairline round the frame and a bracket just outside each corner, as
       Photos draws its own: on the dark ground while the frame holds the
       whole picture, a light picture's edge hiding none of it. */
    let path = UIBezierPath(rect: cut)
    let arm = min(22, cut.width / 3, cut.height / 3)
    let corners: [(CGPoint, CGFloat, CGFloat)] = [
      (CGPoint(x: cut.minX, y: cut.minY), 1, 1), (CGPoint(x: cut.maxX, y: cut.minY), -1, 1),
      (CGPoint(x: cut.minX, y: cut.maxY), 1, -1), (CGPoint(x: cut.maxX, y: cut.maxY), -1, -1),
    ]
    let brackets = UIBezierPath()
    for (corner, across, down) in corners {
      let inset = CGPoint(x: corner.x - across * 2, y: corner.y - down * 2)
      brackets.move(to: CGPoint(x: inset.x + across * (arm + 2), y: inset.y))
      brackets.addLine(to: inset)
      brackets.addLine(to: CGPoint(x: inset.x, y: inset.y + down * (arm + 2)))
    }
    marks.path = path.cgPath
    marks.lineWidth = 1
    let bracketLayer = marks.sublayers?.first as? CAShapeLayer ?? {
      let layer = CAShapeLayer()
      layer.strokeColor = UIColor.white.cgColor
      layer.fillColor = UIColor.clear.cgColor
      layer.lineWidth = 3
      layer.lineCap = .round
      layer.lineJoin = .round
      marks.addSublayer(layer)
      return layer
    }()
    bracketLayer.path = brackets.cgPath
    CATransaction.commit()
  }

  @objc private func dragged(_ pan: UIPanGestureRecognizer) {
    switch pan.state {
    case .began:
      touched = true
      stopGliding()
      started = cut
      /* Where the finger came down, not where it is once the drag is
         recognised: by then it has moved some ten points, and a corner
         touched just inside and dragged inwards would be out of reach of
         the edge it moves towards. */
      let now = pan.location(in: view), moved = pan.translation(in: view)
      let at = CGPoint(x: now.x - moved.x, y: now.y - moved.y)
      /* `inward` is negative outside. */
      func inReach(_ inward: CGFloat, _ size: CGFloat) -> Bool { inward > -reach && inward < min(reachInside, size / 3) }
      let near = (left: inReach(at.x - cut.minX, cut.width), top: inReach(at.y - cut.minY, cut.height),
                  right: inReach(cut.maxX - at.x, cut.width), bottom: inReach(cut.maxY - at.y, cut.height))
      let within = cut.insetBy(dx: -reach, dy: -reach).contains(at)
      /* Of two edges in reach on a small frame, the nearer one. */
      let left = near.left && (!near.right || abs(at.x - cut.minX) <= abs(at.x - cut.maxX))
      let top = near.top && (!near.bottom || abs(at.y - cut.minY) <= abs(at.y - cut.maxY))
      held = (left: within && left, top: within && top,
              right: within && near.right && !left, bottom: within && near.bottom && !top, move: false)
      if !held.left && !held.top && !held.right && !held.bottom { held.move = cut.contains(at) }
    case .changed:
      let moved = pan.translation(in: view)
      var next = started
      if held.move {
        next.origin.x = min(max(started.minX + moved.x, shown.minX), shown.maxX - started.width)
        next.origin.y = min(max(started.minY + moved.y, shown.minY), shown.maxY - started.height)
      } else {
        var left = started.minX, top = started.minY, right = started.maxX, bottom = started.maxY
        if held.left { left = min(max(started.minX + moved.x, shown.minX), right - smallest) }
        if held.right { right = max(min(started.maxX + moved.x, shown.maxX), left + smallest) }
        if held.top { top = min(max(started.minY + moved.y, shown.minY), bottom - smallest) }
        if held.bottom { bottom = max(min(started.maxY + moved.y, shown.maxY), top + smallest) }
        next = CGRect(x: left, y: top, width: right - left, height: bottom - top)
      }
      cut = next
      draw()
    default:
      held = (false, false, false, false, false)
    }
  }

  /* The part inside the frame, in the picture's own pixels; the picture
     itself where the frame was left round all of it. */
  private func cutPicture() -> CGImage {
    if abs(cut.minX - shown.minX) < 1, abs(cut.minY - shown.minY) < 1,
       abs(cut.maxX - shown.maxX) < 1, abs(cut.maxY - shown.maxY) < 1 { return picture }
    let scale = CGFloat(picture.width) / shown.width
    let pixels = CGRect(x: (cut.minX - shown.minX) * scale, y: (cut.minY - shown.minY) * scale,
                        width: cut.width * scale, height: cut.height * scale).integral
    return picture.cropping(to: pixels) ?? picture
  }

  /* Its wait ended with nothing, the frame left for whoever closes the
     stack it lies in. */
  func giveUp() {
    stopGliding()
    let finishing = finish
    finish = nil
    finishing?(nil)
  }

  private func end(_ result: CGImage?) {
    stopGliding()
    let finishing = finish
    finish = nil
    dismiss(animated: true) { finishing?(result) }
  }
}

/* Every system sheet and frame waiting on the reader, with how to give it
   up as if cancelled, and how often everything was put away: a reading
   handed over from outside is shown, never left under a camera, a picker,
   the frame or a dictionary (author 2026-11-14). Here beside the frame,
   which the share extension shares; the app closes them (Translation.swift). */
@MainActor private var standing: [Int: () -> Void] = [:]
@MainActor private var lastStanding = 0
@MainActor private(set) var putAways = 0

/* Kept until `noLongerStanding`; `giveUp` ends its wait with nothing,
   without closing anything — the whole stack is closed at once. */
@MainActor
func whileStanding(_ giveUp: @escaping () -> Void) -> Int {
  lastStanding += 1
  standing[lastStanding] = giveUp
  return lastStanding
}

@MainActor
func noLongerStanding(_ id: Int) {
  standing[id] = nil
}

/* Every wait ended with nothing, and counted: what was still on its way to
   the screen does not come. */
@MainActor
func giveUpEverything() {
  putAways += 1
  let waiting = Array(standing.values)
  standing = [:]
  for giveUp in waiting { giveUp() }
}

/* The picture cut, presented over `top` once nothing is still being put
   away there — a system sheet closes itself as it hands its picture over. */
@MainActor
func cropped(_ picture: CGImage, over top: @MainActor () -> UIViewController?, cancel: String, done: String) async -> CGImage? {
  let began = putAways
  var presenter = top()
  for _ in 0..<30 {
    guard let shown = presenter, shown.isBeingDismissed || shown.isBeingPresented else { break }
    try? await Task.sleep(nanoseconds: 50_000_000)
    presenter = top()
  }
  guard putAways == began else { return nil }
  guard let presenter else { return picture }
  return await withCheckedContinuation { (done_: CheckedContinuation<CGImage?, Never>) in
    var held = 0
    let crop = CropController(picture, cancel: cancel, done: done) {
      noLongerStanding(held)
      done_.resume(returning: $0)
    }
    held = whileStanding { [weak crop] in crop?.giveUp() }
    presenter.present(crop, animated: true)
  }
}
