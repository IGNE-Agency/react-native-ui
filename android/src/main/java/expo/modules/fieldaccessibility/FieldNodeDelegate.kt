package expo.modules.fieldaccessibility

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat

/**
 * The field state a platform can express on an accessibility node but React Native cannot.
 */
internal data class FieldNodeState(
  val error: String? = null,
  val invalid: Boolean = false,
  val required: Boolean = false,
  val stateDescription: String? = null
)

/**
 * Adds field state to a control's accessibility node by composing the delegate React Native
 * already installed instead of replacing it.
 *
 * Every callback is forwarded verbatim. That matters twice over: `performAccessibilityAction`
 * carries React Native's own `ACTION_CLICK` handling, and `getAccessibilityNodeProvider` carries
 * the `ExploreByTouchHelper` virtual node hierarchy that `ReactAccessibilityDelegate` brings with
 * it — dropping either would break the control's existing accessibility rather than extend it.
 *
 * There is no recursion hazard in forwarding `onInitializeAccessibilityNodeInfo`:
 * `ExploreByTouchHelper.onInitializeAccessibilityNodeInfo` calls
 * `AccessibilityDelegateCompat`'s implementation, which reaches the host through
 * `View.onInitializeAccessibilityNodeInfoInternal` and so never dispatches back to the
 * installed delegate.
 */
internal class FieldNodeDelegate(
  private val wrapped: AccessibilityDelegateCompat?
) : AccessibilityDelegateCompat() {
  var state: FieldNodeState = FieldNodeState()

  override fun onInitializeAccessibilityNodeInfo(
    host: View,
    info: AccessibilityNodeInfoCompat
  ) {
    if (wrapped != null) {
      wrapped.onInitializeAccessibilityNodeInfo(host, info)
    } else {
      super.onInitializeAccessibilityNodeInfo(host, info)
    }

    val error = state.error
    if (error != null) {
      info.setError(error)
    }
    // TalkBack reads the error on focus only when `contentInvalid` is set as well, and reads it
    // while typing from `error` alone, so an error always implies invalid here.
    info.setContentInvalid(state.invalid || error != null)
    info.setFieldRequired(state.required)
    state.stateDescription?.let { info.setStateDescription(it) }
  }

  override fun getAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? =
    wrapped?.getAccessibilityNodeProvider(host) ?: super.getAccessibilityNodeProvider(host)

  override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean =
    wrapped?.performAccessibilityAction(host, action, args)
      ?: super.performAccessibilityAction(host, action, args)

  override fun sendAccessibilityEvent(host: View, eventType: Int) {
    if (wrapped != null) {
      wrapped.sendAccessibilityEvent(host, eventType)
    } else {
      super.sendAccessibilityEvent(host, eventType)
    }
  }

  override fun sendAccessibilityEventUnchecked(host: View, event: AccessibilityEvent) {
    if (wrapped != null) {
      wrapped.sendAccessibilityEventUnchecked(host, event)
    } else {
      super.sendAccessibilityEventUnchecked(host, event)
    }
  }

  override fun dispatchPopulateAccessibilityEvent(
    host: View,
    event: AccessibilityEvent
  ): Boolean =
    wrapped?.dispatchPopulateAccessibilityEvent(host, event)
      ?: super.dispatchPopulateAccessibilityEvent(host, event)

  override fun onPopulateAccessibilityEvent(host: View, event: AccessibilityEvent) {
    if (wrapped != null) {
      wrapped.onPopulateAccessibilityEvent(host, event)
    } else {
      super.onPopulateAccessibilityEvent(host, event)
    }
  }

  override fun onInitializeAccessibilityEvent(host: View, event: AccessibilityEvent) {
    if (wrapped != null) {
      wrapped.onInitializeAccessibilityEvent(host, event)
    } else {
      super.onInitializeAccessibilityEvent(host, event)
    }
  }

  override fun onRequestSendAccessibilityEvent(
    host: ViewGroup,
    child: View,
    event: AccessibilityEvent
  ): Boolean =
    wrapped?.onRequestSendAccessibilityEvent(host, child, event)
      ?: super.onRequestSendAccessibilityEvent(host, child, event)
}
