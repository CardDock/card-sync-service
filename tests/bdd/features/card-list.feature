Feature: Card list with filters
  As a developer integrating with the card sync service
  I want to list cards with optional filters and pagination
  So that users can browse the card catalog efficiently

  Scenario: List all cards with default pagination
    When I send a GET request to "/cards"
    Then the response status should be 200
    And the response should contain paginated results
    And at most 20 results should be returned
    And results should not include rawData

  Scenario: Filter cards by type and attribute
    When I send a GET request to "/cards?type=Effect%20Monster&attribute=DARK"
    Then the response status should be 200
    And all returned cards should have type "Effect Monster" and attribute "DARK"

  Scenario: Filter cards by race
    When I send a GET request to "/cards?race=Dragon"
    Then the response status should be 200
    And all returned cards should have race "Dragon"

  Scenario: Pagination respects page and limit
    When I send a GET request to "/cards?page=1&limit=5"
    Then the response status should be 200
    And at most 5 results should be returned
    And the response limit should be 5

  Scenario: Limit is capped at 100
    When I send a GET request to "/cards?limit=200"
    Then the response status should be 200
    And the response limit should be 100
