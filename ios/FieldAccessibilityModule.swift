import ExpoModulesCore

public final class FieldAccessibilityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FieldAccessibility")

    View(FieldAccessibilityView.self) {
      Prop("fieldLabel") { (view: FieldAccessibilityView, label: String?) in
        view.fieldLabel = label
      }

      Prop("fieldError") { (view: FieldAccessibilityView, error: String?) in
        view.fieldError = error
      }

      // Read on Android only, where they become node state rather than custom content.
      Prop("fieldInvalid") { (_: FieldAccessibilityView, _: Bool) in }

      Prop("fieldRequired") { (_: FieldAccessibilityView, _: Bool) in }

      Prop("fieldStateDescription") { (_: FieldAccessibilityView, _: String?) in }

      OnViewDidUpdateProps { (view: FieldAccessibilityView) in
        view.applyToControl()
      }
    }
  }
}
