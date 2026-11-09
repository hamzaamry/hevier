package expo.modules.workoutnotification

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import expo.modules.workoutnotification.NotificationConstants.CHANNEL_ID
import expo.modules.workoutnotification.NotificationConstants.MIN_REDRAW_MS
import expo.modules.workoutnotification.NotificationConstants.NOTIFICATION_ID
import expo.modules.workoutnotification.NotificationConstants.QUIET_AFTER_TAP_MS
import expo.modules.workoutnotification.NotificationConstants.TAG
import expo.modules.workoutnotification.NotificationConstants.TICK_OFFSET_MS
import expo.modules.workoutnotification.NotificationConstants.WAKE_LOCK_MARGIN_MS

// Keeps the workout notification up while a workout is in progress (a
// foreground service, so Android doesn't stop the countdown). While resting it
// redraws every second, and switches back to the set line on its own when the
// rest is over, even if the app's JS is paused, with a buzz and the chime.
// The rest maths is in RestController, the views in NotificationViews.
class WorkoutNotificationService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val tick = Runnable { render(fromTimer = true) }
  private val delayedRender = Runnable { render() }
  private val views by lazy { NotificationViews(this) }
  private val alert by lazy { RestAlert(this) }
  private var wasResting = false
  private var lastNotify = 0L
  private var lastDrawn: String? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Channels.ensure(this)
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
    val current = state
    if (current == null) {
      // hide() came before the service started. Android kills the app if a
      // service started with startForegroundService doesn't call
      // startForeground, so show an empty notification and stop right away.
      val empty = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_workout_notification)
        .build()
      ServiceCompat.startForeground(this, NOTIFICATION_ID, empty, type)
      stopSelf()
      return START_NOT_STICKY
    }
    ServiceCompat.startForeground(this, NOTIFICATION_ID, views.build(current), type)
    running = this
    wasResting = (current.restEndsAt ?: 0) > System.currentTimeMillis()
    scheduleTick()
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    alert.releaseWakeLock()
    if (running === this) running = null
    super.onDestroy()
  }

  // Redraws at most every MIN_REDRAW_MS.
  private fun requestRender() {
    handler.removeCallbacks(delayedRender)
    val wait = lastNotify + MIN_REDRAW_MS - System.currentTimeMillis()
    if (wait > 0) handler.postDelayed(delayedRender, wait) else render()
  }

  // fromTimer: the countdown itself reached zero (not Skip or -15s), so the
  // rest is really over: buzz and chime.
  private fun render(fromTimer: Boolean = false) {
    handler.removeCallbacks(delayedRender)
    val s = state ?: return
    val now = System.currentTimeMillis()
    val resting = (s.restEndsAt ?: 0) > now
    if (fromTimer && wasResting && !resting) alert.restOver()
    wasResting = resting
    // While the buttons are being tapped, nothing is redrawn: a tap landing
    // during a redraw misses the button and opens the app instead. The taps
    // count at once; the screen shows the result when they stop.
    val quietLeft = RestController.lastTap + QUIET_AFTER_TAP_MS - now
    if (quietLeft > 0) {
      handler.postDelayed(delayedRender, quietLeft)
      scheduleTick()
      return
    }
    // Nothing on screen would change (e.g. JS echoing a button): no redraw.
    val drawn = drawnKey(s, now)
    if (drawn == lastDrawn) {
      scheduleTick()
      return
    }
    lastDrawn = drawn
    lastNotify = now
    val notification = views.build(s)
    try {
      NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      Log.w(TAG, "notification permission missing", e)
    }
    scheduleTick()
  }

  private fun drawnKey(s: WorkoutState, now: Long): String {
    val resting = (s.restEndsAt ?: 0) > now
    return listOf(s.title, s.setText, s.restText, resting, s.restEndsAt, s.image, s.setButtons, s.restButtons, RestController.progress(s, now))
      .joinToString("|")
  }

  // While resting, the bar moves once a second, and the phone is kept awake.
  private fun scheduleTick() {
    handler.removeCallbacks(tick)
    val ends = state?.restEndsAt
    val left = (ends ?: 0) - System.currentTimeMillis()
    if (left <= 0) {
      alert.releaseWakeLock()
      return
    }
    alert.holdWakeLock(left + WAKE_LOCK_MARGIN_MS)
    val untilNextSecond = left % 1000
    handler.postDelayed(tick, (if (untilNextSecond == 0L) 1000L else untilNextSecond) + TICK_OFFSET_MS)
  }

  companion object {
    @Volatile private var state: WorkoutState? = null
    @Volatile private var running: WorkoutNotificationService? = null
    private val main = Handler(Looper.getMainLooper())

    fun show(context: Context, s: WorkoutState) {
      main.post {
        state = RestController.merge(s, state, System.currentTimeMillis())
        val service = running
        if (service != null) {
          service.requestRender()
          return@post
        }
        try {
          ContextCompat.startForegroundService(context, Intent(context, WorkoutNotificationService::class.java))
        } catch (e: Exception) {
          // Android doesn't allow starting it while the app is in the background.
          Log.w(TAG, "could not start the workout notification", e)
        }
      }
    }

    // A rest button (see RestController). Returns the new rest for JS, or
    // null when there was nothing to change.
    fun restButton(id: String): Pair<Long?, Long?>? {
      val s = state ?: return null
      val next = RestController.press(s, id, System.currentTimeMillis()) ?: return null
      state = next
      running?.requestRender()
      return next.restEndsAt to next.restTotal
    }

    fun hide(context: Context) {
      main.post {
        state = null
        RestController.reset()
        // Stopping a service that is still starting makes Android kill the app
        // (startForegroundService without startForeground). If it isn't running
        // yet, onStartCommand sees the empty state and stops it itself.
        if (running != null) context.stopService(Intent(context, WorkoutNotificationService::class.java))
      }
    }
  }
}
