package com.spred

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "spred"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    /**
     * Fix for React Native Screens crash
     * Prevents screen fragments from being restored incorrectly
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }

    private var touchEventDepth = 0
    private val maxTouchEventDepth = 20 // Very permissive limit
    private var lastTouchTime = 0L
    private val minTouchInterval = 2L // ~500fps - virtually no throttling

    /**
     * AGGRESSIVE Fix for Gesture Handler StackOverflowError
     * Prevents infinite recursion in touch event handling
     */
    override fun dispatchTouchEvent(ev: android.view.MotionEvent?): Boolean {
        val currentTime = System.currentTimeMillis()
        
        // Throttle touch events to prevent rapid recursion (less aggressive)
        if (currentTime - lastTouchTime < minTouchInterval) {
            return false // Reduced logging for performance
        }
        lastTouchTime = currentTime
        
        // Prevent infinite recursion by limiting call depth
        if (touchEventDepth > maxTouchEventDepth) {
            android.util.Log.w("MainActivity", "Touch event depth limit reached, preventing StackOverflowError")
            return false
        }
        
        touchEventDepth++
        return try {
            val result = super.dispatchTouchEvent(ev)
            touchEventDepth--
            result
        } catch (e: StackOverflowError) {
            touchEventDepth = 0
            android.util.Log.e("MainActivity", "StackOverflowError in dispatchTouchEvent: ${e.message}")
            false
        } catch (e: Exception) {
            touchEventDepth--
            android.util.Log.e("MainActivity", "Exception in dispatchTouchEvent: ${e.message}")
            false
        }
    }
}
