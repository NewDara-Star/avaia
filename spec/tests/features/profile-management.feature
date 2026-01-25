Feature: Profile Management System
  As a parent with multiple children learning programming
  I want to create separate profiles
  So that each child's progress is isolated and personalized

  Background:
    Given the Avaia application is running

  @critical @first-run
  Scenario: Create Profile button is displayed on first app launch
    Given the app is opened for the first time
    When the user reaches the welcome screen
    Then a "Create Profile" button should be prominently displayed

  @critical @profile-creation
  Scenario: Create a new profile with valid name
    Given a profile creation screen is open
    When the user enters a profile name "Daramola" (3-20 characters, alphanumeric + spaces)
    And the user clicks "Create Profile"
    Then a new SQLite database should be created at Electron userData directory
    And the database path should be in format: {userData}/profiles/{profile_id}/avaia.db
    And the app should switch to the newly created profile

  @critical @profile-creation
  Scenario Outline: Reject invalid profile names
    Given a profile creation screen is open
    When the user enters a profile name "<invalid_name>"
    Then the input should display an error message
    And the "Create Profile" button should be disabled

    Examples:
      | invalid_name           | reason                    |
      | ab                     | Too short (< 3 chars)    |
      | 123456789012345678901  | Too long (> 20 chars)    |
      | User/Profile           | Contains forward slash    |
      | User\Profile           | Contains backslash        |
      | User:Profile           | Contains colon            |
      | User*Profile           | Contains asterisk         |
      | User?Profile           | Contains question mark    |

  @critical @profile-switching
  Scenario: Multiple profiles display in dropdown
    Given multiple profiles exist:
      | profile_name | last_used     | track               | progress   |
      | Daramola     | 2 minutes ago | JavaScript/Web Dev  | 2/6        |
      | Child-1      | 3 days ago    | Python/Data Science | 1/5        |
    When the user clicks the avatar icon (top-right)
    Then a dropdown menu should display
    And all profiles should be listed with their details
    And "Switch Profile" option should be visible
    And "Manage Profiles" option should be visible

  @critical @profile-switching
  Scenario: Switch to a different profile
    Given multiple profiles exist
    And the user is currently on profile "Daramola"
    When the user clicks the avatar icon
    And the dropdown opens
    And the user selects "Child-1" profile
    Then a confirmation dialog should appear saying "Switch to Child-1?"
    And when confirmed, the app should reload with Child-1's data
    And no data should leak between profiles
    And the profile switch should be tracked with timestamp

  @critical @data-isolation
  Scenario: Verify no data leakage between profiles
    Given a profile "Profile-A" with test data exists
    And a profile "Profile-B" with different test data exists
    When the user switches from Profile-A to Profile-B
    Then Profile-B's database should not contain any data from Profile-A
    And Profile-A's database should not be modified

  @critical @profile-deletion
  Scenario: Delete profile with confirmation
    Given the "Manage Profiles" screen is open
    And a profile "Test Profile" exists
    When the user clicks "Delete Profile" for "Test Profile"
    Then a confirmation dialog should display with message "This will permanently delete all progress"
    And the dialog should require re-typing the profile name to confirm
    When the user types "Test Profile" and confirms
    Then the profile and all its data should be permanently deleted
    And the app should navigate to the next available profile or welcome screen

  @profile-deletion
  Scenario: Cancel profile deletion
    Given the "Manage Profiles" screen is open
    And a profile "Important Profile" exists
    When the user clicks "Delete Profile" for "Important Profile"
    And the confirmation dialog appears
    And the user clicks "Cancel"
    Then the profile should remain unchanged
    And the dialog should close

  @profile-deletion
  Scenario: Prevent accidental profile deletion
    Given the "Manage Profiles" screen is open
    And a profile "Test Profile" exists
    When the user clicks "Delete Profile" for "Test Profile"
    And the confirmation dialog appears
    And the user types the wrong profile name
    Then the "Confirm Delete" button should remain disabled
    And the profile should not be deleted if the user closes the dialog

  @security @data-integrity
  Scenario: Profile names cannot contain path-breaking characters
    Given the profile creation screen is open
    When the system validates the profile name field
    Then the following characters should be rejected:
      | character | reason                 |
      | /         | Forward slash breaks path |
      | \         | Backslash breaks path    |
      | :         | Colon reserved in paths  |
      | *         | Asterisk is wildcard     |
      | ?         | Question mark is wildcard |

  @security @data-integrity
  Scenario: Cross-profile data isolation
    Given profile "Profile-1" with curriculum cache exists
    And profile "Profile-2" without cache exists
    When profile "Profile-2" requests the curriculum cache
    Then only Profile-2's cached data should be accessible
    And Profile-1's cached data should not be visible to Profile-2

  @profile-ui
  Scenario: Profile dropdown visual design
    Given the profile dropdown is open
    When the user views the dropdown
    Then the dropdown should have dimensions of 360px width
    And the background should be white with shadow (0 10px 40px rgba(0,0,0,0.15))
    And border radius should be 12px with 16px padding

  @profile-ui
  Scenario: Profile cards styling
    Given the profile dropdown is open
    And the user hovers over a profile card
    Then the profile card padding should be 16px
    And border radius should be 8px
    And hover background should be #F9FAFB
    When the profile is active
    Then the background should be #EFF6FF with a 4px blue left border

  @profile-ui
  Scenario: Avatar styling in dropdown
    Given the profile dropdown is open
    When viewing avatar icons
    Then the dropdown avatar size should be 48px
    And the header avatar size should be 32px
    When a profile is selected
    Then the avatar should display a blue ring (4px)
