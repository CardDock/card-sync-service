Feature: Card relationships
  As a developer integrating with the card sync service
  I want to retrieve card prints and artworks
  So that users can see where cards have appeared and their artwork

  Scenario: Retrieve prints for an existing card
    When I send a GET request to "/cards/10000/prints"
    Then the response status should be 200
    And at least one print should be returned
    And each print should have id, cardSetId, cardSetName, setCode, and rarity

  Scenario: Retrieve prints for a non-existent card returns 404
    When I send a GET request to "/cards/99999999/prints"
    Then the response status should be 404

  Scenario: Retrieve artworks for an existing card
    When I send a GET request to "/cards/10000/artworks"
    Then the response status should be 200
    And at least one artwork should be returned
    And each artwork should have an imageUrl containing "ygoprodeck.com"

  Scenario: Retrieve artworks for a non-existent card returns 404
    When I send a GET request to "/cards/99999999/artworks"
    Then the response status should be 404
