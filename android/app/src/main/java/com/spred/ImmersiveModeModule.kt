package com.spred

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ImmersiveModeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ImmersiveModeModule"
    }

    @ReactMethod
    fun enableImmersiveMode(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity is MainActivity) {
                activity.enableImmersiveMode()
                promise.resolve("Immersive mode enabled")
            } else {
                promise.reject("ERROR", "MainActivity not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun disableImmersiveMode(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity is MainActivity) {
                activity.disableImmersiveMode()
                promise.resolve("Immersive mode disabled")
            } else {
                promise.reject("ERROR", "MainActivity not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}