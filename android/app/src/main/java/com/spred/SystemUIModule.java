package com.spred;

import android.app.Activity;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.os.Build;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.ActivityEventListener;

public class SystemUIModule extends ReactContextBaseJavaModule {
    private ReactApplicationContext reactContext;
    private Activity currentActivity;
    private int systemUiVisibilityFlags = 0;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, android.content.Intent intent) {
        }

        @Override
        public void onNewIntent(android.content.Intent intent) {
        }
    };

    public SystemUIModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.reactContext.addActivityEventListener(activityEventListener);
        this.currentActivity = reactContext.getCurrentActivity();
    }

    @Override
    public String getName() {
        return "SystemUIModule";
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (currentActivity != null) {
            // Restore system UI when module is destroyed
            showSystemUI();
        }
    }

    @ReactMethod
    public void hideSystemUI() {
        System.out.println("SystemUIModule: hideSystemUI() called");

        if (currentActivity == null) {
            currentActivity = reactContext.getCurrentActivity();
            if (currentActivity == null) {
                System.out.println("SystemUIModule: No current activity, returning");
                return;
            }
        }

        currentActivity.runOnUiThread(() -> {
            try {
                System.out.println("SystemUIModule: Running on UI thread, hiding system UI");
                Window window = currentActivity.getWindow();
                View decorView = window.getDecorView();

                // Store current flags
                systemUiVisibilityFlags = decorView.getSystemUiVisibility();
                System.out.println("SystemUIModule: Stored system UI flags: " + systemUiVisibilityFlags);

                // Use immersive sticky mode for all Android versions
                // This is the most reliable method for hiding system bars
                int uiFlags = View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;

                System.out.println("SystemUIModule: Setting system UI visibility flags: " + uiFlags);
                decorView.setSystemUiVisibility(uiFlags);
                System.out.println("SystemUIModule: Flags set successfully");

                // Also set fullscreen flag on window
                window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
                window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
                System.out.println("SystemUIModule: Fullscreen mode enabled");

            } catch (Exception e) {
                System.out.println("SystemUIModule: Error in hideSystemUI: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    @ReactMethod
    public void showSystemUI() {
        if (currentActivity == null) {
            currentActivity = reactContext.getCurrentActivity();
            if (currentActivity == null) {
                return;
            }
        }

        currentActivity.runOnUiThread(() -> {
            try {
                Window window = currentActivity.getWindow();
                View decorView = window.getDecorView();

                // Restore original system UI visibility for all Android versions
                decorView.setSystemUiVisibility(systemUiVisibilityFlags);

                // Remove fullscreen flag from window
                window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @ReactMethod
    public void toggleSystemUI() {
        if (currentActivity == null) {
            currentActivity = reactContext.getCurrentActivity();
            if (currentActivity == null) {
                return;
            }
        }

        currentActivity.runOnUiThread(() -> {
            try {
                Window window = currentActivity.getWindow();
                View decorView = window.getDecorView();

                int currentFlags = decorView.getSystemUiVisibility();
                boolean isHidden = (currentFlags & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) != 0;

                if (isHidden) {
                    showSystemUI();
                } else {
                    hideSystemUI();
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
