package expo.modules.fieldaccessibility

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import androidx.core.view.ViewCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * An unstyled ancestor that carries a field's accessibility state down to its control.
 *
 * The state is applied from `onAttachedToWindow`, because Fabric assembles a subtree fully before
 * inserting it into its parent, and re-applied after every prop update, because attachment happens
 * once while props keep changing.
 */
@SuppressLint("ViewConstructor")
class FieldAccessibilityView(context: Context, appContext: AppContext) :
  ExpoView(context, appContext) {
  private var state = FieldNodeState()
  private var delegate: FieldNodeDelegate? = null
  private var delegateHost: View? = null

  fun updateError(error: String?) {
    state = state.copy(error = error)
  }

  fun updateInvalid(invalid: Boolean) {
    state = state.copy(invalid = invalid)
  }

  fun updateRequired(required: Boolean) {
    state = state.copy(required = required)
  }

  fun updateStateDescription(stateDescription: String?) {
    state = state.copy(stateDescription = stateDescription)
  }

  /**
   * Hands the current state to the control's node. At most one delegate is ever installed per
   * control, so calling this repeatedly only refreshes the state the installed delegate reads.
   */
  fun applyToControl() {
    val host = controlNode() ?: return
    val installed = delegate

    if (installed != null && delegateHost === host) {
      installed.state = state
      return
    }

    val composed = FieldNodeDelegate(ViewCompat.getAccessibilityDelegate(host))
    composed.state = state
    ViewCompat.setAccessibilityDelegate(host, composed)
    delegate = composed
    delegateHost = host
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    applyToControl()
  }

  // React Native measures and lays out every view it manages itself, so LinearLayout's own
  // arrangement must not run: it would fight Yoga's result and measure React Native's children
  // with specs they assert against. Mirrors `ReactViewGroup`, which makes both a no-op.
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) = Unit

  /**
   * The control the field is built around: the first focusable view in the subtree, since the
   * field's frame is deliberately not an accessibility node of its own. Falls back to the single
   * child so a control that never takes focus still gets its state.
   */
  private fun controlNode(): View? = firstFocusable(this) ?: getChildAt(0)

  private fun firstFocusable(parent: ViewGroup): View? {
    for (index in 0 until parent.childCount) {
      val child = parent.getChildAt(index)
      if (child.isFocusable) {
        return child
      }
      if (child is ViewGroup) {
        firstFocusable(child)?.let { return it }
      }
    }
    return null
  }
}
