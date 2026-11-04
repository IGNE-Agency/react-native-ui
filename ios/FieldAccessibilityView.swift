// FIRST-BUILD FALLBACK — read this before changing anything else in here.
//
// `AXCustomContent` can only be attached to an object that conforms to `AXCustomContentProvider`,
// and the object we must attach it to is React Native's inner text field, which we do not own. The
// conformance is therefore added retroactively to `UIView` below, with the storage held in an
// associated object. Two things about that are unverified until this file is compiled for the first
// time: whether `@retroactive` is accepted on a conformance to an `@objc` protocol, and whether
// UIKit already declares an `accessibilityCustomContent` selector that this witness would collide
// with.
//
// If it does not compile, the fallback is a different mechanism, not a patch to this one: drop the
// `UIView` extension entirely, subclass the component view and conform *that* subclass to
// `RCTMountingTransactionObserving`, applying the custom content from
// `didMountComponentsWithRootTag:` instead of from `didMoveToWindow` and `OnViewDidUpdateProps`.

import Accessibility
import ExpoModulesCore
import ObjectiveC

private nonisolated(unsafe) var customContentKey: UInt8 = 0

extension UIView: @retroactive AXCustomContentProvider {
  @objc
  public var accessibilityCustomContent: [AXCustomContent]! {
    get {
      objc_getAssociatedObject(self, &customContentKey) as? [AXCustomContent]
    }
    set {
      objc_setAssociatedObject(
        self,
        &customContentKey,
        newValue,
        .OBJC_ASSOCIATION_RETAIN_NONATOMIC
      )
    }
  }
}

/**
 An unstyled ancestor that carries a field's error to its control's accessibility element.

 Custom content at `.high` importance is read on arrival and re-read on every return to the field,
 which an announcement is not. It is applied from `didMoveToWindow`, because Fabric assembles a
 subtree fully before inserting it into its parent, and re-applied after every prop update, because
 the view moves into its window once while props keep changing.
 */
public final class FieldAccessibilityView: ExpoView {
  public var fieldLabel: String?
  public var fieldError: String?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    applyToControl()
  }

  /// Hands the current error to the control's accessibility element, and clears it when gone.
  public func applyToControl() {
    guard let element = FieldAccessibilityView.controlElement(in: self) else {
      return
    }
    guard let error = fieldError, !error.isEmpty else {
      element.accessibilityCustomContent = []
      return
    }
    let content = AXCustomContent(label: fieldLabel ?? "", value: error)
    content.importance = .high
    element.accessibilityCustomContent = [content]
  }

  private static let accessibilityElementSelector = NSSelectorFromString("accessibilityElement")

  /**
   The element a component view stands aside for. `RCTViewComponentView` declares
   `accessibilityElement` publicly, but its header carries C++ and so is invisible to Swift, which
   is why the property is read through the Objective-C runtime rather than through a cast.
   */
  private static func accessibilityElement(of view: UIView) -> UIView? {
    guard view.responds(to: accessibilityElementSelector) else {
      return nil
    }
    return view.value(forKey: "accessibilityElement") as? UIView
  }

  /**
   The first descendant that stands aside for an inner control: a text input yields its text field
   and a switch its `UISwitch`, while a plain view yields itself and is walked through instead.
   */
  private static func controlElement(in view: UIView) -> UIView? {
    for subview in view.subviews {
      if let element = accessibilityElement(of: subview), element !== subview {
        return element
      }
      if let nested = controlElement(in: subview) {
        return nested
      }
    }
    return nil
  }
}
