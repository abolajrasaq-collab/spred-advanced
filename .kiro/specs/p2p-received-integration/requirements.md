# P2P Received Files Integration Requirements

## Introduction

This feature ensures that videos received through P2P transfers are properly displayed in the "RECEIVED" tab of the Downloads screen, providing users with a centralized location to view and manage all received content.

## Glossary

- **P2P_Service**: The WiFi Direct peer-to-peer file transfer service
- **SpredFileService**: The centralized file management service for SPRED app
- **Downloads_Screen**: The main downloads interface with tabs for Downloads, Received, and My List
- **Received_Tab**: The specific tab in Downloads screen that displays P2P received files
- **P2PReceiveScreen**: The component that handles the P2P file receiving process

## Requirements

### Requirement 1

**User Story:** As a user, I want received P2P videos to appear in the RECEIVED tab of the Downloads screen, so that I can easily find and manage all videos sent to me.

#### Acceptance Criteria

1. WHEN a P2P file transfer is completed, THE P2P_Service SHALL save the received file using SpredFileService
2. WHEN a file is saved through SpredFileService as received, THE SpredFileService SHALL mark the file with isReceived flag as true
3. WHEN the Downloads_Screen loads the Received_Tab, THE Downloads_Screen SHALL display all files marked as received through SpredFileService
4. WHEN a user navigates to the Received_Tab, THE Downloads_Screen SHALL show the count of received videos in the header
5. WHERE no received files exist, THE Received_Tab SHALL display an appropriate empty state message

### Requirement 2

**User Story:** As a user, I want received files to be stored in a dedicated received folder, so that they are organized separately from my downloaded content.

#### Acceptance Criteria

1. WHEN P2P_Service receives a file, THE P2P_Service SHALL use SpredFileService to determine the correct storage path
2. WHEN SpredFileService handles a received file, THE SpredFileService SHALL store the file in the dedicated received directory
3. WHEN the received directory does not exist, THE SpredFileService SHALL create the directory structure automatically
4. WHEN storing received files, THE SpredFileService SHALL ensure proper file naming to avoid conflicts
5. WHEN a received file is stored, THE SpredFileService SHALL generate appropriate metadata including file size and creation date

### Requirement 3

**User Story:** As a user, I want to be able to play, share, and delete received videos from the RECEIVED tab, so that I have full control over my received content.

#### Acceptance Criteria

1. WHEN a user taps on a received video, THE Downloads_Screen SHALL navigate to the video player with the received file
2. WHEN a user taps the share button on a received video, THE Downloads_Screen SHALL open sharing options for that video
3. WHEN a user taps the delete button on a received video, THE Downloads_Screen SHALL remove the file from storage and refresh the list
4. WHEN a user selects multiple received videos, THE Downloads_Screen SHALL allow bulk deletion of selected items
5. WHEN received videos are deleted, THE SpredFileService SHALL clean up the files from the received directory