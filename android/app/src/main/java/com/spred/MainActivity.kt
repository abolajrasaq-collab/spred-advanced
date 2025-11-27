package com.spred

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.os.Build

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
        object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
            override fun onCreate(savedInstanceState: Bundle?) {
                // Fix for React Native Screens crash
                // See: https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
                savedInstanceState?.clear()
                super.onCreate(savedInstanceState)
                // Enable immersive mode support
                setupImmersiveMode()
            }
        }

    /**
     * Setup immersive mode support for fullscreen video playback
     */
    private fun setupImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            window.decorView.setOnSystemUiVisibilityChangeListener { visibility ->
                // When system UI visibility changes, we might need to re-apply immersive mode
                // This is handled by the React Native side, but we ensure the window supports it
            }
        }
    }

    /**
     * Enable immersive mode - called from React Native
     */
    fun enableImmersiveMode() {
        runOnUiThread {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                val flags = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
                
                window.decorView.systemUiVisibility = flags
                
                // Also set window flags for maximum compatibility
                window.setFlags(
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN
                )
            }
        }
    }

    /**
     * Disable immersive mode - called from React Native
     */
    fun disableImmersiveMode() {
        runOnUiThread {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                val flags = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
                
                window.decorView.systemUiVisibility = flags
                
                // Clear fullscreen flag
                window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
            }
        }
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
