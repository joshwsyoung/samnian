<?php
// /handlers/autocomplete_handler.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$apiKey = '2c-nazLz20qyqxUS6Ib5-g46059'; // Keep this safe
$action = $_GET['action'] ?? null;
$postcode = $_GET['postcode'] ?? '';
$addressId = $_GET['addressId'] ?? '';  // New variable for the address ID

header('Content-Type: application/json');

// Handle the postcode search (/autocomplete)
if ($action === 'autocomplete' && $postcode) {
    // Build the URL for the 'find' endpoint
    $url = "https://api.getaddress.io/autocomplete/" . urlencode($postcode) . "?api-key=$apiKey";
    
    // Make the API request
    $response = file_get_contents($url);
    
    // Check if the API request was successful
    if ($response === false) {
        echo json_encode(['error' => 'API request failed']);
        http_response_code(500);
        exit;
    }

    // Decode the JSON response
    $responseData = json_decode($response, true);

    // Return the suggestions part of the response
    echo json_encode(['suggestions' => $responseData['suggestions']]);
    exit;
}

// Handle the full address fetch (/get)
if ($action === 'get' && $addressId) {
    // Use the ID for the 'get' endpoint
    $url = "https://api.getaddress.io/get/" . urlencode($addressId) . "?api-key=$apiKey";
    
    // Make the API request
    $response = file_get_contents($url);
    
    // Check if the API request was successful
    if ($response === false) {
        echo json_encode(['error' => 'API request failed']);
        http_response_code(500);
        exit;
    }

    // Return the response from the 'get' endpoint
    echo $response;
    exit;
}

echo json_encode(['error' => 'Invalid request']);
http_response_code(400);
