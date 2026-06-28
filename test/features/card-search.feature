Feature: Card search by name
  As a developer integrating with the card sync service
  I want to search cards by name
  So that users can find cards they are looking for

  Scenario: Search by English name without language parameter
    When I send a GET request to "/cards?name=Dark%20Magician"
    Then the response status should be 200
    And the response should contain paginated results
    And at least one result should be returned
    And each result should have an id and name
    And results should not include rawData

  Scenario: Search by Spanish name with language=es
    When I send a GET request to "/cards?name=Mago%20Oscuro&language=es"
    Then the response status should be 200
    And the response should contain paginated results
    And at least one result should be returned
    And each result should have "Mago Oscuro" in its name

  Scenario: Search by English name with language=en
    When I send a GET request to "/cards?name=Dark%20Magician&language=en"
    Then the response status should be 200
    And at least one result should be returned
    And each result should have an id, name, and type

  Scenario: Search for non-existent name returns empty results
    When I send a GET request to "/cards?name=NonExistentCardXYZ"
    Then the response status should be 200
    And the response should have 0 items, total 0, page 1, limit 0
