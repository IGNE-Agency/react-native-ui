package expo.modules.fieldaccessibility

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FieldAccessibilityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FieldAccessibility")

    View(FieldAccessibilityView::class) {
      Prop("fieldError") { view: FieldAccessibilityView, error: String? ->
        view.updateError(error)
      }

      Prop("fieldInvalid") { view: FieldAccessibilityView, invalid: Boolean ->
        view.updateInvalid(invalid)
      }

      Prop("fieldRequired") { view: FieldAccessibilityView, required: Boolean ->
        view.updateRequired(required)
      }

      Prop("fieldStateDescription") { view: FieldAccessibilityView, description: String? ->
        view.updateStateDescription(description)
      }

      // The label is read on iOS only, where it names the field's custom content.
      Prop("fieldLabel") { _: FieldAccessibilityView, _: String? -> }

      OnViewDidUpdateProps { view: FieldAccessibilityView ->
        view.applyToControl()
      }
    }
  }
}
