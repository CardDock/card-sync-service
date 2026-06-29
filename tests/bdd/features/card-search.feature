Feature: Card search by name
  As a developer integrating with the card sync service
  I want to search cards by name
  So that users can find cards they are looking for

  Scenario: Search by English name without language parameter
    When I send a GET request to "/cards?name=Ten%20Thousand%20Dragon"
    Then the response status should be 200
    And the response should contain paginated results
    And at least one result should be returned
    And each result should have an id and name
    And results should not include rawData

  Scenario: Search by Spanish name with language=es
    When I send a GET request to "/cards?name=Drag%C3%B3n%20Diez%20Mil&language=es"
    Then the response status should be 200
    And the response should contain paginated results
    And at least one result should be returned
    And each result should have "Dragón Diez Mil" in its name

  Scenario: Search by English name with language=en
    When I send a GET request to "/cards?name=Ten%20Thousand%20Dragon&language=en"
    Then the response status should be 200
    And at least one result should be returned
    And each result should have an id, name, and type

  Scenario: Search for non-existent name returns empty results
    When I send a GET request to "/cards?name=NonExistentCardXYZ"
    Then the response status should be 200
    And the response should have 0 items, total 0, page 1, limit 0
