Feature: Card lookup by ID
  As a developer integrating with the card sync service
  I want to retrieve card details by ID
  So that I can display card information in the application

  Scenario: Retrieve existing card by ID
    When I send a GET request to "/cards/46986414"
    Then the response status should be 200
    And the response body should match card "Dark Magician"
    And the response should not include rawData

  Scenario: Retrieve template card locally without API call
    When I send a GET request to "/cards/10000"
    Then the response status should be 200
    And the response body should include a name matching "10000"

  Scenario: Retrieve card with Spanish translation
    When I send a GET request to "/cards/46986414?language=es"
    Then the response status should be 200
    And the response body name should be "Mago Oscuro"

  Scenario: Retrieve card with English language parameter
    When I send a GET request to "/cards/46986414?language=en"
    Then the response status should be 200
    And the response body name should be "Dark Magician"
