package expo.modules.homewidgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// One provider per widget; the drawing is in HomeWidgets.kt and the *View.kt files.
open class HevierWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    HomeWidgets.redraw(context, manager, javaClass, ids)
    // Keep the midnight redraw booked whenever the system updates a widget.
    RedrawScheduler.bookNext(context, WidgetStore.load(context))
  }

  override fun onEnabled(context: Context) {
    HomeWidgets.redrawAll(context) // books the midnight redraw
  }
}

class CalendarWidget : HevierWidget()

class VolumeWidget : HevierWidget()

class CycleWidget : HevierWidget()

class RecoveryWidget : HevierWidget()

// Fires at midnight, and when the timezone changes (the booked alarm is an
// absolute time in the old zone). A reboot is covered by onEnabled.
class MidnightReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    HomeWidgets.redrawAll(context)
  }
}
