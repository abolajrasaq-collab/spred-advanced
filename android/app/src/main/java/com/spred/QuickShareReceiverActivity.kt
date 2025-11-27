package com.spred

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/**
 * QuickShareReceiverActivity - Receives files from Android Quick Share
 * and saves them to the SPRED P2P ecosystem
 */
class QuickShareReceiverActivity : AppCompatActivity() {
    private val TAG = "QuickShareReceiverActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Log.d(TAG, "QuickShareReceiverActivity launched")

        // Handle the received file
        val intent = intent
        if (intent?.action == Intent.ACTION_SEND) {
            if (intent.type?.startsWith("video/") == true) {
                Log.d(TAG, "Received video file via Quick Share")

                // Get the file URI
                val fileUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                if (fileUri != null) {
                    Log.d(TAG, "File URI: $fileUri")
                    saveReceivedVideo(fileUri)
                } else {
                    Log.e(TAG, "No file URI in intent")
                    finish()
                }
            } else {
                Log.w(TAG, "Received non-video file, type: ${intent.type}")
                finish()
            }
        } else {
            Log.w(TAG, "Invalid intent action: ${intent?.action}")
            finish()
        }
    }

    private fun saveReceivedVideo(fileUri: Uri) {
        try {
            // Create SpredP2PReceived directory if it doesn't exist
            val receivedDir = File(getExternalFilesDir(null), "SpredP2PReceived")
            if (!receivedDir.exists()) {
                receivedDir.mkdirs()
                Log.d(TAG, "Created SpredP2PReceived directory: ${receivedDir.absolutePath}")
            }

            // Get file name from URI or create one
            val fileName = "QuickShare_${System.currentTimeMillis()}.mp4"
            val destFile = File(receivedDir, fileName)

            Log.d(TAG, "Saving received video to: ${destFile.absolutePath}")

            // Copy file from URI to our directory
            val inputStream: InputStream? = contentResolver.openInputStream(fileUri)
            if (inputStream != null) {
                FileOutputStream(destFile).use { outputStream ->
                    val buffer = ByteArray(1024)
                    var bytesRead: Int
                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        outputStream.write(buffer, 0, bytesRead)
                    }
                    outputStream.flush()
                }
                inputStream.close()

                Log.d(TAG, "✅ Video saved successfully to SPRED ecosystem")
                Log.d(TAG, "File size: ${destFile.length()} bytes")
                Log.d(TAG, "File path: ${destFile.absolutePath}")

                // Show success message
                showSuccessMessage(destFile.absolutePath)
            } else {
                Log.e(TAG, "Failed to open input stream from URI")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error saving received video", e)
        }
    }

    private fun showSuccessMessage(filePath: String) {
        // Show a simple toast-like message and finish
        Log.d(TAG, "🎉 Video received and saved to SPRED ecosystem: $filePath")

        // Close the activity
        finish()
    }
}
