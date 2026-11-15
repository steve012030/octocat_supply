Feature: Shopping cart management
  As a customer
  I want to add, update, and remove products from my cart
  So that I can manage the items in my order

  Scenario: Add a product to the cart
    Given I am viewing the product catalog
    When I add "Cart Test Product" to my cart
    Then my cart contains 1 item
    And the order subtotal is "$89.00"

  Scenario: Add another unit of a product already in the cart
    Given my cart contains 1 "Cart Test Product"
    When I add "Cart Test Product" to my cart again
    Then my cart contains 2 items
    And the order subtotal is "$178.00"

  Scenario: Change a product quantity
    Given my cart contains 1 "Cart Test Product"
    When I change its quantity to 3
    Then my cart contains 3 items
    And the order subtotal is "$267.00"

  Scenario: Remove a product from the cart
    Given my cart contains 1 "Cart Test Product"
    When I remove "Cart Test Product" from my cart
    Then I see the empty cart message
    And my cart contains 0 items
