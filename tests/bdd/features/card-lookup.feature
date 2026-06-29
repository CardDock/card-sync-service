Feature: Card lookup by ID
  As a developer integrating with the card sync service
  I want to retrieve card details by ID
  So that I can display card information in the application

  Scenario: Retrieve existing card by ID
    When I send a GET request to "/cards/10000"
    Then the response status should be 200
    And the response body should match card "Ten Thousand Dragon"
    And the response should not include rawData

  Scenario: Retrieve card with Spanish translation
    When I send a GET request to "/cards/10000?language=es"
    Then the response status should be 200
    And the response body name should be "Dragón Diez Mil"

  Scenario: Retrieve card with English language parameter
    When I send a GET request to "/cards/10000?language=en"
    Then the response status should be 200
    And the response body name should be "Ten Thousand Dragon"
