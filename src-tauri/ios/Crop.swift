/* A picture cut to the part to be read, before its text is recognised
   (author 2026-11-06): the picture over the whole screen with a frame on it,
   at first around all of it, so a picture that needs no cutting costs one
   tap more. A corner or an edge of the frame is dragged, the frame itself
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

  /* A finger's reach around an edge, and the smallest frame: a word or two
  of small print (author 2026-11-06). Inside a frame narrower than two
  reaches an edge is held only from its outer third, so that its middle
  still moves it. */
  private let reach: CGFloat = 34
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
    let at = pan.location(in: view)
    switch pan.state {
    case .began:
      started = cut
      /* An edge is in reach a finger's width outside it, and inside it as
         far as a third of the frame. `inward` is negative outside. */
      func inReach(_ inward: CGFloat, _ size: CGFloat) -> Bool { inward > -reach && inward < min(reach, size / 3) }
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

  private func end(_ result: CGImage?) {
    let finishing = finish
    finish = nil
    dismiss(animated: true) { finishing?(result) }
  }
}

/* The picture cut, presented over `top` once nothing is still being put
   away there — a system sheet closes itself as it hands its picture over. */
@MainActor
func cropped(_ picture: CGImage, over top: @MainActor () -> UIViewController?, cancel: String, done: String) async -> CGImage? {
  var presenter = top()
  for _ in 0..<30 {
    guard let shown = presenter, shown.isBeingDismissed || shown.isBeingPresented else { break }
    try? await Task.sleep(nanoseconds: 50_000_000)
    presenter = top()
  }
  guard let presenter else { return picture }
  return await withCheckedContinuation { (done_: CheckedContinuation<CGImage?, Never>) in
    let crop = CropController(picture, cancel: cancel, done: done) { done_.resume(returning: $0) }
    presenter.present(crop, animated: true)
  }
}
