# Project Overview

This is a React Native mobile application called "spred". Based on the file structure and dependencies, it appears to be a video sharing platform with a focus on P2P (peer-to-peer) file transfer capabilities.

**Key Technologies:**

*   **Core:** React Native, TypeScript
*   **Navigation:** React Navigation (with stack and bottom tab navigators)
*   **State Management:** Redux with Redux Toolkit and redux-persist
*   **UI:** React Native Paper, custom components, and a custom theme.
*   **P2P:** `p2p-file-transfer`, `@arekjaar/react-native-transfer-big-files`
*   **Video:** `react-native-video`, `react-native-camera`, `react-native-create-thumbnail`
*   **API Communication:** `axios`
*   **Internationalization:** `i18next`

**Architecture:**

The application is structured with a main `ApplicationNavigator` that handles the initial loading and sets up the main `MainNavigator`. The `MainNavigator` is a stack navigator that includes authentication screens, video playback, content creation, and a `BottomTab` navigator for the main user interface. The `BottomTab` navigator provides access to the Home, Shorts, Upload, Downloads, and Account screens. The app also features a `SpredShareNavigator` which likely handles the P2P file sharing functionality.

# Building and Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Start the Metro Bundler:**

```bash
npm start
```

**3. Run the Application:**

**Android:**

```bash
npm run android
```

**iOS:**

```bash
npm run ios
```

# Development Conventions

*   **TypeScript:** The project is written in TypeScript, so all new code should be as well.
*   **Linting:** The project uses ESLint for code linting. Run `npm run lint` to check for linting errors.
*   **Testing:** The project uses Jest for testing. Run `npm run test` to run the test suite.
*   **File Structure:** The `src` directory is organized by feature (e.g., `screens`, `navigators`, `components`, `store`). New files should be placed in the appropriate directory.
*   **Styling:** The project uses a custom theme and `react-native-paper` for styling. New components should use the theme colors and spacing.
*   **State Management:** Redux is used for state management. New state should be added to the Redux store and accessed using the `useSelector` and `useDispatch` hooks.
*   **Navigation:** React Navigation is used for navigation. New screens should be added to the appropriate navigator.
*   **Internationalization:** `i18next` is used for internationalization. All user-facing strings should be added to the translation files.
