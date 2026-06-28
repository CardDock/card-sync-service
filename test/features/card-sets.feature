Feature: Card sets
  As a developer integrating with the card sync service
  I want to list all available card sets
  So that users can see which sets exist

  Scenario: List all card sets
    When I send a GET request to "/card-sets"
    Then the response status should be 200
    And at least one card set should be returned
    And each card set should have an id and name
