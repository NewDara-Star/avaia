Feature: API Key Onboarding Wizard
  As a non-technical parent setting up the app for my children
  I want a step-by-step guide to connect to Claude AI
  So that I don't feel lost or scared by developer consoles

  Background:
    Given the Avaia application is running
    And a profile has been created

  # ──────────────────────────────────────────────
  # Phase 1: API Key Storage & Encryption
  # ──────────────────────────────────────────────

  @critical @api-key-storage
  Scenario: App checks for API key on startup
    Given the app starts with a loaded profile
    When the app checks for an API key
    Then it should look for a global key file at "{userData}/.api_key"
    And it should attempt to decrypt the file via Electron safeStorage

  @critical @api-key-storage
  Scenario: No API key file exists on first launch
    Given no API key file exists at "{userData}/.api_key"
    When the app checks for an API key
    Then the result should indicate no key is configured
    And the app should not crash or show an unhandled error

  @critical @api-key-storage
  Scenario: Save API key with encryption
    Given a valid API key "sk-ant-test-key-1234567890"
    When the key is saved via the API key service
    Then the key should be encrypted via Electron safeStorage
    And an encrypted file should exist at "{userData}/.api_key"
    And the file contents should NOT contain "sk-ant" in plaintext

  @critical @api-key-storage
  Scenario: Load and decrypt a saved API key
    Given an API key "sk-ant-test-key-1234567890" has been saved and encrypted
    When the key is loaded via the API key service
    Then the decrypted key should equal "sk-ant-test-key-1234567890"

  @critical @api-key-storage
  Scenario: Delete an existing API key
    Given an API key has been saved
    When the key is deleted via the API key service
    Then the key file at "{userData}/.api_key" should no longer exist
    And checking for a key should return false

  @critical @api-key-storage @security
  Scenario: API key is never stored in plaintext
    Given a valid API key "sk-ant-test-key-1234567890"
    When the key is saved via the API key service
    Then reading the raw file bytes should not contain the original key string
    And the file should contain an encrypted binary blob

  @critical @api-key-validation
  Scenario Outline: Validate API key format
    When the user provides an API key "<key>"
    Then format validation should return <valid>

    Examples:
      | key                              | valid |
      | sk-ant-valid-key-1234567890      | true  |
      | sk-ant-api03-abcdefghijk         | true  |
      | invalid-key-no-prefix            | false |
      | sk-wrong-prefix-1234             | false |
      |                                  | false |
      | sk-ant-                          | false |

  @critical @api-key-test
  Scenario: Test connection with valid API key
    Given a valid Anthropic API key
    When the user clicks "Test Connection"
    Then the app should make a request to Anthropic's API with max_tokens set to 1
    And the result should indicate success
    And no more than 1 output token should be consumed

  @critical @api-key-test
  Scenario: Test connection with invalid API key
    Given an invalid API key "sk-ant-invalid-fake-key-000"
    When the user clicks "Test Connection"
    Then the result should indicate failure
    And the error message should say "Invalid API key"

  @critical @api-key-test
  Scenario: Test connection with no internet
    Given a valid API key format
    And the network is unavailable
    When the user clicks "Test Connection"
    Then the result should indicate failure
    And the error message should say "No internet connection"

  @critical @api-key-ipc
  Scenario: IPC bridge exposes API key operations
    Given the preload bridge is loaded
    Then window.__mainApi.apiKey should exist
    And it should expose the method "has"
    And it should expose the method "save"
    And it should expose the method "test"
    And it should expose the method "delete"

  @security @api-key-storage
  Scenario: API key is global across all profiles
    Given two profiles "Daramola" and "Ayo" exist
    And an API key has been saved
    When profile "Daramola" checks for an API key
    Then a key should be found
    When profile "Ayo" checks for an API key
    Then a key should be found
    And both profiles should use the same key file

  # ──────────────────────────────────────────────
  # Phase 2: Onboarding Wizard UI
  # ──────────────────────────────────────────────

  @critical @onboarding-wizard
  Scenario: Wizard appears when no API key exists
    Given no API key is configured
    When the app loads the main screen
    Then the onboarding wizard should be displayed
    And the dashboard should NOT be visible
    And the wizard should block all other app functionality

  @critical @onboarding-wizard
  Scenario: Wizard does not appear when API key exists
    Given a valid API key is configured and saved
    When the app loads the main screen
    Then the onboarding wizard should NOT be displayed
    And the dashboard should be visible

  @critical @onboarding-wizard
  Scenario: Wizard cannot be skipped or dismissed
    Given the onboarding wizard is displayed
    When the user tries to close or dismiss the wizard
    Then the wizard should remain visible
    And there should be no close button, skip link, or escape key handler

  @critical @onboarding-wizard @step-1
  Scenario: Step 1 — Introduction explains cost and purpose
    Given the onboarding wizard is on Step 1
    Then the heading should say "Connect to Claude AI"
    And the text should mention Anthropic account requirement
    And the text should mention the cost range "$2-8/month"
    And a "Next" button should be visible
    And no "Back" button should be visible on Step 1

  @critical @onboarding-wizard @step-2
  Scenario: Step 2 — Opens Anthropic console in browser
    Given the onboarding wizard is on Step 2
    When the user clicks "Open Anthropic Console"
    Then the system browser should open "https://console.anthropic.com/settings/keys"
    And the wizard should show visual guidance for creating a key
    And an "I've created my key" button should be visible
    And a "Back" button should return to Step 1

  @critical @onboarding-wizard @step-3
  Scenario: Step 3 — Paste and test API key
    Given the onboarding wizard is on Step 3
    Then a text input with placeholder "sk-ant-..." should be visible
    And a "Test Connection" button should be visible
    And the "Test Connection" button should be disabled until a key is entered

  @critical @onboarding-wizard @step-3
  Scenario: Step 3 — Invalid key format shows error before testing
    Given the onboarding wizard is on Step 3
    When the user pastes "not-a-valid-key"
    And the user clicks "Test Connection"
    Then an error should appear saying the key format is invalid
    And no API request should be made

  @critical @onboarding-wizard @step-3
  Scenario: Step 3 — Valid key triggers test and shows loading
    Given the onboarding wizard is on Step 3
    When the user pastes a valid API key "sk-ant-test-1234567890"
    And the user clicks "Test Connection"
    Then a loading spinner should appear
    And the "Test Connection" button should be disabled during testing

  @critical @onboarding-wizard @step-3
  Scenario: Step 3 — Successful test advances to Step 4
    Given the onboarding wizard is on Step 3
    And the user has pasted a valid API key
    When the connection test succeeds
    Then the wizard should automatically advance to Step 4

  @critical @onboarding-wizard @step-3
  Scenario: Step 3 — Failed test shows error with retry
    Given the onboarding wizard is on Step 3
    And the user has pasted an API key
    When the connection test fails
    Then an error message should be displayed
    And the user should be able to retry with a different key

  @critical @onboarding-wizard @step-4
  Scenario: Step 4 — Success confirmation and save
    Given the onboarding wizard is on Step 4
    Then a success message "Connected! You're all set." should be displayed
    And the API key should already be encrypted and saved
    And a "Start Learning" button should be visible

  @critical @onboarding-wizard @step-4
  Scenario: Step 4 — Start Learning transitions to dashboard
    Given the onboarding wizard is on Step 4
    When the user clicks "Start Learning"
    Then the wizard should close
    And the dashboard should be displayed
    And the wizard should not appear on next app launch

  @critical @onboarding-wizard
  Scenario: Wizard progress indicator shows current step
    Given the onboarding wizard is displayed
    Then a progress indicator should show "Step 1 of 4"
    When the user advances to Step 2
    Then the progress indicator should show "Step 2 of 4"
    When the user advances to Step 3
    Then the progress indicator should show "Step 3 of 4"

  # ──────────────────────────────────────────────
  # Phase 3: Settings — API Key Management
  # ──────────────────────────────────────────────

  @critical @settings @api-key-management
  Scenario: API key status visible in Settings
    Given a valid API key is configured
    When the user navigates to Settings > Account
    Then the API Connection section should be visible
    And the connection status should show "Connected" with a green indicator
    And the key should be displayed masked (e.g. "sk-ant-****...****")

  @critical @settings @api-key-management
  Scenario: Settings shows disconnected state when no key
    Given no API key is configured
    When the user navigates to Settings > Account
    Then the connection status should show "Not Connected" with a red indicator
    And an "Add API Key" button should be visible

  @critical @settings @api-key-management
  Scenario: Update API key via Settings modal
    Given a valid API key is configured
    When the user navigates to Settings > Account
    And the user clicks "Update Key"
    Then an "Update API Key" modal should appear
    And a warning should say "This will update the API key for ALL profiles"
    And a new key input field should be visible
    And "Cancel" and "Test & Save" buttons should be visible

  @critical @settings @api-key-management
  Scenario: Test & Save validates before replacing key
    Given the "Update API Key" modal is open
    When the user enters a new API key
    And the user clicks "Test & Save"
    Then the new key should be tested against the Anthropic API
    And if the test succeeds, the old key should be replaced
    And if the test fails, the old key should be preserved

  @critical @settings @api-key-management
  Scenario: Re-test existing API key from Settings
    Given a valid API key is configured
    When the user navigates to Settings > Account
    And the user clicks "Test Connection"
    Then the existing key should be tested
    And the result should update the connection status indicator

  @security @settings @api-key-management
  Scenario: API key is never fully visible in Settings
    Given a valid API key is configured
    When the user navigates to Settings > Account
    Then the full API key should never be displayed
    And only a masked version should be shown
    And there should be no "reveal" or "show key" option
